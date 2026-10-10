import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Moon } from 'lucide-react';
import { Task, ProductivityStats, Mission } from '../types';
import { TaskService }  from '../services/taskService';
import { WidgetService } from '../services/widgetService';
import { SleepService, QUALITY_META } from '../services/sleepService';
import { getTodayKey, formatDateKey }   from '../services/storageService';
import { StreakGraph }   from './StreakGraph';
import type { TabType } from '../App';

interface TodayViewProps {
  tasks: Task[];
  stats: ProductivityStats;
  missions: Mission[];
  onRefresh: () => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenCarryoverModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenReviewsModal: () => void;
  onOpenWidgetsModal?: () => void;
  onOpenSleepModal?: () => void;
  onNavigateToTab: (tab: TabType) => void;
}

const priorityBadge = (p: string) => {
  if (p === 'high')   return <span className="ios-pill ios-pill-red"   style={{fontSize:11}}>High</span>;
  if (p === 'medium') return <span className="ios-pill ios-pill-orange" style={{fontSize:11}}>Med</span>;
  return null;
};

export const TodayView: React.FC<TodayViewProps> = ({
  tasks, stats, missions, onRefresh, onOpenTaskModal,
  onOpenCarryoverModal, onOpenSettingsModal, onOpenReviewsModal,
  onOpenWidgetsModal: _onOpenWidgetsModal, onOpenSleepModal, onNavigateToTab,
}) => {
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const missionMap = new Map(missions.map(m => [m.id, m]));
  const todaySleep = SleepService.getTodayLog();

  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : hours < 22 ? 'Good Evening' : 'Good Night';
  const greetingEmoji = hours < 12 ? '☀️' : hours < 17 ? '🌤️' : hours < 22 ? '👋' : '🌙';
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const handleToggle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const { wasCompleted } = TaskService.toggleComplete(task.id);
    if (wasCompleted) {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 },
        colors: ['#0A84FF','#30D158','#5E5CE6','#FF9F0A'] });
    }
    WidgetService.refreshPayload();
    onRefresh();
  };

  const todayKey = getTodayKey();
  const tomorrowKey = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return formatDateKey(tm);
  }, []);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => !t.dueDate || t.dueDate === todayKey || (t.dueDate < todayKey && t.status !== 'completed'));
  }, [tasks, todayKey]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate && t.dueDate > todayKey);
  }, [tasks, todayKey]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'today') return todayTasks;
    if (taskFilter === 'upcoming') return upcomingTasks;
    return tasks; // default 'all'
  }, [tasks, taskFilter, todayTasks, upcomingTasks]);

  // Line up tasks: unfinished first (overdue on top, chronological by date, priority, time), completed at the bottom
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const aDone = a.status === 'completed';
      const bDone = b.status === 'completed';
      if (aDone !== bDone) return aDone ? 1 : -1;

      // Overdue tasks that are unfinished get prominent top position
      const aOverdue = a.dueDate && a.dueDate < todayKey && !aDone;
      const bOverdue = b.dueDate && b.dueDate < todayKey && !bDone;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      // Chronological order by due date when viewing all / upcoming
      const dDiff = (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      if (dDiff !== 0) return dDiff;

      const pWeight = { high: 3, medium: 2, low: 1 };
      const pDiff = (pWeight[b.priority] || 2) - (pWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;

      return (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99');
    });
  }, [filteredTasks, todayKey]);

  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const totalToday     = todayTasks.length;
  const pct            = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <div className="animate-fade-in">

      {/* ── Navigation bar ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'6px 20px 0',
      }}>
        <span style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)'}}>
          {dateStr}
        </span>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {/* Sleep Tracker shortcut */}
          <button
            onClick={onOpenSleepModal}
            title="Sleep & Recovery"
            style={{
              padding:'6px 10px', borderRadius:12,
              background:'linear-gradient(135deg, rgba(94,92,230,0.2) 0%, rgba(10,132,255,0.15) 100%)',
              border:'1px solid rgba(94,92,230,0.35)',
              display:'flex', alignItems:'center', gap:5,
              fontSize:12, fontWeight:700, color:'#5E5CE6', cursor:'pointer',
              boxShadow:'0 2px 8px rgba(94,92,230,0.15)',
            }}
          >
            <Moon size={14} />
            <span>Sleep</span>
          </button>

          {/* Working Productivity Analysis shortcut */}
          <button
            onClick={onOpenReviewsModal}
            title="Productivity Analysis"
            style={{
              padding:'6px 12px', borderRadius:12,
              background:'linear-gradient(135deg, rgba(10,132,255,0.2) 0%, rgba(94,92,230,0.18) 100%)',
              border:'1px solid rgba(10,132,255,0.35)',
              display:'flex', alignItems:'center', gap:6,
              fontSize:12, fontWeight:700, color:'var(--ios-blue)', cursor:'pointer',
              boxShadow:'0 2px 8px rgba(10,132,255,0.15)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="9" width="3" height="6" rx="1"/>
              <rect x="6.5" y="5" width="3" height="10" rx="1"/>
              <rect x="12" y="1" width="3" height="14" rx="1"/>
            </svg>
            <span>Analysis</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettingsModal}
            title="Settings"
            style={{
              width:32, height:32, borderRadius:10,
              background:'var(--ios-fill3)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, color:'var(--ios-label)', cursor:'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="3.5"/>
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.05 3.05l1.42 1.42M13.53 13.53l1.42 1.42M3.05 14.95l1.42-1.42M13.53 4.47l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Large title ── */}
      <div style={{padding:'8px 20px 14px'}}>
        <h1 className="ios-large-title">
          {greeting} {greetingEmoji}
        </h1>
      </div>

      {/* ── Today Progress Card ── */}
      <div style={{padding:'0 16px', marginBottom:10}}>
        <div className="ios-card" style={{
          background:'linear-gradient(135deg, rgba(10,132,255,0.15) 0%, rgba(94,92,230,0.1) 100%)',
          border:'1px solid rgba(10,132,255,0.2)',
        }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:3}}>
                Today's Progress
              </div>
              <div style={{fontSize:30,fontWeight:700,letterSpacing:'-0.5px',color:'var(--ios-label)'}}>
                {completedToday} <span style={{fontSize:20,fontWeight:400,color:'var(--ios-label2)'}}>/ {totalToday}</span>
              </div>
            </div>
            {/* Ring */}
            <div style={{position:'relative',width:56,height:56}}>
              <svg viewBox="0 0 56 56" style={{width:56,height:56,transform:'rotate(-90deg)'}}>
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
                <circle cx="28" cy="28" r="24" fill="none"
                  stroke={pct===100?'var(--ios-green)':'var(--ios-blue)'}
                  strokeWidth="6"
                  strokeDasharray={`${2*Math.PI*24}`}
                  strokeDashoffset={`${2*Math.PI*24*(1-pct/100)}`}
                  strokeLinecap="round"
                  style={{transition:'stroke-dashoffset 0.6s ease'}}
                />
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:13,fontWeight:700,color:'var(--ios-label)'}}>
                {pct}%
              </div>
            </div>
          </div>

          {/* Progress track */}
          <div className="ios-progress-track">
            <div className="ios-progress-fill fill-multi" style={{width:`${pct}%`}} />
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
            <span style={{fontSize:13,color:'var(--ios-label2)'}}>
              Routine consistency: <b style={{color:'var(--ios-green)'}}>{stats.routineConsistency}%</b>
            </span>
            <button
              onClick={() => onNavigateToTab('flow')}
              style={{fontSize:13,fontWeight:600,color:'var(--ios-blue)',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:2}}
            >
              View Flow <span>›</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sleep & Recovery Card (Compact Fit) ── */}
      <div style={{padding:'0 16px', marginBottom:10}}>
        <div
          onClick={onOpenSleepModal}
          className="ios-card"
          style={{
            background: 'linear-gradient(135deg, rgba(94,92,230,0.12) 0%, rgba(10,132,255,0.06) 100%)',
            border: '1px solid rgba(94,92,230,0.22)',
            cursor: 'pointer',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 16,
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0, flex:1}}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(94,92,230,0.18)',
              border: '1px solid rgba(94,92,230,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, flexShrink: 0,
            }}>
              🌙
            </div>
            <div style={{minWidth:0, overflow:'hidden'}}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--ios-label2)',
                textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.1,
              }}>
                Sleep & Recovery
              </div>
              {todaySleep ? (
                <div style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--ios-label)',
                  marginTop: 2, display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  <span>{todaySleep.bedTime} → {todaySleep.wakeTime}</span>
                  <span style={{fontSize: 12, fontWeight: 600, color: 'var(--ios-indigo)'}}>
                    · {SleepService.formatDuration(todaySleep.durationMinutes)}
                  </span>
                </div>
              ) : (
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--ios-label)',
                  marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  Log last night's sleep
                </div>
              )}
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:6, flexShrink:0, marginLeft:8}}>
            {todaySleep ? (
              <span
                style={{
                  padding: '3px 8px', borderRadius: 10,
                  background: `${QUALITY_META[todaySleep.quality].color}22`,
                  color: QUALITY_META[todaySleep.quality].color,
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                  border: `1px solid ${QUALITY_META[todaySleep.quality].color}33`,
                }}
              >
                <span>{QUALITY_META[todaySleep.quality].emoji}</span>
                <span>{QUALITY_META[todaySleep.quality].label}</span>
              </span>
            ) : (
              <span
                style={{
                  padding: '4px 10px', borderRadius: 10,
                  background: 'var(--ios-indigo)',
                  color: '#FFF', fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                }}
              >
                <span>+</span> Log
              </span>
            )}
            <span style={{fontSize:14, color:'var(--ios-label3)', opacity:0.6}}>›</span>
          </div>
        </div>
      </div>

      {/* ── Carryover banner ── */}
      {stats.carryOverCount > 0 && (
        <div style={{padding:'0 16px', marginBottom:10}}>
          <button
            onClick={onOpenCarryoverModal}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', borderRadius:14,
              background:'rgba(255,159,10,0.12)', border:'1px solid rgba(255,159,10,0.25)',
              cursor:'pointer', fontFamily:'var(--font)',
            }}
          >
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--ios-orange)'}}>
                  {stats.carryOverCount} overdue task{stats.carryOverCount!==1?'s':''}
                </div>
                <div style={{fontSize:12,color:'var(--ios-label2)'}}>Reschedule or archive?</div>
              </div>
            </div>
            <span style={{fontSize:16,color:'var(--ios-orange)'}}>›</span>
          </button>
        </div>
      )}


      {/* ── Section header ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 20px 8px'}}>
        <span style={{fontSize:22,fontWeight:700,letterSpacing:'-0.3px',color:'var(--ios-label)'}}>
          Tasks
        </span>
        <button
          onClick={() => onOpenTaskModal()}
          style={{display:'flex',alignItems:'center',gap:4,
            fontSize:15,fontWeight:600,color:'var(--ios-blue)',
            background:'none',border:'none',cursor:'pointer'}}
        >
          <span style={{fontSize:18,lineHeight:1}}>+</span> Add
        </button>
      </div>

      {/* ── Task Filter Pills (Default: All) ── */}
      <div style={{display:'flex', gap:6, padding:'0 16px 12px', overflowX:'auto'}}>
        {[
          { key: 'all', label: `All (${tasks.length})` },
          { key: 'today', label: `Today (${todayTasks.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingTasks.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTaskFilter(f.key as any)}
            style={{
              padding: '5px 12px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: taskFilter === f.key ? '1px solid rgba(10, 132, 255, 0.4)' : '1px solid transparent',
              background: taskFilter === f.key ? 'var(--ios-blue)' : 'var(--ios-fill3)',
              color: taskFilter === f.key ? '#FFF' : 'var(--ios-label2)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Task list (iOS grouped style) ── */}
      <div style={{padding:'0 16px', marginBottom:8}}>
        {sortedTasks.length === 0 ? (
          <div className="ios-card" style={{textAlign:'center',padding:'30px 20px'}}>
            <div style={{fontSize:38,marginBottom:8}}>✨</div>
            <div style={{fontSize:17,fontWeight:600,color:'var(--ios-label)',marginBottom:4}}>
              {taskFilter === 'today' ? 'All clear!' : taskFilter === 'upcoming' ? 'No upcoming tasks' : 'No tasks yet'}
            </div>
            <div style={{fontSize:13,color:'var(--ios-label2)'}}>
              {taskFilter === 'today'
                ? 'No tasks for today. Switch to All to see other scheduled tasks.'
                : taskFilter === 'upcoming'
                ? 'No upcoming tasks scheduled.'
                : 'Tap below to add your first task.'}
            </div>
            <button
              onClick={() => onOpenTaskModal()}
              className="ios-btn ios-btn-primary ios-btn-sm"
              style={{marginTop:16,borderRadius:10}}
            >
              + Add Task
            </button>
          </div>
        ) : (
          <div className="ios-grouped-card">
            {sortedTasks.map((task) => {
              const done     = task.status === 'completed';
              const mission  = task.missionId ? missionMap.get(task.missionId) : undefined;

              return (
                <div
                  key={task.id}
                  className="ios-row"
                  style={{cursor:'pointer', opacity: done ? 0.65 : 1}}
                  onClick={() => onOpenTaskModal(task)}
                >
                  {/* Checkbox */}
                  <button
                    className={`ios-check${done?' done':''}`}
                    onClick={e => handleToggle(task, e)}
                  >
                    {done && (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1.5 5L5.5 9L12.5 1" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:3}}>
                      <span style={{
                        fontSize:16, fontWeight:500,
                        color: done ? 'var(--ios-label3)' : 'var(--ios-label)',
                        textDecoration: done ? 'line-through' : 'none',
                        letterSpacing:'-0.2px',
                      }}>
                        {task.title}
                      </span>
                      {priorityBadge(task.priority)}

                      {/* Due Date Indicator Badge */}
                      {task.dueDate && task.dueDate < todayKey && !done && (
                        <span className="ios-pill ios-pill-red" style={{fontSize:11}}>⚠️ Overdue</span>
                      )}
                      {task.dueDate === todayKey && (
                        <span className="ios-pill ios-pill-blue" style={{fontSize:11}}>Today</span>
                      )}
                      {task.dueDate === tomorrowKey && (
                        <span className="ios-pill ios-pill-purple" style={{fontSize:11}}>Tomorrow</span>
                      )}
                      {task.dueDate && task.dueDate > tomorrowKey && (
                        <span className="ios-pill" style={{
                          fontSize:11,
                          background:'rgba(255,255,255,0.08)',
                          color:'var(--ios-label2)',
                          border:'1px solid rgba(255,255,255,0.08)'
                        }}>
                          📅 {new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                        </span>
                      )}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      {task.dueTime && (
                        <span style={{fontSize:12,color:'var(--ios-blue)',fontWeight:500,fontVariantNumeric:'tabular-nums'}}>
                          {task.dueTime}
                        </span>
                      )}
                      <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                        {task.category}
                      </span>
                      {mission && (
                        <span style={{fontSize:12,color:'var(--ios-purple)',fontWeight:500}}>
                          🎯 {mission.title}
                        </span>
                      )}
                      {task.recurrence && (
                        <span style={{fontSize:12,color:'var(--ios-indigo)',fontWeight:500}}>
                          🔁 {task.recurrence}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{opacity:.3,flexShrink:0}}>
                    <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Active missions quick-view ── */}
      {missions.filter(m => m.status==='active').length > 0 && (
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 20px 10px'}}>
            <span style={{fontSize:22,fontWeight:700,letterSpacing:'-0.3px',color:'var(--ios-label)'}}>
              Active Missions
            </span>
            <button
              onClick={() => onNavigateToTab('missions')}
              style={{fontSize:15,fontWeight:600,color:'var(--ios-blue)',background:'none',border:'none',cursor:'pointer'}}
            >
              See All ›
            </button>
          </div>
          <div style={{padding:'0 16px', marginBottom:8, display:'flex', gap:10, overflowX:'auto'}}
            className="filter-scroll">
            {missions.filter(m => m.status==='active').map(m => (
              <div
                key={m.id}
                style={{
                  flexShrink:0, width:180, background:'var(--ios-bg2)',
                  borderRadius:18, padding:'14px', boxShadow:'var(--shadow-card)',
                }}
              >
                <div style={{fontSize:13,fontWeight:700,color:'var(--ios-label)',marginBottom:6,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {m.title}
                </div>
                <div className="ios-progress-track" style={{marginBottom:6}}>
                  <div className="ios-progress-fill fill-purple" style={{width:`${m.progress}%`}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--ios-purple)'}}>
                    {m.progress}%
                  </span>
                  <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                    due {m.deadline}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── GitHub-style Streak Maintenance & Activity Graph (Accurate & positioned at bottom) ── */}
      <StreakGraph stats={stats} onRefresh={onRefresh} />

      <div style={{height:16}} />
    </div>
  );
};
