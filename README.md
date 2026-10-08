# 📱 LineUp — Personal Productivity & Routine Assistant

<p align="center">
  <img src="public/icon-512.png" alt="LineUp Logo" width="100" height="100" style="border-radius: 20%;" />
</p>

<p align="center">
  <b>A modern personal productivity companion that understands your routines, lines up unfinished tasks, tracks missions, supports conversational voice AI, and retains all your daily flow.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web%20%7C%20iOS-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Capacitor-v8-brightgreen?style=flat-square" alt="Capacitor" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/Release-v1.1.0-blueviolet?style=flat-square" alt="Release v1.1.0" />
  <img src="https://img.shields.io/badge/TypeScript-v6-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-v8-646CFF?style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/Android%20SDK-34+-success?style=flat-square" alt="Android SDK" />
</p>

---

## 📦 Direct APK Downloads (v1.1.0)

You can download and install the latest compiled Android package directly from the repository or from [GitHub Releases v1.1.0](https://github.com/krishnanlk/Todo-Android-app/releases/tag/v1.1.0):

| Build Type | File Path | Description | Download |
|---|---|---|---|
| 🟢 **Debug APK (v1.1.0)** | [`apk/LineUp-debug.apk`](apk/LineUp-debug.apk) | Latest updated build with all v1.1.0 fixes & features (4.4 MB) | [Download Debug APK (v1.1.0)](apk/LineUp-debug.apk) |
| 🚀 **Release APK (v1.0.0)** | [`apk/LineUp-release-unsigned.apk`](apk/LineUp-release-unsigned.apk) | Lightweight release package | [Download Release APK](apk/LineUp-release-unsigned.apk) |

> 💡 **Installation Note**: To install on Android, download the `.apk` file to your mobile device, tap to install, and allow **"Install from unknown sources"** if prompted by Android security settings.

---

## 🚀 What's New in Version 1.1.0

### 1. 📋 Unfinished Tasks Lineup
* **Automatic Roll-Forward**: Tasks from previous days that were left incomplete no longer vanish. They automatically line up in Today's task list with an eye-catching **`Overdue`** badge.
* **Intelligent Task Ordering**: Tasks are sorted with incomplete/overdue tasks prioritized at the top by priority and scheduled time, while completed items rest neatly at the bottom with strikethrough.

### 2. ⚡ Simplified Task Assignment
* **One-Tap Task Creation**: The task modal now defaults due dates directly to today (`getTodayKey()`), preventing tasks from being saved without dates.
* **Smart Natural Language Assignment**: LineUp Agent now handles commands like *"assign task..."*, *"assign me a task to finish report at 3 PM"*, and *"task assignment: ...* cleanly and accurately.

### 3. 🌊 Unified Life Flow (Retains All Tasks & Routines)
* **Unified Chronological Day Timeline**: The Life Flow tab now retains and merges **both daily recurring routines and scheduled tasks** in an unbroken chronological sequence.
* **Instant Filtering & Sync**: Filter across **All Flow**, **Routines**, and **Tasks** with live time tracking and interactive completion toggles that sync seamlessly across the app.

### 4. 🔥 Streak Maintenance (Mobile-Fit & Individual Split)
* **Individual Split Design**: Segmented toggle between **Streak Overview** (clean 2x2 responsive metrics: Current Streak, Record Streak, Total Completed, Consistency Rate) and **Activity Heatmap**.
* **Touch-Friendly Heatmap & Day Inspector**: Tap any day on the mobile calendar to inspect completed tasks, routines, and streak activity with zero horizontal clutter.

### 5. 🤖 LineUp Agent UI Overlap Fix
* **Zero-Overlap Input Bar**: Redesigned conversational message input with backdrop blur and ample safe-area bottom clearance (`calc(var(--tab-bar-height) + 34px)`). The text input and send button sit cleanly above the floating bottom tab bar without any obstruction.

### 6. 📊 Dedicated Productivity Analysis
* **Header Shortcut**: Removed the home screen widgets button and replaced it with a prominent **Analysis** shortcut.
* **Synced Weekly & Monthly Digests**: Fully synchronized data metrics, dynamic insights, completed task logs, and AI voice playback for both weekly and monthly digests.

---

## ✨ Core Features & Architecture

### 1. 🌊 Life Flow System
* **Unified Timeline**: Merges your recurring daily routines (Wake up, Classes, Deep Study, Exercise, Project work, Sleep) with scheduled tasks into an uninterrupted, connected timeline.
* **Smart Flow Status**: Visual indicators with glowing SVG connectors and real-time state pulses (`Completed`, `In Progress`, `Upcoming`, `Missed`).
* **Consistency Analytics**: Calculates genuine routine adherence percentages based strictly on historical execution records.

### 2. 🎯 Missions & Milestones System
* **Project Deliverables**: Break complex goals down into actionable milestones (e.g., *"AI Final Project"*, *"DBMS Lab Record"*).
* **Dynamic Progress Tracking**: Real-time progress bar recalculation (`0%` to `100%`) when subtasks are toggled or modified.
* **Deadline Radar**: Live countdown badge showing days remaining, urgent color-coded states, and completion stamps.

### 3. 🎙️ Conversational Voice Assistant
* **End-to-End Voice Pipeline**:
  $$\text{Microphone} \xrightarrow{\text{STT}} \text{Intent Parser (NLU)} \xrightarrow{\text{Productivity Engine}} \text{Local Storage} \xrightarrow{\text{TTS Response}} \text{Speech Synthesis}$$
* **Siri-Inspired Visuals**: Luminous pulsating orb and dynamic waveform bars for audio feedback.
* **Supported Voice Commands**:
  * *"What do I have left today?"*
  * *"Set a task of 3pm as completion of homework"*
  * *"Assign task DBMS report to 4pm"*
  * *"I finished my study session"*
  * *"Give me a weekly review"*
  * *"Show my flow"*
  * *"Create a mission for AI Project"* (triggers interactive follow-up for deadline)
  * *"Carry over incomplete tasks to tomorrow"*

### 4. 📊 Spoken Weekly & Monthly Productivity Reviews
* **Automated Data Synthesizer**: Aggregates planned vs. completed tasks, habit consistency scores, and milestone throughput.
* **Integrated Audio Player**: Web Audio speech synthesis with an interactive soundwave visualizer that recaps your performance aloud.

### 5. 🧩 Native Android Home-Screen Widgets
LineUp includes native Android Java widget providers:
1. **Today Flow Widget (4x2)**: Timeline of upcoming and current routines/tasks with completion checkboxes.
2. **Progress Ring Widget (2x2)**: Daily completion ratio, percentage counter, and circular ring indicator.
3. **Quick Voice Widget (2x2)**: Single-tap floating microphone launcher for immediate voice queries.
4. **Active Mission Widget (4x2)**: Active milestone checklist and live countdown timer.

---

## 📂 Project Structure

```text
├── apk/                             # Compiled Android installable APKs
│   ├── LineUp-debug.apk             # Debug build APK (v1.1.0)
│   └── LineUp-release-unsigned.apk  # Release build APK
├── android/                         # Native Android project (Capacitor)
│   ├── app/
│   │   ├── src/main/java/com/lineup/productivity/
│   │   │   ├── MainActivity.java
│   │   │   ├── LineUpWidgetPlugin.java
│   │   │   └── widgets/             # Native Java Widget Providers
│   │   └── src/main/res/            # Layouts, icons, XML widget configs
│   └── build.gradle
├── src/
│   ├── components/                  # React UI components
│   │   ├── TodayView.tsx            # Today dashboard with lined-up tasks & analysis
│   │   ├── FlowView.tsx             # Life flow timeline retaining all routines & tasks
│   │   ├── MissionsView.tsx         # Missions and deliverables
│   │   ├── AssistantView.tsx        # LineUp AI voice & text chat assistant
│   │   ├── StreakGraph.tsx          # Mobile-fit 2x2 streak overview & heatmap
│   │   ├── ReviewsModal.tsx         # Productivity Analysis digest modal
│   │   └── TaskModal.tsx            # Streamlined quick task creation
│   ├── services/                    # Business logic and storage
│   │   ├── taskService.ts           # Task management & overdue task retention
│   │   ├── flowService.ts           # Chronological flow timeline engine
│   │   ├── voiceAssistantService.ts # Voice NLU and intent action pipeline
│   │   ├── reviewService.ts         # Weekly & monthly productivity analytics
│   │   └── storageService.ts        # Persistent localStorage state manager
│   ├── config/                      # App branding & configuration
│   └── types/                       # TypeScript interfaces & data models
├── capacitor.config.ts              # Capacitor runtime configuration
├── vite.config.ts                   # Vite build configuration
└── package.json                     # Node.js dependencies & scripts
```

---

## 🛠️ Development & Build Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* **npm** or **pnpm**
* **Java JDK 17+** (for Android builds)
* **Android Studio / SDK** (optional, for native development)

### 1. Web Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Build Web Bundle
```bash
npm run build
```

### 3. Sync to Native Android
```bash
npx cap sync android
```

### 4. Build Android APK via CLI
```bash
cd android

# Build Debug APK
./gradlew assembleDebug

# Build Release APK
./gradlew assembleRelease
```
Compiled APKs will be located in:
* `android/app/build/outputs/apk/debug/app-debug.apk`
* `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
