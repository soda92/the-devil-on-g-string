# Table of Contents & Scene Indexing

To bring physical book reading navigation to visual novels, the engine provides an interactive **Table of Contents** (`Key T`).

---

## 📑 Chapter & Scene Indexing

The Table of Contents parses story milestones and scene labels:
- **Main Story Chapters**: Chapter 1 through Chapter 5.
- **Heroine Branch Routes**:
  - Tsubaki Miwa Route (`gt01` – `gt08`, `gted`)
  - Kanon Mizuhara Route (`gk01` – `gk08`, `gked`)
  - Mizuha Shiratori Route (`gm01` – `gm08`, `gmed`)
  - True End Haru Epilogue (`g50` – `g55`)

---

## 🚀 Instant Topic Jumping

Selecting any chapter or topic triggers `jumpToTopic(scenarioName, labelName)`, which runs the backtracking pre-scanner to establish correct background and BGM without breaking game state.
