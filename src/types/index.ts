/**
 * Core Data Models & Type Definitions for LineUp
 */

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'upcoming' | 'in_progress' | 'completed' | 'missed' | 'archived';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom';

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: Priority;
  category: string;
  missionId?: string;
  recurrence?: string;
  reminder?: boolean;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  completedAt?: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  priority: Priority;
  category: string;
  subtasks: Subtask[];
  notes?: string;
  progress: number; // 0 - 100
  color?: string;
  icon?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  completedAt?: string;
}

export interface Routine {
  id: string;
  title: string;
  icon: string;
  time: string; // HH:MM
  startTime?: string; // alias for time
  durationMinutes: number;
  duration?: number; // alias for durationMinutes
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  category: string;
  consistencyScore: number; // percentage 0-100
  active: boolean;
  // Runtime / display fields
  completedToday?: boolean;
  completionRate?: number; // 0-1
  currentStreak?: number;
}

export type FlowEventType = 'routine' | 'task' | 'mission_task';
export type FlowEventStatus = 'completed' | 'in_progress' | 'upcoming' | 'missed';

export interface FlowEvent {
  id: string;
  type: FlowEventType;
  refId: string; // Task ID or Routine ID
  title: string;
  time: string; // HH:MM
  endTime?: string; // HH:MM
  status: FlowEventStatus;
  category: string;
  icon?: string;
  isRoutine: boolean;
  durationMinutes?: number;
  priority?: Priority;
  missionTitle?: string;
}

export interface CompletionRecord {
  id: string;
  itemId: string;
  itemType: 'task' | 'subtask' | 'routine';
  timestamp: string; // ISO
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed';
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceConversation {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actionPerformed?: string;
  timestamp: string;
  audioPlaying?: boolean;
}

export interface ProductivityStats {
  dailyCompletionRate: number; // %
  weeklyCompletionRate: number; // %
  monthlyCompletionRate: number; // %
  routineConsistency: number; // %
  missionProgressAvg: number; // %
  taskCompletionStreak: number; // days
  missedTaskCount: number;
  carryOverCount: number;
  totalTasksToday: number;
  completedTasksToday: number;
  remainingTasksToday: number;
  categoryCompletion: Record<string, { total: number; completed: number; rate: number }>;
  averageCompletionDelayMinutes: number;
  lastUpdated: string;
}

export interface WeeklyReviewData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  tasksPlanned: number;
  tasksCompleted: number;
  tasksMissed: number;
  completionRate: number;
  routineConsistency: number;
  missionMilestonesCompleted: number;
  totalMissionsActive: number;
  mostActiveCategory: string;
  topStrengths: string[];
  areasToImprove: string[];
  spokenScript: string;
  generatedAt: string;
  completedTasksList?: { id: string; title: string; category: string; completedAt?: string }[];
}

export interface MonthlyReviewData {
  id: string;
  monthName: string;
  monthKey: string; // YYYY-MM
  tasksPlanned: number;
  tasksCompleted: number;
  completionRate: number;
  routineConsistency: number;
  missionsCompleted: number;
  missedTasks: number;
  carryOverTasks: number;
  mostActiveCategories: string[];
  comparisonWithLastMonth: string;
  topStrengths?: string[];
  areasToImprove?: string[];
  spokenScript: string;
  generatedAt: string;
  completedTasksList?: { id: string; title: string; category: string; completedAt?: string }[];
}

export interface UserSettings {
  appearance: 'system' | 'light' | 'dark';
  voiceEnabled: boolean;
  voiceSpeed: number; // 0.8 - 1.4
  voicePitch: number; // 0.8 - 1.2
  selectedVoice: string;
  voiceAutoSpeak: boolean;
  hapticFeedback: boolean;
  dailyReviewNotification: boolean;
  weeklyReviewNotification: boolean;
  monthlyReviewNotification: boolean;
  weekStartsOn: 'sunday' | 'monday';
  defaultTaskDuration: number;
  onboardingCompleted: boolean;
  userName: string;
  apiKey?: string;
  targetSleepHours?: number; // default 8.0
  sleepBedtime?: string; // default "23:00"
  sleepWakeTime?: string; // default "07:00"
}

export type SleepQuality = 'exhausted' | 'fair' | 'good' | 'energized';

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  durationMinutes: number; // e.g. 480
  quality: SleepQuality;
  targetHours: number; // e.g. 8.0
  notes?: string;
  createdAt: string;
}

export interface WidgetPayload {
  lastUpdated: string;
  todaySummary: {
    total: number;
    completed: number;
    percentage: number;
  };
  activeFlowItems: {
    id: string;
    title: string;
    time: string;
    status: FlowEventStatus;
    icon?: string;
  }[];
  activeMission?: {
    id: string;
    title: string;
    progress: number;
    daysRemaining: number;
    deadline: string;
  };
}
