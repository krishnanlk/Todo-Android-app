import React, { useState, useEffect, useRef } from 'react';
import { Routine } from '../types';
import { RoutineService } from '../services/routineService';

interface FlowViewProps {
  routines: Routine[];
  onRefresh: () => void;
  onOpenRoutineModal: (r?: Routine) => void;
}

type Segment = 'timeline' | 'habits';

const ICONS: Record<string,string> = {
  wake: '☀️', morning: '🌤️', exercise: '🏃', breakfast: '🍳', college: '🏫',
  study: '📚', work: '💼', lunch: '🥗', break: '☕', reading: '📖',
  meditation: '🧘', project: '💡', dinner: '🍽️', evening: '🌙', sleep: '😴',
};

function getEmoji(name: string): string {
  const key = Object.keys(ICONS).find(k => name.toLowerCase().includes(k));
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

function routineStatus(r: Routine): 'completed'|'in-progress'|'upcoming'|'missed' {
  const now   = new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(r.startTime);
  const dur   = r.duration || r.durationMinutes || 60;
  const end   = start + dur;

  if (r.completedToday) return 'completed';
  if (currentTotal >= start && currentTotal < end) return 'in-progress';
  if (currentTotal >= end) return 'completed';
  return 'upcoming';
}

export const FlowView: React.FC<FlowViewProps> = ({ routines, onRefresh, onOpenRoutineModal }) => {
  const [segment, setSegment] = useState<Segment>('timeline');
  const liveRef = useRef<HTMLDivElement | null>(null);

  const sorted = [...routines].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find live active or upcoming routine id for auto-scroll
  let liveActiveId = '';
  for (const r of sorted) {
    const start = timeToMinutes(r.startTime);
    const dur = r.duration || r.durationMinutes || 60;
    const end = start + dur;
    if (currentMinutes >= start && currentMinutes < end) {
      liveActiveId = r.id;
      break;
    }
  }
  if (!liveActiveId && sorted.length > 0) {
    const upcoming = sorted.find(r => timeToMinutes(r.startTime) > currentMinutes);
    liveActiveId = upcoming ? upcoming.id : sorted[sorted.length - 1].id;
  }

  // Auto-scroll to current live routine on mount or tab change
  useEffect(() => {
    if (segment === 'timeline') {
      const timer = setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [segment, routines]);

  /* Group by time block */
  const groups: Record<string, Routine[]> = {};
  for (const r of sorted) {
    const block = getTimeBlock(timeToHour(r.startTime));
    if (!groups[block]) groups[block] = [];
    groups[block].push(r);
  }

  const completedCount = routines.filter(r => r.completedToday).length;
  const totalCount     = routines.length;

  const handleToggle = (r: Routine, e: React.MouseEvent) => {
    e.stopPropagation();
    RoutineService.toggleToday(r.id);
    onRefresh();
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
          <span style={{fontSize:18}}>+</span> Add
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

      {/* Progress ring + summary */}
      <div style={{padding:'0 16px', marginBottom:12}}>
        <div className="ios-card" style={{
          background:'linear-gradient(135deg,rgba(94,92,230,0.15),rgba(191,90,242,0.1))',
          border:'1px solid rgba(94,92,230,0.2)',
          display:'flex', alignItems:'center', gap:20,
        }}>
          {/* Ring */}
          <div style={{position:'relative',width:72,height:72,flexShrink:0}}>
            <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:'rotate(-90deg)'}}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--ios-indigo)" strokeWidth="8"
                strokeDasharray={`${2*Math.PI*30}`}
                strokeDashoffset={`${2*Math.PI*30*(1-(totalCount>0?completedCount/totalCount:0))}`}
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
              letterSpacing:0.5,marginBottom:4}}>Daily Routines</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--ios-label)',letterSpacing:'-0.3px',marginBottom:4}}>
              {totalCount>0?Math.round(completedCount/totalCount*100):0}% Complete
            </div>
            <div className="ios-pill ios-pill-indigo" style={{fontSize:12}}>
              🌊 Auto-synced to Live Time
            </div>
          </div>
        </div>
      </div>

      {/* Segment */}
      <div className="ios-segment">
        <button className={`ios-segment-item${segment==='timeline'?' active':''}`}
          onClick={() => setSegment('timeline')}>Timeline</button>
        <button className={`ios-segment-item${segment==='habits'?' active':''}`}
          onClick={() => setSegment('habits')}>Habits</button>
      </div>

      {segment === 'timeline' ? (
        /* Timeline view */
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

              {items.map(r => {
                const status = routineStatus(r);
                const isLiveCurrent = r.id === liveActiveId;
                return (
                  <div
                    key={r.id}
                    ref={isLiveCurrent ? liveRef : undefined}
                    className="flow-item"
                    onClick={() => onOpenRoutineModal(r)}
                  >
                    {/* Node */}
                    <div className={`flow-node ${status}`} style={{
                      boxShadow: isLiveCurrent ? '0 0 16px rgba(94, 92, 230, 0.7)' : 'none'
                    }}>
                      {status === 'completed'
                        ? <span style={{fontSize:16}}>✓</span>
                        : <span style={{fontSize:18}}>{getEmoji(r.title)}</span>}
                    </div>

                    {/* Card */}
                    <div
                      className={`flow-content${isLiveCurrent || status === 'in-progress' ? ' flow-active-highlight' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{fontSize:16,fontWeight:600,color:'var(--ios-label)',letterSpacing:'-0.2px'}}>
                            {r.title}
                          </span>
                        </div>
                        <button
                          className={`ios-check${r.completedToday?' done':''}`}
                          style={{width:22,height:22}}
                          onClick={e => handleToggle(r, e)}
                        >
                          {r.completedToday && (
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4.5L4.5 8L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        {r.startTime && (
                          <span style={{fontSize:12,fontWeight:600,color:
                            (isLiveCurrent || status==='in-progress')?'var(--ios-indigo)':
                            status==='completed'?'var(--ios-green)':
                            status==='missed'?'var(--ios-red)':
                            'var(--ios-label2)',
                            fontVariantNumeric:'tabular-nums'}}>
                            {r.startTime}
                          </span>
                        )}
                        {r.duration && (
                          <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                            {r.duration >= 60
                              ? `${(r.duration/60).toFixed(r.duration%60?1:0)}h`
                              : `${r.duration}m`}
                          </span>
                        )}
                        {status==='missed' && (
                          <span className="ios-pill ios-pill-red" style={{fontSize:11}}>
                            Missed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {routines.length === 0 && (
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:48,marginBottom:12}}>🌊</div>
              <div style={{fontSize:20,fontWeight:600,color:'var(--ios-label)',marginBottom:6}}>
                Set up your Flow
              </div>
              <div style={{fontSize:15,color:'var(--ios-label2)',lineHeight:1.5}}>
                Add your daily routines and build a life that flows.
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Habits view */
        <div style={{padding:'8px 16px 20px'}}>
          <div className="ios-grouped-card">
            {routines.map(r => (
              <div key={r.id} className="ios-row" style={{cursor:'pointer'}}
                onClick={() => onOpenRoutineModal(r)}>
                <span style={{fontSize:22,marginRight:12}}>{getEmoji(r.title)}</span>
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
