// --- Default Key Shortcuts Configuration ---
export const DEFAULT_SHORTCUTS = {
  TOGGLE_FULLSCREEN: ['KeyF'],
  TOGGLE_TEXT: ['Space', 'KeyC'],
  TOGGLE_SAVE: ['KeyS'],
  TOGGLE_LOAD: ['KeyL'],
  OPEN_HISTORY_SEARCH: ['Slash'],
  TOGGLE_HISTORY: ['KeyH'],
  TOGGLE_AUTO: ['KeyA'],
  TOGGLE_SETTINGS: ['Semicolon'],
  QUIT_TO_TITLE: ['KeyM'],
  ADVANCE_TEXT: ['Enter']
};

// --- Fullscreen API Handler ---
export const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};
