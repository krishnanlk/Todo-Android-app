import React, { useState } from 'react';
import { BarChart3, X, Pause, Play, Sparkles, CheckCircle2, Target } from 'lucide-react';
import { ReviewService } from '../services/reviewService';
import { VoiceAssistantService } from '../services/voiceAssistantService';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const weeklyReview = ReviewService.generateWeeklyReview();
  const monthlyReview = ReviewService.generateMonthlyReview();

  const currentReview = activeTab === 'weekly' ? weeklyReview : monthlyReview;
  const currentScript = currentReview.spokenScript;
  const completedList = currentReview.completedTasksList || [];

  const handleToggleSpeak = () => {
    if (isPlayingAudio) {
      VoiceAssistantService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      VoiceAssistantService.speak(
        currentScript,
        () => {
          setIsPlayingAudio(false);
        },
        true // Force speech activation on explicit user tap
      );
    }
  };

  const handleTabChange = (tab: 'weekly' | 'monthly') => {
    if (isPlayingAudio) {
      VoiceAssistantService.stopSpeaking();
      setIsPlayingAudio(false);
    }
    setActiveTab(tab);
  };

  const handleClose = () => {
    VoiceAssistantService.stopSpeaking();
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <div className="ios-sheet-backdrop" onClick={handleClose}>
      <div
        className="ios-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '28px',
        }}
      >
        <div className="ios-sheet-handle-bar" />

        {/* Modal Header */}
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
                background: 'rgba(10, 132, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ios-blue)',
              }}
            >
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.3px' }}>
                Productivity Analysis
              </h3>
              <p style={{ fontSize: 11, color: 'var(--ios-label2)', margin: '2px 0 0 0' }}>
                Performance Digest
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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

        {/* Segmented Switcher */}
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
              onClick={() => handleTabChange('weekly')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'weekly' ? 'var(--ios-blue)' : 'transparent',
                color: activeTab === 'weekly' ? '#FFF' : 'var(--ios-label2)',
                boxShadow: activeTab === 'weekly' ? '0 2px 8px rgba(10, 132, 255, 0.4)' : 'none',
              }}
            >
              Weekly
            </button>
            <button
              onClick={() => handleTabChange('monthly')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'monthly' ? 'var(--ios-purple)' : 'transparent',
                color: activeTab === 'monthly' ? '#FFF' : 'var(--ios-label2)',
                boxShadow: activeTab === 'monthly' ? '0 2px 8px rgba(175, 82, 222, 0.4)' : 'none',
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Audio Player Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.18), rgba(94, 92, 230, 0.20))',
              border: isPlayingAudio ? '1.5px solid var(--ios-blue)' : '1px solid rgba(10, 132, 255, 0.35)',
              borderRadius: 16,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isPlayingAudio ? '0 4px 20px rgba(10, 132, 255, 0.35)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleToggleSpeak}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isPlayingAudio ? 'var(--ios-indigo)' : 'var(--ios-blue)',
                  border: 'none',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(10, 132, 255, 0.5)',
                  flexShrink: 0,
                  transition: 'background 0.2s ease',
                }}
              >
                {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
              </button>
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#FFF',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  AI Voice Briefing <Sparkles size={14} color="#60A5FA" />
                </p>
                <p style={{ fontSize: 11, color: 'var(--ios-label2)', margin: '2px 0 0 0' }}>
                  {isPlayingAudio ? 'Speaking digest aloud... Tap to stop' : 'Tap to listen to summary'}
                </p>
              </div>
            </div>

            {isPlayingAudio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 3, height: 14, background: 'var(--ios-blue)', borderRadius: 2 }} />
                <span style={{ width: 3, height: 22, background: 'var(--ios-indigo)', borderRadius: 2 }} />
                <span style={{ width: 3, height: 16, background: 'var(--ios-purple)', borderRadius: 2 }} />
              </div>
            )}
          </div>

          {/* Script Quote Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '12px 14px',
            }}
          >
            <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--ios-label)', lineHeight: 1.5, margin: 0 }}>
              "{currentScript}"
            </p>
          </div>

          {/* 3-Column Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: 'var(--ios-label3)' }}>
                Completed
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', marginTop: 3 }}>
                {currentReview.tasksCompleted} / {currentReview.tasksPlanned}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-green)', marginTop: 2 }}>
                {currentReview.completionRate}% rate
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: 'var(--ios-label3)' }}>
                Consistency
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ios-indigo)', marginTop: 3 }}>
                {currentReview.routineConsistency}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--ios-label2)', marginTop: 2 }}>
                Routines
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: 'var(--ios-label3)' }}>
                Missions
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ios-purple)', marginTop: 3 }}>
                {activeTab === 'weekly' ? weeklyReview.missionMilestonesCompleted : monthlyReview.missionsCompleted}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ios-label2)', marginTop: 2 }}>
                Done
              </div>
            </div>
          </div>

          {/* List of Tasks Completed */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ios-label2)' }}>
                Completed Tasks ({completedList.length})
              </div>
              <span style={{ fontSize: 11, color: 'var(--ios-blue)', fontWeight: 600 }}>
                {activeTab === 'weekly' ? 'Past 7 Days' : monthlyReview.monthName}
              </span>
            </div>

            {completedList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--ios-label3)', fontSize: 12 }}>
                No tasks completed in this period.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {completedList.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <CheckCircle2 size={16} color="var(--ios-green)" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 13,
                          color: '#FFF',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.title}
                      </span>
                    </div>
                    {t.category && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: 'rgba(10, 132, 255, 0.15)',
                          color: 'var(--ios-blue)',
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {t.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ios-label3)' }}>
              Insights
            </div>
            {weeklyReview.topStrengths.slice(0, 2).map((str, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ios-label2)' }}>
                <CheckCircle2 size={14} color="var(--ios-green)" style={{ flexShrink: 0 }} />
                <span>{str}</span>
              </div>
            ))}
            {weeklyReview.areasToImprove.slice(0, 1).map((area, i) => (
              <div key={`imp-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ios-label2)' }}>
                <Target size={14} color="var(--ios-orange)" style={{ flexShrink: 0 }} />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
