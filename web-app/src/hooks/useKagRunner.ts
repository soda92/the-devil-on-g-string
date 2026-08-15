import { useState, useEffect, useRef } from 'react';
import { resolveCharacterName, tokenizeText } from '../utils/gameUtils';
import { DEFAULT_SHORTCUTS, toggleFullscreen } from '../utils/shortcutManager';
import {
  applyTranslationImprovements,
  getFaceIcon,
  backtrackScenarioState
} from '../utils/kagHelpers';
import {
  cleanFForSnapshot,
  cleanChoicesHistoryForSave,
  cleanHistoryLogForSave,
  stripHistoryForLocalStorage
} from '../utils/kagEvaluator';
import { GameVariables, SystemFlags, Language, GameState } from '../types/kag';

export function useKagRunner({
  config,
  playBgm,
  stopBgm,
  playSe,
  playVoice,
  currentVoiceRef,
  bgmPlayer,
  sePlayer,
  voicePlayer,
  toggleBgm
}) {
  const storagePrefix = config?.storagePrefix || 'school';

  const [username, setUsernameState] = useState(() => localStorage.getItem('school_username') || 'default');

  const setUsername = (newUsername) => {
    localStorage.setItem('school_username', newUsername);
    setUsernameState(newUsername);
  };

  const clientIdRef = useRef(null);
  if (!clientIdRef.current) {
    let id = typeof window !== 'undefined' ? sessionStorage.getItem('session_client_id') : null;
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('session_client_id', id);
      }
    }
    clientIdRef.current = id;
  }

  const [sessionConflict, setSessionConflict] = useState(false);

  // Heartbeat loop to detect concurrent sessions
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Username': username
          },
          body: JSON.stringify({ clientId: clientIdRef.current })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.status === 'conflict') {
            setSessionConflict(true);
          } else {
            setSessionConflict(false);
          }
        }
      } catch (e) {
        console.warn("Heartbeat failed", e);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 3000);
    return () => clearInterval(interval);
  }, [username]);

  const [language, setLanguage] = useState<Language>('JP');
  const [gameState, setGameState] = useState<GameState>('TITLE');

  // Visual Novel States
  const [currentScenario, setCurrentScenario] = useState(config?.initial?.scenario || 'g01');
  const [scenarioData, setScenarioData] = useState(null);
  const [pointer, setPointer] = useState(0);
  const [callStack, setCallStack] = useState([]);
  const callStackRef = useRef([]);
  callStackRef.current = callStack;
  const [background, setBackground] = useState(config?.initial?.background || 'white');
  const [sprites, setSprites] = useState({ 0: null, 1: null, 2: null });
  const [speaker, setSpeaker] = useState('');
  const [currentVoice, setCurrentVoice] = useState('');
  const [dialogueText, setDialogueText] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [faceIcon, setFaceIcon] = useState(null);
  const [textVisible, setTextVisible] = useState(false);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [dialogueMode, setDialogueMode] = useState<any>('avg');
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [isFastForward, setIsFastForward] = useState<boolean>(false);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<any>(false);
  const [sideNarration, setSideNarration] = useState<any>({ visible: false, text: '', side: 'left', top: 130 });
  const [showSaveLoad, setShowSaveLoad] = useState<any>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChoiceGraph, setShowChoiceGraph] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showTableOfContents, setShowTableOfContents] = useState<boolean>(false);
  const [showPageFlipper, setShowPageFlipper] = useState<boolean>(false);
  const [historySearchFocused, setHistorySearchFocused] = useState<boolean>(true);

  const [quakeActive, setQuakeActive] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<any>(null);

  const [saveSlots, setSaveSlots] = useState<Record<string | number, any>>(() => {
    const initial: Record<string | number, any> = {};
    const auto = localStorage.getItem(`${storagePrefix}_autosave`);
    if (auto) {
      try { initial.autosave = JSON.parse(auto); } catch (_e) { }
    }
    for (let i = 0; i < 24; i++) {
      const slot = localStorage.getItem(`${storagePrefix}_save_slot_${i}`);
      if (slot) {
        try { initial[i] = JSON.parse(slot); } catch (_e) { }
      }
    }
    // Load special chapter-transition slot 150
    const slot150 = localStorage.getItem(`${storagePrefix}_save_slot_150`);
    if (slot150) {
      try { initial[150] = JSON.parse(slot150); } catch (_e) { }
    }
    return initial;
  });

  const [f, setF] = useState<GameVariables>(() => {
    return {
      ...(config?.defaultF || {}),
      choicesHistory: [],
      chour: new Date().getHours()
    };
  });

  const [sf, setSf] = useState<SystemFlags>(() => {
    const saved = localStorage.getItem(`${storagePrefix}_sf`);
    const defaults: SystemFlags = {
      game_clear: 0,
      kanon_clear: 0,
      mizuha_clear: 0,
      tubaki_clear: 0,
      show_next_chapter: 0,
      first: 1,
      vol: 8,
      sevol: 8,
      typewriterMode: 'CHAR',
      avgOpacity: 6,
      avgBlur: 16,
      novelOpacity: 8,
      novelBlur: 8,
      vAlign: 'TOP',
      hAlign: 'LEFT',
      immerseMode: false,
      skipMode: 'READ_ONLY',
      ...(config?.defaultSf || {})
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (_e) { }
    }
    return defaults;
  });

  const [tf, setTf] = useState<Record<string, any>>({});
  const tfRef = useRef({});
  useEffect(() => {
    tfRef.current = tf;
  }, [tf]);


  // Autoplay lock states
  const [isAudioUnlocked, setIsAudioUnlockedState] = useState(false);
  const isAudioUnlockedRef = useRef(false);
  const setIsAudioUnlocked = (val) => {
    setIsAudioUnlockedState(val);
    isAudioUnlockedRef.current = val;
  };

  const initialBgmRef = useRef('');
  const initialVoiceRef = useRef('');
  const dialogueTextRef = useRef('');
  const lastFetchIdRef = useRef(0);
  const autosaveTimeoutRef = useRef(null);
  const backgroundRef = useRef('white');
  const spritesRef = useRef({ 0: null, 1: null, 2: null });
  const fRef = useRef({});
  const sfRef = useRef({});
  const isFastForwardRef = useRef(false);
  const isAutoModeRef = useRef(false);
  const textTimerRef = useRef(null);
  const handleScreenClickRef = useRef(null);
  const currentSpeakerRef = useRef({ jp: '', en: '' });
  const hasNmCommandRef = useRef(false);
  const hasWaitedClickRef = useRef(false);

  // Update Refs to keep useEffect loop runner closures in sync
  const updateDialogueText = (val) => {
    setDialogueText(val);
    dialogueTextRef.current = val;
  };

  useEffect(() => {
    backgroundRef.current = background;
  }, [background]);

  useEffect(() => {
    spritesRef.current = sprites;
  }, [sprites]);

  useEffect(() => {
    fRef.current = f;
  }, [f]);

  useEffect(() => {
    sfRef.current = sf;
  }, [sf]);

  useEffect(() => {
    isFastForwardRef.current = isFastForward;
  }, [isFastForward]);

  useEffect(() => {
    isAutoModeRef.current = isAutoMode;
  }, [isAutoMode]);

  // Initial local storage and backend state synchronizer
  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/state', {
          headers: {
            'X-Username': username,
            'X-Client-ID': clientIdRef.current
          }
        });
        if (response.ok) {
          const state = await response.json();
          if (state && state.f) setF(prev => ({ ...prev, ...state.f }));
          if (state && state.sf) {
            setSf(prev => {
              const next = { ...prev, ...state.sf };
              let needsBackendSave = false;
              if (next.vol === undefined || isNaN(next.vol)) {
                next.vol = 8;
                needsBackendSave = true;
              }
              if (next.sevol === undefined || isNaN(next.sevol)) {
                next.sevol = 8;
                needsBackendSave = true;
              }
              localStorage.setItem(`${storagePrefix}_sf`, JSON.stringify(next));
              if (needsBackendSave) {
                fetch('/api/save-sf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Username': username,
                    'X-Client-ID': clientIdRef.current
                  },
                  body: JSON.stringify({ sf: next })
                }).catch(e => console.warn("Failed to auto-save default SF to backend", e));
              }
              return next;
            });
          }
          if (state && state.slots) {
            setSaveSlots(state.slots);
            const activeSlots = state.slots || {};

            // Sync autosave
            const autosaveKey = `${storagePrefix}_autosave`;
            if (activeSlots.autosave) {
              const auto = activeSlots.autosave;
              localStorage.setItem(autosaveKey, JSON.stringify(stripHistoryForLocalStorage(auto)));
              setF(prev => {
                const nextF = { ...prev, ...auto.f };
                if (auto.choicesHistory) {
                  nextF.choicesHistory = auto.choicesHistory;
                }
                return nextF;
              });
              if (auto.historyLog && auto.historyLog.length > 0) {
                setHistoryLog(auto.historyLog);
              }
            } else {
              localStorage.removeItem(autosaveKey);
            }

            // Sync manual slots
            for (let i = 0; i < 24; i++) {
              const key = `${storagePrefix}_save_slot_${i}`;
              if (activeSlots[i]) {
                localStorage.setItem(key, JSON.stringify(stripHistoryForLocalStorage(activeSlots[i])));
              } else {
                localStorage.removeItem(key);
              }
            }

            // Sync special transition slot 150
            const key150 = `${storagePrefix}_save_slot_150`;
            if (activeSlots[150]) {
              localStorage.setItem(key150, JSON.stringify(stripHistoryForLocalStorage(activeSlots[150])));
            } else {
              localStorage.removeItem(key150);
            }
          } else {
            setSaveSlots({});
            localStorage.removeItem(`${storagePrefix}_autosave`);
            for (let i = 0; i < 24; i++) {
              localStorage.removeItem(`${storagePrefix}_save_slot_${i}`);
            }
            localStorage.removeItem(`${storagePrefix}_save_slot_150`);
          }
        }
      } catch (e) {
        console.warn("Failed to load backend state, falling back to localStorage", e);
        const savedSf = localStorage.getItem(`${storagePrefix}_sf`);
        if (savedSf) setSf(prev => ({ ...prev, ...JSON.parse(savedSf) }));
      }
    };
    init();
  }, [username]);

  const updateSf = (updater) => {
    setSf(prev => {
      const nextSf = typeof updater === 'function' ? updater(prev) : updater;
      fetch('/api/save-sf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
          'X-Client-ID': clientIdRef.current
        },
        body: JSON.stringify(nextSf)
      }).catch(err => console.error("Failed to save SF to backend", err));
      localStorage.setItem(`${storagePrefix}_sf`, JSON.stringify(nextSf));
      return nextSf;
    });
  };

  const cleanKagExpression = (exp) => {
    if (!exp) return '';
    return exp.replace(/\[(sf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
      .replace(/\[(f\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
      .replace(/\[(tf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1');
  };

  const evaluateExpression = (exp, currentF = f, currentSf = sf, currentTf = tfRef.current) => {
    if (!exp) return true;
    try {
      const cleaned = cleanKagExpression(exp);
      const func = new Function('f', 'sf', 'tf', `return (${cleaned});`);
      return func(currentF, currentSf, currentTf);
    } catch (e) {
      console.error("Expression evaluation failed:", exp, e);
      return false;
    }
  };

  const executeStatement = (exp) => {
    if (!exp) return;
    try {
      const tempF = { ...f };
      const tempSf = { ...sf };
      const tempTf = { ...tf };
      const cleaned = cleanKagExpression(exp);
      const func = new Function('f', 'sf', 'tf', `${cleaned}; return { f, sf, tf };`);
      const result = func(tempF, tempSf, tempTf);
      setF(result.f);
      updateSf(result.sf);
      setTf(result.tf);
    } catch (e) {
      console.error("Statement execution failed:", exp, e);
    }
  };

  const skipToEndif = (startPtr) => {
    let depth = 1;
    let p = startPtr;
    while (p < scenarioData.length && depth > 0) {
      const inst = scenarioData[p];
      if (inst.type === 'if') depth++;
      else if (inst.type === 'endif') depth--;
      p++;
    }
    return p;
  };

  const loadScenario = async (name, targetLabel = null, overridePointer = null, shouldWait = false, skipPreScanner = false) => {
    if (name === 'option' || name === 'systembutton') {
      setShowSettings(true);
      return;
    }
    if (name === 'title' || name === 'backtotitle') {
      stopBgm();
      setGameState('TITLE');
      return;
    }

    const fetchId = ++lastFetchIdRef.current;
    setScenarioData(null);
    setIsWaiting(true);
    try {
      const response = await fetch(`/scenarios/${name}.json`);
      if (!response.ok) throw new Error(`Failed to fetch scenario: ${name}`);
      const data = await response.json();

      if (fetchId !== lastFetchIdRef.current) return;

      const instructions = applyTranslationImprovements(data.instructions);
      data.instructions = instructions;
      setScenarioData(instructions);
      setCurrentScenario(name);

      let startIdx = 0;
      if (overridePointer !== null) {
        let targetTextIdx = overridePointer;
        while (targetTextIdx >= 0 && data.instructions[targetTextIdx]?.type !== 'text') {
          targetTextIdx--;
        }
        startIdx = targetTextIdx >= 0 ? targetTextIdx : overridePointer;

        if (!skipPreScanner) {
          let initialBg = 'white';
          let initialBgm = '';
          let initialSprites = { 0: null, 1: null, 2: null };
          let initialSpeaker = '';
          let initialDialogueMode = 'avg';
          let initialVoice = '';
          let hasNm = false;

          for (let i = 0; i < startIdx; i++) {
            const inst = data.instructions[i];
            if (inst) {
              if (inst.type === 'page_break' || inst.type === 'clear_text') {
                initialSpeaker = '';
                initialVoice = '';
                hasNm = false;
              } else if (inst.type === 'text') {
                if (!hasNm) {
                  initialSpeaker = '';
                }
                hasNm = false;
              } else if (inst.type === 'command') {
                const args = inst.args || {};
                if (inst.name === 'playbgm' || inst.name === 'bgm' || inst.name === 'fadeinbgm' || inst.name === 'fibgm' || inst.name === 'xbgm') {
                  initialBgm = args.storage;
                } else if (inst.name === 'stbgm' || inst.name === 'stopbgm' || inst.name === 'fadeoutbgm' || inst.name === 'fobgm' || inst.name === 'sbgm') {
                  initialBgm = '';
                } else if (inst.name === 'bg' || inst.name === 'bg2' || inst.name === 'bg_ch' || inst.name === 'b_ch') {
                  initialBg = args.str || args.storage || 'black';
                  initialSprites = { 0: null, 1: null, 2: null };
                } else if (inst.name === 'ev' || inst.name === 'ev_ch' || inst.name === 'ev_mosaic') {
                  if (args.str || args.storage) {
                    initialBg = args.str || args.storage;
                  }
                  initialSprites = { 0: null, 1: null, 2: null };
                } else if (inst.name === 'black' || inst.name === 'hide') {
                  if (inst.name === 'black') {
                    initialBg = 'black';
                  }
                  initialSprites = { 0: null, 1: null, 2: null };
                } else if (inst.name === 'image') {
                  if (args.layer === 'base' && args.storage) {
                    initialBg = args.storage;
                  } else if (args.layer !== 'base') {
                    const layer = args.layer !== undefined ? parseInt(args.layer) : 2;
                    if (args.visible === 'false' || !args.storage) {
                      initialSprites[layer] = null;
                    } else {
                      const isBgOrEv = args.storage.startsWith('bg') || args.storage.startsWith('ev_') || args.storage === 'black' || args.storage === 'white';
                      if (isBgOrEv) {
                        initialBg = args.storage;
                      } else {
                        initialSprites[layer] = args.storage;
                      }
                    }
                  }
                } else if (inst.name === 'chr' || inst.name === 'chr_dash' || inst.name === 'chr_walk' || inst.name === 'chr_jump' || inst.name === 'chr_bow') {
                  if (args.c !== undefined) initialSprites[2] = args.c;
                  if (args.l !== undefined) initialSprites[1] = args.l;
                  if (args.r !== undefined) initialSprites[0] = args.r;
                } else if (inst.name === 'mface') {
                  const match = args.name.match(/^[a-zA-Z]+/);
                  const charPrefix = match ? match[0] : '';
                  if (charPrefix) {
                    for (let layer = 0; layer < 3; layer++) {
                      if (initialSprites[layer] && initialSprites[layer].startsWith(charPrefix)) {
                        initialSprites[layer] = args.name;
                        break;
                      }
                    }
                  }
                } else if (inst.name === 'chr_pos_change') {
                  const mapPosToSlot = (pos) => {
                    if (pos === 'c' || pos === 'cc') return 2;
                    if (pos === 'l' || pos === 'll') return 1;
                    if (pos === 'r' || pos === 'rr') return 0;
                    return -1;
                  };
                  const beforeSlot = mapPosToSlot(args.before);
                  const afterSlot = mapPosToSlot(args.after);
                  if (beforeSlot !== -1 && afterSlot !== -1) {
                    const sprite = initialSprites[beforeSlot];
                    initialSprites[afterSlot] = sprite;
                    if (beforeSlot !== afterSlot) {
                      initialSprites[beforeSlot] = null;
                    }
                  }
                } else if (inst.name === 'chr1') {
                  initialSprites[2] = args.str;
                } else if (inst.name === 'chr2') {
                  initialSprites[1] = args.str;
                } else if (inst.name === 'chr3') {
                  initialSprites[0] = args.str;
                } else if (inst.name === 'dellay' || inst.name === 'dellay_far' || inst.name === 'dellay_walk' || inst.name === 'dellay_dash') {
                  const pos = args.pos;
                  if (pos === 'c' || pos === 'cc') initialSprites[2] = null;
                  if (pos === 'l' || pos === 'll') initialSprites[1] = null;
                  if (pos === 'r' || pos === 'rr') initialSprites[0] = null;
                } else if (inst.name === 'delchr') {
                  const l = args.layer !== undefined ? parseInt(args.layer) : 2;
                  initialSprites[l] = null;
                } else if (inst.name === 'alldelchr') {
                  initialSprites = { 0: null, 1: null, 2: null };
                } else if (inst.name === 'name' || inst.name === 'nm') {
                  initialSpeaker = args.txt || args.t || '';
                  initialVoice = args.s || '';
                  hasNm = true;
                } else if (inst.name === 'novel') {
                  initialDialogueMode = 'novel';
                } else if (inst.name === 'avg' || inst.name === 'avg_with_name') {
                  initialDialogueMode = 'avg';
                }
              }
            }
          }

          if (initialBg === 'white' || !initialBgm) {
            const backtracked = await backtrackScenarioState(name);
            if (initialBg === 'white') {
              initialBg = backtracked.bg;
            }
            if (!initialBgm) {
              initialBgm = backtracked.bgm;
            }
          }

          setBackground(initialBg);
          backgroundRef.current = initialBg;
          setSprites(initialSprites);
          spritesRef.current = initialSprites;
          setDialogueMode(initialDialogueMode);

          hasNmCommandRef.current = hasNm;

          if (initialSpeaker) {
            const resolvedSp = resolveCharacterName(initialSpeaker, 'JP', config?.characterNames);
            setSpeaker(resolvedSp);
            currentSpeakerRef.current = { jp: resolvedSp, en: resolveCharacterName(resolvedSp, 'EN', config?.characterNames) };
          } else {
            setSpeaker('');
            currentSpeakerRef.current = { jp: '', en: '' };
          }
          initialVoiceRef.current = initialVoice;
          setCurrentVoice(initialVoice);
          if (initialVoice) {
            playVoice(initialVoice);
          } else if (voicePlayer) {
            voicePlayer.pause();
            voicePlayer.src = '';
          }
          if (initialBgm) {
            initialBgmRef.current = initialBgm;
            playBgm(initialBgm);
          } else {
            initialBgmRef.current = '';
            stopBgm();
          }
        }
      } else if (targetLabel) {
        const idx = data.instructions.findIndex(i => i.type === 'label' && i.name === targetLabel);
        if (idx !== -1) {
          startIdx = idx;
        } else {
          console.warn(`Label ${targetLabel} not found in ${name}`);
        }
      }
      setPointer(overridePointer !== null ? overridePointer : startIdx);
      setIsWaiting(shouldWait);
      setShowOptions(false);
      console.log(`Loaded scenario ${name} at pointer ${overridePointer !== null ? overridePointer : startIdx}`);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerTypewriter = (startText, appendText) => {
    if (textTimerRef.current) clearInterval(textTimerRef.current);

    const speedMode = sf.typewriterMode || 'CHAR';
    if (speedMode === 'OFF') {
      setTypewriterText(startText + appendText);
      return;
    }

    const tokens = tokenizeText(appendText, language);
    let tokenIdx = 0;
    let accumulated = startText;

    setTypewriterText(accumulated);

    textTimerRef.current = setInterval(() => {
      if (tokenIdx < tokens.length) {
        accumulated += tokens[tokenIdx];
        setTypewriterText(accumulated);
        tokenIdx++;
      } else {
        clearInterval(textTimerRef.current);
      }
    }, language === 'EN' ? 45 : 30);
  };

  // Play main theme on Title Screen
  useEffect(() => {
    const hasDeepLink = new URLSearchParams(window.location.search).has('scen');
    if (gameState === 'TITLE' && !hasDeepLink) {
      playBgm('bgm_01');
    }
  }, [gameState]);

  // Play BGM and Voice once audio is unlocked
  useEffect(() => {
    if (isAudioUnlocked) {
      if (gameState === 'TITLE') {
        const hasDeepLink = new URLSearchParams(window.location.search).has('scen');
        if (!hasDeepLink) {
          playBgm('bgm_01');
        }
      } else if (gameState === 'PLAYING') {
        if (initialBgmRef.current) {
          playBgm(initialBgmRef.current);
        } else {
          stopBgm();
        }
        if (initialVoiceRef.current) {
          playVoice(initialVoiceRef.current);
        }
      }
    }
  }, [isAudioUnlocked, gameState]);

  // Clean up autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, []);

  const triggerAutosave = (currentP = pointer, currentScen = currentScenario) => {
    if (gameState !== 'PLAYING' || currentP <= 0 || !currentScen) return;

    const saveData = {
      slotId: 'autosave',
      f: cleanFForSnapshot(f),
      choicesHistory: cleanChoicesHistoryForSave(f.choicesHistory),
      sprites,
      background,
      speaker,
      currentSpeaker: currentSpeakerRef.current,
      currentVoice,
      dialogueText: dialogueTextRef.current,
      dialogueMode,
      language,
      currentScenario: currentScen,
      pointer: currentP,
      showOptions: showOptions || null,
      historyLog: cleanHistoryLogForSave(historyLog),
      bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
      callStack: callStackRef.current,
      date: new Date().toLocaleString(),
      timestamp: Date.now()
    };

    localStorage.setItem(`${storagePrefix}_autosave`, JSON.stringify(stripHistoryForLocalStorage(saveData)));
    setSaveSlots(prev => ({ ...prev, autosave: saveData }));

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      fetch('/api/save-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username,
          'X-Client-ID': clientIdRef.current
        },
        body: JSON.stringify({ slot: 'autosave', data: saveData })
      }).catch(e => console.error('Failed to save autosave to backend', e));
    }, 500);
  };

  // Trigger autosave when pointer, scenario, or history log changes
  useEffect(() => {
    if (gameState === 'PLAYING' && pointer > 0 && currentScenario) {
      triggerAutosave(pointer, currentScenario);
    }
  }, [pointer, currentScenario, gameState, historyLog]);

  // Main Scenario Interpreter Loop Runner
  useEffect(() => {
    if (gameState !== 'PLAYING' || !scenarioData || pointer >= scenarioData.length || isWaiting) return;

    let p = pointer;
    let shouldBlock = false;
    let newF: any = { ...fRef.current };
    let newSf: any = { ...sfRef.current };
    let newTf: any = { ...tfRef.current };
    let tempSprites: any = { ...spritesRef.current };
    let tempBackground: any = backgroundRef.current;
    const collectedOptions: any[] = [];

    while (p < scenarioData.length && !shouldBlock) {
      const inst = scenarioData[p];
      p++;

      switch (inst.type) {
        case 'label':
          break;
        case 'comment':
          break;
        case 'command':
          const args = inst.args || {};
          if (args.cond) {
            if (!evaluateExpression(args.cond, newF, newSf, newTf)) {
              break;
            }
          }
          if (inst.name === 'playbgm' || inst.name === 'bgm' || inst.name === 'fadeinbgm' || inst.name === 'fibgm' || inst.name === 'xbgm') {
            initialBgmRef.current = args.storage;
            playBgm(args.storage);
          } else if (inst.name === 'save') {
            const place = args.place !== undefined ? parseInt(args.place) : 150;
            handleSaveSlot(place, p, currentScenario, newF, newSf, tempSprites, tempBackground);
          } else if (inst.name === 'stbgm' || inst.name === 'stopbgm' || inst.name === 'fadeoutbgm' || inst.name === 'fobgm' || inst.name === 'sbgm') {
            initialBgmRef.current = '';
            stopBgm();
          } else if (inst.name === 'playse' || inst.name === 'se' || inst.name === 'fadeinse' || inst.name === 'fise') {
            playSe(args.storage);
          } else if (inst.name === 'stopse' || inst.name === 'fadeoutse' || inst.name === 'fose' || inst.name === 'sse') {
            // Stop sound effect
            sePlayer.pause();
            sePlayer.src = '';
          } else if (inst.name === 'bg' || inst.name === 'bg2' || inst.name === 'bg_ch' || inst.name === 'b_ch') {
            tempBackground = args.str || args.storage || 'black';
            tempSprites = { 0: null, 1: null, 2: null };
          } else if (inst.name === 'ev' || inst.name === 'ev_ch' || inst.name === 'ev_mosaic') {
            const cgStorage = args.str || args.storage;
            if (cgStorage) {
              tempBackground = cgStorage;
              newSf[cgStorage] = 1;
            }
            tempSprites = { 0: null, 1: null, 2: null };
          } else if (inst.name === 'hide') {
            tempSprites = { 0: null, 1: null, 2: null };
            setTextVisible(false);
          } else if (inst.name === 'show') {
            setTextVisible(true);
          } else if (inst.name === 'wait') {
            const delay = args.time ? parseInt(args.time) : 0;
            if (delay > 0 && !isFastForwardRef.current) {
              setIsWaiting(true);
              setTimeout(() => {
                setIsWaiting(false);
              }, delay);
              shouldBlock = true;
              break;
            }
          } else if (inst.name === 'wvl') {
            if (voicePlayer && !voicePlayer.paused && !voicePlayer.ended && !isFastForwardRef.current) {
              setIsWaiting(true);
              const onVoiceEnd = () => {
                setIsWaiting(false);
                voicePlayer.removeEventListener('ended', onVoiceEnd);
                voicePlayer.removeEventListener('pause', onVoiceEnd);
              };
              voicePlayer.addEventListener('ended', onVoiceEnd);
              voicePlayer.addEventListener('pause', onVoiceEnd);
              shouldBlock = true;
              break;
            }
          } else if (inst.name === 'quake' || inst.name === 'squake') {
            const time = args.time ? parseInt(args.time) : 800;
            setQuakeActive(true);
            if (inst.name === 'quake') {
              setTimeout(() => {
                setQuakeActive(false);
              }, time);
            }
          } else if (inst.name === 'stopquake') {
            setQuakeActive(false);
          } else if (inst.name === 'flash' || inst.name === 'flash_3times') {
            const color = args.color ? args.color : 'white';
            const time = args.time ? parseInt(args.time) : 150;
            if (inst.name === 'flash_3times') {
              setFlashActive(color);
              setTimeout(() => setFlashActive(null), 100);
              setTimeout(() => setFlashActive(color), 200);
              setTimeout(() => setFlashActive(null), 300);
              setTimeout(() => setFlashActive(color), 400);
              setTimeout(() => setFlashActive(null), 500);
            } else {
              setFlashActive(color);
              setTimeout(() => {
                setFlashActive(null);
              }, time);
            }
          } else if (inst.name === 'image') {
            const storage = args.storage;
            const layerStr = String(args.layer || '');
            const layer = args.layer !== undefined ? parseInt(args.layer) : 2;

            if (layerStr === 'base') {
              if (storage) {
                tempBackground = storage;
              }
            } else {
              if (args.visible === 'false' || !storage) {
                tempSprites[layer] = null;
              } else {
                const isBgOrEv = storage.startsWith('bg') || storage.startsWith('ev_') || storage === 'black' || storage === 'white';
                if (isBgOrEv) {
                  tempBackground = storage;
                } else {
                  tempSprites[layer] = storage;
                }
              }
            }
          } else if (inst.name === 'chr' || inst.name === 'chr_dash' || inst.name === 'chr_walk' || inst.name === 'chr_jump' || inst.name === 'chr_bow') {
            if (args.c !== undefined) tempSprites[2] = args.c;
            else if (args.cc !== undefined) tempSprites[2] = args.cc;
            if (args.l !== undefined) tempSprites[1] = args.l;
            else if (args.ll !== undefined) tempSprites[1] = args.ll;
            if (args.r !== undefined) tempSprites[0] = args.r;
            else if (args.rr !== undefined) tempSprites[0] = args.rr;
          } else if (inst.name === 'black') {
            tempBackground = 'black';
            tempSprites = { 0: null, 1: null, 2: null };
          } else if (inst.name === 'mface') {
            const match = args.name.match(/^[a-zA-Z]+/);
            const charPrefix = match ? match[0] : '';
            if (charPrefix) {
              for (let layer = 0; layer < 3; layer++) {
                if (tempSprites[layer] && tempSprites[layer].startsWith(charPrefix)) {
                  tempSprites[layer] = args.name;
                  break;
                }
              }
            }
          } else if (inst.name === 'chr_pos_change') {
            const mapPosToSlot = (pos) => {
              if (pos === 'c' || pos === 'cc') return 2;
              if (pos === 'l' || pos === 'll') return 1;
              if (pos === 'r' || pos === 'rr') return 0;
              return -1;
            };
            const beforeSlot = mapPosToSlot(args.before);
            const afterSlot = mapPosToSlot(args.after);
            if (beforeSlot !== -1 && afterSlot !== -1) {
              const sprite = tempSprites[beforeSlot];
              tempSprites[afterSlot] = sprite;
              if (beforeSlot !== afterSlot) {
                tempSprites[beforeSlot] = null;
              }
            }
          } else if (inst.name === 'chr1') {
            tempSprites[2] = args.str;
          } else if (inst.name === 'chr2') {
            tempSprites[1] = args.str;
          } else if (inst.name === 'chr3') {
            tempSprites[0] = args.str;
          } else if (inst.name === 'chr4') {
            tempSprites[1] = args.str;
          } else if (inst.name === 'chr5') {
            tempSprites[0] = args.str;
          } else if (inst.name === 'chr6') {
            const layer = args.layer !== undefined ? parseInt(args.layer) : 2;
            tempSprites[layer] = args.str;
          } else if (inst.name === '2chr') {
            tempSprites[1] = args.str2;
            tempSprites[0] = args.str3;
          } else if (inst.name === '3chr') {
            tempSprites[2] = args.str1;
            tempSprites[1] = args.str4;
            tempSprites[0] = args.str5;
          } else if (inst.name === 'dellay' || inst.name === 'dellay_far' || inst.name === 'dellay_walk' || inst.name === 'dellay_dash') {
            const pos = String(args.pos || '');
            if (pos.includes('c') || pos === 'all') tempSprites[2] = null;
            if (pos.includes('l') || pos === 'all') tempSprites[1] = null;
            if (pos.includes('r') || pos === 'all') tempSprites[0] = null;
          } else if (inst.name === 'delchr') {
            const l = args.layer !== undefined ? parseInt(args.layer) : 2;
            tempSprites[l] = null;
          } else if (inst.name === 'alldelchr') {
            tempSprites = { 0: null, 1: null, 2: null };
          } else if (inst.name === 'showmsg') {
            setTextVisible(true);
          } else if (inst.name === 'delmsg') {
            setTextVisible(false);
          } else if (inst.name === 'name' || inst.name === 'nm') {
            const jpName = args.txt || args.t || '';
            const enName = resolveCharacterName(args.txt_en || args.t_en || args.t || '', 'EN', config?.characterNames);
            currentSpeakerRef.current = { jp: jpName, en: enName };
            setSpeaker(language === 'JP' ? jpName : enName);
            hasNmCommandRef.current = true;
            if (inst.name === 'nm' && args.s) {
              playVoice(args.s);
              currentVoiceRef.current = args.s;
            } else {
              currentVoiceRef.current = null;
            }
          } else if (inst.name === 'l_moji') {
            setSideNarration({
              visible: true,
              side: 'left',
              text: language === 'JP' ? args.moji : args.moji_en,
              top: args.top ? parseInt(args.top) : 130
            });
            setTimeout(() => {
              setSideNarration(prev => ({ ...prev, visible: false }));
            }, 4500);
          } else if (inst.name === 'r_moji') {
            setSideNarration({
              visible: true,
              side: 'right',
              text: language === 'JP' ? args.moji : args.moji_en,
              top: args.top ? parseInt(args.top) : 130
            });
            setTimeout(() => {
              setSideNarration(prev => ({ ...prev, visible: false }));
            }, 4500);
          } else if (inst.name === 'novel') {
            setDialogueMode('novel');
            setTypewriterText('');
            updateDialogueText('');
          } else if (inst.name === 'avg' || inst.name === 'avg_with_name') {
            setDialogueMode('avg');
            setTypewriterText('');
            updateDialogueText('');
          } else if (inst.name === 'exlink') {
            const txtJp = args.txt || '';
            const txtEn = args.txt_en || txtJp;
            collectedOptions.push({
              text_jp: txtJp,
              text_en: txtEn,
              target: args.target ? args.target.replace('*', '') : '',
              exp: args.exp || null
            });
          } else if (inst.name === 'showexlink') {
            const finalOptions = collectedOptions;
            if (finalOptions.length === 0) {
              let searchP = p - 2;
              while (searchP >= 0) {
                const prevInst = scenarioData[searchP];
                if (!prevInst) break;
                if (prevInst.type === 'command' && prevInst.name === 'exlink') {
                  const prevArgs = prevInst.args || {};
                  const prevTxtJp = prevArgs.txt || '';
                  const prevTxtEn = prevArgs.txt_en || prevTxtJp;
                  finalOptions.unshift({
                    text_jp: prevTxtJp,
                    text_en: prevTxtEn,
                    target: prevArgs.target ? prevArgs.target.replace('*', '') : '',
                    exp: prevArgs.exp || null
                  });
                  searchP--;
                } else if (prevInst.type === 'line_feed' || prevInst.type === 'comment' || prevInst.type === 'label') {
                  searchP--;
                } else {
                  break;
                }
              }
            }
            if (finalOptions.length > 0) {
              setShowOptions(finalOptions);
              shouldBlock = true;
              setIsFastForward(false);
              isFastForwardRef.current = false;
            }
          } else if (inst.name === 'call') {
            const storage = args.storage ? args.storage.replace('.ks', '') : currentScenario;
            const target = args.target ? args.target.replace('*', '') : null;

            const nextStack = [...callStackRef.current, { scenario: currentScenario, pointer: p }];
            setCallStack(nextStack);
            callStackRef.current = nextStack;

            console.log(
              `%c[CALL] Target Scenario: %c${storage}%c | Target Label: %c*${target || 'None'}`,
              'color: #c678dd; font-weight: bold;', 'color: #ce9178; font-weight: bold;',
              'color: #c678dd;', 'color: #56b6c2; font-weight: bold;'
            );
            setF(newF);
            if (JSON.stringify(newSf) !== JSON.stringify(sf)) {
              updateSf(newSf);
            } else {
              setSf(newSf);
            }
            setTf(newTf);
            tfRef.current = newTf;
            setSprites(tempSprites);
            setBackground(tempBackground);

            loadScenario(storage, target);
            return;
          } else if (inst.name === 'return') {
            if (callStackRef.current.length > 0) {
              const returnAddr = callStackRef.current[callStackRef.current.length - 1];
              const nextStack = callStackRef.current.slice(0, -1);
              setCallStack(nextStack);
              callStackRef.current = nextStack;

              console.log(
                `%c[RETURN] Returning to: %c${returnAddr.scenario}%c | Pointer: %c${returnAddr.pointer}`,
                'color: #c678dd; font-weight: bold;', 'color: #ce9178; font-weight: bold;',
                'color: #c678dd;', 'color: #56b6c2; font-weight: bold;'
              );
              setF(newF);
              if (JSON.stringify(newSf) !== JSON.stringify(sf)) {
                updateSf(newSf);
              } else {
                setSf(newSf);
              }
              setTf(newTf);
              tfRef.current = newTf;
              setSprites(tempSprites);
              setBackground(tempBackground);

              loadScenario(returnAddr.scenario, null, returnAddr.pointer, true, true);
              return;
            } else {
              console.warn("KAG return command executed, but call stack is empty!");
            }
          } else if (inst.name === 'jump') {
            const storage = args.storage ? args.storage.replace('.ks', '') : currentScenario;
            const target = args.target ? args.target.replace('*', '') : null;

            console.log(
              `%c[JUMP] Target Scenario: %c${storage}%c | Target Label: %c*${target || 'None'}`,
              'color: #c678dd; font-weight: bold;', 'color: #ce9178; font-weight: bold;',
              'color: #c678dd;', 'color: #56b6c2; font-weight: bold;'
            );
            setF(newF);
            if (JSON.stringify(newSf) !== JSON.stringify(sf)) {
              updateSf(newSf);
            } else {
              setSf(newSf);
            }
            setTf(newTf);
            tfRef.current = newTf;
            setSprites(tempSprites);
            setBackground(tempBackground);

            loadScenario(storage, target);
            return;
          }
          break;

        case 'text':
          const currentPtr = p - 1;
          if (newSf.readScenarios === undefined) {
            newSf.readScenarios = {};
          }
          if (!newSf.readScenarios[currentScenario]) {
            newSf.readScenarios[currentScenario] = {};
          }

          const isRead = newSf.readScenarios[currentScenario][currentPtr] === true;

          if (isFastForwardRef.current && newSf.skipMode === 'READ_ONLY' && !isRead) {
            setIsFastForward(false);
            isFastForwardRef.current = false;
          }

          newSf.readScenarios[currentScenario][currentPtr] = true;

          if (!hasNmCommandRef.current) {
            setSpeaker('');
            currentSpeakerRef.current = { jp: '', en: '' };
          }
          hasNmCommandRef.current = false;

          setCurrentVoice(currentVoiceRef.current || '');
          const displayTxt = language === 'JP' ? inst.text_jp : inst.text_en;

          let prevDiag = dialogueTextRef.current;
          if (dialogueMode === 'avg' && hasWaitedClickRef.current) {
            prevDiag = '';
          }
          hasWaitedClickRef.current = false;

          let targetFullText;
          if (dialogueMode === 'novel' && prevDiag !== '') {
            const separator = (prevDiag.endsWith('<br />') || prevDiag.endsWith('<br/>')) ? '' : '<br />';
            targetFullText = prevDiag + separator + displayTxt;
          } else {
            targetFullText = prevDiag + displayTxt;
          }
          updateDialogueText(targetFullText);
          triggerTypewriter(prevDiag, targetFullText.slice(prevDiag.length));
          setTextVisible(true);

          const snapshot = {
            f: cleanFForSnapshot(newF),
            choicesCount: newF.choicesHistory ? newF.choicesHistory.length : 0,
            sprites: { ...tempSprites },
            background: tempBackground,
            speaker: language === 'JP' ? currentSpeakerRef.current.jp : currentSpeakerRef.current.en,
            currentSpeaker: { ...currentSpeakerRef.current },
            dialogueText: targetFullText,
            currentVoice: currentVoiceRef.current || '',
            currentScenario,
            pointer: p,
            showOptions: showOptions || null,
            bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
            callStack: [...callStackRef.current]
          };

          const voiceFile = currentVoiceRef.current;

          setHistoryLog(prev => {
            const newHistory = [
              ...prev,
              {
                speakerJp: currentSpeakerRef.current.jp,
                speakerEn: currentSpeakerRef.current.en,
                textJp: inst.text_jp,
                textEn: inst.text_en,
                voice: voiceFile,
                currentScenario,
                pointer: p,
                snapshot
              }
            ];
            return newHistory;
          });
          currentVoiceRef.current = null;
          shouldBlock = true;
          break;

        case 'wait_click':
          if (p - 1 !== pointer) {
            shouldBlock = true;
          }
          break;

        case 'page_break':
          if (p - 1 !== pointer) {
            p = p - 1;
            shouldBlock = true;
          } else {
            setTypewriterText('');
            updateDialogueText('');
            setSpeaker('');
            currentSpeakerRef.current = { jp: '', en: '' };
            currentVoiceRef.current = null;
            hasNmCommandRef.current = false;
          }
          break;

        case 'clear_text':
          setTypewriterText('');
          updateDialogueText('');
          setSpeaker('');
          currentSpeakerRef.current = { jp: '', en: '' };
          currentVoiceRef.current = null;
          hasNmCommandRef.current = false;
          break;

        case 'line_feed':
          if (dialogueTextRef.current && dialogueTextRef.current.trim() !== '') {
            updateDialogueText(dialogueTextRef.current + '<br />');
            setTypewriterText(prev => prev + '<br />');
          }
          break;

        case 'link_start':
          const options = [];
          let tempP = p - 1;
          while (tempP < scenarioData.length) {
            const nextInst = scenarioData[tempP];
            if (!nextInst) {
              tempP++;
              continue;
            }
            if (nextInst.type === 'line_feed' || nextInst.type === 'comment') {
              tempP++;
              continue;
            }
            if (nextInst.type === 'link_start') {
              let textValJp = "";
              let textValEn = "";
              const linkTextInst = scenarioData[tempP + 1];
              if (linkTextInst && linkTextInst.type === 'text') {
                textValJp = linkTextInst.text_jp;
                textValEn = linkTextInst.text_en;
              }
              options.push({
                text_jp: textValJp,
                text_en: textValEn,
                target: nextInst.target.replace('*', ''),
                exp: nextInst.exp
              });
              tempP += 3;
            } else {
              break;
            }
          }

          if (options.length > 0) {
            setShowOptions(options);
            shouldBlock = true;
            setIsFastForward(false);
            isFastForwardRef.current = false;
            p = tempP;
          }
          break;

        case 'if':
          if (!evaluateExpression(inst.exp, newF, newSf, newTf)) {
            p = skipToEndif(p);
          }
          break;

        case 'endif':
          break;

        case 'eval':
          try {
            const cleaned = cleanKagExpression(inst.exp);
            const result = new Function('f', 'sf', 'tf', `${cleaned}; return { f, sf, tf };`)(newF, newSf, newTf);
            newF = result.f;
            newSf = result.sf;
            newTf = result.tf;
          } catch (err) {
            console.error("Inline eval error", err);
          }
          break;
      }
    }

    // Update faceRecord from current sprites
    const nextFaceRecord = { ...newF.faceRecord };
    let faceRecordChanged = false;
    for (let layer = 0; layer < 3; layer++) {
      const sprite = tempSprites[layer];
      if (sprite) {
        const cleanSprite = sprite.startsWith('st_') ? sprite.slice(3) : sprite;
        const parts = cleanSprite.split('_');
        if (parts.length > 0) {
          const charName = parts[0];
          const head = charName.substring(0, 4);
          if (nextFaceRecord[head] !== sprite) {
            nextFaceRecord[head] = sprite;
            faceRecordChanged = true;
          }
        }
      }
    }
    if (faceRecordChanged) {
      newF.faceRecord = nextFaceRecord;
    }

    setPointer(p);
    setF(newF);
    if (JSON.stringify(newSf) !== JSON.stringify(sf)) {
      updateSf(newSf);
    } else {
      setSf(newSf);
    }
    setTf(newTf);
    tfRef.current = newTf;
    setSprites(tempSprites);
    setBackground(tempBackground);

    if (shouldBlock) {
      setIsWaiting(true);
    }
  }, [scenarioData, pointer, isWaiting, showOptions, gameState, language]);

  // Update currently displayed text when language toggles
  useEffect(() => {
    if (!scenarioData || pointer <= 0 || pointer > scenarioData.length || gameState !== 'PLAYING') return;

    let accumulated = '';
    let lastClearIdx = -1;

    for (let i = 0; i < pointer; i++) {
      const inst = scenarioData[i];
      if (inst.type === 'page_break' || inst.type === 'clear_text') {
        lastClearIdx = i;
      }
    }

    const startTraceIdx = lastClearIdx !== -1 ? lastClearIdx + 1 : 0;
    for (let i = startTraceIdx; i < pointer; i++) {
      const inst = scenarioData[i];
      if (inst.type === 'text') {
        accumulated += language === 'JP' ? inst.text_jp : inst.text_en;
      } else if (inst.type === 'line_feed') {
        if (accumulated && accumulated.trim() !== '') {
          accumulated += '<br />';
        }
      }
    }

    setDialogueText(accumulated);
    setTypewriterText(accumulated);
    dialogueTextRef.current = accumulated;
  }, [language]);

  // Handle auto-advance (Auto / Fast-Forward modes)
  useEffect(() => {
    if (gameState !== 'PLAYING' || !isWaiting || showOptions) return;

    if (isFastForward) {
      const timer = setTimeout(() => {
        hasWaitedClickRef.current = true;
        setIsWaiting(false);
      }, 80);
      return () => clearTimeout(timer);
    }

    if (isAutoMode) {
      const charCount = typewriterText.length;
      const readDelay = Math.max(1200, charCount * 70);
      const timer = setTimeout(() => {
        hasWaitedClickRef.current = true;
        setIsWaiting(false);
      }, readDelay);
      return () => clearTimeout(timer);
    }
  }, [isWaiting, isAutoMode, isFastForward, typewriterText, showOptions, gameState]);

  // Expose quick_check diagnostics
  useEffect(() => {
    window.quick_check = () => {
      console.log("%c=== ENGINE QUICK CHECK ===", "color: #aa3bff; font-weight: bold; font-size: 14px;");
      console.log("Scenario       :", currentScenario);
      console.log("Pointer        :", pointer);
      console.log("Background     :", background);
      console.log("Sprites        :", sprites);
      console.log("Speaker        :", speaker);
      console.log("Dialogue Mode  :", dialogueMode);
      console.log("Dialogue Text  :", dialogueText);
      console.log("Typewriter     :", typewriterText);
      console.log("Waiting state  :", isWaiting);
      console.log("Auto Mode      :", isAutoMode);
      console.log("Skip Mode      :", isFastForward);
      console.log("f (Variables)  :", f);
      console.log("sf (Sys Flags) :", sf);
      console.log("BGM Player     : src =", bgmPlayer.src, "| paused =", bgmPlayer.paused, "| volume =", bgmPlayer.volume);
      console.log("Voice Player   : src =", voicePlayer.src, "| paused =", voicePlayer.paused);
      console.log("SE Player      : src =", sePlayer.src, "| paused =", sePlayer.paused);
      return {
        scenario: currentScenario,
        pointer,
        background,
        sprites,
        speaker,
        dialogueMode,
        dialogueText,
        typewriterText,
        isWaiting,
        isAutoMode,
        isFastForward,
        f,
        sf,
        gameState,
        isAudioUnlocked,
        voicePlayer,
        audio: {
          bgm: { src: bgmPlayer.src, paused: bgmPlayer.paused, volume: bgmPlayer.volume },
          se: { src: sePlayer.src, paused: sePlayer.paused, volume: sePlayer.volume },
          voice: { src: voicePlayer.src, paused: voicePlayer.paused, volume: voicePlayer.volume }
        }
      };
    };
    return () => {
      delete window.quick_check;
    };
  }, [currentScenario, pointer, background, sprites, speaker, dialogueMode, dialogueText, typewriterText, isWaiting, isAutoMode, isFastForward, f, sf, gameState, isAudioUnlocked]);

  // Log state progression in browser console
  useEffect(() => {
    if (gameState === 'PLAYING') {
      console.log(
        `%c[STEP] Scenario: %c${currentScenario}%c | Pointer: %c${pointer}%c | BG: %c${background}%c | Speaker: %c${speaker || 'None'}`,
        'color: #9cdcfe;', 'color: #ce9178; font-weight: bold;',
        'color: #9cdcfe;', 'color: #b5cea8; font-weight: bold;',
        'color: #9cdcfe;', 'color: #4fc1ff; font-style: italic;',
        'color: #9cdcfe;', 'color: #4ec9b0; font-weight: bold;'
      );
    }
  }, [currentScenario, pointer, background, gameState, speaker]);

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      setFaceIcon(null);
      return;
    }
    const resolvedFace = getFaceIcon(speaker, f);
    setFaceIcon(resolvedFace);
  }, [speaker, f, gameState]);

  // Dialogue box mousewheel scroll backlog history trigger
  const handleWheel = (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.deltaY < -15 && historyLog.length > 0) {
      setShowHistory(true);
    }
  };

  const handleScreenClick = () => {
    if (showOptions || gameState !== 'PLAYING') return;

    if (!isAudioUnlocked) {
      setIsAudioUnlocked(true);
      return;
    }

    if (!textVisible) {
      setTextVisible(true);
      return;
    }

    if (typewriterText !== dialogueText) {
      if (textTimerRef.current) clearInterval(textTimerRef.current);
      setTypewriterText(dialogueText);
      return;
    }

    if (isWaiting) {
      hasWaitedClickRef.current = true;
      setIsWaiting(false);
    }
  };
  handleScreenClickRef.current = handleScreenClick;

  const startNewGame = () => {
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setHistoryLog([]);
    setTf({});
    setF({
      flag_haru: 0,
      flag_kanon: 0,
      flag_mizuha: 0,
      flag_tubaki: 0,
      badflag_kanon: 0,
      kanon_clear: 0,
      mizuha_clear: 0,
      tubaki_clear: 0,
      game_clear: 0,
      go_next_chapter: 0,
      show_next_chapter: 0,
      evcgmode: 0,
      faceRecord: {},
      chour: new Date().getHours(),
      choicesHistory: []
    });
    setCallStack([]);
    callStackRef.current = [];
    setSprites({ 0: null, 1: null, 2: null });
    setBackground('white');
    setDialogueMode('avg');
    setSpeaker('');
    updateDialogueText('');
    setTypewriterText('');
    setGameState('PLAYING');
    loadScenario('g01');
  };

  const resumeGame = () => {
    if (pointer > 0 && scenarioData) {
      setGameState('PLAYING');
      if (initialBgmRef.current) {
        playBgm(initialBgmRef.current);
      } else {
        stopBgm();
      }
      return;
    }
    const auto = localStorage.getItem(`${storagePrefix}_autosave`);
    if (auto) {
      try {
        loadSaveSlot(JSON.parse(auto));
      } catch (_e) { }
    }
  };

  const quitToTitle = () => {
    stopBgm();
    setTf({});
    setGameState('TITLE');
  };

  const rewindToLastScene = () => {
    if (historyLog.length <= 1) return;
    const prevIdx = historyLog.length - 2;
    const targetSnapshot = historyLog[prevIdx].snapshot;
    if (targetSnapshot) {
      loadSaveSlot(targetSnapshot);
      setHistoryLog(prev => prev.slice(0, prevIdx + 1));
    }
  };

  const loadSaveSlot = async (slotData) => {
    if (textTimerRef.current) clearInterval(textTimerRef.current);
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null);
    setIsWaiting(true);
    setF({
      ...slotData.f,
      choicesHistory: slotData.choicesHistory || []
    });
    setSprites(slotData.sprites);
    setBackground(slotData.background);
    setSpeaker(slotData.speaker);
    currentSpeakerRef.current = slotData.currentSpeaker || { jp: slotData.speaker || '', en: slotData.speaker || '' };
    setCurrentVoice(slotData.currentVoice || '');
    updateDialogueText(slotData.dialogueText);
    setTypewriterText(slotData.dialogueText);
    setDialogueMode(slotData.dialogueMode || 'avg');
    setCallStack(slotData.callStack || []);
    callStackRef.current = slotData.callStack || [];

    if (slotData.language) {
      setLanguage(slotData.language);
    }

    if (slotData.historyLog) {
      setHistoryLog(slotData.historyLog);
    } else if (slotData.slotId !== undefined) {
      setHistoryLog([]);
    }

    let data = null;
    try {
      const response = await fetch(`/scenarios/${slotData.currentScenario}.json`);
      if (!response.ok) throw new Error(`Failed to fetch scenario: ${slotData.currentScenario}`);
      const json = await response.json();
      data = json.instructions;
    } catch (e) {
      console.error("Failed to load scenario data for save state, falling back to embedded", e);
      data = slotData.scenarioData;
    }

    if (!data) return;

    const patchedData = applyTranslationImprovements(data);
    setScenarioData(patchedData);
    data = patchedData;
    setCurrentScenario(slotData.currentScenario);
    setPointer(slotData.pointer);

    if (slotData.showOptions) {
      setShowOptions(slotData.showOptions);
    } else {
      setShowOptions(false);
    }

    const targetInst = data[slotData.pointer];
    const shouldWait = targetInst && (targetInst.type === 'text' || targetInst.type === 'wait_click' || targetInst.type === 'page_break');
    setIsWaiting(shouldWait);
    setGameState('PLAYING');

    if (slotData.bgm) {
      initialBgmRef.current = slotData.bgm;
      playBgm(slotData.bgm);
    } else {
      initialBgmRef.current = '';
      stopBgm();
    }

    console.log(
      `%c[LOAD] Loaded Slot: %c${slotData.slotId || 'autosave'}%c | Scenario: %c${slotData.currentScenario}%c | Pointer: %c${slotData.pointer}`,
      'color: #61afef; font-weight: bold;', 'color: #d19a66; font-weight: bold;',
      'color: #61afef;', 'color: #ce9178; font-weight: bold;',
      'color: #61afef;', 'color: #b5cea8; font-weight: bold;'
    );

    setShowSaveLoad(null);
  };

  const handleSaveSlot = (slotIdx, overridePointer = null, overrideScenario = null, overrideF = null, _overrideSf = null, overrideSprites = null, overrideBackground = null) => {
    const slotKey = `${storagePrefix}_save_slot_${slotIdx}`;
    const targetF = overrideF || f;
    const targetSprites = overrideSprites || sprites;
    const targetBackground = overrideBackground || background;
    const targetPointer = overridePointer !== null ? overridePointer : pointer;
    const targetScenario = overrideScenario || currentScenario;

    const saveData = {
      slotId: slotIdx,
      f: cleanFForSnapshot(targetF),
      choicesHistory: cleanChoicesHistoryForSave(targetF.choicesHistory),
      sprites: targetSprites,
      background: targetBackground,
      speaker,
      currentSpeaker: currentSpeakerRef.current,
      currentVoice,
      dialogueText: dialogueTextRef.current,
      dialogueMode,
      language,
      currentScenario: targetScenario,
      pointer: targetPointer,
      showOptions: showOptions || null,
      historyLog: cleanHistoryLogForSave(historyLog),
      bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
      callStack: callStackRef.current,
      date: new Date().toLocaleString(),
      timestamp: Date.now()
    };
    // Write lightweight cache to localStorage to prevent QuotaExceededError
    localStorage.setItem(slotKey, JSON.stringify(stripHistoryForLocalStorage(saveData)));

    console.log(
      `%c[SAVE] Saved to Slot: %c${slotIdx}%c | Scenario: %c${targetScenario}%c | Pointer: %c${targetPointer}`,
      'color: #98c379; font-weight: bold;', 'color: #d19a66; font-weight: bold;',
      'color: #98c379;', 'color: #ce9178; font-weight: bold;',
      'color: #98c379;', 'color: #b5cea8; font-weight: bold;'
    );

    fetch('/api/save-slot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Username': username,
        'X-Client-ID': clientIdRef.current
      },
      body: JSON.stringify({ slot: String(slotIdx), data: saveData })
    }).catch(e => console.error("Failed to save slot to backend", e));

    setSaveSlots(prev => ({ ...prev, [slotIdx]: saveData }));
    setShowSaveLoad(null);
  };

  const handleSelectOption = (opt) => {
    console.log(
      `%c[CHOICE] Selected: %c"${language === 'JP' ? opt.text_jp : opt.text_en}"%c | Target: %c*${opt.target}`,
      'color: #f14c4c; font-weight: bold;', 'color: #e5c07b; font-style: italic;',
      'color: #f14c4c;', 'color: #56b6c2; font-weight: bold;'
    );

    const choiceEntry = {
      scenario: currentScenario,
      pointer: pointer,
      options: showOptions.map(o => ({ jp: o.text_jp, en: o.text_en, target: o.target, exp: o.exp })),
      selectedOption: { jp: opt.text_jp, en: opt.text_en, target: opt.target },
      snapshot: {
        f: cleanFForSnapshot(f),
        choicesCount: f.choicesHistory ? f.choicesHistory.length : 0,
        sprites: { ...sprites },
        background: background,
        speaker: speaker,
        currentSpeaker: { ...currentSpeakerRef.current },
        dialogueText: dialogueText,
        currentScenario,
        pointer: pointer,
        bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
        callStack: [...callStackRef.current]
      }
    };

    if (opt.exp) {
      executeStatement(opt.exp);
    }

    setF(prev => {
      const prevHistory = prev.choicesHistory || [];
      return {
        ...prev,
        choicesHistory: [...prevHistory, choiceEntry]
      };
    });

    setShowOptions(false);
    setIsWaiting(false);
    setIsFastForward(false);
    isFastForwardRef.current = false;

    const idx = scenarioData.findIndex(i => i.type === 'label' && i.name === opt.target);
    if (idx !== -1) {
      setPointer(idx);
    } else {
      console.error(`Target label ${opt.target} not found`);
    }
  };

  const jumpToHistorySnapshot = async (snap, entryIdx) => {
    if (textTimerRef.current) clearInterval(textTimerRef.current);
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null);
    setIsWaiting(true);

    const entry = historyLog[entryIdx];
    const targetScen = snap ? snap.currentScenario : entry.currentScenario;
    const targetPtr = snap ? snap.pointer : entry.pointer;

    setHistoryLog(prev => prev.slice(0, entryIdx + 1));

    if (snap) {
      setF({
        ...snap.f,
        choicesHistory: (f.choicesHistory || []).slice(0, snap.choicesCount || 0)
      });
      setSprites(snap.sprites);
      setBackground(snap.background);
      setSpeaker(snap.speaker);
      currentSpeakerRef.current = snap.currentSpeaker || { jp: snap.speaker || '', en: snap.speaker || '' };
      setCurrentVoice(snap.currentVoice || '');
      updateDialogueText(snap.dialogueText);
      setTypewriterText(snap.dialogueText);

      if (snap.showOptions) {
        setShowOptions(snap.showOptions);
      } else {
        setShowOptions(false);
      }

      setCallStack(snap.callStack || []);
      callStackRef.current = snap.callStack || [];

      if (snap.bgm) {
        initialBgmRef.current = snap.bgm;
        playBgm(snap.bgm);
      } else {
        initialBgmRef.current = '';
        stopBgm();
      }
    } else {
      // Fallback path: pre-scanner reconstructs background, sprites, voice, BGM automatically
      const resolvedSp = language === 'JP' ? entry.speakerJp : entry.speakerEn;
      const text = language === 'JP' ? entry.textJp : entry.textEn;
      setSpeaker(resolvedSp);
      currentSpeakerRef.current = { jp: entry.speakerJp || '', en: entry.speakerEn || '' };
      setCurrentVoice(entry.voice || '');
      updateDialogueText(text);
      setTypewriterText(text);
      setShowOptions(false);
    }

    await loadScenario(targetScen, null, targetPtr, true, true);

    setIsWaiting(true);
    setGameState('PLAYING');
    setShowHistory(false);
    setShowTableOfContents(false);
    setShowPageFlipper(false);
  };

  const jumpToChoiceSnapshot = async (choice, choiceIdx) => {
    if (textTimerRef.current) clearInterval(textTimerRef.current);
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null);
    setIsWaiting(true);

    const snap = choice.snapshot;

    setF({
      ...snap.f,
      choicesHistory: (f.choicesHistory || []).slice(0, choiceIdx)
    });
    setSprites(snap.sprites);
    setBackground(snap.background);
    setSpeaker(snap.speaker);
    currentSpeakerRef.current = snap.currentSpeaker || { jp: snap.speaker || '', en: snap.speaker || '' };
    updateDialogueText(snap.dialogueText);
    setTypewriterText(snap.dialogueText);
    setCurrentScenario(snap.currentScenario);
    setCallStack(snap.callStack || []);
    callStackRef.current = snap.callStack || [];

    await loadScenario(snap.currentScenario, null, snap.pointer, true, true);

    setShowOptions(choice.options.map(o => ({
      text_jp: o.jp,
      text_en: o.en,
      target: o.target,
      exp: o.exp
    })));

    if (snap.bgm) {
      initialBgmRef.current = snap.bgm;
      playBgm(snap.bgm);
    } else {
      initialBgmRef.current = '';
      stopBgm();
    }

    setGameState('PLAYING');
  };

  const jumpToTopic = async (scenId, targetPtr = 0, presets = null) => {
    if (presets) {
      setF(prev => ({ ...prev, ...presets }));
    }
    await loadScenario(scenId, null, targetPtr, true, true);
    setGameState('PLAYING');
    setShowTableOfContents(false);
  };

  const seekPointer = async (targetPtr) => {
    if (!currentScenario) return;
    const maxP = scenarioData?.instructions?.length || targetPtr;
    const safeP = Math.max(0, Math.min(targetPtr, maxP - 1));
    await loadScenario(currentScenario, null, safeP, true, true);
  };

  // Centralized keyboard shortcut manager
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key shortcuts when typing in inputs/textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      if (gameState !== 'PLAYING') {
        return;
      }

      const code = e.code;

      // 1. Fullscreen toggle (always active during gameplay)
      if (DEFAULT_SHORTCUTS.TOGGLE_FULLSCREEN.includes(code)) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // Settings screen toggle (allows toggling off settings screen)
      if (DEFAULT_SHORTCUTS.TOGGLE_SETTINGS.includes(code)) {
        e.preventDefault();
        if (showSettings) {
          setShowSettings(false);
        } else if (!showSaveLoad && !showHistory && !showChoiceGraph) {
          if (!isAudioUnlocked) setIsAudioUnlocked(true);
          setShowSettings(true);
        }
        return;
      }

      // If configuration/settings panels are open (and it wasn't the toggle key), ignore game keys
      if (showSettings || showChoiceGraph) {
        return;
      }

      // 2. Save screen toggle
      if (DEFAULT_SHORTCUTS.TOGGLE_SAVE.includes(code)) {
        e.preventDefault();
        if (showSaveLoad === 'SAVE') {
          setShowSaveLoad(null);
        } else if (!showSaveLoad && !showHistory) {
          if (!isAudioUnlocked) setIsAudioUnlocked(true);
          setShowSaveLoad('SAVE');
        }
        return;
      }

      // 3. Load screen toggle
      if (DEFAULT_SHORTCUTS.TOGGLE_LOAD.includes(code)) {
        e.preventDefault();
        if (showSaveLoad === 'LOAD') {
          setShowSaveLoad(null);
        } else if (!showSaveLoad && !showHistory) {
          if (!isAudioUnlocked) setIsAudioUnlocked(true);
          setShowSaveLoad('LOAD');
        }
        return;
      }

      // 4. Open search history backlog (Slash key - focuses search input)
      if (DEFAULT_SHORTCUTS.OPEN_HISTORY_SEARCH.includes(code)) {
        e.preventDefault();
        if (!showSaveLoad && !showHistory) {
          if (!isAudioUnlocked) setIsAudioUnlocked(true);
          setHistorySearchFocused(true);
          setShowHistory(true);
        }
        return;
      }

      // Toggle history backlog (H key - does not focus search input, allowing closing with H)
      if (DEFAULT_SHORTCUTS.TOGGLE_HISTORY.includes(code)) {
        e.preventDefault();
        if (showHistory) {
          setShowHistory(false);
        } else if (!showSaveLoad) {
          if (!isAudioUnlocked) setIsAudioUnlocked(true);
          setHistorySearchFocused(false);
          setShowHistory(true);
        }
        return;
      }

      // If dialogue history or save/load overlays are active (and it wasn't the toggle key), ignore gameplay keys
      if (showSaveLoad || showHistory) {
        return;
      }

      // Toggle auto mode
      if (DEFAULT_SHORTCUTS.TOGGLE_AUTO.includes(code)) {
        e.preventDefault();
        if (!isAudioUnlocked) setIsAudioUnlocked(true);
        setIsAutoMode(prev => !prev);
        setIsFastForward(false);
        return;
      }

      // Quit to main menu
      if (DEFAULT_SHORTCUTS.QUIT_TO_TITLE.includes(code)) {
        e.preventDefault();
        quitToTitle();
        return;
      }

      // Toggle immerse mode
      if (DEFAULT_SHORTCUTS.TOGGLE_IMMERSE.includes(code)) {
        e.preventDefault();
        if (!isAudioUnlocked) setIsAudioUnlocked(true);
        updateSf(prev => ({ ...prev, immerseMode: !prev.immerseMode }));
        return;
      }

      // Toggle mute/unmute
      if (DEFAULT_SHORTCUTS.TOGGLE_MUTE.includes(code)) {
        e.preventDefault();
        if (toggleBgm) {
          toggleBgm();
        }
        return;
      }

      // Toggle Table of Contents Modal (Key T)
      if (DEFAULT_SHORTCUTS.TOGGLE_TOC.includes(code)) {
        e.preventDefault();
        setShowTableOfContents(prev => !prev);
        return;
      }

      // Toggle Page Flipper Bar (Key B)
      if (DEFAULT_SHORTCUTS.TOGGLE_FLIPPER.includes(code)) {
        e.preventDefault();
        setShowPageFlipper(prev => !prev);
        return;
      }

      // Toggle Table of Contents Modal (Key T)
      if (DEFAULT_SHORTCUTS.TOGGLE_TOC && DEFAULT_SHORTCUTS.TOGGLE_TOC.includes(code)) {
        e.preventDefault();
        setShowTableOfContents(prev => !prev);
        return;
      }

      // Toggle Page Flipper Bar (Key B)
      if (DEFAULT_SHORTCUTS.TOGGLE_FLIPPER && DEFAULT_SHORTCUTS.TOGGLE_FLIPPER.includes(code)) {
        e.preventDefault();
        setShowPageFlipper(prev => !prev);
        return;
      }

      // 5. Toggle text visibility
      if (DEFAULT_SHORTCUTS.TOGGLE_TEXT.includes(code)) {
        e.preventDefault();
        setTextVisible(prev => !prev);
        return;
      }

      // 6. Advance dialogue text
      if (DEFAULT_SHORTCUTS.ADVANCE_TEXT.includes(code)) {
        e.preventDefault();
        if (handleScreenClickRef.current) {
          handleScreenClickRef.current();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showSaveLoad, showSettings, showChoiceGraph, showHistory, isAudioUnlocked, toggleBgm]);

  const replayCurrentVoice = () => {
    if (currentVoice) {
      setTimeout(() => {
        playVoice(currentVoice);
      }, 150);
    }
  };

  return {
    language,
    setLanguage,
    faceIcon,
    gameState,
    setGameState,
    currentScenario,
    scenarioData,
    pointer,
    background,
    sprites,
    speaker,
    currentVoice,
    replayCurrentVoice,
    dialogueText,
    typewriterText,
    textVisible,
    setTextVisible,
    historyLog,
    setHistoryLog,
    dialogueMode,
    isAutoMode,
    setIsAutoMode,
    isFastForward,
    setIsFastForward,
    isWaiting,
    showOptions,
    sideNarration,
    showSaveLoad,
    setShowSaveLoad,
    showSettings,
    setShowSettings,
    showChoiceGraph,
    setShowChoiceGraph,
    showHistory,
    setShowHistory,
    showTableOfContents,
    setShowTableOfContents,
    showPageFlipper,
    setShowPageFlipper,
    jumpToTopic,
    seekPointer,
    historySearchFocused,
    saveSlots,
    f,
    setF,
    tf,
    setTf,
    sf,
    updateSf,
    startNewGame,
    resumeGame,
    loadScenario,
    handleScreenClick,
    handleSelectOption,
    handleWheel,
    rewindToLastScene,
    loadSaveSlot,
    handleSaveSlot,
    quitToTitle,
    jumpToHistorySnapshot,
    jumpToChoiceSnapshot,
    isAudioUnlocked,
    setIsAudioUnlocked,
    quakeActive,
    flashActive,
    storagePrefix,
    username,
    setUsername,
    sessionConflict
  };
}
