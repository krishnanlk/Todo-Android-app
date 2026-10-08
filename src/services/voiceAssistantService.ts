/**
 * Voice Assistant Service
 * Complete Speech-To-Text -> Intent Detection -> Context Resolution ->
 * Productivity Action Engine -> Natural Voice Generation -> Text-To-Speech pipeline.
 */

import { Task, Mission, VoiceConversation, AssistantState, FlowEvent } from '../types';
import { StorageService, formatDateKey, getTodayKey } from './storageService';
import { TaskService } from './taskService';
import { MissionService } from './missionService';
import { FlowService } from './flowService';
import { ProgressService } from './progressService';
import { ReviewService } from './reviewService';
import { WidgetService } from './widgetService';

export interface AssistantActionExecution {
  intent: string;
  responseText: string;
  actionTaken?: string;
  targetId?: string;
  requiresConfirmation?: boolean;
  pendingAction?: () => void;
  navigateToTab?: 'today' | 'flow' | 'missions' | 'assistant';
}

let memoryContext: {
  lastMentionedTaskId?: string;
  lastMentionedMissionId?: string;
  lastMentionedDate?: string;
  pendingConfirmation?: {
    actionName: string;
    execute: () => string;
  };
  awaitingFollowUpFor?: 'mission_deadline' | 'task_time';
  pendingMissionDraft?: { title: string; category?: string };
} = {};

// Module-level utterance references to prevent Android WebView Garbage Collection
let activeSpeakingUtterance: SpeechSynthesisUtterance | null = null;
let ttsKeepAliveInterval: any = null;

// Helper: resolve relative date words (today, tomorrow, tonight, monday, etc.)
export const resolveDateWord = (text: string): { dateKey: string; time?: string } => {
  const lower = text.toLowerCase();
  const now = new Date();
  let target = new Date(now);
  let time: string | undefined = undefined;

  if (lower.includes('tonight')) {
    time = '20:00';
  } else if (lower.includes('morning')) {
    time = '08:00';
  } else if (lower.includes('afternoon')) {
    time = '14:00';
  } else if (lower.includes('evening')) {
    time = '19:00';
  }

  // Check specific time format: e.g. "of 3pm", "at 7 PM", "for 3:30 PM", "10 AM", "at 18:00"
  const timeRegex = /\b(?:at|of|for|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at|of|for|by)\s+(\d{1,2}):(\d{2})\b|\b(?:at|of|for|by)\s+(\d{1,2})\s*(?:o'?clock)\b/i;
  const match = lower.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1] || match[4] || match[6], 10);
    const mins = match[2] ? parseInt(match[2], 10) : (match[5] ? parseInt(match[5], 10) : 0);
    const meridian = (match[3] || '').toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  if (lower.includes('tomorrow')) {
    target.setDate(target.getDate() + 1);
  } else if (lower.includes('day after tomorrow')) {
    target.setDate(target.getDate() + 2);
  } else {
    // Days of the week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const currentDay = now.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7; // next upcoming day
        target.setDate(now.getDate() + diff);
        break;
      }
    }
  }

  return { dateKey: formatDateKey(target), time };
};

// Helper: find best matching task
const findMatchingTask = (query: string): Task | null => {
  const tasks = TaskService.getAll();
  const q = query.toLowerCase().trim();

  // If query is a pronoun or vague ("it", "that", "this", "task", "the task", "t"), target context or top active task
  if (!q || q === 'it' || q === 'that' || q === 'this' || q === 'task' || q === 'the task' || q === 't') {
    if (memoryContext.lastMentionedTaskId) {
      const last = TaskService.getById(memoryContext.lastMentionedTaskId);
      if (last) return last;
    }
    const todayPending = TaskService.getTodayTasks().filter((t) => t.status !== 'completed');
    if (todayPending.length > 0) return todayPending[0];
  }

  // Direct include check
  for (const t of tasks) {
    if (t.title.toLowerCase().includes(q) || q.includes(t.title.toLowerCase())) {
      return t;
    }
  }

  // Keyword tokens
  const tokens = q.split(/\s+/).filter((w) => w.length > 2);
  for (const t of tasks) {
    const tLower = t.title.toLowerCase();
    for (const tok of tokens) {
      if (tLower.includes(tok)) return t;
    }
  }

  // Fallback to last mentioned task
  if (memoryContext.lastMentionedTaskId) {
    const last = TaskService.getById(memoryContext.lastMentionedTaskId);
    if (last) return last;
  }

  // Fallback to the top pending task for today
  const pending = TaskService.getTodayTasks().filter((t) => t.status !== 'completed');
  return pending[0] || null;
};

