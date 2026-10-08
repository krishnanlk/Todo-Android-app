/**
 * Mission Service - handles goal-oriented missions, subtasks, deadline tracking,
 * and automatic progress calculation.
 */

import { Mission, Subtask } from '../types';
import { StorageService } from './storageService';

export const MissionService = {
  getAll: (): Mission[] => {
    return StorageService.getMissions().filter((m) => m.status !== 'archived');
  },

  getById: (id: string): Mission | undefined => {
    return StorageService.getMissions().find((m) => m.id === id);
  },

  getActive: (): Mission[] => {
    return StorageService.getMissions().filter((m) => m.status === 'active');
  },

  calculateProgress: (subtasks: Subtask[]): number => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completedCount = subtasks.filter((s) => s.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  },

  create: (missionData: Omit<Mission, 'id' | 'createdAt' | 'progress' | 'status'> & { status?: 'active' | 'completed' }): Mission => {
    const missions = StorageService.getMissions();
    const progress = MissionService.calculateProgress(missionData.subtasks || []);
    
    const newMission: Mission = {
      ...missionData,
      id: `mission-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      progress,
      status: missionData.status || (progress === 100 ? 'completed' : 'active'),
      createdAt: new Date().toISOString(),
      subtasks: missionData.subtasks || [],
    };

    missions.push(newMission);
    StorageService.saveMissions(missions);
    return newMission;
  },

  update: (id: string, updates: Partial<Mission>): Mission | null => {
    const missions = StorageService.getMissions();
    const index = missions.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const current = missions[index];
    const subtasks = updates.subtasks !== undefined ? updates.subtasks : current.subtasks;
    const progress = updates.progress !== undefined ? updates.progress : MissionService.calculateProgress(subtasks);

    const updated: Mission = {
      ...current,
      ...updates,
      subtasks,
      progress,
      status: progress === 100 && current.status !== 'archived' ? 'completed' : (updates.status || current.status),
      completedAt: progress === 100 ? (current.completedAt || new Date().toISOString()) : undefined,
    };

    missions[index] = updated;
    StorageService.saveMissions(missions);
    return updated;
  },

  delete: (id: string): boolean => {
    const missions = StorageService.getMissions();
    const filtered = missions.filter((m) => m.id !== id);
    if (filtered.length !== missions.length) {
      StorageService.saveMissions(filtered);
      return true;
    }
    return false;
  },

  addSubtask: (missionId: string, title: string): { mission: Mission | null; subtask: Subtask | null } => {
    const missions = StorageService.getMissions();
    const index = missions.findIndex((m) => m.id === missionId);
    if (index === -1) return { mission: null, subtask: null };

    const mission = missions[index];
    const newSubtask: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      completed: false,
      order: mission.subtasks.length,
    };

    const updatedSubtasks = [...mission.subtasks, newSubtask];
    const progress = MissionService.calculateProgress(updatedSubtasks);

    mission.subtasks = updatedSubtasks;
    mission.progress = progress;
    if (mission.status === 'completed' && progress < 100) {
      mission.status = 'active';
      mission.completedAt = undefined;
    }

    missions[index] = mission;
    StorageService.saveMissions(missions);
    return { mission, subtask: newSubtask };
  },

  toggleSubtask: (missionId: string, subtaskId: string): { mission: Mission | null; subtask: Subtask | null } => {
    const missions = StorageService.getMissions();
    const index = missions.findIndex((m) => m.id === missionId);
    if (index === -1) return { mission: null, subtask: null };

    const mission = missions[index];
    const sIndex = mission.subtasks.findIndex((s) => s.id === subtaskId);
    if (sIndex === -1) return { mission, subtask: null };

    const currentSub = mission.subtasks[sIndex];
    const isNowCompleted = !currentSub.completed;

    mission.subtasks[sIndex] = {
      ...currentSub,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };

    mission.progress = MissionService.calculateProgress(mission.subtasks);
    if (mission.progress === 100) {
      mission.status = 'completed';
      mission.completedAt = new Date().toISOString();
    } else if (mission.status === 'completed') {
      mission.status = 'active';
      mission.completedAt = undefined;
    }

    missions[index] = mission;
    StorageService.saveMissions(missions);
    return { mission, subtask: mission.subtasks[sIndex] };
  },

  deleteSubtask: (missionId: string, subtaskId: string): Mission | null => {
    const missions = StorageService.getMissions();
    const index = missions.findIndex((m) => m.id === missionId);
    if (index === -1) return null;

    const mission = missions[index];
    mission.subtasks = mission.subtasks.filter((s) => s.id !== subtaskId);
    mission.progress = MissionService.calculateProgress(mission.subtasks);

    missions[index] = mission;
    StorageService.saveMissions(missions);
    return mission;
  },
};
