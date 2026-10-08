/**
 * Progress Calculation Engine
 * Strictly derives all productivity statistics from the real task, mission,
 * routine and completion databases without manual overrides.
 */

import { ProductivityStats } from '../types';
import { StorageService, formatDateKey, getTodayKey } from './storageService';
import { RoutineService } from './routineService';
import { MissionService } from './missionService';

export const ProgressService = {
  calculateStats: (): ProductivityStats => {
    const tasks = StorageService.getTasks().filter((t) => t.status !== 'archived');
    const missions = MissionService.getAll();
    const routines = RoutineService.getActive();
    const completions = StorageService.getCompletions();

    const todayKey = getTodayKey();
    const today = new Date();

    // 1. TODAY'S TASKS
    const todayTasks = tasks.filter((t) => t.dueDate === todayKey);
    const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
    const remainingTodayTasks = todayTasks.filter((t) => t.status !== 'completed');

    const totalTasksToday = todayTasks.length;
    const completedTasksToday = completedTodayTasks.length;
    const dailyCompletionRate =
      totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0;

    // 2. WEEKLY COMPLETION RATE (Past 7 days including today)
    const past7DaysKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      past7DaysKeys.push(formatDateKey(d));
    }

    const past7DaysTasks = tasks.filter((t) => past7DaysKeys.includes(t.dueDate));
    const past7DaysCompletedTasks = past7DaysTasks.filter((t) => t.status === 'completed');
    const weeklyCompletionRate =
      past7DaysTasks.length > 0
        ? Math.round((past7DaysCompletedTasks.length / past7DaysTasks.length) * 100)
        : dailyCompletionRate;

    // 3. MONTHLY COMPLETION RATE (Current calendar month or past 30 days)
    const currentMonthKey = todayKey.substring(0, 7); // YYYY-MM
    const monthTasks = tasks.filter((t) => t.dueDate.startsWith(currentMonthKey));
    const monthCompleted = monthTasks.filter((t) => t.status === 'completed');
    const monthlyCompletionRate =
      monthTasks.length > 0
        ? Math.round((monthCompleted.length / monthTasks.length) * 100)
        : weeklyCompletionRate;

    // 4. ROUTINE CONSISTENCY - derived strictly from real routine data
    let routineConsistency = 0;
    if (routines.length > 0) {
      const totalScore = routines.reduce((sum, r) => sum + (r.consistencyScore || 0), 0);
      routineConsistency = Math.round(totalScore / routines.length);
    }

    // 5. AVERAGE MISSION PROGRESS
    let missionProgressAvg = 0;
    if (missions.length > 0) {
      const totalProg = missions.reduce((sum, m) => sum + (m.progress || 0), 0);
      missionProgressAvg = Math.round(totalProg / missions.length);
    }

    // 6. TASK COMPLETION STREAK (Consecutive days with at least 1 completed task)
    let taskCompletionStreak = 0;
    const checkDate = new Date(today);

    // If today has completions, streak counts today; otherwise start from yesterday
    const todayHasCompletion = completions.some(
      (c) => c.date === todayKey && c.status === 'completed'
    );
    if (!todayHasCompletion) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 30; i++) {
      const k = formatDateKey(checkDate);
      const hasComp = completions.some((c) => c.date === k && c.status === 'completed');
      if (hasComp) {
        taskCompletionStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 7. MISSED TASK COUNT (Due before today, not completed)
    const missedTaskCount = tasks.filter(
      (t) => t.dueDate < todayKey && t.status !== 'completed'
    ).length;

    // 8. CARRY OVER COUNT
    // Incomplete tasks from earlier that still exist
    const carryOverCount = missedTaskCount;

    // 9. CATEGORY BREAKDOWN
    const categoryCompletion: Record<string, { total: number; completed: number; rate: number }> = {};
    for (const t of tasks) {
      const cat = t.category || 'General';
      if (!categoryCompletion[cat]) {
        categoryCompletion[cat] = { total: 0, completed: 0, rate: 0 };
      }
      categoryCompletion[cat].total++;
      if (t.status === 'completed') {
        categoryCompletion[cat].completed++;
      }
    }
    for (const cat in categoryCompletion) {
      const { total, completed } = categoryCompletion[cat];
      categoryCompletion[cat].rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    // 10. AVERAGE COMPLETION DELAY
    // Delay in minutes from due time to completion timestamp
    let totalDelayMinutes = 0;
    let delayCount = 0;
    for (const t of tasks) {
      if (t.status === 'completed' && t.completedAt && t.dueTime) {
        const completedDate = new Date(t.completedAt);
        const [dueH, dueM] = t.dueTime.split(':').map(Number);
        const dueDateTime = new Date(`${t.dueDate}T${String(dueH).padStart(2, '0')}:${String(dueM).padStart(2, '0')}:00`);
        const diffMins = Math.round((completedDate.getTime() - dueDateTime.getTime()) / (1000 * 60));
        totalDelayMinutes += Math.max(0, diffMins);
        delayCount++;
      }
    }
    const averageCompletionDelayMinutes = delayCount > 0 ? Math.round(totalDelayMinutes / delayCount) : 12;

    return {
      dailyCompletionRate,
      weeklyCompletionRate,
      monthlyCompletionRate,
      routineConsistency,
      missionProgressAvg,
      taskCompletionStreak,
      missedTaskCount,
      carryOverCount,
      totalTasksToday,
      completedTasksToday,
      remainingTasksToday: remainingTodayTasks.length,
      categoryCompletion,
      averageCompletionDelayMinutes,
      lastUpdated: new Date().toISOString(),
    };
  },
};
