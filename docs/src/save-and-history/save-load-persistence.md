# Save / Load & Multi-User Persistence

The engine provides 24 save slots per profile across 3 pages (8 slots per page), along with automated checkpointing (`autosave`) and chapter handoff slots (`slot 150`).

---

## 💾 Save Slot Structure (`SaveSlotData`)

```typescript
export interface SaveSlotData {
  slotId: number | string;
  currentScenario: string;
  pointer: number;
  f: GameVariables;
  choicesHistory: ChoiceHistoryItem[];
  sprites: SpritesState;
  background: string;
  speaker?: string;
  currentVoice?: string;
  dialogueText: string;
  dialogueMode: DialogueMode | string;
  language: Language;
  bgm?: string | null;
  date: string;
  timestamp: number;
}
```

---

## 👥 Multi-Profile Isolation

Save keys and system flags are scoped by `storagePrefix` (e.g. `${username}_save_slot_0`, `${username}_sf`). Switching user profiles immediately swaps the active save bank without data collisions.

---

## ☁️ Dual-Layer Synchronization

1. **Immediate Local Cache**: Saves are serialized into `localStorage` instantly.
2. **Asynchronous REST Synchronization**: Saves are POSTed to `/api/save-slot` and `/api/save-sf` in the background with debounced timers.
