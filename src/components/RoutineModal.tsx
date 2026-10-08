import React, { useState, useEffect } from 'react';
import { Routine } from '../types';
import { RoutineService } from '../services/routineService';
import { WidgetService }  from '../services/widgetService';

interface RoutineModalProps {
  routine?: Routine | null;
  isOpen:   boolean;
  onClose:  () => void;
  onSaved:  () => void;
}

const DAYS = [
  { label:'S', name:'Sunday',    value:0 },
  { label:'M', name:'Monday',    value:1 },
  { label:'T', name:'Tuesday',   value:2 },
  { label:'W', name:'Wednesday', value:3 },
  { label:'T', name:'Thursday',  value:4 },
  { label:'F', name:'Friday',    value:5 },
  { label:'S', name:'Saturday',  value:6 },
];

const EMOJIS = ['🌅','🎓','🍱','📚','💻','🏃','📖','🌙','☕','🧘','🏋️','🚴','💡','🎵','🛀','🧹','💊','🐾'];

const DURATION_PRESETS = [
  { label:'15m', mins:15 },
  { label:'30m', mins:30 },
  { label:'45m', mins:45 },
  { label:'1h',  mins:60 },
  { label:'1.5h',mins:90 },
  { label:'2h',  mins:120 },
  { label:'3h',  mins:180 },
];

export const RoutineModal: React.FC<RoutineModalProps> = ({ routine, isOpen, onClose, onSaved }) => {
  const [title,    setTitle]    = useState('');
  const [icon,     setIcon]     = useState('🌅');
  const [time,     setTime]     = useState('07:00');
  const [duration, setDuration] = useState(45);
  const [days,     setDays]     = useState<number[]>([1,2,3,4,5]);
  const [category, setCategory] = useState('routine');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (routine) {
      setTitle(routine.title);
      setIcon(routine.icon || '🌅');
      setTime(routine.time || routine.startTime || '07:00');
      setDuration(routine.durationMinutes || routine.duration || 45);
      setDays(routine.daysOfWeek || [1,2,3,4,5]);
      setCategory(routine.category || 'routine');
    } else {
      setTitle(''); setIcon('🌅'); setTime('07:00');
      setDuration(45); setDays([1,2,3,4,5]); setCategory('routine');
    }
  }, [routine, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x!==d) : [...prev, d].sort((a,b)=>a-b));
  };

  const selectAll = () => setDays([0,1,2,3,4,5,6]);
  const selectWeekdays = () => setDays([1,2,3,4,5]);
  const selectWeekends = () => setDays([0,6]);

  const handleSave = () => {
    if (!title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const data = { title:title.trim(), icon, time, startTime:time,
        durationMinutes:duration, duration, daysOfWeek:days, category, active:true };
      if (routine) {
        RoutineService.update(routine.id, data);
      } else {
        RoutineService.create(data);
      }
      WidgetService.refreshPayload();
      setSaving(false);
      onSaved();
      onClose();
    }, 200);
  };

  const handleDelete = () => {
    if (routine && window.confirm('Delete this routine?')) {
      RoutineService.delete(routine.id);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="ios-sheet-backdrop" onClick={onClose}>
      <div className="ios-sheet" onClick={e => e.stopPropagation()}>
        <div className="ios-sheet-handle-bar" />

        <div className="ios-sheet-header">
          <button onClick={onClose}
            style={{fontSize:17,fontWeight:400,color:'var(--ios-blue)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>
            Cancel
          </button>
          <span className="ios-sheet-title">{routine ? 'Edit Routine' : 'New Routine'}</span>
          <button onClick={handleSave}
            disabled={!title.trim()||saving}
            style={{fontSize:17,fontWeight:600,
              color:title.trim()?'var(--ios-blue)':'var(--ios-label3)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>
            {saving ? '…' : 'Save'}
          </button>
        </div>

        <div className="ios-sheet-scroll">
          {/* Emoji picker */}
          <div className="ios-input-group">
            <div className="ios-input-label">Icon</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setIcon(e)}
                  style={{
                    width:44,height:44,borderRadius:12,fontSize:22,
                    border:'none',cursor:'pointer',
                    background: icon===e?'rgba(94,92,230,0.15)':'var(--ios-bg3)',
                    outline: icon===e?'2px solid var(--ios-indigo)':'none',
                    transition:'all 0.15s ease',
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="ios-input-group">
            <div className="ios-input-label">Routine Name</div>
            <input
              className="ios-input"
              placeholder="e.g. Morning Exercise"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              style={{fontSize:17,fontWeight:500}}
            />
          </div>

          {/* Time */}
          <div className="ios-input-group">
            <div className="ios-input-label">Start Time</div>
            <input type="time" className="ios-input"
              value={time} onChange={e => setTime(e.target.value)}
              style={{colorScheme:'dark'}} />
          </div>

          {/* Duration */}
          <div className="ios-input-group">
            <div className="ios-input-label">Duration</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {DURATION_PRESETS.map(dp => (
                <button key={dp.label} onClick={() => setDuration(dp.mins)}
                  style={{
                    padding:'8px 16px',borderRadius:999,border:'none',
                    background: duration===dp.mins?'var(--ios-indigo)':'var(--ios-bg3)',
                    color: duration===dp.mins?'#FFF':'var(--ios-label2)',
                    fontFamily:'var(--font)',fontSize:14,fontWeight:500,
                    cursor:'pointer',transition:'all 0.2s ease',
                  }}>
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week */}
          <div className="ios-input-group">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span className="ios-input-label" style={{marginBottom:0}}>Days</span>
              <div style={{display:'flex',gap:8}}>
                {[
                  {label:'All',     action:selectAll},
                  {label:'Mon-Fri', action:selectWeekdays},
                  {label:'Weekends',action:selectWeekends},
                ].map(q => (
                  <button key={q.label} onClick={q.action}
                    style={{fontSize:12,fontWeight:600,color:'var(--ios-blue)',
                      background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:6,justifyContent:'space-between'}}>
              {DAYS.map(d => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  title={d.name}
                  style={{
                    width:42,height:42,borderRadius:'50%',border:'none',cursor:'pointer',
                    background: days.includes(d.value)?'var(--ios-blue)':'var(--ios-bg3)',
                    color: days.includes(d.value)?'#FFF':'var(--ios-label2)',
                    fontFamily:'var(--font)',fontSize:14,fontWeight:600,
                    transition:'all 0.2s ease',
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {routine && (
            <button onClick={handleDelete}
              className="ios-btn ios-btn-destructive ios-btn-full"
              style={{marginTop:8}}>
              Delete Routine
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
