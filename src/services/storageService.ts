/**
 * Storage Service - handles persistent storage for Tasks, Missions, Routines,
 * History, Voice Logs, and Settings with realistic demo data fallback.
 */

import { Task, Mission, Routine, CompletionRecord, UserSettings, VoiceConversation } from '../types';
import { APP_CONFIG } from '../config/appConfig';

const STORAGE_KEYS = {
  TASKS: 'lineup_tasks',
  MISSIONS: 'lineup_missions',
  ROUTINES: 'lineup_routines',
  COMPLETIONS: 'lineup_completions',
  SETTINGS: 'lineup_settings',
  VOICE_CONVERSATIONS: 'lineup_voice_conversations',
  INITIALIZED: 'lineup_initialized_v1',
};

export const defaultSettings: UserSettings = {
  appearance: 'dark',
  voiceEnabled: true,
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  selectedVoice: '',
  voiceAutoSpeak: true,
  hapticFeedback: true,
  dailyReviewNotification: true,
  weeklyReviewNotification: true,
  monthlyReviewNotification: true,
  weekStartsOn: 'monday',
  defaultTaskDuration: 45,
  onboardingCompleted: false,
  userName: 'User',
};

// Formats a date object to YYYY-MM-DD in local time
export const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = (): string => {
  return formatDateKey(new Date());
};

