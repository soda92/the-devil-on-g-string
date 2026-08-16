# Dialogue Modes (AVG, Novel, Subtitle)

The engine supports three distinct dialogue presentation modes:

---

## 🎭 1. AVG Mode (Adventure Game)
- **Position**: Anchored at the bottom third of the screen.
- **Components**: Character Nameplate badge, optional speaker Face Icon avatar, and lower action bar.
- **Behavior**: Accumulates text between `page_break` markers or clears automatically on speaker transitions.
- **Customization**: Independent background opacity (`sf.avgOpacity`) and blur level (`sf.avgBlur`).

---

## 📖 2. Novel Mode (NVL / Full-Screen)
- **Position**: Covers 90% of the game window.
- **Components**: Centered wide text display without nameplate popups.
- **Behavior**: Accumulates multiple narrative paragraphs sequentially across pages.
- **Customization**: Independent background opacity (`sf.novelOpacity`) and blur level (`sf.novelBlur`).

---

## 🎬 3. Subtitle / Immersive Mode (`Key I`)
- **Position**: Clean floating subtitles anchored at the bottom with high-contrast text shadows.
- **Components**: All background boxes, borders, and system action bars are removed.
- **Nameplate Prefix**: If speaker is present, prepends `[Speaker Name]` inline before dialogue.
- **Hover Action**: Hovering over the text reveals a subtle quick-exit button (`Exit Subtitles`).
