import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { RoutineService } from '../services/routineService';
import { MissionService } from '../services/missionService';
import { WidgetService } from '../services/widgetService';
import { APP_CONFIG } from '../config/appConfig';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [selectedRoutines, setSelectedRoutines] = useState<string[]>([
    'Morning routine',
    'College / Deep Study',
    'Project work',
    'Exercise',
  ]);
  const [missionName, setMissionName] = useState('AI Project');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [weeklyReviews, setWeeklyReviews] = useState(true);

  if (!isOpen) return null;

  const toggleRoutine = (title: string) => {
    if (selectedRoutines.includes(title)) {
      setSelectedRoutines(selectedRoutines.filter((r) => r !== title));
    } else {
      setSelectedRoutines([...selectedRoutines, title]);
    }
  };

  const handleFinish = () => {
    // Save settings
    const settings = StorageService.getSettings();
    StorageService.saveSettings({
      ...settings,
      onboardingCompleted: true,
      voiceEnabled,
      weeklyReviewNotification: weeklyReviews,
    });

    // Update wake and sleep routine times
    const routines = RoutineService.getAll();
    const wakeRout = routines.find((r) => r.id === 'routine-wakeup');
    if (wakeRout) {
      RoutineService.update(wakeRout.id, { time: wakeTime });
    }
    const sleepRout = routines.find((r) => r.id === 'routine-sleep');
    if (sleepRout) {
      RoutineService.update(sleepRout.id, { time: sleepTime });
    }

    // Create starting mission if specified
    if (missionName.trim()) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const deadline = nextWeek.toISOString().split('T')[0];

      MissionService.create({
        title: missionName.trim(),
        description: 'Primary milestone goal created during initial setup.',
        startDate: today.toISOString().split('T')[0],
        deadline,
        priority: 'high',
        category: 'development',
        subtasks: [
          { id: 'st-1', title: 'System setup and dependencies', completed: true, order: 0 },
          { id: 'st-2', title: 'Feature planning and draft', completed: false, order: 1 },
          { id: 'st-3', title: 'Implementation and validation', completed: false, order: 2 },
        ],
      });
    }

    WidgetService.refreshPayload();
    onComplete();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#1C1C1E',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '28px',
          padding: '24px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          fontFamily: 'var(--font)',
        }}
      >
        {/* Header with step indicator and skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--ios-blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              backgroundColor: 'rgba(10, 132, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '12px',
            }}
          >
            Step {step} of 3
          </div>
          <button
            onClick={handleFinish}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Skip setup
          </button>
        </div>

        {/* Step 1: Flow Timeline */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <img
                  src="/app-logo.png"
                  alt="LineUp"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                    objectFit: 'contain',
                  }}
                />
                <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.4px', margin: 0 }}>
                  Welcome to {APP_CONFIG.name}
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)', margin: '4px 0 0' }}>
                Let's customize your daily Life Flow schedule.
              </p>
            </div>

            {/* Wake & Sleep Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--ios-orange)' }}>
                  <span>☀️</span> Wake Up
                </div>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  style={{
                    backgroundColor: '#1C1C1E',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '6px 8px',
                    color: '#FFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--ios-indigo)' }}>
                  <span>🌙</span> Sleep
                </div>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  style={{
                    backgroundColor: '#1C1C1E',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '6px 8px',
                    color: '#FFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Daily Blocks Toggle List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(235, 235, 245, 0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Daily Flow Blocks:
              </label>
              {[
                'Morning routine',
                'College / Deep Study',
                'Project work',
                'Exercise',
                'Daily review',
              ].map((rout) => {
                const isSelected = selectedRoutines.includes(rout);
                return (
                  <button
                    key={rout}
                    type="button"
                    onClick={() => toggleRoutine(rout)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      backgroundColor: isSelected ? 'rgba(10, 132, 255, 0.18)' : '#2C2C2E',
                      border: isSelected ? '1px solid var(--ios-blue)' : '1px solid transparent',
                      color: isSelected ? '#FFFFFF' : 'rgba(235, 235, 245, 0.7)',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{rout}</span>
                    <span style={{ fontSize: '14px', color: isSelected ? 'var(--ios-blue)' : 'transparent' }}>✓</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: 'var(--ios-blue)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(10, 132, 255, 0.4)',
                marginTop: '4px',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Missions */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.4px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span> Active Missions
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)', margin: '4px 0 0' }}>
                Missions track short-term project outcomes and key deadlines.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(235, 235, 245, 0.8)' }}>
                Your primary short-term project or goal:
              </label>
              <input
                type="text"
                placeholder="e.g. AI Project or DBMS Lab"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#2C2C2E',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: 'rgba(191, 90, 242, 0.12)',
                border: '1px solid rgba(191, 90, 242, 0.3)',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ios-purple)' }}>
                💡 Why Missions Matter
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(235, 235, 245, 0.7)', lineHeight: 1.4 }}>
                Unlike simple checklists, missions calculate completion velocity, countdown deadlines, and report progress spoken directly to you.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: '#2C2C2E',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--ios-purple)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(191, 90, 242, 0.4)',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Voice & Reviews */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.4px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎙️</span> Voice & Reviews
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)', margin: '4px 0 0' }}>
                Configure spoken feedback and productivity reviews.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#2C2C2E',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Conversational Voice Assistant</div>
                  <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)' }}>Natural spoken answers & updates</div>
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: voiceEnabled ? 'var(--ios-green)' : '#3A3A3C',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '2px',
                      left: voiceEnabled ? '20px' : '2px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>

              <div
                onClick={() => setWeeklyReviews(!weeklyReviews)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#2C2C2E',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Spoken Progress Reviews</div>
                  <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)' }}>Weekly & monthly productivity digests</div>
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: weeklyReviews ? 'var(--ios-green)' : '#3A3A3C',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '2px',
                      left: weeklyReviews ? '20px' : '2px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 50%, #BF5AF2 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(94, 92, 230, 0.5)',
                marginTop: '6px',
              }}
            >
              Generate My Flow & Launch {APP_CONFIG.name} 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