// Realistic sample data for first launch or demo mode
export const generateDemoData = () => {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 6);
  const nextWeekKey = formatDateKey(nextWeek);

  const demoMissions: Mission[] = [
    {
      id: 'mission-ai-project',
      title: 'AI Project',
      description: 'Production-ready neural assistant & productivity model pipeline',
      startDate: yesterdayKey,
      deadline: nextWeekKey,
      priority: 'high',
      category: 'development',
      progress: 72,
      color: '#0A84FF',
      status: 'active',
      createdAt: yesterday.toISOString(),
      subtasks: [
        { id: 'sub-1', title: 'Research & Architecture', completed: true, order: 0, completedAt: yesterday.toISOString() },
        { id: 'sub-2', title: 'Dataset preparation', completed: true, order: 1, completedAt: yesterday.toISOString() },
        { id: 'sub-3', title: 'Model implementation', completed: true, order: 2, completedAt: today.toISOString() },
        { id: 'sub-4', title: 'Testing & Error validation', completed: false, order: 3 },
        { id: 'sub-5', title: 'Documentation', completed: false, order: 4 },
        { id: 'sub-6', title: 'Presentation deck', completed: false, order: 5 },
      ],
      notes: 'Focus on low latency intent classification and seamless voice responses.',
    },
    {
      id: 'mission-dbms-lab',
      title: 'DBMS Lab & Record',
      description: 'Complete SQL query optimization, transactions chapter and record sign-off',
      startDate: yesterdayKey,
      deadline: tomorrowKey,
      priority: 'high',
      category: 'study',
      progress: 80,
      color: '#BF5AF2',
      status: 'active',
      createdAt: yesterday.toISOString(),
      subtasks: [
        { id: 'sub-dbms-1', title: 'SQL Joins & Trigger Exercises', completed: true, order: 0, completedAt: yesterday.toISOString() },
        { id: 'sub-dbms-2', title: 'Normalization documentation', completed: true, order: 1, completedAt: yesterday.toISOString() },
        { id: 'sub-dbms-3', title: 'Complete DBMS Lab practical', completed: true, order: 2, completedAt: today.toISOString() },
        { id: 'sub-dbms-4', title: 'Final Record submission', completed: false, order: 3 },
      ],
      notes: 'Due for lab verification tomorrow.',
    },
    {
      id: 'mission-hackathon',
      title: 'Hackathon Prototype',
      description: 'Prepare hackathon presentation and live cloud deployment',
      startDate: todayKey,
      deadline: nextWeekKey,
      priority: 'medium',
      category: 'development',
      progress: 33,
      color: '#30D158',
      status: 'active',
      createdAt: today.toISOString(),
      subtasks: [
        { id: 'sub-hack-1', title: 'Wireframing & UX design', completed: true, order: 0, completedAt: today.toISOString() },
        { id: 'sub-hack-2', title: 'API integration', completed: false, order: 1 },
        { id: 'sub-hack-3', title: 'Pitch deck slides', completed: false, order: 2 },
      ],
    },
  ];

  const demoTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Submit DBMS assignment',
      description: 'Upload practical queries and schema diagrams to portal',
      dueDate: todayKey,
      dueTime: '16:00',
      priority: 'high',
      category: 'study',
      missionId: 'mission-dbms-lab',
      reminder: true,
      status: 'completed',
      createdAt: yesterday.toISOString(),
      completedAt: new Date(today.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'task-2',
      title: 'Finish AI project',
      description: 'Complete intent parser tests and action executor service',
      dueDate: todayKey,
      dueTime: '18:30',
      priority: 'high',
      category: 'development',
      missionId: 'mission-ai-project',
      reminder: true,
      status: 'upcoming',
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'task-3',
      title: 'Exercise',
      description: 'Cardio, strength session and post-workout stretches',
      dueDate: todayKey,
      dueTime: '20:00',
      priority: 'medium',
      category: 'routine',
      recurrence: 'daily',
      reminder: true,
      status: 'upcoming',
      createdAt: today.toISOString(),
    },
    {
      id: 'task-4',
      title: 'Read research paper',
      description: 'Read attention mechanism transformer paper section 3-5',
      dueDate: todayKey,
      dueTime: '21:30',
      priority: 'low',
      category: 'study',
      reminder: false,
      status: 'upcoming',
      createdAt: today.toISOString(),
    },
    {
      id: 'task-5',
      title: 'Prepare for viva',
      description: 'Revise ACID properties, indexing, and B-trees',
      dueDate: tomorrowKey,
      dueTime: '10:00',
      priority: 'high',
      category: 'study',
      missionId: 'mission-dbms-lab',
      status: 'upcoming',
      createdAt: today.toISOString(),
    },
    {
      id: 'task-6',
      title: 'Complete internship task',
      description: 'Submit pull request for automated analytics sync',
      dueDate: tomorrowKey,
      dueTime: '15:00',
      priority: 'medium',
      category: 'work',
      status: 'upcoming',
      createdAt: today.toISOString(),
    },
    {
      id: 'task-7',
      title: 'Prepare hackathon presentation',
      description: 'Draft the 3-minute pitch slides and demo flow',
      dueDate: nextWeekKey,
      dueTime: '19:00',
      priority: 'medium',
      category: 'development',
      missionId: 'mission-hackathon',
      status: 'upcoming',
      createdAt: today.toISOString(),
    },
    {
      id: 'task-8',
      title: 'Morning review & planning',
      description: 'Align day schedule and priorities',
      dueDate: todayKey,
      dueTime: '07:30',
      priority: 'low',
      category: 'routine',
      status: 'completed',
      createdAt: today.toISOString(),
      completedAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
    },
  ];

  const demoRoutines: Routine[] = APP_CONFIG.defaultRoutines.map((r) => ({
    id: r.id,
    title: r.title,
    icon: r.icon,
    time: r.time,
    durationMinutes: r.durationMinutes,
    daysOfWeek: r.daysOfWeek,
    category: r.category,
    consistencyScore: r.consistencyScore,
    active: true,
  }));

  // Historical completion records for the past 7 days to give genuine statistics
  const demoCompletions: CompletionRecord[] = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);

    // Routine completions
    demoCompletions.push({
      id: `comp-rout-wake-${i}`,
      itemId: 'routine-wakeup',
      itemType: 'routine',
      timestamp: `${dateStr}T07:15:00Z`,
      date: dateStr,
      status: 'completed',
    });
    demoCompletions.push({
      id: `comp-rout-col-${i}`,
      itemId: 'routine-college',
      itemType: 'routine',
      timestamp: `${dateStr}T13:00:00Z`,
      date: dateStr,
      status: 'completed',
    });
    if (i % 2 === 0) {
      demoCompletions.push({
        id: `comp-rout-ex-${i}`,
        itemId: 'routine-exercise',
        itemType: 'routine',
        timestamp: `${dateStr}T20:30:00Z`,
        date: dateStr,
        status: 'completed',
      });
    }

    // Task completions
    demoCompletions.push({
      id: `comp-task-${i}-1`,
      itemId: `task-hist-${i}`,
      itemType: 'task',
      timestamp: `${dateStr}T17:00:00Z`,
      date: dateStr,
      status: 'completed',
    });
    demoCompletions.push({
      id: `comp-task-${i}-2`,
      itemId: `task-hist-${i}-b`,
      itemType: 'task',
      timestamp: `${dateStr}T19:30:00Z`,
      date: dateStr,
      status: 'completed',
    });
  }

  // Today's completed records
  demoCompletions.push({
    id: 'comp-today-1',
    itemId: 'task-1',
    itemType: 'task',
    timestamp: new Date(today.getTime() - 4 * 3600 * 1000).toISOString(),
    date: todayKey,
    status: 'completed',
  });
  demoCompletions.push({
    id: 'comp-today-2',
    itemId: 'task-8',
    itemType: 'task',
    timestamp: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
    date: todayKey,
    status: 'completed',
  });

  const demoVoiceConversations: VoiceConversation[] = [
    {
      id: 'voice-msg-1',
      role: 'user',
      text: 'What do I have left today?',
      timestamp: new Date(today.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'voice-msg-2',
      role: 'assistant',
      text: 'You have three remaining tasks today. Your AI project is the most time-sensitive, scheduled for 6:30 PM.',
      timestamp: new Date(today.getTime() - 24 * 60 * 1000).toISOString(),
    },
  ];

  return {
    tasks: demoTasks,
    missions: demoMissions,
    routines: demoRoutines,
    completions: demoCompletions,
    conversations: demoVoiceConversations,
  };
};

