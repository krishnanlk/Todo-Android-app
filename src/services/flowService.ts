/**
 * Flow Service - automatically merges daily recurring routines and scheduled tasks
 * into an uninterrupted, flowing chronological timeline.
 */

import { FlowEvent, FlowEventStatus, CompletionRecord } from '../types';
import { StorageService, formatDateKey, getTodayKey } from './storageService';
import { RoutineService } from './routineService';
import { TaskService } from './taskService';
import { MissionService } from './missionService';

// Helper to convert HH:MM to total minutes from midnight
const timeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper to convert minutes to HH:MM
const minutesToTime = (totalMinutes: number): string => {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const FlowService = {
  getFlowForDate: (dateKey: string): FlowEvent[] => {
    const targetDate = new Date(`${dateKey}T00:00:00`);
    const dayOfWeek = targetDate.getDay();
    const isToday = dateKey === getTodayKey();

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const completions = StorageService.getCompletions();
    const missions = MissionService.getAll();
    const missionMap = new Map(missions.map((m) => [m.id, m]));

    const flowItems: FlowEvent[] = [];

    // 1. Gather Routines active on this day of week
    const dayRoutines = RoutineService.getForDayOfWeek(dayOfWeek);
    for (const r of dayRoutines) {
      const startMins = timeToMinutes(r.time);
      const endMins = startMins + (r.durationMinutes || 45);
      const endTime = minutesToTime(endMins);

      // Check if marked completed in completions record
      const isCompleted = completions.some(
        (c) => c.itemId === r.id && c.date === dateKey && c.status === 'completed'
      );

      let status: FlowEventStatus = 'upcoming';
      if (isCompleted) {
        status = 'completed';
      } else if (isToday) {
        if (currentMinutes >= startMins && currentMinutes < endMins) {
          status = 'in_progress';
        } else if (currentMinutes >= endMins) {
          status = 'missed';
        } else {
          status = 'upcoming';
        }
      } else if (targetDate < new Date(`${getTodayKey()}T00:00:00`)) {
        status = isCompleted ? 'completed' : 'missed';
      } else {
        status = 'upcoming';
      }

      flowItems.push({
        id: `flow-routine-${r.id}-${dateKey}`,
        type: 'routine',
        refId: r.id,
        title: r.title,
        time: r.time,
        endTime,
        status,
        category: r.category,
        icon: r.icon,
        isRoutine: true,
        durationMinutes: r.durationMinutes,
      });
    }

    // 2. Gather Scheduled Tasks for this date
    const dayTasks = TaskService.getForDate(dateKey);
    for (const t of dayTasks) {
      const taskTime = t.dueTime || '12:00';
      const startMins = timeToMinutes(taskTime);
      const duration = 45;
      const endTime = minutesToTime(startMins + duration);

      let status: FlowEventStatus = 'upcoming';
      if (t.status === 'completed') {
        status = 'completed';
      } else if (isToday) {
        if (currentMinutes >= startMins && currentMinutes < startMins + duration) {
          status = 'in_progress';
        } else if (currentMinutes >= startMins + duration) {
          status = 'missed';
        } else {
          status = 'upcoming';
        }
      } else if (targetDate < new Date(`${getTodayKey()}T00:00:00`)) {
        status = 'missed';
      } else {
        status = 'upcoming';
      }

      const linkedMission = t.missionId ? missionMap.get(t.missionId) : undefined;

      flowItems.push({
        id: `flow-task-${t.id}`,
        type: linkedMission ? 'mission_task' : 'task',
        refId: t.id,
        title: t.title,
        time: taskTime,
        endTime,
        status,
        category: t.category,
        icon: linkedMission ? '🎯' : '📝',
        isRoutine: false,
        durationMinutes: duration,
        priority: t.priority,
        missionTitle: linkedMission?.title,
      });
    }

    // Sort chronologically by time
    flowItems.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    return flowItems;
  },

  getTodayFlow: (): FlowEvent[] => {
    return FlowService.getFlowForDate(getTodayKey());
  },

  toggleFlowItemComplete: (flowEvent: FlowEvent, dateKey: string = getTodayKey()): boolean => {
    if (flowEvent.isRoutine) {
      // Toggle Routine completion record
      const completions = StorageService.getCompletions();
      const existingIdx = completions.findIndex(
        (c) => c.itemId === flowEvent.refId && c.date === dateKey && c.status === 'completed'
      );

      if (existingIdx !== -1) {
        completions.splice(existingIdx, 1);
        StorageService.saveCompletions(completions);
        return false;
      } else {
        const record: CompletionRecord = {
          id: `comp-flow-${Date.now()}`,
          itemId: flowEvent.refId,
          itemType: 'routine',
          timestamp: new Date().toISOString(),
          date: dateKey,
          status: 'completed',
        };
        completions.push(record);
        StorageService.saveCompletions(completions);
        return true;
      }
    } else {
      // Toggle Task completion
      const result = TaskService.toggleComplete(flowEvent.refId);
      return result.wasCompleted;
    }
  },
};