// Helper: find best matching mission
const findMatchingMission = (query: string): Mission | null => {
  const missions = MissionService.getAll();
  const q = query.toLowerCase().trim();

  for (const m of missions) {
    if (m.title.toLowerCase().includes(q) || q.includes(m.title.toLowerCase())) {
      return m;
    }
  }

  const tokens = q.split(/\s+/).filter((w) => w.length > 2);
  for (const m of missions) {
    const mLower = m.title.toLowerCase();
    for (const tok of tokens) {
      if (mLower.includes(tok)) return m;
    }
  }

  if (memoryContext.lastMentionedMissionId) {
    const last = MissionService.getById(memoryContext.lastMentionedMissionId);
    if (last) return last;
  }

  return missions[0] || null;
};

export const VoiceAssistantService = {
  // Speech Recognition instance
  recognition: null as any,
  isListening: false,
  userWantsListening: false,
  baseTranscript: '',
  currentFullTranscript: '',
  onTranscriptCallback: null as ((text: string, isFinal: boolean) => void) | null,
  onStateChangeCallback: null as ((state: AssistantState) => void) | null,
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,

  initSpeechRecognition: (
    onTranscript: (text: string, isFinal: boolean) => void,
    onStateChange: (state: AssistantState) => void
  ): boolean => {
    if (typeof window === 'undefined') return false;

    VoiceAssistantService.onTranscriptCallback = onTranscript;
    VoiceAssistantService.onStateChangeCallback = onStateChange;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported on this browser.');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        VoiceAssistantService.isListening = true;
        if (VoiceAssistantService.onStateChangeCallback) {
          VoiceAssistantService.onStateChangeCallback('listening');
        }
      };

      recognition.onresult = (event: any) => {
        let finalPart = '';
        let interimPart = '';
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalPart += res[0].transcript + ' ';
          } else {
            interimPart += res[0].transcript;
          }
        }

        const base = VoiceAssistantService.baseTranscript;
        const total = (base ? base + ' ' : '') + finalPart + interimPart;
        const cleaned = total.trim();
        VoiceAssistantService.currentFullTranscript = cleaned;

        if (VoiceAssistantService.onTranscriptCallback) {
          VoiceAssistantService.onTranscriptCallback(cleaned, !interimPart && !!finalPart);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          VoiceAssistantService.userWantsListening = false;
          VoiceAssistantService.isListening = false;
          if (VoiceAssistantService.onStateChangeCallback) {
            VoiceAssistantService.onStateChangeCallback('error');
          }
        }
      };

      recognition.onend = () => {
        VoiceAssistantService.isListening = false;
        // If user is still in listening session (e.g. paused speech or WebView killed session), auto-restart
        if (VoiceAssistantService.userWantsListening) {
          VoiceAssistantService.baseTranscript = VoiceAssistantService.currentFullTranscript;
          try {
            recognition.start();
          } catch (err) {
            console.warn('Speech recognition restart error:', err);
            VoiceAssistantService.userWantsListening = false;
            if (VoiceAssistantService.onStateChangeCallback) {
              VoiceAssistantService.onStateChangeCallback('idle');
            }
          }
        } else {
          if (VoiceAssistantService.onStateChangeCallback) {
            VoiceAssistantService.onStateChangeCallback('idle');
          }
        }
      };

      VoiceAssistantService.recognition = recognition;
      return true;
    } catch (e) {
      console.error('Failed to init speech recognition', e);
      return false;
    }
  },

  resetTranscript: () => {
    VoiceAssistantService.baseTranscript = '';
    VoiceAssistantService.currentFullTranscript = '';
  },

  startListening: () => {
    VoiceAssistantService.userWantsListening = true;
    if (VoiceAssistantService.recognition && !VoiceAssistantService.isListening) {
      try {
        VoiceAssistantService.recognition.start();
      } catch (err) {
        console.warn('Start listening error', err);
      }
    }
  },

  stopListening: () => {
    VoiceAssistantService.userWantsListening = false;
    if (VoiceAssistantService.recognition && VoiceAssistantService.isListening) {
      try {
        VoiceAssistantService.recognition.stop();
      } catch (err) {
        console.warn('Stop listening error', err);
      }
    }
    VoiceAssistantService.isListening = false;
    if (VoiceAssistantService.onStateChangeCallback) {
      VoiceAssistantService.onStateChangeCallback('idle');
    }
  },

  abortListening: () => {
    VoiceAssistantService.userWantsListening = false;
    VoiceAssistantService.baseTranscript = '';
    VoiceAssistantService.currentFullTranscript = '';
    if (VoiceAssistantService.recognition) {
      try {
        VoiceAssistantService.recognition.abort();
      } catch (err) {
        console.warn('Abort listening error', err);
      }
    }
    VoiceAssistantService.isListening = false;
    if (VoiceAssistantService.onStateChangeCallback) {
      VoiceAssistantService.onStateChangeCallback('idle');
    }
  },

  speak: (text: string, onEnd?: () => void, force: boolean = false) => {
    // ALWAYS stop any speech recognition before speaking to prevent microphone loopback
    VoiceAssistantService.stopListening();

    const settings = StorageService.getSettings();
    if (!force && !settings.voiceEnabled) {
      if (onEnd) onEnd();
      return;
    }

    if (typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn('SpeechSynthesis not available');
      if (onEnd) onEnd();
      return;
    }

    try {
      synth.cancel();
    } catch {
      // ignore
    }

    // Split text into manageable sentences to prevent Android WebView audio stalls
    const cleanText = text.replace(/[*_#"`]/g, '').trim();
    const sentences = cleanText
      .replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    const voices = synth.getVoices ? synth.getVoices() : [];
    let selectedVoiceObj: SpeechSynthesisVoice | undefined = undefined;
    if (settings.selectedVoice && voices.length > 0) {
      selectedVoiceObj = voices.find((v) => v.name === settings.selectedVoice);
    }
    if (!selectedVoiceObj && voices.length > 0) {
      selectedVoiceObj =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('en-US'))
        ) || voices[0];
    }

    let currentIndex = 0;

    const clearKeepAlive = () => {
      if (ttsKeepAliveInterval) {
        clearInterval(ttsKeepAliveInterval);
        ttsKeepAliveInterval = null;
      }
    };

    const finishPlayback = () => {
      clearKeepAlive();
      activeSpeakingUtterance = null;
      if (typeof window !== 'undefined') {
        (window as any)._activeSpeakingUtterance = null;
      }
      if (onEnd) onEnd();
    };

    const playNext = () => {
      if (currentIndex >= sentences.length) {
        finishPlayback();
        return;
      }

      const sentence = sentences[currentIndex++];
      const utterance = new SpeechSynthesisUtterance(sentence);
      activeSpeakingUtterance = utterance;
      if (typeof window !== 'undefined') {
        (window as any)._activeSpeakingUtterance = utterance;
      }

      utterance.rate = settings.voiceSpeed || 1.0;
      utterance.pitch = settings.voicePitch || 1.0;
      utterance.lang = 'en-US';
      if (selectedVoiceObj) utterance.voice = selectedVoiceObj;

      utterance.onend = () => {
        playNext();
      };

      utterance.onerror = (e) => {
        console.warn('TTS sentence error:', e);
        playNext();
      };

      try {
        synth.speak(utterance);
        if (synth.paused) {
          synth.resume();
        }
      } catch (err) {
        console.warn('Failed to speak utterance:', err);
        playNext();
      }
    };

    // Android WebView background keepalive to prevent audio pause stall
    clearKeepAlive();
    ttsKeepAliveInterval = setInterval(() => {
      if (synth && synth.speaking) {
        synth.pause();
        synth.resume();
      } else {
        clearKeepAlive();
      }
    }, 4500);

    // Android WebView workaround: small delay after cancel before speak
    setTimeout(() => {
      try {
        if (synth.paused) {
          synth.resume();
        }
        playNext();
      } catch (err) {
        console.warn('TTS start error:', err);
        finishPlayback();
      }
    }, 60);
  },

  stopSpeaking: () => {
    if (ttsKeepAliveInterval) {
      clearInterval(ttsKeepAliveInterval);
      ttsKeepAliveInterval = null;
    }
    activeSpeakingUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any)._activeSpeakingUtterance = null;
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    }
  },

  /**
   * Main conversational reasoning engine:
   * Maps natural language prompt to productivity database actions.
   */
  processVoiceCommand: async (inputText: string): Promise<AssistantActionExecution> => {
    const text = inputText.trim();
    const lower = text.toLowerCase();

    // 1. Check for Pending Follow-up (e.g. creating mission deadline)
    if (memoryContext.awaitingFollowUpFor === 'mission_deadline' && memoryContext.pendingMissionDraft) {
      const { dateKey } = resolveDateWord(text);
      const draft = memoryContext.pendingMissionDraft;
      const created = MissionService.create({
        title: draft.title,
        startDate: getTodayKey(),
        deadline: dateKey,
        priority: 'high',
        category: draft.category || 'development',
        subtasks: [
          { id: `sub-init-1`, title: 'Initial planning', completed: false, order: 0 },
          { id: `sub-init-2`, title: 'Core milestone execution', completed: false, order: 1 },
          { id: `sub-init-3`, title: 'Final testing & review', completed: false, order: 2 },
        ],
      });

      memoryContext.awaitingFollowUpFor = undefined;
      memoryContext.pendingMissionDraft = undefined;
      memoryContext.lastMentionedMissionId = created.id;
      WidgetService.refreshPayload();

      return {
        intent: 'CREATE_MISSION',
        responseText: `Mission "${created.title}" created with deadline set to ${dateKey}. I've set up three starting milestones for you.`,
        actionTaken: `Created mission: ${created.title}`,
        navigateToTab: 'missions',
      };
    }

    // 2. Check for Pending Confirmation (e.g. destructive actions)
    if (memoryContext.pendingConfirmation) {
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('do it') || lower.includes('sure')) {
        const msg = memoryContext.pendingConfirmation.execute();
        memoryContext.pendingConfirmation = undefined;
        WidgetService.refreshPayload();
        return {
          intent: 'CONFIRMED_ACTION',
          responseText: msg,
          actionTaken: 'Executed confirmed action',
        };
      } else if (lower.includes('no') || lower.includes('cancel') || lower.includes('stop')) {
        memoryContext.pendingConfirmation = undefined;
        return {
          intent: 'CANCELLED_ACTION',
          responseText: 'Understood. Action cancelled.',
          actionTaken: 'Cancelled pending action',
        };
      }
    }

    // 3. INTENT: WHAT DO I HAVE LEFT TODAY / LIST TODAY
    if (
      lower.includes('left today') ||
      lower.includes('what do i have') ||
      lower.includes('today tasks') ||
      lower.includes('today schedule') ||
      lower.includes("what's today") ||
      lower.includes('whats today') ||
      lower.includes('my day look like')
    ) {
      const todayTasks = TaskService.getTodayTasks();
      const remaining = todayTasks.filter((t) => t.status !== 'completed');
      const completed = todayTasks.filter((t) => t.status === 'completed');

      if (remaining.length === 0) {
        return {
          intent: 'LIST_TODAY',
          responseText: `All clear! You've completed all ${completed.length} tasks scheduled for today. Great job!`,
          actionTaken: 'Retrieved today remaining tasks',
          navigateToTab: 'today',
        };
      }

      const topTask = remaining[0];
      const timeInfo = topTask.dueTime ? ` scheduled for ${topTask.dueTime}` : '';
      return {
        intent: 'LIST_TODAY',
        responseText: `You have ${remaining.length} remaining tasks today. Your ${topTask.title}${timeInfo} is the most time-sensitive.`,
        actionTaken: `Found ${remaining.length} remaining tasks`,
        navigateToTab: 'today',
      };
    }

    // 4. INTENT: SHOW FLOW / DAILY FLOW
    if (lower.includes('show flow') || lower.includes('current flow') || lower.includes('my flow') || lower.includes('show timeline')) {
      const flow = FlowService.getTodayFlow();
      const activeItem = flow.find((f) => f.status === 'in_progress') || flow.find((f) => f.status === 'upcoming');
      const response = activeItem
        ? `Here is your daily flow. Currently active is ${activeItem.title} at ${activeItem.time}.`
        : 'Here is your life flow timeline for today.';

      return {
        intent: 'SHOW_FLOW',
        responseText: response,
        actionTaken: 'Displayed Life Flow',
        navigateToTab: 'flow',
      };
    }

    // 5. INTENT: WEEKLY REVIEW / WEEKLY UPDATES OF TASKS DONE
    if (
      lower.includes('weekly update') ||
      lower.includes('weekly updates') ||
      lower.includes('weekly review') ||
      lower.includes('weekly analysis') ||
      lower.includes('weekly progress') ||
      lower.includes('how did i do this week') ||
      lower.includes('how productive was i this week') ||
      lower.includes('my week') ||
      lower.includes('tasks done this week') ||
      lower.includes('tasks done week') ||
      lower.includes('tasks completed this week')
    ) {
      const weekly = ReviewService.generateWeeklyReview();
      return {
        intent: 'WEEKLY_REVIEW',
        responseText: weekly.spokenScript,
        actionTaken: 'Generated Weekly AI Review',
      };
    }

    // 6. INTENT: MONTHLY REVIEW / MONTHLY UPDATES
    if (
      lower.includes('monthly update') ||
      lower.includes('monthly updates') ||
      lower.includes('monthly review') ||
      lower.includes('monthly analysis') ||
      lower.includes('monthly progress') ||
      lower.includes('how did i do this month') ||
      lower.includes('month summary') ||
      lower.includes('tasks done this month') ||
      lower.includes('tasks done month') ||
      lower.includes('tasks completed this month')
    ) {
      const monthly = ReviewService.generateMonthlyReview();
      return {
        intent: 'MONTHLY_REVIEW',
        responseText: monthly.spokenScript,
        actionTaken: 'Generated Monthly AI Review',
      };
    }

    // 6.5. INTENT: GENERAL ANALYSIS / UPDATES OF TASKS DONE
    if (
      lower.includes('analysis') ||
      lower.includes('updates of tasks done') ||
      lower.includes('update of tasks done') ||
      lower.includes('updates of task done') ||
      lower.includes('update of task done') ||
      lower.includes('tasks done') ||
      lower.includes('tasks completed')
    ) {
      const weekly = ReviewService.generateWeeklyReview();
      const stats = ProgressService.calculateStats();
      const doneList = weekly.completedTasksList || [];
      const doneNames = doneList.length > 0 ? ` Recent completed tasks include ${doneList.slice(0, 3).map(t => `"${t.title}"`).join(', ')}.` : '';
      const reply = `Here is your productivity analysis: you have completed ${weekly.tasksCompleted} of ${weekly.tasksPlanned} planned tasks this week with a ${weekly.completionRate}% completion rate. Your routine consistency is ${stats.routineConsistency}%.${doneNames}`;
      return {
        intent: 'PRODUCTIVITY_ANALYSIS',
        responseText: reply,
        actionTaken: 'Generated Productivity Analysis',
      };
    }

    // 7. INTENT: CHECK PROGRESS / HOW AM I DOING
    if (lower.includes('check progress') || lower.includes('how is my progress') || lower.includes('my stats')) {
      const stats = ProgressService.calculateStats();
      return {
        intent: 'CHECK_PROGRESS',
        responseText: `Your daily completion rate is ${stats.dailyCompletionRate}% with ${stats.completedTasksToday} of ${stats.totalTasksToday} tasks finished. Your routine consistency is holding strong at ${stats.routineConsistency}%.`,
        actionTaken: 'Retrieved real-time productivity stats',
      };
    }

    // 8. INTENT: COMPLETE TASK / I FINISHED ... / MARK AS DONE
    if (
      lower.includes('i finished') ||
      lower.includes('finished my') ||
      lower.includes('completed my') ||
      (lower.includes('mark') && (lower.includes('complete') || lower.includes('done') || lower.includes('complted') || lower.includes('finish'))) ||
      lower.includes('check off') ||
      lower.includes('done with') ||
      lower.includes('complete task') ||
      lower.includes('complete the task') ||
      lower.startsWith('complete ') ||
      lower.startsWith('finish ')
    ) {
      // Extract target subject
      let cleaned = lower
        .replace(/(i finished|finished my|completed my|mark\s+(?:it|this|that|t|the task|task)?\s*(?:as )?(?:completed|complete|complted|done)|complete\s+(?:the\s+)?task|finish\s+(?:the\s+)?task|check off|done with|as complete|as completed|as complted|as done|mark|my|the|task)/gi, '')
        .trim();

      const matchedTask = findMatchingTask(cleaned);
      if (matchedTask) {
        if (matchedTask.status !== 'completed') {
          TaskService.toggleComplete(matchedTask.id);
        }
        memoryContext.lastMentionedTaskId = matchedTask.id;
        WidgetService.refreshPayload();

        let extraNote = '';
        if (matchedTask.missionId) {
          const mission = MissionService.getById(matchedTask.missionId);
          if (mission) {
            extraNote = ` You're now ${mission.progress}% through the ${mission.title} mission.`;
          }
        }

        return {
          intent: 'COMPLETE_TASK',
          responseText: `Nice. I've marked "${matchedTask.title}" as completed.${extraNote}`,
          actionTaken: `Completed task: ${matchedTask.title}`,
          targetId: matchedTask.id,
          navigateToTab: 'today',
        };
      }

      // Check subtask or routine
      const missions = MissionService.getAll();
      for (const m of missions) {
        for (const s of m.subtasks) {
          if (s.title.toLowerCase().includes(cleaned) || cleaned.includes(s.title.toLowerCase())) {
            MissionService.toggleSubtask(m.id, s.id);
            WidgetService.refreshPayload();
            return {
              intent: 'COMPLETE_SUBTASK',
              responseText: `Done. I've marked milestone "${s.title}" in ${m.title} as completed. Progress updated to ${m.progress}%.`,
              actionTaken: `Completed subtask: ${s.title}`,
              navigateToTab: 'missions',
            };
          }
        }
      }

      // Check Flow routines
      const flowItems = FlowService.getTodayFlow();
      const routineMatch = flowItems.find((f) => f.title.toLowerCase().includes(cleaned));
      if (routineMatch) {
        FlowService.toggleFlowItemComplete(routineMatch);
        WidgetService.refreshPayload();
        return {
          intent: 'COMPLETE_ROUTINE',
          responseText: `Excellent. I've marked your "${routineMatch.title}" routine as completed for today.`,
          actionTaken: `Completed routine: ${routineMatch.title}`,
          navigateToTab: 'flow',
        };
      }

      return {
        intent: 'COMPLETE_TASK_FAIL',
        responseText: `I couldn't locate a task matching "${cleaned}". Could you clarify the exact task title?`,
      };
    }

    // 9. INTENT: CREATE MISSION
    if (lower.includes('create a mission') || lower.includes('create mission') || lower.includes('new mission')) {
      const match = text.match(/create (?:a )?mission (?:for )?(.+?)(?: with deadline|$)/i);
      const title = match ? match[1].trim() : 'New Project Mission';

      // Ask follow-up question
      memoryContext.awaitingFollowUpFor = 'mission_deadline';
      memoryContext.pendingMissionDraft = {
        title: title.replace(/^for\s+/i, ''),
        category: 'development',
      };

      return {
        intent: 'CREATE_MISSION_FOLLOWUP',
        responseText: `Sure. What deadline would you like for ${memoryContext.pendingMissionDraft.title}? (e.g. "tomorrow", "Friday", or "October 15")`,
        actionTaken: 'Awaiting mission deadline',
      };
    }

    // 10. INTENT: ADD SUBTASK
    if (lower.includes('add') && (lower.includes('subtask') || lower.includes('milestone'))) {
      const match = text.match(/add (.+?) as (?:a )?(?:subtask|milestone)(?: to (.+))?/i);
      const subtaskTitle = match ? match[1].trim() : 'New milestone';
      const missionQuery = match && match[2] ? match[2].trim() : '';

      const targetMission = missionQuery ? findMatchingMission(missionQuery) : (memoryContext.lastMentionedMissionId ? MissionService.getById(memoryContext.lastMentionedMissionId) : MissionService.getActive()[0]);

      if (targetMission) {
        MissionService.addSubtask(targetMission.id, subtaskTitle);
        memoryContext.lastMentionedMissionId = targetMission.id;
        WidgetService.refreshPayload();
        return {
          intent: 'ADD_SUBTASK',
          responseText: `Added "${subtaskTitle}" to your ${targetMission.title} mission.`,
          actionTaken: `Added subtask to ${targetMission.title}`,
          navigateToTab: 'missions',
        };
      }

      return {
        intent: 'ADD_SUBTASK_FAIL',
        responseText: "Which mission would you like to add this subtask to?",
      };
    }

    // 11. INTENT: MOVE / RESCHEDULE TASK
    if (lower.includes('move') || lower.includes('reschedule') || lower.includes('postpone')) {
      const { dateKey } = resolveDateWord(text);
      const cleaned = lower.replace(/(move|reschedule|postpone|my|task|to|saturday|friday|tomorrow|next week)/gi, '').trim();
      const task = findMatchingTask(cleaned);

      if (task) {
        TaskService.update(task.id, { dueDate: dateKey });
        memoryContext.lastMentionedTaskId = task.id;
        WidgetService.refreshPayload();
        return {
          intent: 'UPDATE_TASK',
          responseText: `Done — I've moved "${task.title}" to ${dateKey}.`,
          actionTaken: `Rescheduled task ${task.title} to ${dateKey}`,
          navigateToTab: 'today',
        };
      }
    }

    // 12. INTENT: DELETE TASK (Requires safety check or executes)
    if (lower.includes('delete') || lower.includes('remove')) {
      const cleaned = lower.replace(/(delete|remove|the|my|task|routine|mission)/gi, '').trim();
      const task = findMatchingTask(cleaned);

      if (task) {
        // Confirmation for task deletion
        memoryContext.pendingConfirmation = {
          actionName: `Delete task ${task.title}`,
          execute: () => {
            TaskService.delete(task.id);
            return `I have removed "${task.title}".`;
          },
        };

        return {
          intent: 'CONFIRM_DELETE',
          responseText: `Are you sure you want to delete "${task.title}"? Say "yes" to confirm or "no" to cancel.`,
          requiresConfirmation: true,
        };
      }
    }

    // 13. INTENT: CARRY OVER INCOMPLETE TASKS
    if (lower.includes('carry over') || lower.includes('move incomplete') || lower.includes('carryover')) {
      const count = TaskService.carryOverToTomorrow();
      WidgetService.refreshPayload();
      return {
        intent: 'CARRYOVER_TASKS',
        responseText: count > 0 ? `I've moved ${count} incomplete tasks to tomorrow.` : 'You have no overdue tasks to carry over.',
        actionTaken: `Carried over ${count} tasks`,
      };
    }

    // 14. INTENT: CREATE / ASSIGN TASK
    const isTaskCreation =
      /^(?:please\s+)?(?:set|add|create|schedule|put|make|assign)\s+(?:a\s+|an\s+|me\s+a\s+)?task\b/i.test(text) ||
      /\b(?:create|add|set|schedule|assign)\s+(?:a\s+|an\s+)?task\b/i.test(text) ||
      /^(?:please\s+)?remind\s+me\s+to\b/i.test(text) ||
      /^(?:add|schedule|set|assign)\s+task\b/i.test(lower) ||
      lower.startsWith('add ') ||
      lower.startsWith('schedule ') ||
      lower.startsWith('assign ') ||
      lower.includes('new task') ||
      lower.startsWith('task assignment');

    if (isTaskCreation) {
      const { dateKey, time: resolvedTime } = resolveDateWord(text);

      // Extract explicit time phrase if present
      const timeRegex = /\b(?:at|of|for|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at|of|for|by)\s+(\d{1,2}):(\d{2})\b|\b(?:at|of|for|by)\s+(\d{1,2})\s*(?:o'?clock)\b/i;
      const timeMatch = text.match(timeRegex);
      const timePhrase = timeMatch ? timeMatch[0] : '';

      // Clean task title from conversational phrasing
      let title = text
        .replace(/^(?:task\s+assignment\s*:\s*|task\s+assignment\s+)/i, '')
        .replace(/^(?:please\s+)?(?:set|add|create|schedule|put|make|assign)\s+(?:a\s+|an\s+|me\s+a\s+)?task\s*(?:for|to|of|named|called)?\s*/i, '')
        .replace(/^(?:please\s+)?remind\s+me\s+to\s*/i, '')
        .replace(/^(?:please\s+)?(?:add|schedule|set|assign)\s+/i, '');

      // Remove time phrase if it was at the beginning (e.g. "of 3pm as completion of homework")
      if (timePhrase) {
        const escapedPhrase = timePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        title = title
          .replace(new RegExp(`^${escapedPhrase}\\s*(?:as|to|called|named|for|that)?\\s*`, 'i'), '')
          .replace(new RegExp(`\\s*${escapedPhrase}.*$`, 'i'), '');
      }

      // Clean trailing dates, relative words, and fix speech-to-text typos
      title = title
        .replace(/\bhomw\s*work\b/gi, 'homework')
        .replace(/\bhomwork\b/gi, 'homework')
        .replace(/\bcomplted\b/gi, 'completed')
        .replace(/^(?:as|to|called|named|for|that)\s+/i, '')
        .replace(/\s+(?:tomorrow|tonight|today|on\s+\w+).*$/i, '')
        .trim();

      if (!title) title = 'Scheduled Task';
      title = title.charAt(0).toUpperCase() + title.slice(1);

      // Detect category
      let category = 'study';
      if (lower.includes('project') || lower.includes('code') || lower.includes('python') || lower.includes('dev')) {
        category = 'development';
      } else if (lower.includes('exercise') || lower.includes('gym') || lower.includes('run') || lower.includes('workout')) {
        category = 'routine';
      } else if (lower.includes('work') || lower.includes('job') || lower.includes('internship') || lower.includes('office')) {
        category = 'work';
      } else if (lower.includes('homework') || lower.includes('study') || lower.includes('assignment') || lower.includes('dbms') || lower.includes('exam') || lower.includes('viva')) {
        category = 'study';
      } else {
        category = 'general';
      }

      // Detect linked mission
      const activeMissions = MissionService.getActive();
      let matchedMissionId: string | undefined = undefined;
      for (const m of activeMissions) {
        if (title.toLowerCase().includes(m.title.toLowerCase()) || lower.includes(m.title.toLowerCase())) {
          matchedMissionId = m.id;
          break;
        }
      }

      const effectiveTime = resolvedTime || '15:00';

      const newTask = TaskService.create({
        title,
        dueDate: dateKey,
        dueTime: effectiveTime,
        priority: lower.includes('urgent') || lower.includes('important') || lower.includes('high') ? 'high' : 'medium',
        category,
        missionId: matchedMissionId,
        reminder: true,
      });

      memoryContext.lastMentionedTaskId = newTask.id;
      WidgetService.refreshPayload();

      // Format display time for conversational voice reply (e.g. 15:00 -> 3:00 PM)
      let displayTime = newTask.dueTime || '3:00 PM';
      if (newTask.dueTime && newTask.dueTime.includes(':')) {
        const [hS, mS] = newTask.dueTime.split(':');
        let hNum = parseInt(hS, 10);
        const meridian = hNum >= 12 ? 'PM' : 'AM';
        if (hNum > 12) hNum -= 12;
        if (hNum === 0) hNum = 12;
        displayTime = `${hNum}:${mS} ${meridian}`;
      }

      const dateWord = newTask.dueDate === getTodayKey() ? 'today' : (newTask.dueDate === resolveDateWord('tomorrow').dateKey ? 'tomorrow' : `on ${newTask.dueDate}`);
      const reply = `Done! I've scheduled "${newTask.title}" for ${dateWord} at ${displayTime}.`;

      return {
        intent: 'CREATE_TASK',
        responseText: reply,
        actionTaken: `Created task: ${newTask.title}`,
        targetId: newTask.id,
        navigateToTab: 'today',
      };
    }

    // 15. DEFAULT CONVERSATIONAL / QUERY FALLBACK
    const tasks = TaskService.getTodayTasks();
    return {
      intent: 'GENERAL_ASSIST',
      responseText: `I'm here. You have ${tasks.filter((t) => t.status !== 'completed').length} tasks left on your schedule today. You can ask me to add tasks, complete milestones, review your week, or check your flow.`,
      actionTaken: 'Provided assistant status',
    };
  },
};
