import React, { useState, useEffect } from 'react';
import { Task, Mission } from '../types';
import { TaskService } from '../services/taskService';
import { getTodayKey } from '../services/storageService';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  missions: Mission[];
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITIES  = ['low', 'medium', 'high'] as const;
const CATEGORIES  = ['general','study','development','work','health','personal','finance','creative'];
const RECURRENCES = ['none','daily','weekdays','weekends','weekly','monthly'];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, task, missions, onClose, onSaved }) => {
  const [title,      setTitle]      = useState('');
  const [notes,      setNotes]      = useState('');
  const [dueDate,    setDueDate]    = useState(getTodayKey());
  const [dueTime,    setDueTime]    = useState('');
  const [priority,   setPriority]   = useState<'low'|'medium'|'high'>('medium');
  const [category,   setCategory]   = useState('general');
  const [missionId,  setMissionId]  = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setDueDate(task.dueDate || getTodayKey());
      setDueTime(task.dueTime || '');
      setPriority(task.priority || 'medium');
      setCategory(task.category || 'general');
      setMissionId(task.missionId || '');
      setRecurrence(task.recurrence || 'none');
    } else {
      setTitle(''); setNotes(''); setDueDate(getTodayKey()); setDueTime('');
      setPriority('medium'); setCategory('general');
      setMissionId(''); setRecurrence('none');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const data = {
        title:      title.trim(),
        notes,
        dueDate:    dueDate || getTodayKey(),
        dueTime,
        priority,
        category,
        missionId: missionId || undefined,
        recurrence: recurrence === 'none' ? undefined : recurrence,
      };
      if (task) {
        TaskService.update(task.id, data);
      } else {
        TaskService.create(data);
      }
      setSaving(false);
      onSaved();
      onClose();
    }, 200);
  };

  const handleDelete = () => {
    if (task && window.confirm('Delete this task?')) {
      TaskService.delete(task.id);
      onSaved();
      onClose();
    }
  };

  const priorityColors = { low:'var(--ios-green)', medium:'var(--ios-orange)', high:'var(--ios-red)' };

  return (
    <div className="ios-sheet-backdrop" onClick={onClose}>
      <div className="ios-sheet" onClick={e => e.stopPropagation()}>
        <div className="ios-sheet-handle-bar" />

        <div className="ios-sheet-header">
          <button
            onClick={onClose}
            style={{fontSize:17,fontWeight:400,color:'var(--ios-blue)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}
          >
            Cancel
          </button>
          <span className="ios-sheet-title">{task ? 'Edit Task' : 'New Task'}</span>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            style={{fontSize:17,fontWeight:600,
              color:title.trim()?'var(--ios-blue)':'var(--ios-label3)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>

        <div className="ios-sheet-scroll">
          {/* Title */}
          <div className="ios-input-group">
            <div className="ios-input-label">Task Title</div>
            <input
              className="ios-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              style={{fontSize:17,fontWeight:500}}
            />
          </div>

          {/* Notes */}
          <div className="ios-input-group">
            <div className="ios-input-label">Notes</div>
            <textarea
              className="ios-input ios-textarea"
              placeholder="Add notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Date & Time row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <div className="ios-input-group" style={{marginBottom:0}}>
              <div className="ios-input-label">Due Date</div>
              <input
                type="date" className="ios-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{colorScheme:'dark'}}
              />
            </div>
            <div className="ios-input-group" style={{marginBottom:0}}>
              <div className="ios-input-label">Due Time</div>
              <input
                type="time" className="ios-input"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                style={{colorScheme:'dark'}}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="ios-input-group">
            <div className="ios-input-label">Priority</div>
            <div style={{display:'flex',gap:8}}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    flex:1,padding:'10px',borderRadius:10,
                    background: priority===p
                      ? `${priorityColors[p]}22`
                      : 'var(--ios-bg3)',
                    color: priority===p ? priorityColors[p] : 'var(--ios-label2)',
                    fontFamily:'var(--font)',fontSize:14,fontWeight:600,
                    cursor:'pointer',
                    border: priority===p ? `1.5px solid ${priorityColors[p]}55` : '1.5px solid transparent',
                    textTransform:'capitalize' as const,
                    transition:'all 0.2s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="ios-input-group">
            <div className="ios-input-label">Category</div>
            <select
              className="ios-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{colorScheme:'dark'}}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Recurrence */}
          <div className="ios-input-group">
            <div className="ios-input-label">Repeat</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {RECURRENCES.map(r => (
                <button
                  key={r}
                  onClick={() => setRecurrence(r)}
                  style={{
                    padding:'8px 14px',borderRadius:9999,border:'none',
                    background: recurrence===r ? 'var(--ios-indigo)' : 'var(--ios-bg3)',
                    color: recurrence===r ? '#FFF' : 'var(--ios-label2)',
                    fontFamily:'var(--font)',fontSize:13,fontWeight:500,
                    cursor:'pointer',textTransform:'capitalize',
                    transition:'all 0.2s ease',
                  }}
                >
                  {r === 'none' ? 'No repeat' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Mission link */}
          {missions.length > 0 && (
            <div className="ios-input-group">
              <div className="ios-input-label">Link to Mission</div>
              <select
                className="ios-select"
                value={missionId}
                onChange={e => setMissionId(e.target.value)}
                style={{colorScheme:'dark'}}
              >
                <option value="">No mission</option>
                {missions.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Delete */}
          {task && (
            <button
              onClick={handleDelete}
              className="ios-btn ios-btn-destructive ios-btn-full"
              style={{marginTop:8}}
            >
              Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
