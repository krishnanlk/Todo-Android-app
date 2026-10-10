/**
 * Task Service - handles task creation, updates, completion, deletion, carryover,
 * and filtering for LineUp.
 */

import { Task, TaskStatus, CompletionRecord } from '../types';
import { StorageService, formatDateKey, getTodayKey } from './storageService';
import { NotificationService } from './notificationService';

export const TaskService = {
  getAll: (): Task[] => {
    return StorageService.getTasks().filter((t) => t.status !== 'archived');
  },

  getById: (id: string): Task | undefined => {
    return StorageService.getTasks().find((t) => t.id === id);
  },

  getForDate: (dateKey: string): Task[] => {
    return StorageService.getTasks().filter((t) => t.dueDate === dateKey && t.status !== 'archived');
  },

  getTodayTasks: (): Task[] => {
    const today = getTodayKey();
    return StorageService.getTasks().filter((t) => {
      if (t.status === 'archived') return false;
      // Scheduled for today or unscheduled
      if (t.dueDate === today || !t.dueDate) return true;
      // Unfinished tasks from previous days automatically line up in today until completed
      if (t.dueDate < today && t.status !== 'completed') return true;
      return false;
    });
  },

  getUpcomingTasks: (): Task[] => {
    const today = getTodayKey();
    return StorageService.getTasks().filter((t) => t.dueDate > today && t.status !== 'archived');
  },

  getMissedOrOverdueTasks: (): Task[] => {
    const today = getTodayKey();
    return StorageService.getTasks().filter(
      (t) => t.dueDate < today && t.status !== 'completed' && t.status !== 'archived'
    );
  },

  create: (taskData: Omit<Task, 'id' | 'createdAt' | 'status'> & { status?: TaskStatus }): Task => {
    const tasks = StorageService.getTasks();
    const newTask: Task = {
      ...taskData,
      dueDate: taskData.dueDate || getTodayKey(),
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: taskData.status || 'upcoming',
    };

    tasks.push(newTask);
    StorageService.saveTasks(tasks);
    NotificationService.scheduleTaskReminder(newTask);
    return newTask;
  },

  update: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...updates,
    };

    StorageService.saveTasks(tasks);
    NotificationService.scheduleTaskReminder(tasks[index]);
    return tasks[index];
  },

  toggleComplete: (id: string): { task: Task | null; wasCompleted: boolean } => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return { task: null, wasCompleted: false };

    const task = tasks[index];
    const isNowCompleted = task.status !== 'completed';
    const nowIso = new Date().toISOString();

    task.status = isNowCompleted ? 'completed' : 'upcoming';
    task.completedAt = isNowCompleted ? nowIso : undefined;

    tasks[index] = task;
    StorageService.saveTasks(tasks);

    if (isNowCompleted) {
      NotificationService.cancelTaskReminder(id);
    } else {
      NotificationService.scheduleTaskReminder(task);
    }

    // Record completion in history log
    const completions = StorageService.getCompletions();
    if (isNowCompleted) {
      const record: CompletionRecord = {
        id: `comp-${Date.now()}`,
        itemId: task.id,
        itemType: 'task',
        timestamp: nowIso,
        date: formatDateKey(new Date()),
        status: 'completed',
      };
      completions.push(record);
    } else {
      // Remove last completion record for this task today
      const todayKey = getTodayKey();
      const cIdx = completions.findIndex(
        (c) => c.itemId === task.id && c.date === todayKey && c.status === 'completed'
      );
      if (cIdx !== -1) completions.splice(cIdx, 1);
    }
    StorageService.saveCompletions(completions);

    return { task, wasCompleted: isNowCompleted };
  },

  delete: (id: string): boolean => {
    const tasks = StorageService.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      StorageService.saveTasks(filtered);
      NotificationService.cancelTaskReminder(id);
      return true;
    }
    return false;
  },

  restore: (id: string): Task | null => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tasks[index].status = 'upcoming';
    tasks[index].completedAt = undefined;
    StorageService.saveTasks(tasks);
    return tasks[index];
  },

  carryOverToTomorrow: (taskIds?: string[]): number => {
    const tasks = StorageService.getTasks();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = formatDateKey(tomorrow);
    const todayKey = formatDateKey(today);

    let count = 0;
    const updated = tasks.map((t) => {
      const isTarget = taskIds ? taskIds.includes(t.id) : (t.dueDate <= todayKey && t.status !== 'completed' && t.status !== 'archived');
      if (isTarget) {
        count++;
        return {
          ...t,
          dueDate: tomorrowKey,
          status: 'upcoming' as TaskStatus,
        };
      }
      return t;
    });

    if (count > 0) {
      StorageService.saveTasks(updated);
    }
    return count;
  },
};
