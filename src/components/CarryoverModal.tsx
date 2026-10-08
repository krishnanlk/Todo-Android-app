import React, { useState } from 'react';
import { Calendar, X, CheckSquare, Square, ArrowRight, Archive, Sparkles, Clock } from 'lucide-react';
import { TaskService } from '../services/taskService';
import { WidgetService } from '../services/widgetService';

interface CarryoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessed: () => void;
}

export const CarryoverModal: React.FC<CarryoverModalProps> = ({
  isOpen,
  onClose,
  onProcessed,
}) => {
  const overdueTasks = TaskService.getMissedOrOverdueTasks();
  const [selectedIds, setSelectedIds] = useState<string[]>(overdueTasks.map((t) => t.id));

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === overdueTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(overdueTasks.map((t) => t.id));
    }
  };

  const handleMoveSelected = () => {
    TaskService.carryOverToTomorrow(selectedIds);
    WidgetService.refreshPayload();
    onProcessed();
    onClose();
  };

  const handleMoveAll = () => {
    TaskService.carryOverToTomorrow();
    WidgetService.refreshPayload();
    onProcessed();
    onClose();
  };

  const handleArchiveIncomplete = () => {
    for (const id of selectedIds) {
      TaskService.update(id, { status: 'archived' });
    }
    WidgetService.refreshPayload();
    onProcessed();
    onClose();
  };

  return (
    <div className="ios-sheet-backdrop" onClick={onClose}>
      <div
        className="ios-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 24,
        }}
      >
        <div className="ios-sheet-handle-bar" />

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 20px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 159, 10, 0.16)',
                border: '1px solid rgba(255, 159, 10, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ios-orange)',
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--ios-label)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}
              >
                Smart Task Carryover
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ios-label2)', marginTop: 2 }}>
                {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} overdue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--ios-fill3)',
              border: 'none',
              color: 'var(--ios-label2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: '16px 20px 8px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Informational Callout */}
          <div
            style={{
              background: 'rgba(255, 159, 10, 0.10)',
              border: '1px solid rgba(255, 159, 10, 0.22)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <Sparkles size={16} style={{ color: 'var(--ios-orange)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-orange)', marginBottom: 2 }}>
                {overdueTasks.length} unfinished task{overdueTasks.length > 1 ? 's' : ''} detected
              </div>
              <div style={{ fontSize: 12, color: 'var(--ios-label2)', lineHeight: 1.4 }}>
                Select which tasks you want to reschedule for tomorrow or archive without penalty to protect your streak.
              </div>
            </div>
          </div>

          {/* Quick Selection Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 4px',
            }}
          >
            <button
              onClick={toggleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ios-blue)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {selectedIds.length === overdueTasks.length ? 'Deselect All' : 'Select All'}
            </button>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ios-label3)',
                background: 'var(--ios-fill3)',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              {selectedIds.length} of {overdueTasks.length} selected
            </span>
          </div>

          {/* Task List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 220,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {overdueTasks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: 'var(--ios-label3)',
                  fontSize: 13,
                }}
              >
                No overdue tasks to process.
              </div>
            ) : (
              overdueTasks.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleSelect(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: isSelected ? 'rgba(255, 159, 10, 0.08)' : 'var(--ios-bg3)',
                      border: isSelected
                        ? '1px solid rgba(255, 159, 10, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ color: isSelected ? 'var(--ios-orange)' : 'var(--ios-label3)', flexShrink: 0 }}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isSelected ? '#FFFFFF' : 'var(--ios-label)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          {t.category && (
                            <span
                              style={{
                                fontSize: 10,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                                color: 'var(--ios-label3)',
                                background: 'var(--ios-fill3)',
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                            >
                              {t.category}
                            </span>
                          )}
                          {t.priority === 'high' && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--ios-red)',
                                background: 'rgba(255, 69, 58, 0.15)',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              High
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: 'var(--ios-orange)',
                        background: 'rgba(255, 159, 10, 0.12)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        flexShrink: 0,
                        fontWeight: 500,
                      }}
                    >
                      <Clock size={11} />
                      Due {t.dueDate}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleMoveSelected}
              disabled={selectedIds.length === 0}
              className="ios-btn ios-btn-amber"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15,
                borderRadius: 14,
              }}
            >
              Move {selectedIds.length} Selected to Tomorrow
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={handleMoveAll}
                className="ios-btn ios-btn-secondary"
                style={{
                  padding: '11px',
                  fontSize: 13,
                  borderRadius: 12,
                }}
              >
                Move All
              </button>
              <button
                onClick={handleArchiveIncomplete}
                disabled={selectedIds.length === 0}
                className="ios-btn ios-btn-danger"
                style={{
                  padding: '11px',
                  fontSize: 13,
                  borderRadius: 12,
                }}
              >
                <Archive size={14} />
                Archive Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
