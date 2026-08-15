# Save / Load & Document Archives System

The engine features a modern, unified **Document Archives (档案管理)** manager (`ArchivesModal.tsx`), replacing legacy split Save and Load screens with a single feature-rich hub.

---

## 🗄️ Unified Archives Features

1. **Custom Save Notes (备忘笔记)**:
   - When saving, players can attach a custom memo (e.g. *"Before deciding to trust Kanon"*, *"Ch3 climax scene"*).
   - Notes are searchable and editable inline anytime without reloading the save.
2. **Multi-Dimensional Views & Sorting**:
   - 🕒 **All Archives (最新优先)**: Shows autosave and manual saves sorted chronologically.
   - 📖 **By Chapter & Route (按章节与分支分类)**: Groups saves by story milestones (Chapter 1–5, Tsubaki Route, Kanon Route, Mizuha Route, Haru Epilogue).
   - ⭐ **Pinned / Favorites (标星收藏)**: Protects favorite milestone saves from being overwritten.
   - 🔍 **Real-time Full-Text Search**: Instant search across custom notes, spoken lines, speaker names, and scenario IDs.
3. **Rich Visual Cards**:
   - Live scene thumbnail preview rendering the saved background image.
   - Colored chapter badge and heroine affection meters.
   - Spoken dialogue quote snippet and date timestamp.
   - Action buttons: **▶️ 读取 (Load)**, **💾 覆盖 (Overwrite)**, **📌 标星 (Pin)**, **🗑️ 删除 (Delete)**.

---

## 💾 Save Slot Data Model (`SaveSlotData`)

```typescript
export interface SaveSlotData {
  slotId?: number | string;
  currentScenario: string;
  pointer: number;
  f: GameVariables;
  choicesHistory?: ChoiceHistoryItem[];
  sprites: SpritesState;
  background: string;
  speaker: string;
  currentSpeaker?: { jp: string; en: string };
  currentVoice?: string;
  dialogueText: string;
  dialogueMode: DialogueMode | string;
  language: Language | string;
  bgm?: string | null;
  callStack?: CallStackFrame[];
  date?: string;
  timestamp?: number;
  note?: string;      // User custom memo
  pinned?: boolean;   // Starred / protected from overwrite
}
```

---

## ☁️ Persistence & Multi-Profile Synchronization

- **Local Cache**: Saved instantly to `localStorage` under `${username}_save_slot_${id}`.
- **Cloud / REST Backend**: Synchronized via `POST /api/save-slot` and `DELETE /api/save-slot?slot=${id}` with user session isolation.
