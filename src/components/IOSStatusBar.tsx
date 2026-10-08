import React from 'react';

/* Wifi, Signal, Battery SVGs as React components */
const WifiIcon = () => (
  <svg viewBox="0 0 17 12" fill="currentColor" style={{width:16,height:12}}>
    <path d="M8.5 3.5a7.46 7.46 0 0 1 5.3 2.2l1.4-1.4A9.45 9.45 0 0 0 8.5 1.5a9.45 9.45 0 0 0-6.7 2.8l1.4 1.4A7.46 7.46 0 0 1 8.5 3.5z" opacity=".3"/>
    <path d="M8.5 6a4.96 4.96 0 0 1 3.5 1.45L13.4 6A6.97 6.97 0 0 0 8.5 4 6.97 6.97 0 0 0 3.6 6l1.4 1.45A4.96 4.96 0 0 1 8.5 6z" opacity=".6"/>
    <path d="M8.5 8.5a2.5 2.5 0 0 1 1.77.73L11.7 7.8A4.48 4.48 0 0 0 8.5 6.5a4.48 4.48 0 0 0-3.2 1.3l1.43 1.43A2.5 2.5 0 0 1 8.5 8.5z"/>
    <circle cx="8.5" cy="11" r="1.5"/>
  </svg>
);

const SignalIcon = () => (
  <svg viewBox="0 0 17 12" fill="currentColor" style={{width:17,height:12}}>
    <rect x="0"  y="9" width="3" height="3" rx="1" opacity=".3"/>
    <rect x="4"  y="6.5" width="3" height="5.5" rx="1" opacity=".5"/>
    <rect x="8"  y="4" width="3" height="8" rx="1" opacity=".75"/>
    <rect x="12" y="1" width="3" height="11" rx="1"/>
  </svg>
);

const BatteryIcon = () => (
  <svg viewBox="0 0 25 12" fill="currentColor" style={{width:25,height:12}}>
    <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity=".35" fill="none"/>
    <rect x="22.5" y="3.5" width="2" height="5" rx="1" fillOpacity=".4"/>
    <rect x="2" y="2" width="17" height="8" rx="2" />
  </svg>
);

interface IOSStatusBarProps {
  time: string;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({ time }) => {
  return (
    <div style={{
      height: 50,
      paddingTop: 14,
      paddingLeft: 20,
      paddingRight: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Time */}
      <span style={{
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.3px',
        color: 'var(--ios-label)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {time}
      </span>

      {/* Dynamic Island */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 120,
        height: 34,
        background: '#000',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)',
        zIndex: 20,
      }} />

      {/* Status icons */}
      <div style={{display:'flex', alignItems:'center', gap:5, color:'var(--ios-label)'}}>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
};
