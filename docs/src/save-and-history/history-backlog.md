# Backlog History, Search & Rewind

The dialogue backlog (`HistoryModal.tsx`) records previous dialogue lines, character voices, and variable state snapshots.

---

## 🔍 Instant Search & Highlight

- **Keyboard Shortcut**: Pressing `/` (`Slash`) opens the backlog and automatically focuses the search input.
- **Safe Highlighting**: The `highlightText` helper uses a non-greedy regex (`(${query})(?![^<>]*>)`) to wrap matching text in `<mark>` elements without corrupting internal HTML tags or ruby formatting.

---

## ⏪ Time-Travel Dialogue Rewind

Each backlog entry contains a lightweight snapshot of scenario position and variables:
```typescript
interface HistoryLogItem {
  id: string | number;
  speakerJp?: string;
  speakerEn?: string;
  textJp?: string;
  textEn?: string;
  voice?: string;
  snapshot?: {
    currentScenario: string;
    pointer: number;
    f: GameVariables;
  };
}
```

When a player clicks a backlog entry, the engine prompts for confirmation, then reverts scenario position, character variables, and sprites to that exact moment in time without duplicating dialogue text.
