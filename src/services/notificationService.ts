/**
 * Notification Service - manages browser and system notification requests,
 * smart daily reminders, routine alerts, and in-app alerts.
 */

import { StorageService } from './storageService';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'flow' | 'review' | 'system';
  timestamp: string;
}

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  hasPermission: (): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  send: (title: string, options?: NotificationOptions) => {
    const settings = StorageService.getSettings();
    if (!settings.dailyReviewNotification) return;

    if (NotificationService.hasPermission()) {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (err) {
        console.warn('Browser notification error', err);
      }
    }

    // Always dispatch in-app notification event
    window.dispatchEvent(
      new CustomEvent('lineup-notification', {
        detail: {
          id: `notif-${Date.now()}`,
          title,
          body: options?.body || '',
          timestamp: new Date().toISOString(),
        },
      })
    );
  },

  notifyTaskDue: (taskTitle: string, dueTime?: string) => {
    NotificationService.send(`⏰ Upcoming Task: ${taskTitle}`, {
      body: dueTime ? `Scheduled for ${dueTime}. Ready to tackle it?` : `Time to make progress on your goal!`,
    });
  },

  notifyFlowTransition: (routineTitle: string) => {
    NotificationService.send(`🌊 Flow Routine: ${routineTitle}`, {
      body: 'Your next life flow block has begun. Stay in the zone!',
    });
  },
};
