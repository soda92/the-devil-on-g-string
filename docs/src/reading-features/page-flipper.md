# Page Flipper & Timeline Scrubbing (Book Flip Mode)

The **Page Flipper / Timeline Scrubber** ([`PageFlipperBar.tsx`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/web-app/src/components/PageFlipperBar.tsx), shortcut `Key B` or `翻页` button on the dialogue system bar) operates as an **unobstructed right-hand vertical companion panel**, allowing readers to casually flip through sentences and scenes like a physical book without obscuring any in-game art or dialogue boxes.

---

## 🎨 1. Unobstructed Side Companion Architecture

- **Zero Game Screen Occlusion**: The 350px vertical companion panel sits to the right of the 800×600 visual novel game screen in the responsive canvas.
- **Dynamic Viewport Expansion**: Opening the Page Flipper automatically expands the browser scaling boundary (`targetWidth: 1180px`), scaling both the pristine visual novel viewport and the navigation sidebar in lockstep.
- **Live Dialogue Preview Card**: Features an integrated, scrollable dialogue card on the right that previews full speaker names and dialogue text at the scrubbed pointer.

---

## 📖 2. 1000-Line Range Chunk Windowing

For large chapter scenarios spanning 2,000 to 5,000+ instructions (e.g. `g01.ks` with 4,795 lines), the scrubber features **Adaptive 1000-Line Range Windows**:

- **Fine-Grained 1-Line Precision**: Within each 1,000-line window (e.g. `1 - 1000`, `1001 - 2000`, `2001 - 3000`, `3001 - 4000`, `4001 - 4795`), the slider spans that specific 1,000-line bracket, providing 1-line granular control.
- **Range Chunk Pills**: Clickable brackets above the slider let you switch focus across any section of the chapter or select `全场景 / Full (0 - N)` for broad scrubbing.
- **Intentional Chunk Locking**: Clicking a range chunk keeps the slider firmly bound to that range while you drag, preventing unwanted snaps.

---

## ⚡ 3. Step & Jump Navigation

- **Chunk Stepping**: `-1k` and `+1k` buttons jump directly across 1,000-line blocks.
- **Fine Stepping**: `-10`, `◀ -1`, `+1 ▶`, and `+10` buttons for precise micro-adjustments.
- **🔖 Temporary Bookmarking (`书签` & `↩ 返回`)**: Press **书签 (Mark)** to remember your current reading line, explore earlier/later lines freely, and click **↩ 返回 (Return)** to instantly snap back to your bookmark.
- **📚 Table of Contents Jump (`目录`)**: One-click jump into the structured Story Milestones modal.
