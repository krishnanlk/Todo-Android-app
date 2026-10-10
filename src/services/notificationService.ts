/**
 * Notification Service - Smart, witty, and engaging daily notifications
 * alerting the user to tasks due today (same day).
 * Pure English witty copy (Zomato-style catchiness) + Native Android LocalNotifications + Web Push + In-app Toasts.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageService, getTodayKey } from './storageService';
import { TaskService } from './taskService';
import { Task } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'flow' | 'review' | 'system';
  timestamp: string;
}

// Curated library of witty, catchy, pure English notification lines
interface WittyMessage {
  title: string;
  body: (taskCount: number, topTaskName: string) => string;
}

const MORNING_WITTY_LINES: WittyMessage[] = [
  {
    title: "Knock knock! 🚪 VIP delivery for you",
    body: (count, task) =>
      count === 1
        ? `Just 1 mission on your menu today: '${task}'. Ready to feast? 🍽️`
        : `${count} fresh tasks hot out of the oven today, starting with '${task}'. Ready to feast? 🚀`,
  },
  {
    title: "Your bed misses you already! 🛌",
    body: (count, task) =>
      count === 1
        ? `Conquer '${task}' today and sleep like royalty tonight! 👑`
        : `Finish today's ${count} tasks early and you can snooze completely guilt-free tonight! 🏆`,
  },
  {
    title: "Plot twist of the day 🎬",
    body: (count, task) =>
      count === 1
        ? `Finishing '${task}' today feels 100x better than scrolling for an hour! ⚡`
        : `Checking off ${count} tasks today feels 100x better than doomscrolling. Time to shine! ✨`,
  },
  {
    title: "Coffee is poured. Goals are loaded. ☕🔥",
    body: (count, task) =>
      count === 1
        ? `'${task}' is queued up for today. Let's make it look easy! 🎯`
        : `${count} tasks lined up for today. Grab that coffee and let's conquer! ☕💪`,
  },
  {
    title: "Are you a magician? 🪄",
    body: (count, task) =>
      count === 1
        ? `Make '${task}' disappear before lunch and watch your day level up! 🌟`
        : `Making ${count} tasks disappear today would look legendary. First up: '${task}'! 🎩✨`,
  },
];

const AFTERNOON_WITTY_LINES: WittyMessage[] = [
  {
    title: "Don't leave your tasks on read! 👀",
    body: (count, task) =>
      count === 1
        ? `'${task}' is waiting patiently for today. 10 minutes of focus and you're golden! 💥`
        : `${count} tasks waiting on today's list. 15 minutes of focus and you're halfway there! ⚡`,
  },
  {
    title: "Half-time pep talk! ⏳",
    body: (count, task) =>
      count === 1
        ? `Afternoon slump? Take a stretch and knock out '${task}'! 🏃‍♂️`
        : `The clock is ticking, but you're faster! ${count} tasks left on today's deck. 🚀`,
  },
  {
    title: "Your future self sent a high-five ✋",
    body: (count, task) =>
      count === 1
        ? `They whispered: 'Get '${task}' done today, we're building greatness!' 🌟`
        : `They whispered: 'Knock out these ${count} tasks today, we'll thank you tomorrow!' 🚀`,
  },
  {
    title: "Brain fuel alert ⚡",
    body: (count, task) =>
      count === 1
        ? `'${task}' is the main course today. Finish it and enjoy the rest of your day! 🍕`
        : `${count} tasks due before midnight. Conquer '${task}' now and chill later! 🛋️`,
  },
];

const EVENING_WITTY_LINES: WittyMessage[] = [
  {
    title: "Sleep like a champion tonight 🏆",
    body: (count, task) =>
      count === 1
        ? `Just '${task}' stands between you and total peace of mind tonight. Finish strong! 🌟`
        : `Only ${count} tasks left between you and legendary sleep. Let's finish strong! 🛌✨`,
  },
  {
    title: "Final countdown of the day! ⏰",
    body: (count, task) =>
      count === 1
        ? `Wrap up '${task}' before midnight strikes and keep that streak blazing! 🔥`
        : `Wrap up your ${count} tasks before midnight strikes to protect your streak! 🔥`,
  },
  {
    title: "Imagine the 100% satisfaction... 💯",
    body: (count, task) =>
      count === 1
        ? `One task away from a flawless day: '${task}'. Let's close it out! 🎯`
        : `You're just ${count} tasks away from a 100% completed day. You've got this! 🎉`,
  },
];

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    // 1. Try native Capacitor LocalNotifications on Android
    try {
      const capPerm = await LocalNotifications.requestPermissions();
      if (capPerm.display === 'granted') {
        return true;
      }
    } catch {
      // not on mobile or running in standard browser
    }

    // 2. Try Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch {
        return false;
      }
    }

    return false;
  },

  hasPermission: (): boolean => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  },

  /**
   * Universal dispatch: schedules or triggers notification on Android + Web + In-App Toast
   */
  send: async (title: string, options?: { body?: string; id?: number }) => {
    const settings = StorageService.getSettings();
    if (!settings.dailyReviewNotification) return;

    const notifId = options?.id || Math.floor(Math.random() * 100000) + 1;
    const bodyText = options?.body || '';

    // 1. Native Capacitor LocalNotification on Android device
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body: bodyText,
            schedule: { at: new Date(Date.now() + 500) }, // 500ms immediate schedule
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch {
      // Not on native device or fallback to web
    }

    // 2. Web browser Notification
    if (NotificationService.hasPermission()) {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          body: bodyText,
        });
      } catch (err) {
        console.warn('Browser notification error', err);
      }
    }

    // 3. In-app toast banner dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lineup-notification', {
          detail: {
            id: `notif-${Date.now()}`,
            title,
            body: bodyText,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  },

  /**
   * Generates a smart, witty, pure-English daily task notification for tasks due TODAY (same day).
   */
  generateCatchyTodayNotification: (todayTasks: Task[]): { title: string; body: string } => {
    const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');

    if (pendingTasks.length === 0) {
      return {
        title: "Clean slate club! 🌿",
        body: "You have zero tasks due today. Time to relax, recharge, or plan your next victory! ✨",
      };
    }

    const count = pendingTasks.length;
    const topTaskName = pendingTasks[0]?.title || 'Key Priority';

    const currentHour = new Date().getHours();
    let pool: WittyMessage[];

    if (currentHour < 12) {
      pool = MORNING_WITTY_LINES;
    } else if (currentHour < 18) {
      pool = AFTERNOON_WITTY_LINES;
    } else {
      pool = EVENING_WITTY_LINES;
    }

    // Pick a line based on day and count so it stays fresh
    const selected = pool[Math.floor(Math.random() * pool.length)];

    return {
      title: selected.title,
      body: selected.body(count, topTaskName),
    };
  },

  /**
   * Checks today's tasks and triggers a witty daily task alert if not already notified recently.
   */
  checkAndTriggerDailyAlert: async (force: boolean = false) => {
    const settings = StorageService.getSettings();
    if (!force && !settings.dailyReviewNotification) return;

    const todayKey = getTodayKey();
    const lastAlertKey = `lineup_last_daily_alert_${todayKey}`;

    // Throttle: don't spam if alert was already sent within 3 hours unless forced
    if (!force) {
      const lastSentTime = localStorage.getItem(lastAlertKey);
      if (lastSentTime) {
        const diffMs = Date.now() - parseInt(lastSentTime, 10);
        if (diffMs < 3 * 60 * 60 * 1000) {
          return; // Already notified recently today
        }
      }
    }

    const todayTasks = TaskService.getTodayTasks();
    const { title, body } = NotificationService.generateCatchyTodayNotification(todayTasks);

    await NotificationService.send(title, { body });
    localStorage.setItem(lastAlertKey, Date.now().toString());
  },

  /**
   * Specific task due alert
   */
  notifyTaskDue: (taskTitle: string, dueTime?: string) => {
    NotificationService.send(`⏰ Due Today: ${taskTitle}`, {
      body: dueTime ? `Scheduled for ${dueTime}. Let's knock this out before dinner! 🚀` : `It's on today's list. Ready to conquer it? 🎯`,
    });
  },

  notifyFlowTransition: (routineTitle: string) => {
    NotificationService.send(`🌊 Flow Block: ${routineTitle}`, {
      body: 'Your next life flow block has begun. Stay in the zone! ⚡',
    });
  },

  /**
   * Schedule automated task reminder based on dueDate, dueTime, and recurrence pattern.
   */
  scheduleTaskReminder: async (task: Task) => {
    if (!task.dueDate) return;

    // Stable positive 32-bit integer notification ID
    const notifId = Math.abs(
      task.id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    ) % 10000000;

    // Cancel existing scheduled notification for this task first
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch {
      // ignore
    }

    if (task.status === 'completed' || task.status === 'archived') {
      return;
    }

    const timeStr = task.dueTime || '09:00';
    const [h, m] = timeStr.split(':').map(Number);
    const scheduledDate = new Date(`${task.dueDate}T${String(h || 9).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`);

    const now = new Date();
    let targetAt = scheduledDate;

    // Determine repeating schedule
    let every: 'day' | 'week' | 'month' | undefined = undefined;
    let repeats = false;

    if (task.recurrence === 'daily' || task.recurrence === 'weekdays' || task.recurrence === 'weekends') {
      every = 'day';
      repeats = true;
    } else if (task.recurrence === 'weekly') {
      every = 'week';
      repeats = true;
    } else if (task.recurrence === 'monthly') {
      every = 'month';
      repeats = true;
    }

    if (targetAt.getTime() <= now.getTime()) {
      if (repeats && every === 'day') {
        targetAt = new Date(targetAt.getTime() + 24 * 60 * 60 * 1000);
      } else if (repeats && every === 'week') {
        targetAt = new Date(targetAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (repeats && every === 'month') {
        targetAt = new Date(targetAt);
        targetAt.setMonth(targetAt.getMonth() + 1);
      } else {
        // One-time task scheduled in past or today past time - skip scheduling future notification
        return;
      }
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: `⏰ Task: ${task.title}`,
            body: task.notes
              ? `${task.notes} · Due ${timeStr}${task.recurrence ? ` (${task.recurrence})` : ''}`
              : `Scheduled for ${timeStr}${task.recurrence ? ` · Repeats ${task.recurrence}` : ''}`,
            schedule: repeats && every ? { at: targetAt, every, repeats: true } : { at: targetAt },
            extra: { taskId: task.id },
          },
        ],
      });
    } catch (e) {
      console.warn('Native LocalNotifications schedule error:', e);
    }
  },

  /**
   * Cancel task reminder notification
   */
  cancelTaskReminder: async (taskId: string) => {
    const notifId = Math.abs(
      taskId.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    ) % 10000000;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch {
      // ignore
    }
  },
};
