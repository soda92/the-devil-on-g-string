# Page Flipper & Timeline Scrubbing (Book Flip Mode)

The **Page Flipper / Timeline Scrubber** ([`PageFlipperBar.tsx`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/web-app/src/components/PageFlipperBar.tsx), shortcut `Key B` or `翻页` button on dialogue bar) allows readers to casually flip through sentences and scenes like a physical book.

---

## 📖 1. 1000-Line Range Chunk Windowing

For large chapter scenarios spanning 2,000 to 5,000+ instructions (e.g. `g01.ks` with 4,795 lines), the scrubber introduces **Adaptive 1000-Line Range Windows**:

- **Fine-Grained 1-Line Precision**: Within each 1,000-line window (e.g. `1 - 1000`, `1001 - 2000`, `2001 - 3000`, `3001 - 4000`, `4001 - 4795`), the slider spans that specific 1,000-line bracket, providing 1-line granular control.
- **Range Chunk Pills**: Clickable brackets above the slider let you switch focus across any section of the chapter or select `全场景 / Full (0 - N)` for broad scrubbing.
- **Auto Range Tracking**: As gameplay advances or jumps across 1,000-line thresholds, the active range window automatically encloses the current pointer.

---

## ⚡ 2. Step & Jump Navigation

- **Chunk Stepping**: `⏮ -1000` and `+1000 ⏭` buttons jump directly across 1,000-line blocks.
- **Fine Stepping**: `-10`, `◀ -1`, `+1 ▶`, and `+10` buttons for precise micro-adjustments.
- **🔖 Temporary Bookmarking (`书签` & `↩ 返回`)**: Press **书签 (Mark)** to remember your current reading line, explore earlier/later lines freely, and click **↩ 返回 (Return)** to instantly snap back to your bookmark.
- **📚 Table of Contents Jump (`目录`)**: One-click jump into the structured Story Milestones modal.
