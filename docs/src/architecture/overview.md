# Architectural Overview

The engine follows a modular, decoupled architecture consisting of three primary layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (App.tsx, GameplayScreen, DialogueBox, TitleScreen, etc.)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Engine State Machine                     │
│         (useKagRunner.ts - State & Flow Orchestrator)       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│  Bytecode & Helpers Layer   ││    Audio & Media Channels    │
│  - kagEvaluator.ts          ││    - useGameAudio.ts         │
│  - kagHelpers.ts            ││    - Singleton Audio Elements│
│  - textFormatter.ts         ││    - spritePositions.json    │
│  - gameUtils.ts             ││    - fileMap.json            │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 🏗️ Layer Responsibilities

### 1. Presentation Layer (`src/components/`)
Pure React UI components responsible for layout, animations, user input events, and modal dialogs. Components receive state and action handlers from `useKagRunner` via strongly-typed TypeScript interfaces:
- **`App.tsx`**: Top-level root component. Mounts screen views based on `gameState` (`TITLE` vs `PLAYING`) and manages window resize scaling.
- **`GameplayScreen.tsx`**: Renders backgrounds, active character sprites (left, center, right), side narrations, choices overlay, and the dialogue box.
- **`DialogueBox.tsx`**: Handles dialogue modes (AVG vs NVL vs Subtitle), character nameplate, face icon, typewriter rendering, and quick action bar.
- **`SaveLoadModal.tsx`, `SettingsPanel.tsx`, `ChoiceGraphModal.tsx`, `HistoryModal.tsx`, `GalleryScreen.tsx`, `MusicRoom.tsx`, `DebugPanel.tsx`**: Specialized overlay systems.

### 2. Engine State Machine (`src/hooks/useKagRunner.ts`)
The central coordinator managing:
- Current scenario identifier (`currentScenario`) and execution pointer (`pointer`).
- Visual state (background, sprites, speaker, dialogue mode, shake, flash).
- Flow state (`isWaiting`, `isAutoMode`, `isFastForward`, `showOptions`).
- User profile isolation, local storage sync, and REST backend persistence.

### 3. Utility & Helper Modules (`src/utils/`)
- **`kagEvaluator.ts`**: Pure functions for KAG expression evaluation (`cleanKagExpression`, `evaluateExpression`, `executeStatement`) and save snapshot sanitization.
- **`kagHelpers.ts`**: Backtracking logic (`backtrackScenarioState`), face icon resolution (`getFaceIcon`), and translation refinement (`applyTranslationImprovements`).
- **`textFormatter.ts`**: KAG ruby text tag replacement (`[ruby]`) and special quote cleanups.
- **`gameUtils.ts`**: Asset lookup resolver with alias normalization (`resolveAsset`) and character name translation dictionary.
- **`shortcutManager.ts`**: Key code bindings and native Fullscreen API wrapper.

### 4. Audio Subsystem (`src/hooks/useGameAudio.ts`)
Singleton HTML5 audio channels (`bgmPlayer`, `sePlayer`, `voicePlayer`) persisted across React re-renders and hot-module reloads, with automatic pause/resume on tab blur/focus.
