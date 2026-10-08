import React, { useState, useEffect } from 'react';
import { Mission, Priority, Subtask } from '../types';
import { MissionService } from '../services/missionService';
import { WidgetService }  from '../services/widgetService';
import { getTodayKey, formatDateKey } from '../services/storageService';

interface MissionModalProps {
  mission?: Mission | null;
  isOpen:   boolean;
  onClose:  () => void;
  onSaved:  () => void;
}

const ICONS     = ['🎯','🚀','📚','💻','🏃','🎨','💡','🌍','🏆','⚡','🔬','🎵','📊','🛠️','🌱'];
const CATS      = ['development','study','health','career','finance','creative','personal','other'];
const PRIORITIES: Priority[] = ['low','medium','high'];
const PRI_COLORS = { low:'var(--ios-green)', medium:'var(--ios-orange)', high:'var(--ios-red)' };

export const MissionModal: React.FC<MissionModalProps> = ({ mission, isOpen, onClose, onSaved }) => {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [startDate,   setStartDate]   = useState(getTodayKey());
  const [deadline,    setDeadline]    = useState('');
  const [priority,    setPriority]    = useState<Priority>('high');
  const [category,    setCategory]    = useState('development');
  const [icon,        setIcon]        = useState('🎯');
  const [subtasks,    setSubtasks]    = useState<{ id:string;title:string;completed:boolean;order:number }[]>([]);
  const [newSub,      setNewSub]      = useState('');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (mission) {
      setTitle(mission.title);
      setDescription(mission.description || '');
      setStartDate(mission.startDate);
      setDeadline(mission.deadline);
      setPriority(mission.priority);
      setCategory(mission.category);
      setIcon(mission.icon || '🎯');
      setSubtasks(mission.subtasks.map((s, idx) => ({ id:s.id, title:s.title, completed:s.completed, order:s.order ?? idx })));
      setNotes(mission.notes || '');
    } else {
      const future = new Date(); future.setDate(future.getDate()+7);
      setTitle(''); setDescription(''); setStartDate(getTodayKey());
      setDeadline(formatDateKey(future)); setPriority('high');
      setCategory('development'); setIcon('🎯');
      setSubtasks([]); setNotes('');
    }
  }, [mission, isOpen]);

  if (!isOpen) return null;

  const addSubtask = () => {
    if (!newSub.trim()) return;
    setSubtasks(prev => [...prev, {
      id: `sub-${Date.now()}`,
      title: newSub.trim(),
      completed: false,
      order: prev.length,
    }]);
    setNewSub('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const data = { title:title.trim(), description, startDate, deadline, priority, category,
        icon, subtasks, notes };
      if (mission) {
        MissionService.update(mission.id, data);
      } else {
        MissionService.create(data);
      }
      WidgetService.refreshPayload();
      setSaving(false);
      onSaved();
      onClose();
    }, 200);
  };

  const handleDelete = () => {
    if (mission && window.confirm('Delete this mission?')) {
      MissionService.delete(mission.id);
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
          <span className="ios-sheet-title">{mission ? 'Edit Mission' : 'New Mission'}</span>
          <button onClick={handleSave}
            disabled={!title.trim()||saving}
            style={{fontSize:17,fontWeight:600,
              color:title.trim()?'var(--ios-blue)':'var(--ios-label3)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>
            {saving ? '…' : 'Save'}
          </button>
        </div>

        <div className="ios-sheet-scroll">
          {/* Icon picker */}
          <div className="ios-input-group">
            <div className="ios-input-label">Icon</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  style={{
                    width:44,height:44,borderRadius:12,fontSize:22,
                    border:'none',cursor:'pointer',
                    background: icon===ic?'rgba(10,132,255,0.15)':'var(--ios-bg3)',
                    outline: icon===ic?'2px solid var(--ios-blue)':'none',
                    transition:'all 0.15s ease',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="ios-input-group">
            <div className="ios-input-label">Mission Title</div>
            <input
              className="ios-input"
              placeholder="What's your big goal?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              style={{fontSize:17,fontWeight:500}}
            />
          </div>

          {/* Description */}
          <div className="ios-input-group">
            <div className="ios-input-label">Description</div>
            <textarea className="ios-input ios-textarea"
              placeholder="What does success look like?"
              value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Dates */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <div className="ios-input-group" style={{marginBottom:0}}>
              <div className="ios-input-label">Start Date</div>
              <input type="date" className="ios-input"
                value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{colorScheme:'dark'}} />
            </div>
            <div className="ios-input-group" style={{marginBottom:0}}>
              <div className="ios-input-label">Deadline</div>
              <input type="date" className="ios-input"
                value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{colorScheme:'dark'}} />
            </div>
          </div>

          {/* Priority */}
          <div className="ios-input-group">
            <div className="ios-input-label">Priority</div>
            <div style={{display:'flex',gap:8}}>
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  style={{
                    flex:1,padding:'10px',borderRadius:10,border:'none',
                    background: priority===p?`${PRI_COLORS[p]}22`:'var(--ios-bg3)',
                    color: priority===p?PRI_COLORS[p]:'var(--ios-label2)',
                    fontFamily:'var(--font)',fontSize:14,fontWeight:600,cursor:'pointer',
                    outline: priority===p?`1.5px solid ${PRI_COLORS[p]}55`:'1.5px solid transparent',
                    textTransform:'capitalize',transition:'all 0.2s ease',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="ios-input-group">
            <div className="ios-input-label">Category</div>
            <select className="ios-select"
              value={category} onChange={e => setCategory(e.target.value)}
              style={{colorScheme:'dark'}}>
              {CATS.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Subtasks */}
          <div className="ios-input-group">
            <div className="ios-input-label">Milestones / Subtasks</div>

            {subtasks.length > 0 && (
              <div className="ios-grouped-card" style={{marginBottom:8}}>
                {subtasks.map((s, i) => (
                  <div key={s.id} className="ios-row" style={{padding:'10px 14px'}}>
                    <span style={{flex:1,fontSize:15,color:'var(--ios-label)'}}>{s.title}</span>
                    <button onClick={() => removeSubtask(s.id)}
                      style={{background:'none',border:'none',cursor:'pointer',
                        color:'var(--ios-red)',fontSize:20,padding:'0 4px'}}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <input
                className="ios-input"
                placeholder="Add milestone…"
                value={newSub}
                onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addSubtask()}
                style={{flex:1}}
              />
              <button onClick={addSubtask}
                style={{
                  padding:'0 16px',borderRadius:10,
                  background:'var(--ios-blue)',color:'#FFF',
                  border:'none',cursor:'pointer',
                  fontFamily:'var(--font)',fontSize:15,fontWeight:600,
                }}>
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="ios-input-group">
            <div className="ios-input-label">Notes</div>
            <textarea className="ios-input ios-textarea"
              placeholder="Any additional notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)} />
          </div>

          {mission && (
            <button onClick={handleDelete}
              className="ios-btn ios-btn-destructive ios-btn-full"
              style={{marginTop:8}}>
              Delete Mission
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
