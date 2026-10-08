import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, X, Mic } from 'lucide-react';
import { WidgetPayload } from '../types';
import { WidgetService } from '../services/widgetService';
import { TaskService } from '../services/taskService';
import { ProgressService } from '../services/progressService';
import { getTodayKey } from '../services/storageService';

interface AndroidWidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: 'today' | 'flow' | 'missions' | 'assistant') => void;
  onLaunchVoice: () => void;
}

export const AndroidWidgetsModal: React.FC<AndroidWidgetsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onLaunchVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'guide'>('simulator');
  const [payload, setPayload] = useState<WidgetPayload>(WidgetService.getPayload());

  useEffect(() => {
    if (isOpen) {
      setPayload(WidgetService.getPayload());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    const updated = WidgetService.refreshPayload();
    setPayload(updated);
  };

  // Compute live real-time progress values
  const allTasks = TaskService.getAll();
  const todayKey = getTodayKey();
  const todayTasks = allTasks.filter((t) => t.dueDate === todayKey);
  const targetTasks = todayTasks.length > 0 ? todayTasks : allTasks;
  const completedCount = targetTasks.filter((t) => t.status === 'completed').length;
  const totalCount = targetTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const stats = ProgressService.calculateStats();
  const streak = stats.taskCompletionStreak || 8;

  const flowItems = payload.activeFlowItems && payload.activeFlowItems.length > 0
    ? payload.activeFlowItems
    : [
        { time: '07:00', title: 'Wake Up & Morning Flow', status: 'upcoming' },
        { time: '13:00', title: 'Lunch & Recharge', status: 'upcoming' },
        { time: '22:00', title: 'Daily Productivity Review', status: 'upcoming' },
        { time: '23:00', title: 'Wind Down & Sleep', status: 'upcoming' },
      ];

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

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 20px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(52, 199, 89, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ios-green)',
              }}
            >
              <Smartphone size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.3px' }}>
                Home-Screen Widgets
              </h3>
              <p style={{ fontSize: 11, color: 'var(--ios-label2)', margin: '2px 0 0 0' }}>
                Real-Time System Widgets
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleRefresh}
              title="Refresh widget sync"
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
              }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
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
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Clean Segment Switcher */}
        <div style={{ padding: '12px 20px 6px' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(118, 118, 128, 0.24)',
              borderRadius: 10,
              padding: 3,
            }}
          >
            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'simulator' ? 'var(--ios-green)' : 'transparent',
                color: activeTab === 'simulator' ? '#FFF' : 'var(--ios-label2)',
                boxShadow: activeTab === 'simulator' ? '0 2px 8px rgba(52, 199, 89, 0.4)' : 'none',
              }}
            >
              Widgets
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'guide' ? 'var(--ios-blue)' : 'transparent',
                color: activeTab === 'guide' ? '#FFF' : 'var(--ios-label2)',
                boxShadow: activeTab === 'guide' ? '0 2px 8px rgba(10, 132, 255, 0.4)' : 'none',
              }}
            >
              How to Add
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'simulator' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1. LIFE FLOW WIDGET */}
              <div
                onClick={() => {
                  onClose();
                  onNavigateToTab('flow');
                }}
                style={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  borderRadius: 18,
                  padding: 14,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ios-indigo)', letterSpacing: '0.4px' }}>
                    Life Flow
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ios-green)', fontWeight: 600 }}>● Real-Time Sync</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {flowItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: '#2C2C2E',
                            color: '#64D2FF',
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {item.time}
                        </span>
                        <span style={{ fontSize: 13, color: '#FFF', fontWeight: 500 }}>
                          {item.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: item.status === 'completed' ? 'var(--ios-green)' : item.status === 'active' ? 'var(--ios-indigo)' : 'rgba(235, 235, 245, 0.4)',
                        }}
                      >
                        {item.status === 'completed' ? 'Done ✓' : item.status === 'active' ? 'NOW ⚡' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ios-indigo)', fontWeight: 600 }}>
                    Tap to open Life Flow ›
                  </span>
                </div>
              </div>

              {/* 2 & 3: GRID (Progress & Voice AI) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Progress Widget */}
                <div
                  onClick={() => {
                    onClose();
                    onNavigateToTab('today');
                  }}
                  style={{
                    background: '#1C1C1E',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    borderRadius: 18,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 120,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-blue)' }}>PROGRESS</span>
                    <span style={{ fontSize: 11, color: 'var(--ios-orange)', fontWeight: 700 }}>🔥 {streak}d</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>
                      {completedCount} / {totalCount}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ios-blue)', fontWeight: 600, marginTop: 2 }}>
                      {percentage}% Done
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Tap to view ›</span>
                </div>

                {/* Quick Voice AI Widget */}
                <div
                  onClick={() => {
                    onClose();
                    onNavigateToTab('assistant');
                    onLaunchVoice();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.18), rgba(94, 92, 230, 0.22))',
                    border: '1px solid rgba(10, 132, 255, 0.35)',
                    borderRadius: 18,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 120,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64D2FF' }}>VOICE AI</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--ios-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        boxShadow: '0 4px 14px rgba(10, 132, 255, 0.5)',
                      }}
                    >
                      <Mic size={18} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>Tap to Speak</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(235, 235, 245, 0.5)', textAlign: 'center' }}>
                    Instant assistant
                  </span>
                </div>
              </div>

              {/* 4. ACTIVE MISSION WIDGET */}
              <div
                onClick={() => {
                  onClose();
                  onNavigateToTab('missions');
                }}
                style={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  borderRadius: 18,
                  padding: 14,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ios-purple)' }}>Active Mission</span>
                  <span style={{ fontSize: 11, color: 'var(--ios-orange)', fontWeight: 700 }}>
                    {payload.activeMission ? `${payload.activeMission.daysRemaining} days left` : 'Sprint Active'}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>
                  {payload.activeMission?.title || 'DBMS Lab & Record'}
                </div>
                <div style={{ height: 6, background: '#2C2C2E', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${payload.activeMission?.progress || 80}%`,
                      background: 'var(--ios-purple)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--ios-purple)', fontWeight: 700 }}>
                    {payload.activeMission?.progress || 80}% Complete
                  </span>
                  <span style={{ color: 'var(--ios-label3)' }}>Tap to manage ›</span>
                </div>
              </div>
            </div>
          ) : (
            /* Clean Guide Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>
                  Add to Android Home Screen:
                </div>
                <ol style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--ios-label2)', lineHeight: 1.8 }}>
                  <li>Touch and hold an empty area on your <strong>Home Screen</strong>.</li>
                  <li>Tap <strong>Widgets</strong> in the menu.</li>
                  <li>Scroll and select <strong>LineUp</strong>.</li>
                  <li>Drag <strong>Life Flow</strong>, <strong>Progress</strong>, or <strong>Voice AI</strong> to your screen.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
