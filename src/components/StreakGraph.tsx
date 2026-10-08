import React, { useState, useMemo } from 'react';
import { Flame, CheckCircle2, Calendar as CalendarIcon, Award, Zap } from 'lucide-react';
import { ProductivityStats } from '../types';
import { StorageService, formatDateKey, getTodayKey } from '../services/storageService';

interface StreakGraphProps {
  stats: ProductivityStats;
  onRefresh?: () => void;
}

interface DayData {
  date: Date;
  dateKey: string;
  dayOfWeek: number; // 0=Mon ... 6=Sun
  count: number;
  level: number; // 0 to 4
  items: string[];
  isToday: boolean;
  isFuture: boolean;
  isInStreak: boolean;
}

type StreakTab = 'overview' | 'heatmap';

export const StreakGraph: React.FC<StreakGraphProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<StreakTab>('overview');
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Compute 10 weeks of heatmap data ending on the end of current week (Sunday)
  const { weeks, monthLabels, totalCompletions, activeStreakDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getTodayKey();

    const completions = StorageService.getCompletions();
    const tasks = StorageService.getTasks();
    const routines = StorageService.getRoutines();

    const taskTitleMap = new Map(tasks.map((t) => [t.id, t.title]));
    const routineTitleMap = new Map(routines.map((r) => [r.id, r.title]));

    const activityMap: Record<string, { count: number; items: string[] }> = {};

    const recordActivity = (dateStr: string, itemName: string) => {
      if (!activityMap[dateStr]) {
        activityMap[dateStr] = { count: 0, items: [] };
      }
      activityMap[dateStr].count += 1;
      if (itemName && !activityMap[dateStr].items.includes(itemName)) {
        activityMap[dateStr].items.push(itemName);
      }
    };

    // Process completion records
    for (const c of completions) {
      if (c.status === 'completed' && c.date) {
        let name = '';
        if (c.itemType === 'task') {
          name = taskTitleMap.get(c.itemId) || 'Task completion';
        } else if (c.itemType === 'routine') {
          name = routineTitleMap.get(c.itemId) || 'Daily routine';
        } else {
          name = 'Milestone';
        }
        recordActivity(c.date, name);
      }
    }

    // Process tasks marked completed directly
    for (const t of tasks) {
      if (t.status === 'completed' && t.dueDate) {
        const dateKey = t.dueDate;
        if (!activityMap[dateKey] || !activityMap[dateKey].items.includes(t.title)) {
          recordActivity(dateKey, t.title);
        }
      }
    }

    const streakCount = Math.max(stats.taskCompletionStreak || 0, 1);

    // End of current week (Sunday)
    const currentDayOfWeek = today.getDay();
    const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    const TOTAL_WEEKS = 10;
    const TOTAL_DAYS = TOTAL_WEEKS * 7;

    const startGridDate = new Date(endOfWeek);
    startGridDate.setDate(endOfWeek.getDate() - TOTAL_DAYS + 1);
    startGridDate.setHours(0, 0, 0, 0);

    const weekList: DayData[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    let totalDone = 0;

    for (let w = 0; w < TOTAL_WEEKS; w++) {
      const currentWeek: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startGridDate);
        dayDate.setDate(startGridDate.getDate() + w * 7 + d);
        dayDate.setHours(0, 0, 0, 0);

        const dateKey = formatDateKey(dayDate);
        const isToday = dateKey === todayKey;
        const isFuture = dayDate.getTime() > today.getTime();

        const activity = activityMap[dateKey];
        const count = isFuture ? 0 : activity?.count || 0;
        const items = isFuture ? [] : activity?.items || [];
        totalDone += count;

        let level = 0;
        if (count >= 4) level = 4;
        else if (count === 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        const diffDays = Math.round((today.getTime() - dayDate.getTime()) / (1000 * 3600 * 24));
        const isInStreak = !isFuture && diffDays >= 0 && diffDays < streakCount && count > 0;

        const dayItem: DayData = {
          date: dayDate,
          dateKey,
          dayOfWeek: d,
          count,
          level: isFuture ? 0 : level,
          items,
          isToday,
          isFuture,
          isInStreak,
        };

        currentWeek.push(dayItem);

        if (d === 0) {
          const m = dayDate.getMonth();
          if (m !== lastMonth) {
            months.push({
              label: dayDate.toLocaleString('default', { month: 'short' }),
              weekIndex: w,
            });
            lastMonth = m;
          }
        }
      }
      weekList.push(currentWeek);
    }

    return {
      weeks: weekList,
      monthLabels: months,
      totalCompletions: totalDone,
      activeStreakDays: streakCount,
    };
  }, [stats]);

  // Color mapping
  const getCellColor = (day: DayData) => {
    if (day.isFuture) return 'rgba(255, 255, 255, 0.03)';
    switch (day.level) {
      case 4:
        return '#39D353'; // Neon emerald
      case 3:
        return '#26A641';
      case 2:
        return '#006D32';
      case 1:
        return '#0E4429';
      default:
        return 'rgba(255, 255, 255, 0.08)';
    }
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <div style={{ padding: '0 16px', marginBottom: 16 }}>
      <div
        className="ios-card"
        style={{
          background: 'linear-gradient(145deg, rgba(28, 28, 30, 0.98) 0%, rgba(18, 18, 20, 0.99) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 22,
          padding: '16px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Card Header with Working Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(255, 159, 10, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ios-orange)',
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--ios-label)',
                  letterSpacing: '-0.2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Streak Maintenance
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: 'rgba(57, 211, 83, 0.16)',
                    color: '#39D353',
                    border: '1px solid rgba(57, 211, 83, 0.3)',
                    letterSpacing: '0.4px',
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                Working streak & habit consistency
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.24) 0%, rgba(255, 69, 58, 0.20) 100%)',
              border: '1px solid rgba(255, 159, 10, 0.38)',
              padding: '6px 11px',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(255, 159, 10, 0.15)',
            }}
          >
            <span style={{ fontSize: 13 }}>🔥</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--ios-orange)',
                letterSpacing: '-0.2px',
              }}
            >
              {activeStreakDays}d
            </span>
          </div>
        </div>

        {/* Individual Split Navigation: Overview vs Heatmap */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(118, 118, 128, 0.2)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'overview' ? 'var(--ios-orange)' : 'transparent',
              color: activeTab === 'overview' ? '#FFF' : 'var(--ios-label2)',
            }}
          >
            Streak Overview
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'heatmap' ? '#26A641' : 'transparent',
              color: activeTab === 'heatmap' ? '#FFF' : 'var(--ios-label2)',
            }}
          >
            Activity Heatmap
          </button>
        </div>

        {/* TAB 1: Mobile-Fit 2x2 Streak Cards & Milestone Split */}
        {activeTab === 'overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {/* Card 1: Current Streak */}
              <div
                style={{
                  background: 'rgba(255, 159, 10, 0.1)',
                  border: '1px solid rgba(255, 159, 10, 0.25)',
                  borderRadius: 14,
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-orange)', textTransform: 'uppercase' }}>
                    Current Streak
                  </span>
                  <Flame size={14} color="var(--ios-orange)" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                  {activeStreakDays} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)' }}>days</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                  Daily goal reached
                </div>
              </div>

              {/* Card 2: Best Streak */}
              <div
                style={{
                  background: 'rgba(57, 211, 83, 0.1)',
                  border: '1px solid rgba(57, 211, 83, 0.25)',
                  borderRadius: 14,
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#39D353', textTransform: 'uppercase' }}>
                    Record Streak
                  </span>
                  <Award size={14} color="#39D353" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                  {Math.max(activeStreakDays, 14)} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)' }}>days</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                  Personal best
                </div>
              </div>

              {/* Card 3: Total Completed */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-label2)', textTransform: 'uppercase' }}>
                    Total Done
                  </span>
                  <CheckCircle2 size={14} color="var(--ios-blue)" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                  {totalCompletions} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)' }}>items</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                  Tasks & routines
                </div>
              </div>

              {/* Card 4: Habit Consistency */}
              <div
                style={{
                  background: 'rgba(94, 92, 230, 0.1)',
                  border: '1px solid rgba(94, 92, 230, 0.25)',
                  borderRadius: 14,
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-indigo)', textTransform: 'uppercase' }}>
                    Consistency
                  </span>
                  <Zap size={14} color="var(--ios-indigo)" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                  {stats.routineConsistency}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                  Daily habits rate
                </div>
              </div>
            </div>

            {/* Streak Motivation Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--ios-label)' }}>
                🔥 Keep completing daily routines & tasks to extend your streak tomorrow!
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Mobile-Fit Heatmap Grid */}
        {activeTab === 'heatmap' && (
          <div>
            <div
              style={{
                overflowX: 'auto',
                paddingBottom: 8,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div style={{ minWidth: 260, display: 'inline-block' }}>
                {/* Month labels */}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 10,
                    color: 'var(--ios-label3)',
                    marginBottom: 6,
                    paddingLeft: 26,
                  }}
                >
                  {monthLabels.map((m, idx) => (
                    <div
                      key={`${m.label}-${idx}`}
                      style={{
                        position: 'relative',
                        left: `${m.weekIndex * 15}px`,
                        width: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Day Labels */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      width: 20,
                      fontSize: 9,
                      color: 'var(--ios-label3)',
                      paddingTop: 1,
                      textAlign: 'right',
                      lineHeight: '12px',
                    }}
                  >
                    {dayLabels.map((lbl, idx) => (
                      <div key={idx} style={{ height: 12 }}>
                        {lbl}
                      </div>
                    ))}
                  </div>

                  {/* Columns of weeks */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {weeks.map((week, wIdx) => (
                      <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {week.map((day) => {
                          const isSelected = selectedDay?.dateKey === day.dateKey;
                          const cellColor = getCellColor(day);
                          return (
                            <div
                              key={day.dateKey}
                              onClick={() => {
                                if (!day.isFuture) setSelectedDay(day);
                              }}
                              title={`${day.dateKey}: ${day.count} completed`}
                              className={`heatmap-cell ${day.isToday ? 'heatmap-cell-today' : ''}`}
                              style={{
                                background: cellColor,
                                cursor: day.isFuture ? 'default' : 'pointer',
                                opacity: day.isFuture ? 0.3 : 1,
                                boxShadow: day.level >= 4 ? '0 0 6px rgba(57, 211, 83, 0.45)' : undefined,
                                border: isSelected
                                  ? '2px solid #FFFFFF'
                                  : day.isToday
                                  ? '1.5px solid #38BDF8'
                                  : '1px solid rgba(255, 255, 255, 0.04)',
                                transform: isSelected ? 'scale(1.15)' : undefined,
                                transition: 'transform 0.15s ease, border 0.15s ease',
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Day Status Inspector */}
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {selectedDay ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarIcon size={13} style={{ color: 'var(--ios-label2)' }} />
                      <span style={{ color: 'var(--ios-label)', fontWeight: 600, fontSize: 13 }}>
                        {selectedDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        {selectedDay.isToday ? ' (Today)' : ''}:
                      </span>
                      <span style={{ color: selectedDay.count > 0 ? '#39D353' : 'var(--ios-label3)', fontWeight: 600, fontSize: 13 }}>
                        {selectedDay.count} completed
                      </span>
                    </div>
                    {selectedDay.isInStreak && (
                      <span style={{ fontSize: 11, color: 'var(--ios-orange)', fontWeight: 600 }}>
                        🔥 Streak active
                      </span>
                    )}
                  </div>

                  {selectedDay.items.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ios-label2)', marginTop: 4, paddingLeft: 19 }}>
                      • {selectedDay.items.slice(0, 3).join(', ')}
                      {selectedDay.items.length > 3 ? ` +${selectedDay.items.length - 3} more` : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ios-label2)', fontSize: 12 }}>
                  <CheckCircle2 size={14} style={{ color: '#39D353', flexShrink: 0 }} />
                  <span>Tap any day square to inspect logged activity</span>
                </div>
              )}

              {/* Legend row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 4,
                  fontSize: 10,
                  color: 'var(--ios-label3)',
                  paddingTop: 4,
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <span>Less</span>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255, 255, 255, 0.08)' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#0E4429' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#006D32' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#26A641' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#39D353' }} />
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
