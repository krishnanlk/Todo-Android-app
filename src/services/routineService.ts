/**
 * Routine Service - manages daily/weekly recurring routines (Life Flow)
 * and calculates true routine consistency scores from completion records.
 */

import { Routine, CompletionRecord } from '../types';
import { StorageService } from './storageService';

export const RoutineService = {
  getAll: (): Routine[] => {
    return StorageService.getRoutines();
  },

  getActive: (): Routine[] => {
    return StorageService.getRoutines().filter((r) => r.active);
  },

  getById: (id: string): Routine | undefined => {
    return StorageService.getRoutines().find((r) => r.id === id);
  },

  getForDayOfWeek: (dayOfWeek: number): Routine[] => {
    // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return StorageService.getRoutines().filter(
      (r) => r.active && r.daysOfWeek.includes(dayOfWeek)
    ).sort((a, b) => a.time.localeCompare(b.time));
  },

  create: (routineData: Omit<Routine, 'id' | 'consistencyScore'>): Routine => {
    const routines = StorageService.getRoutines();
    const newRoutine: Routine = {
      ...routineData,
      id: `routine-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      consistencyScore: 100, // Starts fresh at 100%
    };

    routines.push(newRoutine);
    StorageService.saveRoutines(routines);
    return newRoutine;
  },

  update: (id: string, updates: Partial<Routine>): Routine | null => {
    const routines = StorageService.getRoutines();
    const index = routines.findIndex((r) => r.id === id);
    if (index === -1) return null;

    routines[index] = { ...routines[index], ...updates };
    StorageService.saveRoutines(routines);
    return routines[index];
  },

  delete: (id: string): boolean => {
    const routines = StorageService.getRoutines();
    const filtered = routines.filter((r) => r.id !== id);
    if (filtered.length !== routines.length) {
      StorageService.saveRoutines(filtered);
      return true;
    }
    return false;
  },

  // Calculate consistency of a routine across recent history (past 14 days)
  calculateConsistency: (routineId: string, daysWindow = 14): number => {
    const completions = StorageService.getCompletions();
    const routine = RoutineService.getById(routineId);
    if (!routine) return 0;

    let totalScheduledDays = 0;
    let totalCompletedDays = 0;
    const now = new Date();

    for (let i = 1; i <= daysWindow; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();

      if (routine.daysOfWeek.includes(dayOfWeek)) {
        totalScheduledDays++;
        const dateKey = d.toISOString().split('T')[0];
        const record = completions.find(
          (c) => c.itemId === routineId && c.date === dateKey && c.status === 'completed'
        );
        if (record) totalCompletedDays++;
      }
    }

    if (totalScheduledDays === 0) return routine.consistencyScore || 90;
    const calculated = Math.round((totalCompletedDays / totalScheduledDays) * 100);
    return calculated;
  },

  /** Toggle today's completion for a routine (uses localStorage daily key) */
  toggleToday: (id: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const key   = `lineup-today-${today}-${id}`;
    const cur   = localStorage.getItem(key) === '1';
    localStorage.setItem(key, cur ? '0' : '1');
    return !cur;
  },

  /** Check if a routine is completed today */
  isCompletedToday: (id: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`lineup-today-${today}-${id}`) === '1';
  },

  /** Get all routines with completedToday populated */
  getAllWithToday: (): Routine[] => {
    return StorageService.getRoutines().map(r => ({
      ...r,
      completedToday: RoutineService.isCompletedToday(r.id),
      completionRate: RoutineService.calculateConsistency(r.id) / 100,
      startTime: r.time,
      duration: r.durationMinutes,
    }));
  },

  // Updates and syncs all routine consistency scores
  refreshAllConsistencies: () => {
    const routines = StorageService.getRoutines();
    const updated = routines.map((r) => ({
      ...r,
      consistencyScore: RoutineService.calculateConsistency(r.id),
    }));
    StorageService.saveRoutines(updated);
  },
};
