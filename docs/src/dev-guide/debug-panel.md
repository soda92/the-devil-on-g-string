# Engine Debugger & Diagnostics

The engine includes built-in developer tools accessible during local development and testing.

---

## 🛠️ In-Game Debug Panel (`DebugPanel.tsx`)

Clicking the wrench icon in the top header opens the engine console:
- **Runner & Vars Tab**:
  - Jump directly to any scenario file and pointer.
  - Live inspection and mutation of local variables (`f`) and system flags (`sf`).
  - Audio channel playback status and manual play/pause/mute triggers.
  - Execution history view showing the last 10 instructions processed.
- **Dialog Inspector Tab**:
  - Full searchable list of all dialogue lines in the current scenario file.
  - One-click voice clip preview buttons.
  - Instant jump-to-line triggers.

---

## 🩺 Global `window.quick_check()` Helper

In browser DevTools, calling `window.quick_check()` outputs a detailed color-coded summary of current runner state, audio volumes, and active sprite layers.
