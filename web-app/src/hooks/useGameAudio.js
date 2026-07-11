import { useEffect, useRef, useState } from 'react';
import { resolveAsset } from '../utils/gameUtils';

// --- Singleton Audio Elements (Persisted globally to survive Vite HMR) ---
if (!globalThis.__bgmPlayer__) {
  globalThis.__bgmPlayer__ = new Audio();
  globalThis.__bgmPlayer__.loop = true;
}
if (!globalThis.__sePlayer__) {
  globalThis.__sePlayer__ = new Audio();
}
if (!globalThis.__voicePlayer__) {
  globalThis.__voicePlayer__ = new Audio();
}

const bgmPlayer = globalThis.__bgmPlayer__;
const sePlayer = globalThis.__sePlayer__;
const voicePlayer = globalThis.__voicePlayer__;

export function useGameAudio(vol = 8, sevol = 8) {
  const currentVoiceRef = useRef(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  
  // Track persistent mute preference in localStorage
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('school_bgm_muted') === 'true';
  });
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Synchronize playing state with actual audio events
  useEffect(() => {
    const onPlay = () => setIsBgmPlaying(true);
    const onPause = () => setIsBgmPlaying(false);
    bgmPlayer.addEventListener('play', onPlay);
    bgmPlayer.addEventListener('pause', onPause);
    // Initialize current state
    setIsBgmPlaying(!bgmPlayer.paused);
    return () => {
      bgmPlayer.removeEventListener('play', onPlay);
      bgmPlayer.removeEventListener('pause', onPause);
    };
  }, []);

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
    // Only apply the mute flag to the title screen theme 'bgm_01'
    if (storage === 'bgm_01' && isMutedRef.current) {
      bgmPlayer.pause();
    } else {
      if (bgmPlayer.paused) {
        bgmPlayer.play().catch(err => console.log("BGM play interrupted", err));
      }
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

  const toggleBgm = () => {
    if (bgmPlayer.paused) {
      // Unmute BGM
      setIsMuted(false);
      localStorage.setItem('school_bgm_muted', 'false');
      if (!bgmPlayer.src || bgmPlayer.src === window.location.href) {
        playBgm('bgm_01');
      } else {
        bgmPlayer.play().catch(err => console.log("BGM play interrupted", err));
      }
    } else {
      // Mute BGM
      setIsMuted(true);
      localStorage.setItem('school_bgm_muted', 'true');
      bgmPlayer.pause();
    }
  };

  // Auto-pause all active players when tab/app is inactive (lost focus/blur/hidden), and resume state when active
  useEffect(() => {
    const pauseAll = () => {
      if (bgmPlayer && !bgmPlayer.paused) {
        bgmPlayer.pause();
        bgmPlayer.__wasAutoPaused__ = true;
      }
      if (sePlayer && !sePlayer.paused) {
        sePlayer.pause();
        sePlayer.__wasAutoPaused__ = true;
      }
      if (voicePlayer && !voicePlayer.paused) {
        voicePlayer.pause();
        voicePlayer.__wasAutoPaused__ = true;
      }
    };

    const resumeAll = () => {
      if (document.hidden) return;
      if (bgmPlayer && bgmPlayer.__wasAutoPaused__) {
        bgmPlayer.play().catch(err => console.log("BGM auto-resume interrupted", err));
        bgmPlayer.__wasAutoPaused__ = false;
      }
      if (sePlayer && sePlayer.__wasAutoPaused__) {
        sePlayer.play().catch(err => console.log("SE auto-resume interrupted", err));
        sePlayer.__wasAutoPaused__ = false;
      }
      if (voicePlayer && voicePlayer.__wasAutoPaused__) {
        voicePlayer.play().catch(err => console.log("Voice auto-resume interrupted", err));
        voicePlayer.__wasAutoPaused__ = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAll();
      } else {
        resumeAll();
      }
    };

    window.addEventListener('blur', pauseAll);
    window.addEventListener('focus', resumeAll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', pauseAll);
      window.removeEventListener('focus', resumeAll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    playBgm,
    stopBgm,
    toggleBgm,
    isBgmPlaying,
    playSe,
    playVoice,
    bgmPlayer,
    sePlayer,
    voicePlayer,
    currentVoiceRef
  };
}
