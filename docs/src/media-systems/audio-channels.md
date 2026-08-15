# Audio Subsystem & Channel Isolation

The audio pipeline in `src/hooks/useGameAudio.ts` provides multi-channel playback and lifecycle synchronization.

---

## 📻 Dedicated Audio Channels

1. **BGM Player (`bgmPlayer`)**: Loops background music tracks (`.ogg`).
2. **SE Player (`sePlayer`)**: Plays sound effects (`.wav`).
3. **Voice Player (`voicePlayer`)**: Plays character voice lines (`.ogg`).

---

## 🔇 Title Screen Mute Isolation

To allow players to mute the Title Screen theme (`bgm_01`) without muting gameplay music, the engine maintains an isolated preference:
- Muting BGM on the title screen writes `school_bgm_muted = true`.
- When entering gameplay, `playBgm('bgm_test')` checks the requested track ID; only `bgm_01` respects the title mute flag, ensuring gameplay music plays normally.

---

## ⏸️ Tab Blur / Visibility Auto-Pause

When the browser tab loses focus or visibility:
```typescript
window.addEventListener('blur', pauseAll);
window.addEventListener('focus', resumeAll);
document.addEventListener('visibilitychange', handleVisibilityChange);
```
- Active audio channels pause and mark `__wasAutoPaused__ = true`.
- When the tab is refocused, only channels that were actively playing before the blur are automatically resumed.
