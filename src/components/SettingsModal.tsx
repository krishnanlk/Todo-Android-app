import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { APP_CONFIG } from '../config/appConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged: () => void;
}

function SettingRow({ label, subtitle, right }: {
  label: string; subtitle?: string; right: React.ReactNode;
}) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'13px 16px', borderBottom:'0.5px solid var(--ios-separator)'}}>
      <div>
        <div style={{fontSize:16,fontWeight:400,color:'var(--ios-label)'}}>{label}</div>
        {subtitle && <div style={{fontSize:12,color:'var(--ios-label3)',marginTop:2}}>{subtitle}</div>}
      </div>
      <div style={{flexShrink:0,marginLeft:12}}>{right}</div>
    </div>
  );
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <div className={`ios-toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)} />
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsChanged }) => {
  const [settings,        setSettings]       = useState<UserSettings>(StorageService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [exportNotice,    setExportNotice]    = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(StorageService.getSettings());
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const save = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    StorageService.saveSettings(updated);
    onSettingsChanged();
  };

  const handleExport = () => {
    const json = StorageService.exportDataJson();
    const blob = new Blob([json], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `lineup_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (StorageService.importDataJson(ev.target?.result as string)) {
        onSettingsChanged();
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset to sample productivity data?')) {
      StorageService.resetToDemo();
      onSettingsChanged();
      onClose();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all tasks, routines, and app data? This cannot be undone.')) {
      StorageService.clearAllData();
      onSettingsChanged();
      onClose();
    }
  };

  const handleTestVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Voice test successful. Your settings are active.');
      utterance.rate = settings.voiceSpeed || 1.0;
      utterance.pitch = settings.voicePitch || 1.0;
      utterance.lang = 'en-US';
      if (settings.selectedVoice && availableVoices.length > 0) {
        const v = availableVoices.find((x) => x.name === settings.selectedVoice);
        if (v) utterance.voice = v;
      }
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 50);
    }
  };

  return (
    <div className="ios-sheet-backdrop" onClick={onClose}>
      <div className="ios-sheet" onClick={e => e.stopPropagation()}>
        <div className="ios-sheet-handle-bar" />

        <div className="ios-sheet-header">
          <div style={{width:60}} />
          <span className="ios-sheet-title">Settings</span>
          <button onClick={onClose}
            style={{fontSize:17,fontWeight:600,color:'var(--ios-blue)',
              background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)'}}>
            Done
          </button>
        </div>

        <div className="ios-sheet-scroll">
          {/* Profile */}
          <div className="ios-input-group">
            <div className="ios-input-label">Your Name</div>
            <input className="ios-input"
              placeholder="Enter your name"
              value={settings.userName || ''}
              onChange={e => save('userName', e.target.value)} />
          </div>

          {/* Appearance */}
          <div style={{marginBottom:24}}>
            <div className="ios-section-header" style={{padding:'0 4px',marginBottom:8}}>
              Appearance
            </div>
            <div className="ios-grouped-card">
              {(['dark','light','system'] as const).map(mode => (
                <div key={mode} className="ios-row"
                  onClick={() => save('appearance', mode)}
                  style={{cursor:'pointer'}}>
                  <span style={{flex:1,fontSize:16,fontWeight:400,color:'var(--ios-label)',textTransform:'capitalize'}}>
                    {mode === 'system' ? 'System Default' : `${mode.charAt(0).toUpperCase()+mode.slice(1)} Mode`}
                  </span>
                  {settings.appearance === mode && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 9L7.5 12.5L14 6" stroke="var(--ios-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div style={{marginBottom:24}}>
            <div className="ios-section-header" style={{padding:'0 4px',marginBottom:8}}>
              Voice Assistant
            </div>
            <div className="ios-grouped-card">
              <SettingRow label="Voice Responses" subtitle="Speak answers aloud"
                right={<Toggle checked={settings.voiceEnabled} onChange={v => save('voiceEnabled', v)} />} />

              <SettingRow label="Auto-speak Replies"
                right={<Toggle checked={settings.voiceAutoSpeak} onChange={v => save('voiceAutoSpeak', v)} />} />
            </div>

            {/* Sliders */}
            <div style={{padding:'12px 4px 0',display:'flex',flexDirection:'column',gap:16}}>
              {[
                { label:'Speech Rate', key:'voiceSpeed', min:0.75, max:1.5, step:0.05,
                  val:settings.voiceSpeed, fmt:(v:number)=>`${v}×` },
                { label:'Voice Pitch', key:'voicePitch', min:0.8, max:1.3, step:0.05,
                  val:settings.voicePitch, fmt:(v:number)=>`${v}×` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:14,fontWeight:500,color:'var(--ios-label)'}}>{s.label}</span>
                    <span style={{fontSize:14,color:'var(--ios-blue)',fontVariantNumeric:'tabular-nums'}}>{s.fmt(s.val)}</span>
                  </div>
                  <input type="range"
                    min={s.min} max={s.max} step={s.step}
                    value={s.val}
                    onChange={e => save(s.key as keyof UserSettings, parseFloat(e.target.value) as any)}
                    style={{width:'100%',accentColor:'var(--ios-blue)'}} />
                </div>
              ))}
            </div>

            <div style={{marginTop:16, display:'flex', alignItems:'flex-end', gap:10}}>
              <div style={{flex: 1}}>
                <div className="ios-input-label">Voice Accent</div>
                <select className="ios-select"
                  value={settings.selectedVoice}
                  onChange={e => save('selectedVoice', e.target.value)}
                  style={{colorScheme:'dark'}}>
                  <option value="">System Default</option>
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleTestVoice}
                style={{
                  background: 'var(--ios-fill3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--ios-blue)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '13px 14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Test Voice
              </button>
            </div>
          </div>

          {/* Sleep & Recovery */}
          <div style={{marginBottom:24}}>
            <div className="ios-section-header" style={{padding:'0 4px',marginBottom:8}}>
              Sleep & Recovery Goal
            </div>
            <div className="ios-grouped-card">
              <SettingRow
                label="Target Sleep Duration"
                subtitle="Ideal sleep goal per night"
                right={
                  <div style={{display:'flex',gap:6}}>
                    {[7.0, 7.5, 8.0, 8.5].map(hrs => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => save('targetSleepHours', hrs)}
                        style={{
                          padding:'4px 8px', borderRadius:8,
                          fontSize:12, fontWeight:600,
                          background: (settings.targetSleepHours || 8.0) === hrs ? 'var(--ios-indigo)' : 'var(--ios-fill3)',
                          color: (settings.targetSleepHours || 8.0) === hrs ? '#FFF' : 'var(--ios-label)',
                          border:'none', cursor:'pointer',
                        }}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                }
              />
              <SettingRow
                label="Default Bedtime"
                subtitle="Target hour to sleep"
                right={
                  <input
                    type="time"
                    value={settings.sleepBedtime || '23:00'}
                    onChange={e => save('sleepBedtime', e.target.value)}
                    style={{
                      background:'var(--ios-fill3)', border:'none',
                      borderRadius:8, padding:'4px 8px',
                      color:'var(--ios-label)', fontSize:14, fontWeight:600,
                      fontFamily:'var(--font)',
                    }}
                  />
                }
              />
              <SettingRow
                label="Default Wake Up"
                subtitle="Target morning alarm"
                right={
                  <input
                    type="time"
                    value={settings.sleepWakeTime || '07:00'}
                    onChange={e => save('sleepWakeTime', e.target.value)}
                    style={{
                      background:'var(--ios-fill3)', border:'none',
                      borderRadius:8, padding:'4px 8px',
                      color:'var(--ios-label)', fontSize:14, fontWeight:600,
                      fontFamily:'var(--font)',
                    }}
                  />
                }
              />
            </div>
          </div>

          {/* Notifications */}
          <div style={{marginBottom:24}}>
            <div className="ios-section-header" style={{padding:'0 4px',marginBottom:8}}>
              Reviews & Notifications
            </div>
            <div className="ios-grouped-card">
              <SettingRow label="Daily Tasks Due Alerts"
                subtitle="Smart & witty reminders for tasks due today"
                right={<Toggle checked={settings.dailyReviewNotification}
                  onChange={v => save('dailyReviewNotification', v)} />} />
              <SettingRow label="Weekly Summaries"
                right={<Toggle checked={settings.weeklyReviewNotification}
                  onChange={v => save('weeklyReviewNotification', v)} />} />
              <div
                className="ios-row"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  NotificationService.requestPermission();
                  NotificationService.checkAndTriggerDailyAlert(true);
                }}
              >
                <span style={{ flex: 1, fontSize: 15, color: 'var(--ios-blue)' }}>🔔 Test Witty Notification</span>
                <span style={{ fontSize: 13, color: 'var(--ios-label3)' }}>Send now ›</span>
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div style={{marginBottom:24}}>
            <div className="ios-section-header" style={{padding:'0 4px',marginBottom:8}}>
              Data & Storage
            </div>
            <div className="ios-grouped-card">
              <div className="ios-row" style={{cursor:'pointer'}} onClick={handleExport}>
                <span style={{flex:1,fontSize:16,color:'var(--ios-blue)'}}>Export Backup</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ios-blue)" strokeWidth="1.5">
                  <path d="M8 10V2M4 6l4-4 4 4" strokeLinecap="round"/>
                  <path d="M2 12h12v2H2v-2z"/>
                </svg>
              </div>
              <label className="ios-row" style={{cursor:'pointer'}}>
                <span style={{flex:1,fontSize:16,color:'var(--ios-blue)'}}>Import Backup</span>
                <input type="file" accept=".json" onChange={handleImport} style={{display:'none'}}/>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ios-blue)" strokeWidth="1.5">
                  <path d="M8 2v8M4 6l4 4 4-4" strokeLinecap="round"/>
                  <path d="M2 12h12v2H2v-2z"/>
                </svg>
              </label>
              <div className="ios-row" style={{cursor:'pointer'}} onClick={handleResetDemo}>
                <span style={{flex:1,fontSize:16,color:'var(--ios-blue)'}}>Load Sample Data</span>
              </div>
              <div className="ios-row" style={{cursor:'pointer'}} onClick={handleClearAll}>
                <span style={{flex:1,fontSize:16,color:'var(--ios-red)'}}>Clear All Data</span>
              </div>
            </div>
            {exportNotice && (
              <div style={{textAlign:'center',padding:'8px',fontSize:13,
                fontWeight:600,color:'var(--ios-green)'}}>
                ✓ Backup saved to downloads
              </div>
            )}
          </div>

          {/* About */}
          <div style={{textAlign:'center',padding:'4px 0 20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
            <img
              src="/app-logo.png"
              alt="LineUp"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(24, 96, 240, 0.45)',
                marginBottom: 8,
                objectFit: 'contain',
              }}
            />
            <div style={{fontSize:15,fontWeight:700,color:'var(--ios-label)',marginBottom:2}}>
              {APP_CONFIG.name}
            </div>
            <div style={{fontSize:12,color:'var(--ios-label3)'}}>Version {APP_CONFIG.version}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
