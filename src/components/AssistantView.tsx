import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceAssistantService } from '../services/voiceAssistantService';
import { AssistantState } from '../types';
import type { TabType } from '../App';

interface AssistantViewProps {
  onRefreshData: () => void;
  onNavigateToTab: (tab: TabType) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  navTab?: TabType;
  navLabel?: string;
}

const SUGGESTIONS = [
  "Set a task of 3pm as completion of homework",
  "What's my progress today?",
  "Give me a weekly review",
  "Start exercise routine",
  "What should I focus on?",
  "Mark morning review done",
];

function getTime() {
  return new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
}

export const AssistantView: React.FC<AssistantViewProps> = ({ onRefreshData, onNavigateToTab }) => {
  const [voiceState,    setVoiceState]   = useState<AssistantState>('idle');
  const [transcript,    setTranscript]   = useState('');
  const [chatMessages,  setChatMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'ai',
    text: "Hey there! I'm your LineUp AI assistant. I can help you manage tasks, track your flow, and review your progress. Tap the mic or ask me something!",
    time: getTime(),
  }]);
  const [typedInput,    setTypedInput]   = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' });
  }, [chatMessages]);

  const addMessages = (userText: string, aiText: string, navTab?: TabType, navLabel?: string) => {
    const time = getTime();
    setChatMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`,   role:'user', text:userText, time },
      { id: `ai-${Date.now()+1}`, role:'ai',   text:aiText,  time, navTab, navLabel },
    ]);
    onRefreshData();
  };

  const processInput = useCallback((text: string) => {
    if (!text.trim()) return;
    setVoiceState('processing');
    setTimeout(async () => {
      try {
        const result = await VoiceAssistantService.processVoiceCommand(text);
        setVoiceState('speaking');
        const navLabel = result.navigateToTab === 'today' ? 'View in Today ›' : (result.navigateToTab ? `View in ${result.navigateToTab} ›` : undefined);
        addMessages(text, result.responseText, result.navigateToTab as TabType, navLabel);

        // Speak aloud with force=true to ensure audio playback
        VoiceAssistantService.speak(result.responseText, () => {
          setVoiceState('idle');
        }, true);
      } catch {
        setVoiceState('idle');
        addMessages(text, "I'm sorry, I had trouble with that. Could you try again?");
      }
    }, 80);
  }, []); // eslint-disable-line

  useEffect(() => {
    // Initialize speech recognition once on mount
    VoiceAssistantService.initSpeechRecognition(
      (text: string) => {
        setTranscript(text);
        processInput(text);
      },
      (state: AssistantState) => {
        setVoiceState(state);
      }
    );

    const autoHandler = () => {
      setTranscript('');
      VoiceAssistantService.startListening();
    };
    window.addEventListener('lineup-voice-autolisten', autoHandler);
    return () => window.removeEventListener('lineup-voice-autolisten', autoHandler);
  }, []); // eslint-disable-line

  const handleMicTap = () => {
    if (voiceState === 'listening') {
      VoiceAssistantService.stopListening();
      setVoiceState('idle');
      return;
    }
    if (voiceState !== 'idle') return;
    setTranscript('');
    VoiceAssistantService.startListening();
  };

  const handleTextSend = () => {
    const text = typedInput.trim();
    if (!text || voiceState !== 'idle') return;
    setTypedInput('');
    processInput(text);
  };

  const orbClass =
    voiceState === 'listening'  ? 'voice-orb-listen' :
    voiceState === 'speaking'   ? 'voice-orb-speak'  :
    voiceState === 'processing' ? 'voice-orb-think'  :
    'voice-orb-idle';

  return (
    <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',minHeight:'100%'}}>

      {/* Nav bar */}
      <div style={{padding:'6px 20px 0'}}>
        <span style={{fontSize:13,fontWeight:600,color:'var(--ios-label2)'}}>AI Assistant</span>
      </div>

      {/* Large title */}
      <div style={{padding:'8px 20px 12px'}}>
        <h1 className="ios-large-title">Ask LineUp 🤖</h1>
      </div>

      {/* Voice orb */}
      <div className="voice-orb-container" style={{marginBottom:4}}>
        <button className={`voice-orb ${orbClass}`} onClick={handleMicTap}
          aria-label="Voice Assistant">
          {(voiceState === 'idle') && (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="white">
              <rect x="13" y="4" width="10" height="18" rx="5"/>
              <path d="M6 18a12 12 0 0 0 24 0" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <line x1="18" y1="30" x2="18" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="13" y1="34" x2="23" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
          {(voiceState === 'listening') && (
            <div className="waveform">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="wave-bar" style={{animationDelay:`${i*0.1}s`}}/>
              ))}
            </div>
          )}
          {(voiceState === 'processing') && (
            <div style={{
              width:32,height:32,border:'3px solid rgba(255,255,255,0.3)',
              borderTopColor:'#FFF',borderRadius:'50%',
              animation:'orb-spin 0.8s linear infinite',
            }}/>
          )}
          {(voiceState === 'speaking') && (
            <div className="waveform">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="wave-bar" style={{animationDelay:`${i*0.12}s`}}/>
              ))}
            </div>
          )}
        </button>

        <div style={{fontSize:14,fontWeight:600,color:'var(--ios-label2)',textAlign:'center',minHeight:20}}>
          {voiceState === 'idle'       && 'Tap to speak'}
          {voiceState === 'listening'  && <span style={{color:'var(--ios-red)'}}>Listening…</span>}
          {voiceState === 'processing' && <span style={{color:'var(--ios-purple)'}}>Thinking…</span>}
          {voiceState === 'speaking'   && <span style={{color:'var(--ios-green)'}}>Speaking…</span>}
        </div>

        {transcript ? (
          <div style={{maxWidth:280,textAlign:'center',fontSize:15,color:'var(--ios-label)',
            fontStyle:'italic',lineHeight:1.4}}>
            "{transcript}"
          </div>
        ) : null}
      </div>

      {/* Suggestion pills */}
      <div className="filter-scroll" style={{marginBottom:12}}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="filter-pill"
            onClick={() => processInput(s)}
            disabled={voiceState !== 'idle'}
            style={{fontSize:13,opacity:voiceState!=='idle'?0.5:1}}>
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{
        flex:1,overflowY:'auto',padding:'0 16px',
        display:'flex',flexDirection:'column',gap:12,
        scrollbarWidth:'none',maxHeight:280,minHeight:120,
      }}>
        {chatMessages.map(msg => (
          <div key={msg.id}
            style={{display:'flex',flexDirection:'column',
              alignItems:msg.role==='user'?'flex-end':'flex-start',
              gap:2,animation:'fade-in 0.25s ease'}}>
            <div className={msg.role==='user'?'chat-bubble-user':'chat-bubble-ai'}>
              <div>{msg.text}</div>
              {msg.navTab && (
                <button
                  onClick={() => onNavigateToTab(msg.navTab!)}
                  style={{
                    marginTop: 8,
                    padding: '5px 12px',
                    borderRadius: 12,
                    background: 'rgba(10, 132, 255, 0.2)',
                    border: '1px solid rgba(10, 132, 255, 0.4)',
                    color: 'var(--ios-blue)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {msg.navLabel || 'View ›'}
                </button>
              )}
            </div>
            <span style={{fontSize:11,color:'var(--ios-label3)',
              paddingLeft:msg.role==='ai'?8:0,paddingRight:msg.role==='user'?8:0}}>
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Text input with clean elevation and clearance */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        background: 'rgba(28, 28, 30, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        margin: '0 16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          flex:1,display:'flex',alignItems:'center',
          background:'var(--ios-bg2)',borderRadius:22,
          padding:'0 14px',border:'1px solid var(--ios-separator)',
        }}>
          <input
            value={typedInput}
            onChange={e => setTypedInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleTextSend()}
            placeholder="Type a message or command…"
            disabled={voiceState !== 'idle'}
            style={{
              flex:1,background:'none',border:'none',outline:'none',
              fontFamily:'var(--font)',fontSize:15,color:'var(--ios-label)',
              padding:'11px 0',
            }}
          />
        </div>
        <button
          onClick={handleTextSend}
          disabled={!typedInput.trim() || voiceState !== 'idle'}
          style={{
            width:38,height:38,borderRadius:'50%',
            background: (typedInput.trim() && voiceState==='idle') ? 'var(--ios-blue)' : 'var(--ios-fill3)',
            border:'none',display:'flex',alignItems:'center',justifyContent:'center',
            cursor:(typedInput.trim() && voiceState==='idle')?'pointer':'default',
            transition:'background 0.2s ease',flexShrink:0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13V4M4 7L8 3L12 7"
              stroke={(typedInput.trim() && voiceState==='idle')?'#FFF':'var(--ios-label3)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Ample bottom spacer to ensure 0% overlap with the floating tab bar */}
      <div style={{ height: 'calc(var(--tab-bar-height) + 34px)', flexShrink: 0 }} />
    </div>
  );
};
