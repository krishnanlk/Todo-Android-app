import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceAssistantService } from '../services/voiceAssistantService';
import { AssistantState } from '../types';
import type { TabType } from '../App';
import { Mic, ArrowUp, Sparkles, Volume2, X, Square } from 'lucide-react';

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
  "Set a task for 3pm to complete homework",
  "What do I have left today?",
  "Give me a weekly review",
  "Show my life flow timeline",
  "How is my productivity progress?",
];

function getTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export const AssistantView: React.FC<AssistantViewProps> = ({ onRefreshData, onNavigateToTab }) => {
  const [voiceState, setVoiceState] = useState<AssistantState>('idle');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hello! I'm LineUp Assistant. Ask me to schedule tasks, track your life flow, or review your productivity. Tap the mic to talk, or type below!",
      time: getTime(),
    },
  ]);
  const [typedInput, setTypedInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, voiceState, isVoiceMode, voiceTranscript]);

  // Clean up keyboard class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  const addMessages = (userText: string, aiText: string, navTab?: TabType, navLabel?: string) => {
    const time = getTime();
    setChatMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: userText, time },
      { id: `ai-${Date.now() + 1}`, role: 'ai', text: aiText, time, navTab, navLabel },
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
        const navLabel =
          result.navigateToTab === 'today'
            ? 'View in Today ›'
            : result.navigateToTab
            ? `View in ${result.navigateToTab} ›`
            : undefined;
        addMessages(text, result.responseText, result.navigateToTab as TabType, navLabel);

        // Speak response aloud
        VoiceAssistantService.speak(
          result.responseText,
          () => {
            setVoiceState('idle');
          },
          true
        );
      } catch {
        setVoiceState('idle');
        addMessages(text, "I had trouble processing that command. Could you try asking again?");
      }
    }, 60);
  }, []); // eslint-disable-line

  useEffect(() => {
    VoiceAssistantService.initSpeechRecognition(
      (text: string) => {
        setVoiceTranscript(text);
      },
      (state: AssistantState) => {
        setVoiceState(state);
      }
    );

    const autoHandler = () => {
      startVoiceSession();
    };
    window.addEventListener('lineup-voice-autolisten', autoHandler);
    return () => window.removeEventListener('lineup-voice-autolisten', autoHandler);
  }, []); // eslint-disable-line

  const startVoiceSession = () => {
    if (voiceState === 'speaking') {
      VoiceAssistantService.stopSpeaking();
    }
    VoiceAssistantService.resetTranscript();
    setVoiceTranscript('');
    setIsVoiceMode(true);
    VoiceAssistantService.startListening();
  };

  const handleVoiceCancel = () => {
    VoiceAssistantService.abortListening();
    setIsVoiceMode(false);
    setVoiceTranscript('');
    setVoiceState('idle');
  };

  const handleVoiceToggleRecord = () => {
    if (voiceState === 'listening') {
      VoiceAssistantService.stopListening();
    } else {
      VoiceAssistantService.startListening();
    }
  };

  const handleVoiceSend = () => {
    VoiceAssistantService.stopListening();
    const textToSend = voiceTranscript.trim();
    setIsVoiceMode(false);
    setVoiceTranscript('');
    if (textToSend) {
      processInput(textToSend);
    } else {
      setVoiceState('idle');
    }
  };

  const handleMicTap = () => {
    if (voiceState === 'speaking') {
      VoiceAssistantService.stopSpeaking();
      setVoiceState('idle');
      return;
    }
    startVoiceSession();
  };

  const handleTextSend = () => {
    const text = typedInput.trim();
    if (!text || voiceState !== 'idle') return;
    setTypedInput('');
    processInput(text);
  };

  const handleFocus = () => {
    setIsInputFocused(true);
    document.body.classList.add('keyboard-open');
  };

  const handleBlur = () => {
    // Small timeout so tap on send/mic doesn't immediately dismiss state
    setTimeout(() => {
      setIsInputFocused(false);
      document.body.classList.remove('keyboard-open');
    }, 150);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        background: 'var(--ios-bg)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(20, 20, 22, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(10, 132, 255, 0.35)',
            }}
          >
            <Sparkles size={16} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ios-label)', lineHeight: 1.2 }}>
              LineUp Assistant
            </div>
            <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>
              {voiceState === 'listening' ? (
                <span style={{ color: 'var(--ios-red)', fontWeight: 600 }}>● Listening to you...</span>
              ) : voiceState === 'speaking' ? (
                <span style={{ color: 'var(--ios-green)', fontWeight: 600 }}>● Speaking response...</span>
              ) : voiceState === 'processing' ? (
                <span style={{ color: 'var(--ios-purple)', fontWeight: 600 }}>● Processing...</span>
              ) : (
                'Online & ready'
              )}
            </div>
          </div>
        </div>

        {voiceState === 'speaking' && (
          <button
            onClick={() => {
              VoiceAssistantService.stopSpeaking();
              setVoiceState('idle');
            }}
            style={{
              background: 'rgba(48, 209, 88, 0.15)',
              border: '1px solid rgba(48, 209, 88, 0.3)',
              borderRadius: 20,
              padding: '4px 10px',
              color: 'var(--ios-green)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <Volume2 size={13} />
            <span>Mute</span>
          </button>
        )}
      </div>

      {/* Main chat messages container */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          scrollbarWidth: 'none',
        }}
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 3,
              animation: 'fade-in 0.2s ease',
            }}
          >
            <div
              className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
              style={{
                maxWidth: '85%',
                fontSize: 15,
                lineHeight: 1.45,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}
            >
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
            <span
              style={{
                fontSize: 11,
                color: 'var(--ios-label3)',
                paddingLeft: msg.role === 'ai' ? 8 : 0,
                paddingRight: msg.role === 'user' ? 8 : 0,
              }}
            >
              {msg.time}
            </span>
          </div>
        ))}



        {/* Processing indicator */}
        {voiceState === 'processing' && (
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 16,
              background: 'rgba(94, 92, 230, 0.12)',
              border: '1px solid rgba(94, 92, 230, 0.25)',
              alignSelf: 'flex-start',
              fontSize: 13,
              color: 'var(--ios-indigo)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid rgba(94, 92, 230, 0.3)',
                borderTopColor: 'var(--ios-indigo)',
                animation: 'orb-spin 0.8s linear infinite',
              }}
            />
            Thinking...
          </div>
        )}
      </div>

      {/* Suggestion pills row */}
      {chatMessages.length <= 3 && (
        <div
          className="filter-scroll"
          style={{
            padding: '4px 16px 8px',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="filter-pill"
              onClick={() => processInput(s)}
              disabled={voiceState !== 'idle'}
              style={{
                fontSize: 12,
                whiteSpace: 'nowrap',
                opacity: voiceState !== 'idle' ? 0.5 : 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ChatGPT-style bottom input bar */}
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(18, 18, 20, 0.95)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {isVoiceMode ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Live speech preview chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                marginBottom: 8,
                background: 'rgba(28, 28, 30, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: voiceState === 'listening' ? '#30D158' : '#FF9F0A',
                  boxShadow: voiceState === 'listening' ? '0 0 8px #30D158' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: voiceTranscript ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                  fontStyle: voiceTranscript ? 'normal' : 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {voiceTranscript || (voiceState === 'listening' ? 'Listening... Speak now' : 'Paused. Tap send or resume.')}
              </span>
            </div>

            {/* ChatGPT Voice Capsule bar (Image 4) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                background: '#141416',
                borderRadius: 9999,
                padding: '5px 8px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
                minHeight: 52,
              }}
            >
              {/* Cancel Button [ ✕ ] */}
              <button
                onClick={handleVoiceCancel}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E5E5EA',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.2s ease',
                }}
                title="Cancel voice input"
              >
                <X size={18} strokeWidth={2.4} />
              </button>

              {/* Waveform track with dotted line */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 4px',
                  overflow: 'hidden',
                }}
              >
                {/* Horizontal dotted track */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 1.2px, transparent 1.2px)',
                    backgroundSize: '8px 2px',
                    backgroundRepeat: 'repeat-x',
                    backgroundPosition: 'center',
                  }}
                />

                {/* Animated waveform sound bars */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3.5,
                    background: '#141416',
                    padding: '0 8px',
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: voiceState === 'listening' ? 10 : 4,
                      borderRadius: 3,
                      background: '#FFFFFF',
                      opacity: voiceState === 'listening' ? 0.9 : 0.4,
                      animation: voiceState === 'listening' ? 'chatgpt-wave 0.6s ease-in-out infinite alternate' : 'none',
                    }}
                  />
                  <div
                    style={{
                      width: 3,
                      height: voiceState === 'listening' ? 18 : 4,
                      borderRadius: 3,
                      background: '#FFFFFF',
                      opacity: voiceState === 'listening' ? 0.9 : 0.4,
                      animation: voiceState === 'listening' ? 'chatgpt-wave 0.45s ease-in-out 0.15s infinite alternate' : 'none',
                    }}
                  />
                  <div
                    style={{
                      width: 3,
                      height: voiceState === 'listening' ? 24 : 6,
                      borderRadius: 3,
                      background: '#FFFFFF',
                      opacity: voiceState === 'listening' ? 1 : 0.5,
                      animation: voiceState === 'listening' ? 'chatgpt-wave 0.7s ease-in-out 0.05s infinite alternate' : 'none',
                    }}
                  />
                  <div
                    style={{
                      width: 3,
                      height: voiceState === 'listening' ? 16 : 4,
                      borderRadius: 3,
                      background: '#FFFFFF',
                      opacity: voiceState === 'listening' ? 0.9 : 0.4,
                      animation: voiceState === 'listening' ? 'chatgpt-wave 0.5s ease-in-out 0.2s infinite alternate' : 'none',
                    }}
                  />
                  <div
                    style={{
                      width: 3,
                      height: voiceState === 'listening' ? 8 : 4,
                      borderRadius: 3,
                      background: '#FFFFFF',
                      opacity: voiceState === 'listening' ? 0.9 : 0.4,
                      animation: voiceState === 'listening' ? 'chatgpt-wave 0.65s ease-in-out 0.1s infinite alternate' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Right buttons: [ ⏹ ] and [ ↑ ] */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Stop / Record toggle button [ ⏹ ] */}
                <button
                  onClick={handleVoiceToggleRecord}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title={voiceState === 'listening' ? 'Stop recording' : 'Resume recording'}
                >
                  <Square size={13} fill="#FFFFFF" strokeWidth={0} />
                </button>

                {/* Send Button [ ↑ ] */}
                <button
                  onClick={handleVoiceSend}
                  disabled={!voiceTranscript.trim() && voiceState !== 'listening'}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#0A84FF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(10, 132, 255, 0.35)',
                    transition: 'transform 0.15s ease, opacity 0.2s ease',
                    opacity: (!voiceTranscript.trim() && voiceState !== 'listening') ? 0.5 : 1,
                  }}
                  title="Send voice message"
                >
                  <ArrowUp size={20} strokeWidth={2.6} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.07)',
              borderRadius: 26,
              padding: '4px 6px 4px 16px',
              border: isInputFocused
                ? '1px solid var(--ios-blue)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              transition: 'border 0.2s ease, box-shadow 0.2s ease',
              boxShadow: isInputFocused ? '0 0 12px rgba(10, 132, 255, 0.25)' : 'none',
            }}
          >
            {/* Text Input */}
            <input
              ref={inputRef}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={voiceState === 'speaking' ? 'Speaking response...' : 'Ask LineUp Assistant...'}
              disabled={voiceState === 'processing'}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font)',
                fontSize: 15,
                color: 'var(--ios-label)',
                padding: '8px 0',
              }}
            />

            {/* ChatGPT-style buttons container: Voice Mic beside Send */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {/* Voice Input Button */}
              <button
                onClick={handleMicTap}
                title="Talk with voice"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    voiceState === 'speaking'
                      ? 'rgba(48, 209, 88, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border:
                    voiceState === 'speaking'
                      ? '1.5px solid var(--ios-green)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color:
                    voiceState === 'speaking'
                      ? 'var(--ios-green)'
                      : 'var(--ios-label2)',
                }}
              >
                <Mic size={18} />
              </button>

              {/* Send Button */}
              <button
                onClick={handleTextSend}
                disabled={!typedInput.trim() || voiceState !== 'idle'}
                title="Send message"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    typedInput.trim() && voiceState === 'idle'
                      ? 'var(--ios-blue)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: typedInput.trim() && voiceState === 'idle' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  color: typedInput.trim() && voiceState === 'idle' ? '#FFF' : 'rgba(255, 255, 255, 0.25)',
                }}
              >
                <ArrowUp size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic bottom spacer: hides when typing/keyboard open so input docks cleanly, gives space for tab bar otherwise */}
      <div
        style={{
          height: isInputFocused ? 4 : 'calc(var(--tab-bar-height) + 12px)',
          flexShrink: 0,
          transition: 'height 0.2s ease',
        }}
      />
    </div>
  );
};
