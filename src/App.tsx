import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TodayView }      from './components/TodayView';
import { FlowView }       from './components/FlowView';
import { MissionsView }   from './components/MissionsView';
import { AssistantView }  from './components/AssistantView';
import { TaskModal }      from './components/TaskModal';
import { MissionModal }   from './components/MissionModal';
import { RoutineModal }   from './components/RoutineModal';
import { ReviewsModal }   from './components/ReviewsModal';
import { AndroidWidgetsModal } from './components/AndroidWidgetsModal';
import { CarryoverModal } from './components/CarryoverModal';
import { SettingsModal }  from './components/SettingsModal';
import { OnboardingModal }from './components/OnboardingModal';
import { IOSTabBar }      from './components/IOSTabBar';

import { Task, Mission, Routine, ProductivityStats, UserSettings } from './types';
import { StorageService }  from './services/storageService';
import { TaskService }     from './services/taskService';
import { MissionService }  from './services/missionService';
import { RoutineService }  from './services/routineService';
import { ProgressService } from './services/progressService';
import { WidgetService }   from './services/widgetService';
import { NotificationService } from './services/notificationService';
import { App as CapApp }   from '@capacitor/app';

export type TabType = 'today' | 'flow' | 'missions' | 'assistant';

/* Quick-add FAB menu overlay */
function QuickAddMenu({ onClose, onTask, onMission, onRoutine }: {
  onClose: () => void;
  onTask: () => void;
  onMission: () => void;
  onRoutine: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 108,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {[
          { label: 'New Routine', color: 'var(--ios-indigo)', emoji: '🌊', action: () => { onRoutine(); onClose(); } },
          { label: 'New Mission', color: 'var(--ios-purple)', emoji: '🎯', action: () => { onMission(); onClose(); } },
          { label: 'New Task',    color: 'var(--ios-blue)',   emoji: '✓', action: () => { onTask(); onClose(); } },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '210px',
              background: item.color,
              color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
              padding: '12px 20px',
              fontFamily: 'var(--font)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <button
          onClick={onClose}
          style={{
            marginTop: 4,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#FFF',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* In-app toast */
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position:'absolute', top:58, left:'50%', transform:'translateX(-50%)',
        zIndex:200, maxWidth:320, padding:'10px 16px', borderRadius:12,
        background:'rgba(50,50,56,0.95)', backdropFilter:'blur(20px)',
        color:'#FFF', fontSize:14, fontWeight:500, textAlign:'center',
        boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
        animation:'slide-down 0.25s ease', cursor:'pointer',
        display:'flex', alignItems:'center', gap:8,
      }}
    >
      <span style={{fontSize:16}}>🔔</span>
      <span>{message}</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab]         = useState<TabType>('today');
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [stats, setStats]     = useState<ProductivityStats>(ProgressService.calculateStats());
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [toast, setToast]     = useState<string|null>(null);

  /* Modal states */
  const [taskModal,     setTaskModal]     = useState(false);
  const [editTask,      setEditTask]      = useState<Task|null>(null);
  const [missionModal,  setMissionModal]  = useState(false);
  const [editMission,   setEditMission]   = useState<Mission|null>(null);
  const [routineModal,  setRoutineModal]  = useState(false);
  const [editRoutine,   setEditRoutine]   = useState<Routine|null>(null);
  const [reviewsModal,  setReviewsModal]  = useState(false);
  const [widgetsModal,  setWidgetsModal]  = useState(false);
  const [carryoverModal,setCarryoverModal]= useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [onboarding,    setOnboarding]    = useState(false);
  const [quickAdd,      setQuickAdd]      = useState(false);

  /* Refs for Android Back Gesture / Navigation */
  const quickAddRef       = useRef(false);
  const taskModalRef      = useRef(false);
  const missionModalRef   = useRef(false);
  const routineModalRef   = useRef(false);
  const reviewsModalRef   = useRef(false);
  const widgetsModalRef   = useRef(false);
  const carryoverModalRef = useRef(false);
  const settingsModalRef  = useRef(false);
  const onboardingRef     = useRef(false);
  const tabRef            = useRef<TabType>('today');

  useEffect(() => { quickAddRef.current = quickAdd; }, [quickAdd]);
  useEffect(() => { taskModalRef.current = taskModal; }, [taskModal]);
  useEffect(() => { missionModalRef.current = missionModal; }, [missionModal]);
  useEffect(() => { routineModalRef.current = routineModal; }, [routineModal]);
  useEffect(() => { reviewsModalRef.current = reviewsModal; }, [reviewsModal]);
  useEffect(() => { widgetsModalRef.current = widgetsModal; }, [widgetsModal]);
  useEffect(() => { carryoverModalRef.current = carryoverModal; }, [carryoverModal]);
  useEffect(() => { settingsModalRef.current = settingsModal; }, [settingsModal]);
  useEffect(() => { onboardingRef.current = onboarding; }, [onboarding]);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  const reload = useCallback(() => {
    StorageService.initStorage();
    const s = StorageService.getSettings();
    setSettings(s);
    setTasks(TaskService.getTodayTasks());
    setMissions(MissionService.getAll());
    setRoutines(RoutineService.getAllWithToday());
    setStats(ProgressService.calculateStats());
    WidgetService.refreshPayload();
    if (!s.onboardingCompleted) setOnboarding(true);
  }, []);

  useEffect(() => {
    reload();

    const handleDeepLink = (url: string) => {
      if (!url) return;
      if (url.includes('assistant')) {
        setTab('assistant');
        if (url.includes('autolisten=true')) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('lineup-voice-autolisten'));
          }, 350);
        }
      } else if (url.includes('flow')) {
        setTab('flow');
      } else if (url.includes('missions')) {
        setTab('missions');
      } else if (url.includes('today')) {
        setTab('today');
      }
    };

    handleDeepLink(window.location.href);

    try {
      CapApp.addListener('appUrlOpen', (data) => {
        handleDeepLink(data.url);
      });
    } catch {
      // not on mobile
    }

    // Android native back button & edge slide gesture listener
    let backSub: any = null;
    try {
      CapApp.addListener('backButton', () => {
        // Priority 1: Close Quick Add overlay
        if (quickAddRef.current) {
          setQuickAdd(false);
          return;
        }
        // Priority 2: Dismiss top open modal/sheet with slide-out motion
        if (taskModalRef.current)      { setTaskModal(false); return; }
        if (missionModalRef.current)   { setMissionModal(false); return; }
        if (routineModalRef.current)   { setRoutineModal(false); return; }
        if (reviewsModalRef.current)   { setReviewsModal(false); return; }
        if (widgetsModalRef.current)   { setWidgetsModal(false); return; }
        if (carryoverModalRef.current) { setCarryoverModal(false); return; }
        if (settingsModalRef.current)  { setSettingsModal(false); return; }
        if (onboardingRef.current)     { setOnboarding(false); return; }

        // Priority 3: Navigate back to Today page from secondary tabs
        if (tabRef.current !== 'today') {
          setTab('today');
          return;
        }

        // Priority 4: Exit app if already on root Today tab
        CapApp.exitApp();
      }).then((handle) => {
        backSub = handle;
      }).catch(() => {});
    } catch {
      // not on mobile
    }

    const handler = (e: any) => { setToast(`${e.detail.title} — ${e.detail.body}`); };
    window.addEventListener('lineup-notification', handler);

    // Initial check for witty daily tasks due today notification
    NotificationService.checkAndTriggerDailyAlert();

    // 24-Hour Midnight 12:00 AM Auto-Reset monitor
    const checkMidnightAndAlerts = () => {
      const resetOccurred = StorageService.checkDailyMidnightReset();
      if (resetOccurred) {
        reload();
      }
      NotificationService.checkAndTriggerDailyAlert();
    };

    const midnightTimer = setInterval(checkMidnightAndAlerts, 30000); // Check every 30s
    window.addEventListener('focus', checkMidnightAndAlerts);
    document.addEventListener('visibilitychange', checkMidnightAndAlerts);

    return () => {
      window.removeEventListener('lineup-notification', handler);
      window.removeEventListener('focus', checkMidnightAndAlerts);
      document.removeEventListener('visibilitychange', checkMidnightAndAlerts);
      clearInterval(midnightTimer);
      if (backSub && backSub.remove) backSub.remove();
    };
  }, [reload]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.appearance || 'dark');
  }, [settings.appearance]);

  const openTask    = (t?: Task)    => { setEditTask(t || null);    setTaskModal(true); };
  const openMission = (m?: Mission) => { setEditMission(m || null); setMissionModal(true); };
  const openRoutine = (r?: Routine) => { setEditRoutine(r || null); setRoutineModal(true); };

  return (
    <div className="phone-shell">

      {/* Screen content with native slide-in motion */}
      <div className="screen-scroll">
        <div key={tab} className="page-slide-enter">
          {tab === 'today' && (
            <TodayView
              tasks={tasks} stats={stats} missions={missions}
              onRefresh={reload}
              onOpenTaskModal={openTask}
              onOpenCarryoverModal={() => setCarryoverModal(true)}
              onOpenSettingsModal={() => setSettingsModal(true)}
              onOpenReviewsModal={() => setReviewsModal(true)}
              onOpenWidgetsModal={() => setWidgetsModal(true)}
              onNavigateToTab={setTab}
            />
          )}
          {tab === 'flow' && (
            <FlowView
              routines={routines}
              tasks={tasks}
              onRefresh={reload}
              onOpenRoutineModal={openRoutine}
              onOpenTaskModal={openTask}
            />
          )}
          {tab === 'missions' && (
            <MissionsView
              missions={missions}
              onRefresh={reload}
              onOpenMissionModal={openMission}
            />
          )}
          {tab === 'assistant' && (
            <AssistantView
              onRefreshData={reload}
              onNavigateToTab={setTab}
            />
          )}
        </div>
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar
        active={tab}
        onChange={setTab}
        onFab={() => setQuickAdd(v => !v)}
      />

      {/* Quick Add overlay */}
      {quickAdd && (
        <QuickAddMenu
          onClose={() => setQuickAdd(false)}
          onTask={openTask}
          onMission={openMission}
          onRoutine={openRoutine}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* All Modals */}
      {taskModal && (
        <TaskModal
          isOpen task={editTask} missions={missions}
          onClose={() => setTaskModal(false)}
          onSaved={reload}
        />
      )}
      {missionModal && (
        <MissionModal
          isOpen mission={editMission}
          onClose={() => setMissionModal(false)}
          onSaved={reload}
        />
      )}
      {routineModal && (
        <RoutineModal
          isOpen routine={editRoutine}
          onClose={() => setRoutineModal(false)}
          onSaved={reload}
        />
      )}
      {reviewsModal  && <ReviewsModal   isOpen onClose={() => setReviewsModal(false)} />}
      {widgetsModal  && (
        <AndroidWidgetsModal
          isOpen
          onClose={() => setWidgetsModal(false)}
          onLaunchVoice={() => { setWidgetsModal(false); setTab('assistant'); }}
          onNavigateToTab={t => { setWidgetsModal(false); setTab(t); }}
        />
      )}
      {carryoverModal && (
        <CarryoverModal
          isOpen
          onClose={() => setCarryoverModal(false)}
          onProcessed={reload}
        />
      )}
      {settingsModal && (
        <SettingsModal
          isOpen
          onClose={() => setSettingsModal(false)}
          onSettingsChanged={reload}
        />
      )}
      {onboarding && (
        <OnboardingModal
          isOpen
          onComplete={() => { setOnboarding(false); reload(); }}
        />
      )}
    </div>
  );
}
