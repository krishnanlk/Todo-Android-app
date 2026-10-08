import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Routine, Task, FlowEvent } from '../types';
import { FlowService } from '../services/flowService';
import { WidgetService } from '../services/widgetService';

interface FlowViewProps {
  routines: Routine[];
  tasks?: Task[];
  onRefresh: () => void;
  onOpenRoutineModal: (r?: Routine) => void;
  onOpenTaskModal?: (t?: Task) => void;
}

type Segment = 'timeline' | 'habits';

const ICONS: Record<string, string> = {
  wake: '☀️', morning: '🌤️', exercise: '🏃', breakfast: '🍳', college: '🏫',
  study: '📚', work: '💼', lunch: '🥗', break: '☕', reading: '📖',
  meditation: '🧘', project: '💡', dinner: '🍽️', evening: '🌙', sleep: '😴',
};

function getEmoji(title: string, defaultIcon?: string): string {
  if (defaultIcon) return defaultIcon;
  const key = Object.keys(ICONS).find(k => title.toLowerCase().includes(k));
  return key ? ICONS[key] : '📌';
}

function getTimeBlock(hour: number): string {
  if (hour < 6)  return 'Early Morning';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Midday';
  if (hour < 18) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
}

function timeToHour(t?: string): number {
  if (!t) return 8;
  const [h] = t.split(':').map(Number);
  return h || 8;
}

