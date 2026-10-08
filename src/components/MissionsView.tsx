import React, { useState } from 'react';
import { Mission } from '../types';
import { MissionService } from '../services/missionService';

interface MissionsViewProps {
  missions: Mission[];
  onRefresh: () => void;
  onOpenMissionModal: (m?: Mission) => void;
}

type Filter = 'active' | 'completed' | 'all';

const STATUS_COLORS: Record<string,string> = {
  active:    'var(--ios-blue)',
  completed: 'var(--ios-green)',
  paused:    'var(--ios-orange)',
  archived:  'var(--ios-label3)',
};

const TOP_COLORS = ['var(--ios-blue)','var(--ios-purple)','var(--ios-green)','var(--ios-orange)','var(--ios-teal)','var(--ios-pink)'];

export const MissionsView: React.FC<MissionsViewProps> = ({ missions, onRefresh, onOpenMissionModal }) => {
  const [filter, setFilter] = useState<Filter>('active');
  const [expanded, setExpanded] = useState<string|null>(null);

  const filtered = missions.filter(m => {
    if (filter === 'active')    return m.status === 'active';
    if (filter === 'completed') return m.status === 'completed';
    return true;
  });

  const active    = missions.filter(m => m.status==='active').length;
  const completed = missions.filter(m => m.status==='completed').length;

  const toggleExpand = (id: string) =>
    setExpanded(prev => prev===id ? null : id);

  const toggleSubtask = (missionId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    MissionService.toggleSubtask(missionId, subtaskId);
    onRefresh();
  };

  return (
    <div className="animate-fade-in">
      {/* Nav bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 20px 0'}}>
        <span style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)'}}>Personal Goals</span>
        <button
          onClick={() => onOpenMissionModal()}
          style={{display:'flex',alignItems:'center',gap:4,fontSize:15,fontWeight:600,
            color:'var(--ios-blue)',background:'none',border:'none',cursor:'pointer'}}
        >
          <span style={{fontSize:18}}>+</span> Mission
        </button>
      </div>

      {/* Large title */}
      <div style={{padding:'8px 20px 12px'}}>
        <h1 className="ios-large-title">Missions 🎯</h1>
      </div>

      {/* Stats summary */}
      <div style={{padding:'0 16px',marginBottom:12}}>
        <div style={{display:'flex',gap:10}}>
          {[
            { label:'Active',    value:active,    color:'var(--ios-blue)',   bg:'rgba(10,132,255,0.1)'  },
            { label:'Completed', value:completed,  color:'var(--ios-green)',  bg:'rgba(48,209,88,0.1)'   },
            { label:'Total',     value:missions.length, color:'var(--ios-label)',bg:'var(--ios-bg2)'         },
          ].map(s => (
            <div key={s.label} className="ios-card" style={{flex:1,padding:'12px 12px',background:s.bg}}>
              <div style={{fontSize:26,fontWeight:700,color:s.color,letterSpacing:'-0.5px'}}>
                {s.value}
              </div>
              <div style={{fontSize:12,color:'var(--ios-label2)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ios-segment">
        {(['active','all','completed'] as Filter[]).map(f => (
          <button
            key={f}
            className={`ios-segment-item${filter===f?' active':''}`}
            onClick={() => setFilter(f)}
            style={{textTransform:'capitalize'}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Missions list */}
      <div style={{padding:'0 16px'}}>
        {filtered.length === 0 ? (
          <div className="ios-card" style={{textAlign:'center',padding:'40px 20px'}}>
            <div style={{fontSize:40,marginBottom:8}}>🎯</div>
            <div style={{fontSize:18,fontWeight:600,color:'var(--ios-label)',marginBottom:4}}>
              {filter==='active' ? 'No active missions' : 'No missions yet'}
            </div>
            <div style={{fontSize:14,color:'var(--ios-label2)',lineHeight:1.5,marginBottom:16}}>
              Set your next big goal and track your progress.
            </div>
            <button
              onClick={() => onOpenMissionModal()}
              className="ios-btn ios-btn-primary ios-btn-sm"
              style={{borderRadius:10}}
            >
              + Create Mission
            </button>
          </div>
        ) : (
          filtered.map((m, idx) => {
            const accentColor = TOP_COLORS[idx % TOP_COLORS.length];
            const isExpanded  = expanded === m.id;
            const subtasks    = m.subtasks || [];
            const doneSubs    = subtasks.filter(s => s.completed).length;

            return (
              <div
                key={m.id}
                style={{marginBottom:12}}
                className="mission-card"
              >
                {/* Top accent bar */}
                <div style={{
                  position:'absolute',top:0,left:0,right:0,height:3,
                  borderRadius:'18px 18px 0 0',
                  background:accentColor,
                }}/>

                {/* Header */}
                <div
                  style={{display:'flex',alignItems:'flex-start',gap:12,cursor:'pointer'}}
                  onClick={() => onOpenMissionModal(m)}
                >
                  <div style={{
                    width:44,height:44,borderRadius:12,
                    background:`linear-gradient(135deg,${accentColor}30,${accentColor}15)`,
                    border:`1.5px solid ${accentColor}40`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:22,flexShrink:0,
                  }}>
                    {m.icon || '🎯'}
                  </div>

                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--ios-label)',
                      letterSpacing:'-0.2px',marginBottom:3,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {m.title}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,color:STATUS_COLORS[m.status]||'var(--ios-label2)',fontWeight:600}}>
                        {m.status}
                      </span>
                      {m.deadline && (
                        <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                          📅 {m.deadline}
                        </span>
                      )}
                      <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                        {doneSubs}/{subtasks.length} subtasks
                      </span>
                    </div>
                  </div>

                  {/* Progress pct */}
                  <div style={{flexShrink:0,textAlign:'right'}}>
                    <div style={{fontSize:20,fontWeight:700,color:accentColor}}>
                      {m.progress}%
                    </div>
                    <button
                      onClick={e => {e.stopPropagation(); toggleExpand(m.id);}}
                      style={{fontSize:11,color:'var(--ios-blue)',background:'none',border:'none',
                        cursor:'pointer',fontFamily:'var(--font)',fontWeight:600,padding:'2px 0'}}
                    >
                      {isExpanded ? 'Less ▲' : 'More ▼'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="ios-progress-track" style={{margin:'12px 0'}}>
                  <div
                    style={{
                      height:'100%',borderRadius:999,
                      background:accentColor,
                      width:`${m.progress}%`,
                      transition:'width 0.5s ease',
                    }}
                  />
                </div>

                {/* Expanded subtasks */}
                {isExpanded && subtasks.length > 0 && (
                  <div style={{
                    background:'var(--ios-bg3)',borderRadius:12,padding:'8px 4px',
                    display:'flex',flexDirection:'column',gap:0,
                    animation:'fade-in 0.25s ease',
                  }}>
                    {subtasks.map((s, i) => (
                      <div
                        key={s.id}
                        style={{
                          display:'flex',alignItems:'center',gap:10,
                          padding:'10px 12px',
                          borderBottom: i<subtasks.length-1?'0.5px solid var(--ios-separator)':'none',
                        }}
                      >
                        <button
                          className={`ios-check${s.completed?' done':''}`}
                          style={{width:22,height:22}}
                          onClick={e => toggleSubtask(m.id, s.id, e)}
                        >
                          {s.completed && (
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4.5L4.5 8L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <span style={{
                          fontSize:14,fontWeight:500,
                          color: s.completed?'var(--ios-label3)':'var(--ios-label)',
                          textDecoration: s.completed?'line-through':'none',
                          flex:1,
                        }}>
                          {s.title}
                        </span>
                        {(s as any).dueDate && (
                          <span style={{fontSize:12,color:'var(--ios-label3)'}}>
                            {(s as any).dueDate}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit button */}
                <button
                  onClick={e => {e.stopPropagation(); onOpenMissionModal(m);}}
                  style={{
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                    width:'100%',marginTop:12,
                    padding:'9px',borderRadius:10,
                    background:'var(--ios-fill3)',border:'none',
                    fontSize:14,fontWeight:600,color:'var(--ios-blue)',
                    cursor:'pointer',fontFamily:'var(--font)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 1L13 4L5 12H2V9L10 1z"/>
                  </svg>
                  Edit Mission
                </button>
              </div>
            );
          })
        )}

        {/* Footer add */}
        {filtered.length > 0 && (
          <button
            onClick={() => onOpenMissionModal()}
            style={{
              width:'100%',padding:'14px',borderRadius:18,
              background:'var(--ios-fill4)',
              border:'1.5px dashed var(--ios-separator)',
              fontSize:15,fontWeight:600,color:'var(--ios-blue)',
              cursor:'pointer',fontFamily:'var(--font)',marginBottom:4,
            }}
          >
            + New Mission
          </button>
        )}
      </div>

      <div style={{height:8}}/>
    </div>
  );
};
