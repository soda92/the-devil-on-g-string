# Choice Graph & Route Affection Status

The Choice Flowchart modal (`ChoiceGraphModal.tsx`) visualizes player decisions and active heroine route status.

---

## 💖 Heroine Route Affection Meters

The engine tracks affection counters for the 4 main heroines:
- **Tsubaki Miwa** (`f.flag_tubaki` / max 4) — `#ec4899`
- **Kanon Mizuhara** (`f.flag_kanon` / max 3) — `#3b82f6`
- **Mizuha Shiratori** (`f.flag_mizuha` / max 2) — `#eab308`
- **Haru Usami** (`f.flag_haru` / max 3) — `#8b5cf6`

---

## 🔒 Route Lock & Active Badges

When the story locks into a specific heroine's branch (e.g. `gt01` through `gt08` for Tsubaki):
- The active route displays a glowing **💖 Active** badge.
- Other heroine bars are dimmed and marked with **🔒 Bypassed** badges, reflecting the narrative lock-in.

---

## 🌳 Interactive Decision Flowchart

Every choice made by the player is recorded in `f.choicesHistory`. Players can click any previous decision node to rewind the game back to that choice point.
