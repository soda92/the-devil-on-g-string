# Pre-Scanner & Deep-Link State Reconstruction

A major challenge in visual novel web engines is supporting direct URL deep-linking (e.g. `http://localhost:5173/?scen=g05&ptr=536`) and quick timeline jumps without showing blank screens or missing character sprites.

---

## 🔍 The State Reconstruction Problem

KAG scripts rely on cumulative imperative instructions. If a player jumps directly to pointer `536`, that line might be spoken by a character standing on a background set at pointer `12`, with BGM started at pointer `529`. Without state reconstruction, jumping to `536` would yield no background, missing music, and empty sprites.

---

## 🛠️ The Backtracking Pre-Scanner Algorithm (`src/utils/kagHelpers.ts`)

When jumping to an arbitrary pointer `P` in scenario `S`:

1. **Backwards Search from `P` to `0`**:
   - Finds the most recent `bg` or `black` command to set `background`.
   - Finds the most recent `playbgm` or `bgm` command (and checks for `stopbgm` or `fobgm` fadeouts) to set the active BGM track.
   - Finds active sprites (`c`, `l`, `r`) while respecting sprite clear commands (`cl`, `cl_a`).
   - Finds the most recent speaker (`nm`) and dialogue box mode (`avg` vs `novel`).
2. **Preceding Scenario Traversal**:
   - If a background or BGM is not defined in the current file (e.g., in a route scenario like `gt08`), the scanner traverses backwards through the preceding chronological chapter (`gt07` ➔ `gt06` ➔ `g24`) to recover visual and audio states.
3. **Pointer Alignment**:
   - Snaps `pointer` backwards to the start of the surrounding dialogue sentence so that full sentence text and voice clips play properly.
