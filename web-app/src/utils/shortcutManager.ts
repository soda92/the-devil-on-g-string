// --- Default Key Shortcuts Configuration ---
export const DEFAULT_SHORTCUTS: Record<string, string[]> = {
  TOGGLE_FULLSCREEN: ['KeyF'],
  TOGGLE_TEXT: ['Space', 'KeyC'],
  TOGGLE_SAVE: ['KeyS'],
  TOGGLE_LOAD: ['KeyL'],
  OPEN_HISTORY_SEARCH: ['Slash'],
  TOGGLE_HISTORY: ['KeyH'],
  TOGGLE_AUTO: ['KeyA'],
  TOGGLE_SETTINGS: ['Semicolon'],
  QUIT_TO_TITLE: ['KeyQ'],
  ADVANCE_TEXT: ['Enter'],
  TOGGLE_IMMERSE: ['KeyI'],
  TOGGLE_MUTE: ['KeyM'],
  TOGGLE_TOC: ['KeyT'],
  TOGGLE_FLIPPER: ['KeyB']
};

// --- Fullscreen API Handler ---
export const toggleFullscreen = (): void => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err: Error) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};
