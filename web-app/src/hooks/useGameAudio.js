import { useEffect, useRef } from 'react';
import { resolveAsset } from '../utils/gameUtils';

// --- Singleton Audio Elements ---
const bgmPlayer = new Audio();
bgmPlayer.loop = true;

const sePlayer = new Audio();
const voicePlayer = new Audio();

// Clean up audio playback on Vite hot reloads
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    bgmPlayer.pause();
    sePlayer.pause();
    voicePlayer.pause();
  });
}

export function useGameAudio(vol = 8, sevol = 8) {
  const currentVoiceRef = useRef(null);

  // Sync volumes when they change
  useEffect(() => {
    const bgmVol = typeof vol === 'number' && !isNaN(vol) ? vol : 8;
    const seVol = typeof sevol === 'number' && !isNaN(sevol) ? sevol : 8;
    bgmPlayer.volume = bgmVol / 10;
    sePlayer.volume = seVol / 10;
    voicePlayer.volume = seVol / 10;
  }, [vol, sevol]);

  const playBgm = (storage) => {
    if (!storage) return;
    const url = resolveAsset(storage, 'bgm');
    const fullUrl = window.location.origin + url;
    if (bgmPlayer.src !== fullUrl) {
      bgmPlayer.src = url;
    }
    if (bgmPlayer.paused) {
      bgmPlayer.play().catch(err => console.log("BGM play interrupted", err));
    }
  };

  const stopBgm = () => {
    bgmPlayer.pause();
  };

  const playSe = (storage) => {
    if (!storage) return;
    const url = resolveAsset(storage, 'sound');
    sePlayer.src = url;
    sePlayer.play().catch(err => console.log("SE play interrupted", err));
  };

  const playVoice = (storage) => {
    if (!storage) return;
    const url = resolveAsset(storage, 'voice');
    voicePlayer.src = url;
    currentVoiceRef.current = storage;
    voicePlayer.play().catch(err => console.log("Voice play interrupted", err));
  };

  return {
    playBgm,
    stopBgm,
    playSe,
    playVoice,
    bgmPlayer,
    sePlayer,
    voicePlayer,
    currentVoiceRef
  };
}
