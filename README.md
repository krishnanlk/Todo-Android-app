# 📱 LineUp — Personal Productivity & Routine Assistant

<p align="center">
  <img src="public/icon-512.png" alt="LineUp Logo" width="100" height="100" style="border-radius: 20%;" />
</p>

<p align="center">
  <b>A modern productivity companion that understands your routines, tracks missions, supports conversational voice AI, and provides native Android home-screen widgets.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web%20%7C%20iOS-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Capacitor-v8-brightgreen?style=flat-square" alt="Capacitor" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/Release-v1.0.0-blueviolet?style=flat-square" alt="Release v1.0.0" />
  <img src="https://img.shields.io/badge/TypeScript-v6-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-v8-646CFF?style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/Android%20SDK-34+-success?style=flat-square" alt="Android SDK" />
</p>

---

## 📦 Direct APK Downloads (v1.0.0)

You can download and install the latest compiled Android packages directly from the repository or from the [GitHub Releases v1.0.0](https://github.com/krishnanlk/Todo-Android-app/releases/tag/v1.0.0):

| Build Type | File Path | Description | Download |
|---|---|---|---|
| 🚀 **Release APK** | [`apk/LineUp-release-unsigned.apk`](apk/LineUp-release-unsigned.apk) | Optimized, lightweight release package (3.4 MB) | [Download Release APK (v1.0.0)](https://github.com/krishnanlk/Todo-Android-app/releases/download/v1.0.0/LineUp-release-unsigned.apk) |
| 🟢 **Debug APK** | [`apk/LineUp-debug.apk`](apk/LineUp-debug.apk) | Developer build with debug symbols and developer tools enabled (4.5 MB) | [Download Debug APK (v1.0.0)](https://github.com/krishnanlk/Todo-Android-app/releases/download/v1.0.0/LineUp-debug.apk) |

> 💡 **Installation Note**: To install on Android, download the `.apk` file to your device, tap to install, and allow **"Install from unknown sources"** if prompted.

---

## ✨ Key Features & Architecture

### 1. 🌊 Life Flow System
* **Unified Timeline**: Merges your recurring daily routines (Wake up, Classes, Deep Study, Exercise, Project work, Sleep) with scheduled tasks into an uninterrupted, connected timeline.
* **Smart Flow Status**: Visual indicators with glowing SVG connectors and real-time state pulses (`Completed`, `In Progress`, `Upcoming`, `Skipped`).
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
  * *"What's left for today?"*
  * *"Create a task to finish DBMS record tomorrow at 7 PM"*
  * *"I finished my study session"*
  * *"How did I do this week?"*
  * *"Show my current flow"*
  * *"Create a mission for AI Project"* (triggers interactive follow-up for deadline)
  * *"Carry over incomplete tasks to tomorrow"*

### 4. 📊 Spoken Weekly & Monthly Reviews
* **Automated Data Synthesizer**: Aggregates planned vs. completed tasks, habit consistency scores, and milestone throughput.
* **Integrated Audio Player**: Web Audio speech synthesis with an interactive soundwave visualizer that recaps your week out loud.

### 5. 🧩 Native Android Home-Screen Widgets
LineUp comes with full native Android Java widget providers as well as an in-app launcher simulator:
1. **Today Flow Widget (4x2)**: Timeline of upcoming and current routines/tasks with completion checkboxes.
2. **Progress Ring Widget (2x2)**: Daily completion ratio, percentage counter, and circular ring indicator.
3. **Quick Voice Widget (2x2)**: Single-tap floating microphone launcher for immediate voice queries.
4. **Active Mission Widget (4x2)**: Active milestone checklist and live countdown timer.

Native source implementations:
* `android/app/src/main/java/com/lineup/productivity/widgets/`
  * `TodayFlowWidgetProvider.java`
  * `ProgressWidgetProvider.java`
  * `QuickVoiceWidgetProvider.java`
  * `ActiveMissionWidgetProvider.java`
  * `LineUpWidgetPlugin.java`
* XML definitions: `android/app/src/main/res/layout/widget_*.xml` and `xml/widget_*_info.xml`.

### 6. 🎨 iOS-Inspired Design Language
* Modern Apple aesthetics: SF Pro typography, fine glassmorphism (`backdrop-filter: blur(24px)`), smooth squircles, floating bottom navigation, and confetti celebration effects.
* Responsive dark & light adaptive palette.

---

## 📂 Project Structure

```text
├── apk/                             # Compiled Android installable APKs
│   ├── LineUp-debug.apk             # Debug build APK
│   └── LineUp-release-unsigned.apk  # Optimized release build APK
├── android/                         # Native Android project (Capacitor)
│   ├── app/
│   │   ├── src/main/java/com/lineup/productivity/
│   │   │   ├── MainActivity.java
│   │   │   ├── LineUpWidgetPlugin.java
│   │   │   └── widgets/             # Native Java Widget Providers
│   │   └── src/main/res/            # Layouts, icons, XML widget configs
│   ├── build.gradle
│   └── gradlew.bat
├── android-widgets/                 # Standalone widget reference layouts & Java code
├── ios/                             # Native iOS project (Capacitor)
├── src/                             # React + TypeScript Frontend
│   ├── components/                  # UI Views, Modals, Simulators & Controls
│   │   ├── TodayView.tsx            # Main daily timeline & tasks
│   │   ├── FlowView.tsx             # Life flow & routine management
│   │   ├── MissionsView.tsx         # Goal tracking & milestones
│   │   ├── AssistantView.tsx        # Voice assistant UI & orb
│   │   ├── AndroidWidgetsModal.tsx  # In-app Android widget interactive simulator
│   │   ├── ReviewsModal.tsx         # Spoken weekly/monthly review player
│   │   ├── StreakGraph.tsx          # Habit streak heatmaps
│   │   └── CarryoverModal.tsx       # Unfinished task rollover modal
│   ├── services/                    # Business logic & local storage
│   │   ├── voiceAssistantService.ts # NLU parsing & voice interaction
│   │   ├── flowService.ts           # Daily timeline orchestration
│   │   ├── missionService.ts        # Goals & milestone progress calculations
│   │   ├── reviewService.ts         # Performance summary synthesizer
│   │   ├── widgetService.ts         # Bridge syncing data to Android widgets
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

## ⚙️ Easy Rebranding & Customization

App name, taglines, and branding parameters are completely decoupled:
* Edit [`src/config/appConfig.ts`](src/config/appConfig.ts) to update `APP_CONFIG.name`, default routines, or styling constants.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
