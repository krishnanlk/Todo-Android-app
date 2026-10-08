/**
 * Widget Service - generates live dynamic data for Android Home-Screen Widgets:
 * 1. Today Flow Widget
 * 2. Progress Widget
 * 3. Quick Voice Widget
 * 4. Active Mission Widget
 *
 * Ensures Android widget storage is refreshed immediately whenever task, mission,
 * or routine data updates.
 */

import { registerPlugin } from '@capacitor/core';
import { WidgetPayload } from '../types';
import { FlowService } from './flowService';
import { ProgressService } from './progressService';
import { MissionService } from './missionService';

const WIDGET_STORAGE_KEY = 'lineup_widget_payload';

interface LineUpWidgetPluginInterface {
  updateWidgets(options: { payload: string }): Promise<void>;
}

const LineUpWidgetPlugin = registerPlugin<LineUpWidgetPluginInterface>('LineUpWidgetPlugin');

export const WidgetService = {
  getPayload: (): WidgetPayload => {
    try {
      const stored = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return WidgetService.refreshPayload();
  },

  refreshPayload: (): WidgetPayload => {
    const todayFlow = FlowService.getTodayFlow();
    const stats = ProgressService.calculateStats();
    const activeMissions = MissionService.getActive();
    
    // Choose most urgent active mission
    let activeMissionData = undefined;
    if (activeMissions.length > 0) {
      const topMission = activeMissions.sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
      const today = new Date();
      const deadlineDate = new Date(topMission.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      activeMissionData = {
        id: topMission.id,
        title: topMission.title,
        progress: topMission.progress,
        daysRemaining,
        deadline: topMission.deadline,
      };
    }

    const payload: WidgetPayload = {
      lastUpdated: new Date().toISOString(),
      todaySummary: {
        total: stats.totalTasksToday,
        completed: stats.completedTasksToday,
        percentage: stats.dailyCompletionRate,
      },
      activeFlowItems: todayFlow.slice(0, 5).map((f) => ({
        id: f.id,
        title: f.title,
        time: f.time,
        status: f.status,
        icon: f.icon,
      })),
      activeMission: activeMissionData,
    };

    try {
      const payloadStr = JSON.stringify(payload);
      localStorage.setItem(WIDGET_STORAGE_KEY, payloadStr);
      // Dispatch custom browser event for reactive UI updates
      window.dispatchEvent(new CustomEvent('lineup-widget-updated', { detail: payload }));
      // Sync with native Android Home-Screen widgets via Capacitor Plugin
      LineUpWidgetPlugin.updateWidgets({ payload: payloadStr }).catch(() => {});
    } catch (e) {
      console.error('Failed to save widget payload', e);
    }

    return payload;
  },
};