function timeToMinutes(t?: string): number {
  if (!t) return 480;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const FlowView: React.FC<FlowViewProps> = ({
  routines,
  tasks = [],
  onRefresh,
  onOpenRoutineModal,
  onOpenTaskModal,
}) => {
  const [segment, setSegment] = useState<Segment>('timeline');
  const liveRef = useRef<HTMLDivElement | null>(null);

  // FlowService retains all items (routines + scheduled tasks) into a chronological flow
  const allFlowItems = useMemo(() => {
    return FlowService.getTodayFlow();
  }, [routines, tasks]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find currently active or next upcoming item
  const liveActiveId = useMemo(() => {
    const active = allFlowItems.find(f => {
      const start = timeToMinutes(f.time);
      const end = timeToMinutes(f.endTime);
      return currentMinutes >= start && currentMinutes < end;
    });
    if (active) return active.id;
    const upcoming = allFlowItems.find(f => timeToMinutes(f.time) > currentMinutes);
    return upcoming ? upcoming.id : (allFlowItems[0]?.id || '');
  }, [allFlowItems, currentMinutes]);

  // Auto-scroll to current live item on mount or segment switch
  useEffect(() => {
    if (segment === 'timeline') {
      const timer = setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [segment, allFlowItems]);

  // Group by time block
  const groups = useMemo(() => {
    const map: Record<string, FlowEvent[]> = {};
    for (const item of allFlowItems) {
      const block = getTimeBlock(timeToHour(item.time));
      if (!map[block]) map[block] = [];
      map[block].push(item);
    }
    return map;
  }, [allFlowItems]);

  const completedCount = allFlowItems.filter(f => f.status === 'completed').length;
  const totalCount     = allFlowItems.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (item: FlowEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasCompleted = FlowService.toggleFlowItemComplete(item);
    if (wasCompleted) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 },
        colors: ['#5E5CE6', '#0A84FF', '#30D158', '#FF9F0A'] });
    }
    WidgetService.refreshPayload();
    onRefresh();
  };

  const handleItemClick = (item: FlowEvent) => {
    if (item.isRoutine) {
      const foundRoutine = routines.find(r => r.id === item.refId);
      onOpenRoutineModal(foundRoutine);
    } else if (onOpenTaskModal) {
      const foundTask = tasks.find(t => t.id === item.refId);
      onOpenTaskModal(foundTask);
    }
  };

  const formattedLiveTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in">
      {/* Nav bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 20px 0'}}>
        <span style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)'}}>Life Flow</span>
        <button
          onClick={() => onOpenRoutineModal()}
          style={{display:'flex',alignItems:'center',gap:4,fontSize:15,fontWeight:600,
            color:'var(--ios-blue)',background:'none',border:'none',cursor:'pointer'}}
        >
          <span style={{fontSize:18}}>+</span> Add Routine
        </button>
      </div>

      {/* Large title with Live time status */}
      <div style={{padding:'8px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h1 className="ios-large-title" style={{margin:0}}>Life Flow 🌊</h1>
        <div style={{
          display:'flex',
          alignItems:'center',
          gap:6,
          background:'rgba(94, 92, 230, 0.15)',
          border:'1px solid rgba(94, 92, 230, 0.3)',
          borderRadius:12,
          padding:'4px 10px',
          fontSize:12,
          fontWeight:600,
          color:'var(--ios-indigo)',
        }}>
          <span style={{width:6, height:6, borderRadius:'50%', background:'var(--ios-indigo)', display:'inline-block'}} />
          Live {formattedLiveTime}
        </div>
      </div>

      {/* Unified Progress Card: retains all items */}
      <div style={{padding:'0 16px', marginBottom:12}}>
        <div className="ios-card" style={{
          background:'linear-gradient(135deg, rgba(94,92,230,0.18), rgba(10,132,255,0.12))',
          border:'1px solid rgba(94,92,230,0.25)',
          display:'flex', alignItems:'center', gap:20,
        }}>
          {/* Ring */}
          <div style={{position:'relative',width:72,height:72,flexShrink:0}}>
            <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:'rotate(-90deg)'}}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--ios-indigo)" strokeWidth="8"
                strokeDasharray={`${2*Math.PI*30}`}
                strokeDashoffset={`${2*Math.PI*30*(1 - pct / 100)}`}
                strokeLinecap="round"
                style={{transition:'stroke-dashoffset 0.6s ease'}}
              />
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
              flexDirection:'column'}}>
              <span style={{fontSize:18,fontWeight:700,color:'var(--ios-label)'}}>{completedCount}</span>
              <span style={{fontSize:10,color:'var(--ios-label3)'}}>/{totalCount}</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)',textTransform:'uppercase',
              letterSpacing:0.5,marginBottom:4}}>Retained Day Flow</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--ios-label)',letterSpacing:'-0.3px',marginBottom:4}}>
              {pct}% Completed
            </div>
            <div className="ios-pill ios-pill-indigo" style={{fontSize:12}}>
              🌊 Chronological Flow ({allFlowItems.filter(f=>f.isRoutine).length} Habits · {allFlowItems.filter(f=>!f.isRoutine).length} Tasks)
            </div>
          </div>
        </div>
      </div>

      {/* Segment Switcher */}
      <div className="ios-segment" style={{marginBottom:10}}>
        <button className={`ios-segment-item${segment==='timeline'?' active':''}`}
          onClick={() => setSegment('timeline')}>Timeline Flow</button>
        <button className={`ios-segment-item${segment==='habits'?' active':''}`}
          onClick={() => setSegment('habits')}>Habits Overview</button>
      </div>

      {segment === 'timeline' ? (
        <>
          {/* Timeline view retaining all events */}
          <div className="flow-timeline">
            {Object.entries(groups).map(([block, items]) => (
              <div key={block}>
                {/* Time block header */}
                <div style={{
                  display:'flex',alignItems:'center',gap:8,
                  marginBottom:8, marginLeft:52, marginTop:4,
                }}>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--ios-label3)',
                    textTransform:'uppercase',letterSpacing:0.5}}>
                    {block}
                  </span>
                </div>

                {items.map(item => {
                  const isDone = item.status === 'completed';
                  const isCurrent = item.id === liveActiveId;
                  const isLiveProgress = item.status === 'in_progress';

                  return (
                    <div
                      key={item.id}
                      ref={isCurrent ? liveRef : undefined}
                      className="flow-item"
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Node icon */}
                      <div className={`flow-node ${isDone ? 'completed' : isLiveProgress ? 'in-progress' : item.status}`}
                        style={{
                          boxShadow: isCurrent ? '0 0 16px rgba(94, 92, 230, 0.7)' : 'none',
                          background: isDone ? 'var(--ios-green)' : item.isRoutine ? 'var(--ios-indigo)' : 'var(--ios-blue)',
                        }}
                      >
                        {isDone ? (
                          <span style={{fontSize:16, color:'#FFF'}}>✓</span>
                        ) : (
                          <span style={{fontSize:16}}>{getEmoji(item.title, item.icon)}</span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div
                        className={`flow-content${isCurrent || isLiveProgress ? ' flow-active-highlight' : ''}`}
                        style={{ cursor: 'pointer', opacity: isDone ? 0.75 : 1 }}
                      >
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                            <span style={{
                              fontSize:16, fontWeight:600,
                              color: isDone ? 'var(--ios-label3)' : 'var(--ios-label)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              letterSpacing:'-0.2px',
                            }}>
                              {item.title}
                            </span>
                            {!item.isRoutine && (
                              <span style={{
                                fontSize:10, fontWeight:700,
                                padding:'2px 6px', borderRadius:6,
                                background:'rgba(10, 132, 255, 0.15)',
                                color:'var(--ios-blue)',
                              }}>
                                TASK
                              </span>
                            )}
                            {item.missionTitle && (
                              <span style={{
                                fontSize:11, color:'var(--ios-purple)', fontWeight:600,
                              }}>
                                🎯 {item.missionTitle}
                              </span>
                            )}
                          </div>
                          <button
                            className={`ios-check${isDone ? ' done' : ''}`}
                            style={{width:22,height:22}}
                            onClick={e => handleToggle(item, e)}
                          >
                            {isDone && (
                              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                <path d="M1 4.5L4.5 8L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </div>

                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{
                            fontSize:12, fontWeight:600,
                            color: isLiveProgress ? 'var(--ios-indigo)' : isDone ? 'var(--ios-green)' : 'var(--ios-label2)',
                            fontVariantNumeric:'tabular-nums',
                          }}>
                            {item.time} {item.endTime ? `– ${item.endTime}` : ''}
                          </span>
                          {item.durationMinutes && (
                            <span style={{fontSize:12, color:'var(--ios-label3)'}}>
                              {item.durationMinutes >= 60
                                ? `${(item.durationMinutes/60).toFixed(item.durationMinutes%60?1:0)}h`
                                : `${item.durationMinutes}m`}
                            </span>
                          )}
                          {item.category && (
                            <span style={{fontSize:12, color:'var(--ios-label3)'}}>
                              {item.category}
                            </span>
                          )}
                          {item.status === 'missed' && !isDone && (
                            <span className="ios-pill ios-pill-red" style={{fontSize:11}}>
                              Missed
                            </span>
                          )}
                          {isLiveProgress && (
                            <span className="ios-pill ios-pill-indigo" style={{fontSize:11}}>
                              Now
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {allFlowItems.length === 0 && (
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:48,marginBottom:12}}>🌊</div>
                <div style={{fontSize:20,fontWeight:600,color:'var(--ios-label)',marginBottom:6}}>
                  Nothing in this Flow
                </div>
                <div style={{fontSize:15,color:'var(--ios-label2)',lineHeight:1.5}}>
                  Add tasks or daily routines to flow through your day.
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Habits view */
        <div style={{padding:'8px 16px 20px'}}>
          <div className="ios-grouped-card">
            {routines.map(r => (
              <div key={r.id} className="ios-row" style={{cursor:'pointer'}}
                onClick={() => onOpenRoutineModal(r)}>
                <span style={{fontSize:22,marginRight:12}}>{getEmoji(r.title, r.icon)}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:500,color:'var(--ios-label)'}}>{r.title}</div>
                  <div style={{fontSize:13,color:'var(--ios-label3)',marginTop:2}}>
                    {r.startTime} · {r.daysOfWeek ? `${r.daysOfWeek.length} days/wk` : 'Daily'}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:15,fontWeight:700,color:'var(--ios-indigo)'}}>
                    {r.consistencyScore || 85}%
                  </div>
                  <div style={{fontSize:11,color:'var(--ios-label3)'}}>consistency</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
