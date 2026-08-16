# Variables System (f, sf, tf)

The engine implements KAG's three standard variable scopes:

---

## 🗄️ Variable Scopes

### 1. `f` (Scenario Local Variables)
- **Scope**: Tied directly to the current game session and stored inside save files (`SaveSlotData`).
- **Key Fields**:
  - `flag_tubaki`, `flag_kanon`, `flag_mizuha`, `flag_haru`: Heroine affection route counters.
  - `tubaki_clear`, `kanon_clear`, `mizuha_clear`, `game_clear`: Route completion flags.
  - `chour`: Simulated hour of the day (used to select dynamic morning/evening/night title screen art).
  - `choicesHistory`: List of past choices made by the player in this save timeline.

### 2. `sf` (System Global Variables)
- **Scope**: Global across all save files and game restarts. Persisted in `localStorage` and synchronized with the backend (`/api/save-sf`).
- **Key Fields**:
  - `readScenarios`: Matrix of read scenarios and pointers used for the "Skip Read Text Only" feature.
  - `vol`, `sevol`: Audio volume sliders (0 to 10).
  - `avgOpacity`, `avgBlur`, `novelOpacity`, `novelBlur`: Visual layout adjustments.
  - `typewriterMode`: `'WORD' | 'CHAR' | 'OFF'`.
  - `skipMode`: `'ALL' | 'READ_ONLY'`.
  - `immerseMode`: `boolean` subtitle mode toggle.
  - CG unlock flags (e.g. `sf.ev_01a = 1`).

### 3. `tf` (Temporary Variables)
- **Scope**: Transient memory valid only during the current scenario execution. Cleared when returning to the title screen.
- **Example**: `tf.go_next_chapter` used during chapter handoffs.
