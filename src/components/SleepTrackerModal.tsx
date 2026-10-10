import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Moon, Sun, Trash2, Calendar } from 'lucide-react';
import { SleepQuality } from '../types';
import { SleepService, QUALITY_META } from '../services/sleepService';
import { StorageService, getTodayKey } from '../services/storageService';

interface SleepTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const TARGET_PRESETS = [6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export const SleepTrackerModal: React.FC<SleepTrackerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const todayKey = getTodayKey();
  const settings = StorageService.getSettings();

  const [date, setDate] = useState(todayKey);
  const [bedTime, setBedTime] = useState(settings.sleepBedtime || '23:00');
  const [wakeTime, setWakeTime] = useState(settings.sleepWakeTime || '07:00');
  const [quality, setQuality] = useState<SleepQuality>('good');
  const [notes, setNotes] = useState('');
  const [targetHours, setTargetHours] = useState(settings.targetSleepHours || 8.0);
  const [saving, setSaving] = useState(false);

  const loadDateLog = useCallback((targetDate: string) => {
    const existing = SleepService.getByDate(targetDate);
    if (existing) {
      setBedTime(existing.bedTime);
      setWakeTime(existing.wakeTime);
      setQuality(existing.quality);
      setNotes(existing.notes || '');
      setTargetHours(existing.targetHours || 8.0);
    } else {
      const s = StorageService.getSettings();
      setBedTime(s.sleepBedtime || '23:00');
      setWakeTime(s.sleepWakeTime || '07:00');
      setQuality('good');
      setNotes('');
    }
  }, []);

  // Load existing log for the selected date on open or date change
  useEffect(() => {
    if (isOpen) {
      const s = StorageService.getSettings();
      setTargetHours(s.targetSleepHours || 8.0);
      loadDateLog(date);
    }
  }, [isOpen, date, loadDateLog]);

  const calculatedMinutes = useMemo(() => {
    return SleepService.calculateDurationMinutes(bedTime, wakeTime);
  }, [bedTime, wakeTime]);

  const calculatedHours = (calculatedMinutes / 60).toFixed(1);
  const targetMinutes = targetHours * 60;
  const diffMinutes = calculatedMinutes - targetMinutes;
  const isGoalMet = calculatedMinutes >= targetMinutes - 15;

  // 7-day stats computed strictly from local data, with live preview for current input
  const stats = useMemo(() => {
    return SleepService.getRecentStats(7, {
      date,
      durationMinutes: calculatedMinutes,
      quality,
      targetHours,
    });
  }, [date, calculatedMinutes, quality, targetHours, saving, isOpen]);

  if (!isOpen) return null;

  const handleSetCurrentBedtime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setBedTime(`${h}:${m}`);
  };

  const handleSetCurrentWakeTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setWakeTime(`${h}:${m}`);
  };

  const handleTargetChange = (val: number) => {
    setTargetHours(val);
    const curr = StorageService.getSettings();
    StorageService.saveSettings({ ...curr, targetSleepHours: val });
  };

  const handleSave = () => {
    setSaving(true);
    SleepService.saveLog({
      date,
      bedTime,
      wakeTime,
      quality,
      targetHours,
      notes,
    });

    if (isGoalMet) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#30D158', '#0A84FF', '#5E5CE6', '#BF5AF2'],
      });
    }

    setTimeout(() => {
      setSaving(false);
      onSaved();
      onClose();
    }, 200);
  };

  const handleDelete = () => {
    const existing = SleepService.getByDate(date);
    if (existing && window.confirm('Delete sleep record for this date?')) {
      SleepService.deleteLog(existing.id);
      loadDateLog(date);
      onSaved();
    }
  };

  return (
    <div className="ios-sheet-backdrop" onClick={onClose}>
      <div
        className="ios-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92vh' }}
      >
        <div className="ios-sheet-handle-bar" />

        {/* Header */}
        <div className="ios-sheet-header">
          <button
            onClick={onClose}
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: 'var(--ios-blue)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            Cancel
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>🌙</span>
            <span className="ios-sheet-title">Sleep & Recovery</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--ios-blue)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>

        <div className="ios-sheet-scroll" style={{ paddingBottom: 36 }}>
          {/* Main Duration Hero Card */}
          <div
            style={{
              borderRadius: 20,
              padding: '18px 20px',
              background: 'linear-gradient(135deg, rgba(94,92,230,0.2) 0%, rgba(10,132,255,0.12) 100%)',
              border: '1px solid rgba(94,92,230,0.3)',
              marginBottom: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Calculated Rest Duration
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px' }}>
                    {SleepService.formatDuration(calculatedMinutes)}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ios-label2)' }}>
                    ({calculatedHours}h)
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isGoalMet ? 'rgba(48,209,88,0.2)' : 'rgba(255,159,10,0.2)',
                  color: isGoalMet ? '#30D158' : '#FF9F0A',
                  border: `1px solid ${isGoalMet ? 'rgba(48,209,88,0.35)' : 'rgba(255,159,10,0.35)'}`,
                }}
              >
                <span>{isGoalMet ? '✨ Target Met' : '⚠️ Deficit'}</span>
              </div>
            </div>

            {/* Progress bar towards goal */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  height: 7,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((calculatedMinutes / targetMinutes) * 100))}%`,
                    background: isGoalMet
                      ? 'linear-gradient(90deg, #0A84FF, #30D158)'
                      : 'linear-gradient(90deg, #FF9F0A, #FF453A)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--ios-label2)' }}>
                <span>
                  {diffMinutes >= 0
                    ? `+${SleepService.formatDuration(diffMinutes)} surplus`
                    : `-${SleepService.formatDuration(Math.abs(diffMinutes))} needed`}
                </span>
                <span>Goal: {targetHours} hrs</span>
              </div>
            </div>
          </div>

          {/* Time Selectors: Bedtime & Wake up */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Bedtime Card */}
            <div
              style={{
                background: 'var(--ios-card-bg)',
                borderRadius: 16,
                padding: '14px',
                border: '1px solid var(--ios-separator)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#5E5CE6' }}>
                  <Moon size={15} />
                  <span>Bedtime</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetCurrentBedtime}
                  style={{
                    background: 'rgba(94,92,230,0.15)',
                    border: 'none',
                    color: '#5E5CE6',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Now
                </button>
              </div>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--ios-label)',
                  background: 'var(--ios-fill3)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 10px',
                  textAlign: 'center',
                  fontFamily: 'var(--font)',
                }}
              />
            </div>

            {/* Wake Up Card */}
            <div
              style={{
                background: 'var(--ios-card-bg)',
                borderRadius: 16,
                padding: '14px',
                border: '1px solid var(--ios-separator)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#FF9F0A' }}>
                  <Sun size={15} />
                  <span>Wake Up</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetCurrentWakeTime}
                  style={{
                    background: 'rgba(255,159,10,0.15)',
                    border: 'none',
                    color: '#FF9F0A',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Now
                </button>
              </div>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--ios-label)',
                  background: 'var(--ios-fill3)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 10px',
                  textAlign: 'center',
                  fontFamily: 'var(--font)',
                }}
              />
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="ios-input-group" style={{ marginBottom: 16 }}>
            <div className="ios-input-label">How Did You Feel?</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {(Object.keys(QUALITY_META) as SleepQuality[]).map((q) => {
                const meta = QUALITY_META[q];
                const active = quality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px 6px',
                      borderRadius: 14,
                      background: active ? `${meta.color}22` : 'var(--ios-fill3)',
                      border: active ? `2px solid ${meta.color}` : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 24, marginBottom: 4 }}>{meta.emoji}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        color: active ? meta.color : 'var(--ios-label2)',
                      }}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 6, textAlign: 'center' }}>
              {QUALITY_META[quality].desc}
            </div>
          </div>

          {/* Target Sleep Duration Selector */}
          <div className="ios-input-group" style={{ marginBottom: 16 }}>
            <div className="ios-input-label">Nightly Sleep Target</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TARGET_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTargetChange(t)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: targetHours === t ? 'var(--ios-indigo)' : 'var(--ios-fill3)',
                    color: targetHours === t ? '#FFF' : 'var(--ios-label)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t}h
                </button>
              ))}
            </div>
          </div>

          {/* Optional Reflection Notes */}
          <div className="ios-input-group" style={{ marginBottom: 20 }}>
            <div className="ios-input-label">Sleep Notes (Optional)</div>
            <input
              className="ios-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. No screens 30m before bed, read a book"
            />
          </div>

          {/* 7-Day History Chart */}
          <div
            style={{
              background: 'var(--ios-card-bg)',
              borderRadius: 20,
              padding: '16px',
              border: '1px solid var(--ios-separator)',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--ios-label)' }}>
                <Calendar size={16} color="var(--ios-indigo)" />
                <span>7-Day Sleep Trend</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ios-label2)' }}>Target: {targetHours}h</span>
            </div>

            {/* Vertical Bar Chart */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: 110,
                padding: '0 8px 6px',
                borderBottom: '1px solid var(--ios-separator)',
                position: 'relative',
              }}
            >
              {/* Target guideline */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${Math.min(95, (targetHours / 10) * 100)}%`,
                  borderTop: '1px dashed rgba(94,92,230,0.6)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />

              {stats.days.map((day) => {
                const hours = day.durationMinutes > 0 ? day.durationMinutes / 60 : 0;
                const barHeightPct = Math.min(100, Math.max(14, (hours / 10) * 100));
                const hasLog = (!!day.log && day.durationMinutes > 0) || (day.isLive && day.durationMinutes > 0);
                const isSelected = day.dateKey === date;

                return (
                  <div
                    key={day.dateKey}
                    onClick={() => {
                      setDate(day.dateKey);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: 'pointer',
                      zIndex: 2,
                      flex: 1,
                    }}
                  >
                    {/* Hours label on top if logged */}
                    {hasLog ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isSelected ? 'var(--ios-indigo)' : 'var(--ios-label2)',
                          marginBottom: 2,
                        }}
                      >
                        {hours.toFixed(1)}h
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--ios-label3)',
                          marginBottom: 2,
                          opacity: 0.5,
                        }}
                      >
                        —
                      </span>
                    )}

                    <div
                      style={{
                        width: 24,
                        height: hasLog ? `${barHeightPct}%` : '6px',
                        borderRadius: hasLog ? '6px 6px 3px 3px' : '3px',
                        background: hasLog
                          ? day.metTarget
                            ? 'linear-gradient(180deg, #30D158 0%, #0A84FF 100%)'
                            : 'linear-gradient(180deg, #FF9F0A 0%, #FF453A 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        outline: isSelected ? '2px solid var(--ios-indigo)' : 'none',
                        outlineOffset: '2px',
                        boxShadow: isSelected && hasLog ? '0 0 10px rgba(94,92,230,0.5)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                      title={hasLog ? `${day.dateKey}: ${hours.toFixed(1)} hrs` : `${day.dateKey}: No data`}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: day.isToday || isSelected ? 700 : 500,
                        color: isSelected
                          ? 'var(--ios-indigo)'
                          : day.isToday
                          ? 'var(--ios-blue)'
                          : hasLog
                          ? 'var(--ios-label2)'
                          : 'var(--ios-label3)',
                        marginTop: 4,
                      }}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected day breakdown preview if not today */}
            {date !== todayKey ? (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'var(--ios-label2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Editing log for: <b>{date}</b></span>
                <button
                  type="button"
                  onClick={() => setDate(todayKey)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ios-blue)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Switch to Today
                </button>
              </div>
            ) : stats.loggedDaysCount === 0 ? (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'var(--ios-label3)',
                  textAlign: 'center',
                }}
              >
                No sleep cycles saved yet. Enter today's bedtime & wake up above and tap <b>Save</b>.
              </div>
            ) : null}
          </div>

          {/* 3 Metric Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: 'var(--ios-card-bg)',
                borderRadius: 14,
                padding: '12px 10px',
                textAlign: 'center',
                border: '1px solid var(--ios-separator)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase' }}>
                7D Average
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ios-label)', marginTop: 4 }}>
                {stats.loggedDaysCount > 0 ? `${stats.avgHours}h` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ios-label2)', marginTop: 2 }}>
                {stats.loggedDaysCount}/7 logged
              </div>
            </div>

            <div
              style={{
                background: 'var(--ios-card-bg)',
                borderRadius: 14,
                padding: '12px 10px',
                textAlign: 'center',
                border: '1px solid var(--ios-separator)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase' }}>
                Consistency
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: stats.loggedDaysCount > 0
                    ? stats.consistencyRate >= 70
                      ? '#30D158'
                      : '#FF9F0A'
                    : 'var(--ios-label3)',
                  marginTop: 4,
                }}
              >
                {stats.loggedDaysCount > 0 ? `${stats.consistencyRate}%` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ios-label2)', marginTop: 2 }}>
                {stats.loggedDaysCount > 0 ? `${stats.daysMetGoal} of ${stats.loggedDaysCount} met` : 'No logs yet'}
              </div>
            </div>

            <div
              style={{
                background: 'var(--ios-card-bg)',
                borderRadius: 14,
                padding: '12px 10px',
                textAlign: 'center',
                border: '1px solid var(--ios-separator)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase' }}>
                Sleep Debt
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: stats.loggedDaysCount > 0
                    ? stats.debtHours >= 0
                      ? '#30D158'
                      : '#FF453A'
                    : 'var(--ios-label3)',
                  marginTop: 4,
                }}
              >
                {stats.loggedDaysCount > 0
                  ? `${stats.debtHours >= 0 ? '+' : ''}${stats.debtHours}h`
                  : '0.0h'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ios-label2)', marginTop: 2 }}>
                vs {targetHours}h goal
              </div>
            </div>
          </div>

          {/* Delete entry button if exists */}
          {SleepService.getByDate(date) && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ios-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
              >
                <Trash2 size={15} />
                <span>Delete This Record</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
