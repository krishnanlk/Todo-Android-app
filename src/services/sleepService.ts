/**
 * Sleep Service - manages sleep & wake tracking, duration calculations,
 * recovery quality, and weekly sleep analytics for LineUp.
 */

import { SleepLog, SleepQuality } from '../types';
import { StorageService, getTodayKey, formatDateKey } from './storageService';
import { RoutineService } from './routineService';

export const QUALITY_META: Record<
  SleepQuality,
  { label: string; emoji: string; color: string; desc: string }
> = {
  energized: {
    label: 'Energized',
    emoji: '⚡',
    color: '#30D158',
    desc: 'Woke up fully charged & ready',
  },
  good: {
    label: 'Restful',
    emoji: '😊',
    color: '#0A84FF',
    desc: 'Solid, uninterrupted rest',
  },
  fair: {
    label: 'Fair',
    emoji: '🥱',
    color: '#FF9F0A',
    desc: 'A bit groggy or woke up during night',
  },
  exhausted: {
    label: 'Exhausted',
    emoji: '😴',
    color: '#FF453A',
    desc: 'Insufficient or restless sleep',
  },
};

export const SleepService = {
  /**
   * Calculates duration in minutes from bedtime to wake up time.
   * Handles overnight crossover seamlessly (e.g. 23:15 to 07:00 = 465 mins / 7h 45m).
   */
  calculateDurationMinutes: (bedTime: string, wakeTime: string): number => {
    if (!bedTime || !wakeTime) return 480;
    const [bH, bM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    const bedMin = (bH || 0) * 60 + (bM || 0);
    const wakeMin = (wH || 0) * 60 + (wM || 0);

    if (wakeMin >= bedMin) {
      // Same day sleep (e.g., 01:00 to 07:30 or day nap)
      return wakeMin - bedMin;
    } else {
      // Crossed midnight (e.g. 23:00 to 07:00)
      return (24 * 60 - bedMin) + wakeMin;
    }
  },

  /**
   * Formats minutes into human-readable e.g. "7h 45m"
   */
  formatDuration: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  },

  /**
   * Format decimal hours e.g. 7.75 -> "7.8 hrs"
   */
  formatHoursDecimal: (minutes: number): string => {
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  },

  getAll: (): SleepLog[] => {
    return StorageService.getSleepLogs().sort((a, b) => b.date.localeCompare(a.date));
  },

  getByDate: (dateKey: string): SleepLog | undefined => {
    return StorageService.getSleepLogs().find((l) => l.date === dateKey);
  },

  getTodayLog: (): SleepLog | undefined => {
    const today = getTodayKey();
    return StorageService.getSleepLogs().find((l) => l.date === today);
  },

  saveLog: (params: {
    date?: string;
    bedTime: string;
    wakeTime: string;
    quality: SleepQuality;
    targetHours?: number;
    notes?: string;
  }): SleepLog => {
    const settings = StorageService.getSettings();
    const date = params.date || getTodayKey();
    const targetHours = params.targetHours ?? (settings.targetSleepHours || 8.0);
    const durationMinutes = SleepService.calculateDurationMinutes(params.bedTime, params.wakeTime);

    const existing = SleepService.getByDate(date);
    const log: SleepLog = {
      id: existing?.id || `sleep-${date}-${Date.now().toString(36)}`,
      date,
      bedTime: params.bedTime,
      wakeTime: params.wakeTime,
      durationMinutes,
      quality: params.quality,
      targetHours,
      notes: params.notes?.trim() || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    StorageService.saveSleepLog(log);

    // Auto-mark default wakeup routine as done if not completed
    try {
      const routines = RoutineService.getAll();
      const wakeRout = routines.find(
        (r) => r.id === 'routine-wakeup' || r.title.toLowerCase().includes('wake')
      );
      if (wakeRout && !RoutineService.isCompletedToday(wakeRout.id)) {
        RoutineService.toggleToday(wakeRout.id);
      }
    } catch (e) {
      console.warn('Could not auto-sync sleep with routine', e);
    }

    return log;
  },

  deleteLog: (id: string) => {
    const logs = StorageService.getSleepLogs().filter((l) => l.id !== id);
    StorageService.saveSleepLogs(logs);
  },

  /**
   * Computes 7-day analytics including daily breakdown, target delta, average hours,
   * consistency percentage, and sleep debt.
   */
  getRecentStats: (
    daysCount = 7,
    liveEntry?: { date: string; durationMinutes: number; quality: SleepQuality; targetHours?: number }
  ) => {
    const allLogs = StorageService.getSleepLogs();
    const settings = StorageService.getSettings();
    const targetHours = settings.targetSleepHours || 8.0;
    const targetMinutes = targetHours * 60;

    const today = new Date();
    const days: {
      date: Date;
      dateKey: string;
      dayLabel: string;
      log?: SleepLog;
      durationMinutes: number;
      percentage: number;
      metTarget: boolean;
      isToday: boolean;
      isLive?: boolean;
    }[] = [];

    let totalRecordedMinutes = 0;
    let loggedDaysCount = 0;
    let daysMetGoal = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
      
      let log = allLogs.find((l) => l.date === dateKey);
      let isLive = false;

      // Check if user is currently entering/reviewing this date in modal
      if (liveEntry && liveEntry.date === dateKey && liveEntry.durationMinutes > 0) {
        log = {
          id: log?.id || `live-${dateKey}`,
          date: dateKey,
          bedTime: log?.bedTime || '',
          wakeTime: log?.wakeTime || '',
          durationMinutes: liveEntry.durationMinutes,
          quality: liveEntry.quality,
          targetHours: liveEntry.targetHours || targetHours,
          createdAt: log?.createdAt || new Date().toISOString(),
        };
        isLive = true;
      }

      const durationMinutes = log ? log.durationMinutes : 0;
      if (log) {
        totalRecordedMinutes += durationMinutes;
        loggedDaysCount++;
        if (durationMinutes >= targetMinutes - 15) {
          daysMetGoal++;
        }
      }

      const percentage = durationMinutes > 0 ? Math.min(100, Math.round((durationMinutes / targetMinutes) * 100)) : 0;

      days.push({
        date: d,
        dateKey,
        dayLabel,
        log,
        durationMinutes,
        percentage,
        metTarget: durationMinutes >= targetMinutes - 15,
        isToday: i === 0,
        isLive,
      });
    }

    const avgMinutes = loggedDaysCount > 0 ? Math.round(totalRecordedMinutes / loggedDaysCount) : 0;
    const avgHours = loggedDaysCount > 0 ? parseFloat((avgMinutes / 60).toFixed(1)) : 0;

    // Sleep debt is calculated only across actual logged days
    const totalExpectedMinutes = loggedDaysCount * targetMinutes;
    const debtMinutes = loggedDaysCount > 0 ? totalRecordedMinutes - totalExpectedMinutes : 0;
    const debtHours = parseFloat((debtMinutes / 60).toFixed(1));

    const consistencyRate =
      loggedDaysCount > 0 ? Math.round((daysMetGoal / loggedDaysCount) * 100) : 0;

    return {
      days,
      loggedDaysCount,
      totalRecordedMinutes,
      avgMinutes,
      avgHours,
      targetHours,
      debtHours,
      consistencyRate,
      daysMetGoal,
      todayLog: allLogs.find((l) => l.date === getTodayKey()),
    };
  },
};