export const StorageService = {
  initStorage: () => {
    try {
      const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        const demo = generateDemoData();
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(demo.tasks));
        localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(demo.missions));
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(demo.routines));
        localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(demo.completions));
        localStorage.setItem(STORAGE_KEYS.VOICE_CONVERSATIONS, JSON.stringify(demo.conversations));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
    } catch (err) {
      console.warn('Storage initialization fallback to memory', err);
    }
  },

  getTasks: (): Task[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveTasks: (tasks: Task[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  },

  getMissions: (): Mission[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveMissions: (missions: Mission[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    } catch (e) {
      console.error('Error saving missions', e);
    }
  },

  getRoutines: (): Routine[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveRoutines: (routines: Routine[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error('Error saving routines', e);
    }
  },

  getCompletions: (): CompletionRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCompletions: (completions: CompletionRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
    } catch (e) {
      console.error('Error saving completions', e);
    }
  },

  getSettings: (): UserSettings => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings: (settings: UserSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  getVoiceConversations: (): VoiceConversation[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VOICE_CONVERSATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveVoiceConversations: (conversations: VoiceConversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Error saving voice conversations', e);
    }
  },

  resetToDemo: () => {
    const demo = generateDemoData();
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(demo.tasks));
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(demo.missions));
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(demo.routines));
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(demo.completions));
    localStorage.setItem(STORAGE_KEYS.VOICE_CONVERSATIONS, JSON.stringify(demo.conversations));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...defaultSettings, onboardingCompleted: true }));
  },

  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.MISSIONS);
    localStorage.removeItem(STORAGE_KEYS.ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(STORAGE_KEYS.VOICE_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  },

  exportDataJson: (): string => {
    return JSON.stringify({
      version: APP_CONFIG.version,
      exportedAt: new Date().toISOString(),
      tasks: StorageService.getTasks(),
      missions: StorageService.getMissions(),
      routines: StorageService.getRoutines(),
      completions: StorageService.getCompletions(),
      settings: StorageService.getSettings(),
    }, null, 2);
  },

  importDataJson: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.tasks)) StorageService.saveTasks(data.tasks);
      if (Array.isArray(data.missions)) StorageService.saveMissions(data.missions);
      if (Array.isArray(data.routines)) StorageService.saveRoutines(data.routines);
      if (Array.isArray(data.completions)) StorageService.saveCompletions(data.completions);
      if (data.settings) StorageService.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};
