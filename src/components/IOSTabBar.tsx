import React from 'react';
import type { TabType } from '../App';

/* SVG icons matching Apple SF Symbols style */
const icons: Record<string, (filled: boolean) => React.ReactElement> = {
  today: (f) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="3" y="5" width="20" height="18" rx="4" stroke="currentColor" strokeWidth={f?2:1.5} fill={f?'currentColor':'none'} opacity={f?.15:1}/>
      {f && <rect x="3" y="5" width="20" height="18" rx="4" fill="currentColor" opacity={.15}/>}
      <rect x="3" y="5" width="20" height="18" rx="4" stroke="currentColor" strokeWidth={1.8} fill="none"/>
      <line x1="3" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth={1.5}/>
      <rect x="8.5" y="14" width="3" height="3" rx="1" fill="currentColor"/>
      <rect x="14.5" y="14" width="3" height="3" rx="1" fill="currentColor" opacity={f?1:.5}/>
      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
      <line x1="18" y1="3" x2="18" y2="7" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
    </svg>
  ),
  flow: (f) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="4.5" r="2.5" stroke="currentColor" strokeWidth={f?2:1.5} fill={f?'currentColor':'none'} opacity={f?.3:1}/>
      {f && <circle cx="13" cy="4.5" r="2.5" fill="currentColor" opacity={.3}/>}
      <circle cx="13" cy="4.5" r="2.5" stroke="currentColor" strokeWidth={1.8} fill="none"/>
      <line x1="13" y1="7" x2="13" y2="10" stroke="currentColor" strokeWidth={1.5}/>
      <rect x="8" y="10" width="10" height="6" rx="3" stroke="currentColor" strokeWidth={1.5} fill={f?'currentColor':'none'} opacity={f?.15:1}/>
      {f && <rect x="8" y="10" width="10" height="6" rx="3" fill="currentColor" opacity={.15}/>}
      <rect x="8" y="10" width="10" height="6" rx="3" stroke="currentColor" strokeWidth={1.5} fill="none"/>
      <line x1="13" y1="16" x2="13" y2="19" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="13" cy="21.5" r="2" stroke="currentColor" strokeWidth={1.5} fill="none"/>
    </svg>
  ),
  missions: (f) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth={f?2:1.5}/>
      <circle cx="13" cy="13" r="5.5" stroke="currentColor" strokeWidth={1.5} opacity={f?.7:.5}/>
      <circle cx="13" cy="13" r="2" fill="currentColor"/>
    </svg>
  ),
  assistant: (f) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3C7.48 3 3 7.03 3 12c0 2.47 1.03 4.71 2.7 6.33L4.5 22l4.18-1.3A10.3 10.3 0 0 0 13 21c5.52 0 10-4.03 10-9S18.52 3 13 3z"
        stroke="currentColor" strokeWidth={1.5} fill={f?'currentColor':'none'} opacity={f?.15:1}/>
      {f && <path d="M13 3C7.48 3 3 7.03 3 12c0 2.47 1.03 4.71 2.7 6.33L4.5 22l4.18-1.3A10.3 10.3 0 0 0 13 21c5.52 0 10-4.03 10-9S18.52 3 13 3z" fill="currentColor" opacity={.15}/>}
      <path d="M13 3C7.48 3 3 7.03 3 12c0 2.47 1.03 4.71 2.7 6.33L4.5 22l4.18-1.3A10.3 10.3 0 0 0 13 21c5.52 0 10-4.03 10-9S18.52 3 13 3z" stroke="currentColor" strokeWidth={1.5} fill="none"/>
      <circle cx="8.5"  cy="12" r="1.2" fill="currentColor"/>
      <circle cx="13"   cy="12" r="1.2" fill="currentColor"/>
      <circle cx="17.5" cy="12" r="1.2" fill="currentColor"/>
    </svg>
  ),
};

interface IOSTabBarProps {
  active: TabType;
  onChange: (tab: TabType) => void;
  onFab: () => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'today',     label: 'Today' },
  { key: 'flow',      label: 'Flow' },
  { key: 'missions',  label: 'Missions' },
  { key: 'assistant', label: 'Assistant' },
];

const tabColors: Record<TabType, string> = {
  today:     'var(--ios-blue)',
  flow:      'var(--ios-indigo)',
  missions:  'var(--ios-purple)',
  assistant: 'var(--ios-teal)',
};

export const IOSTabBar: React.FC<IOSTabBarProps> = ({ active, onChange, onFab }) => {
  return (
    <div className="ios-tab-bar">
      {tabs.map((t, i) => {
        const isActive = active === t.key;
        const color = isActive ? tabColors[t.key] : 'var(--ios-label3)';

        /* Insert FAB between Flow and Missions */
        const elements = [];

        elements.push(
          <button
            key={t.key}
            className="tab-item"
            onClick={() => onChange(t.key)}
            style={{ color }}
          >
            <div className="tab-icon">
              {icons[t.key](isActive)}
            </div>
            <span className="tab-label" style={{ color }}>
              {t.label}
            </span>
          </button>
        );

        /* Insert FAB after Flow (index 1) */
        if (i === 1) {
          elements.push(
            <button key="fab" className="tab-fab" onClick={onFab}>
              <div className="tab-fab-circle">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                  <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="tab-label" style={{ color:'var(--ios-label3)' }}>Add</span>
            </button>
          );
        }

        return elements;
      })}
    </div>
  );
};
