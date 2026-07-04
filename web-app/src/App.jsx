import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// --- Sub Components ---
import TitleScreen from './components/TitleScreen';
import SaveLoadModal from './components/SaveLoadModal';
import GalleryScreen from './components/GalleryScreen';
import SettingsPanel from './components/SettingsPanel';
import DialogueBox from './components/DialogueBox';
import HistoryModal from './components/HistoryModal';
import GameplayScreen from './components/GameplayScreen';
import ChoiceGraphModal from './components/ChoiceGraphModal';
import DebugPanel from './components/DebugPanel';

// --- Utility Helpers ---
import { resolveAsset, resolveCharacterName, tokenizeText } from './utils/gameUtils';

// --- Global Audio Engine Objects ---
const bgmPlayer = new Audio();
bgmPlayer.loop = true;

const sePlayer = new Audio();
const voicePlayer = new Audio();

// --- Save State Cleaners for Flowchart Nested Snapshots ---
const cleanFForSnapshot = (originalF) => {
  if (!originalF) return {};
  const clean = { ...originalF };
  delete clean.choicesHistory;
  return clean;
};

const cleanChoicesHistoryForSave = (history) => {
  if (!history) return [];
  return history.map(choice => ({
    ...choice,
    snapshot: {
      ...choice.snapshot,
      f: cleanFForSnapshot(choice.snapshot.f)
    }
  }));
};

const cleanHistoryLogForSave = (log) => {
  if (!log) return [];
  return log.map(entry => ({
    ...entry,
    snapshot: {
      ...entry.snapshot,
      f: cleanFForSnapshot(entry.snapshot.f)
    }
  }));
};

export default function App() {
  // Game States
  const [gameState, setGameState] = useState('TITLE'); // 'TITLE' | 'PLAYING' | 'GALLERY' | 'REPLAY' | 'SETTINGS'
  const [language, setLanguage] = useState('JP'); // 'JP' | 'EN'
  
  // Script and Interpreter States
  const [currentScenario, setCurrentScenario] = useState('g01');
  const [scenarioData, setScenarioData] = useState(null);
  const [pointer, setPointer] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Variables (TJS2 f and sf scopes)
  const [f, setF] = useState({
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
    faceRecord: 0,
    choicesHistory: [],
    chour: 12, // Hour of the day for title background
  });
  
  const [sf, setSf] = useState({
    game_clear: 0,
    kanon_clear: 0,
    mizuha_clear: 0,
    tubaki_clear: 0,
    show_next_chapter: 0,
    first: 1,
    vol: 8, // BGM volume (0 - 10)
    sevol: 8, // SE volume (0 - 10)
    typewriterMode: 'CHAR',
  });

  // Layer States
  const [background, setBackground] = useState('white'); // image file name or color
  const [sprites, setSprites] = useState({
    0: null, // Right layer
    1: null, // Left layer
    2: null  // Center layer
  });
  
  // Dialogue Box States
  const [speaker, setSpeaker] = useState('');
  const [dialogueText, setDialogueText] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [textVisible, setTextVisible] = useState(false);
  const [historyLog, setHistoryLog] = useState([]);
  const [dialogueMode, setDialogueMode] = useState('avg');
  
  const dialogueTextRef = useRef('');
  const updateDialogueText = (val) => {
    setDialogueText(val);
    dialogueTextRef.current = val;
  };
  
  const [saveSlots, setSaveSlots] = useState(() => {
    const initial = {};
    const auto = localStorage.getItem('school_autosave');
    if (auto) {
      try { initial.autosave = JSON.parse(auto); } catch(e){}
    }
    for (let i = 0; i < 18; i++) {
      const slot = localStorage.getItem(`school_save_slot_${i}`);
      if (slot) {
        try { initial[i] = JSON.parse(slot); } catch(e){}
      }
    }
    return initial;
  });
  const updateSf = (updater) => {
    setSf(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem('school_school_sf', JSON.stringify(next));
      fetch('/api/save-sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sf: next })
      }).catch(e => console.error("Failed to save SF to backend", e));
      return next;
    });
  };
  
  // Side Narration Overlay (l_moji / r_moji)
  const [sideNarration, setSideNarration] = useState({
    visible: false,
    side: 'left',
    text: '',
    top: 130
  });

  // Modal overlays
  const [showSaveLoad, setShowSaveLoad] = useState(null); // 'SAVE' | 'LOAD' | null
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChoiceGraph, setShowChoiceGraph] = useState(false);
  const [cgViewerUrl, setCgViewerUrl] = useState(null);
  
  const textTimerRef = useRef(null);
  const handleScreenClickRef = useRef(null);
  const backendSaveTimeoutRef = useRef(null);
  const currentSpeakerRef = useRef({ jp: '', en: '' });

  // Unlock audio context on first user interaction to bypass autoplay restrictions
  useEffect(() => {
    const unlock = () => {
      const silentBuffer = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
      
      if (!bgmPlayer.src) {
        bgmPlayer.src = silentBuffer;
      }
      bgmPlayer.play()
        .then(() => {
          if (bgmPlayer.src === silentBuffer) {
            bgmPlayer.pause();
            bgmPlayer.src = '';
          }
        })
        .catch(e => console.log("BGM context unlock status:", e));

      if (!sePlayer.src) {
        sePlayer.src = silentBuffer;
      }
      sePlayer.play()
        .then(() => {
          if (sePlayer.src === silentBuffer) {
            sePlayer.pause();
            sePlayer.src = '';
          }
        })
        .catch(e => console.log("SE context unlock status:", e));

      if (!voicePlayer.src) {
        voicePlayer.src = silentBuffer;
      }
      voicePlayer.play()
        .then(() => {
          if (voicePlayer.src === silentBuffer) {
            voicePlayer.pause();
            voicePlayer.src = '';
          }
        })
        .catch(e => console.log("Voice context unlock status:", e));

      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const [isFastForward, setIsFastForward] = useState(false);
  const isFastForwardRef = useRef(false);

  // Auto-advance when fast-forwarding is active and waiting for user input
  useEffect(() => {
    if (isFastForward && isWaiting && !showOptions) {
      const timer = setTimeout(() => {
        setIsWaiting(false);
      }, 30); // Advance every 30ms when fast forwarding
      return () => clearTimeout(timer);
    }
  }, [isFastForward, isWaiting, showOptions]);

  // Read URL search params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scen = params.get('scen');
    const ptr = params.get('ptr');
    if (scen) {
      const parsedPtr = parseInt(ptr) || 0;
      setGameState('PLAYING');
      loadScenario(scen, null, parsedPtr);
    }
  }, []);

  // Sync state to URL search params
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const url = new URL(window.location.href);
      url.searchParams.set('scen', currentScenario);
      url.searchParams.set('ptr', String(pointer));
      window.history.replaceState(null, '', url.pathname + url.search);
    } else {
      const url = new URL(window.location.href);
      if (url.searchParams.has('scen') || url.searchParams.has('ptr')) {
        url.searchParams.delete('scen');
        url.searchParams.delete('ptr');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  }, [currentScenario, pointer, gameState]);

  // Handle keyboard hotkeys: Space/Enter/L/PageUp/Escape, and Hold-down Shift+S to Skip dialogue
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && gameState === 'PLAYING' && !showOptions && !showHistory && !showSaveLoad && !showSettings && !showChoiceGraph) {
        e.preventDefault();
        setTextVisible(prev => !prev);
      }
      if (e.key === 'Enter' && gameState === 'PLAYING' && !showOptions && !showHistory && !showSaveLoad && !showSettings && !showChoiceGraph) {
        e.preventDefault();
        handleScreenClickRef.current?.();
      }
      if ((e.key === 'l' || e.key === 'PageUp') && gameState === 'PLAYING' && !showOptions && !showHistory && !showSaveLoad && !showSettings && !showChoiceGraph) {
        e.preventDefault();
        setShowHistory(true);
      }
      if (e.code === 'KeyS' && e.shiftKey && gameState === 'PLAYING' && !showOptions && !showHistory && !showSaveLoad && !showSettings && !showChoiceGraph) {
        e.preventDefault();
        if (!isFastForwardRef.current) {
          setIsFastForward(true);
          isFastForwardRef.current = true;
        }
      }
      if (e.key === 'Escape') {
        if (showSaveLoad) {
          e.preventDefault();
          setShowSaveLoad(null);
        } else if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
        } else if (showHistory) {
          e.preventDefault();
          setShowHistory(false);
        } else if (showChoiceGraph) {
          e.preventDefault();
          setShowChoiceGraph(false);
        }
      }
    };

    const handleKeyUp = (e) => {
      // If the S key is released, or Shift is released while fast forwarding, stop skipping
      if ((e.code === 'KeyS' || e.key === 'Shift') && isFastForwardRef.current) {
        setIsFastForward(false);
        isFastForwardRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, showOptions, showHistory, showSaveLoad, showSettings, showChoiceGraph]);

  const handleWheel = (e) => {
    if (gameState === 'PLAYING' && !showOptions && !showHistory && !showSaveLoad && !showSettings && !showChoiceGraph) {
      if (e.deltaY < -10) { // scrolling up
        setShowHistory(true);
      }
    }
  };

  // Cancel typing and output dialogue text instantly when starting fast-forward
  useEffect(() => {
    if (isFastForward) {
      if (textTimerRef.current) clearInterval(textTimerRef.current);
      setTypewriterText(dialogueTextRef.current);
      if (isWaiting) {
        setIsWaiting(false);
      }
    }
  }, [isFastForward, isWaiting]);

  // Autosave game state to localStorage and Go backend on every progression step
  useEffect(() => {
    if (gameState === 'PLAYING' && pointer > 0 && scenarioData) {
      const autoSaveData = {
        f: cleanFForSnapshot(f),
        choicesHistory: cleanChoicesHistoryForSave(f.choicesHistory),
        sprites,
        background,
        speaker,
        currentSpeaker: currentSpeakerRef.current,
        dialogueText: dialogueTextRef.current,
        language,
        dialogueMode,
        currentScenario,
        pointer,
        showOptions: showOptions || null,
        historyLog: cleanHistoryLogForSave(historyLog),
        // scenarioData is intentionally omitted to keep payload extremely small (under 1KB)
        bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
        date: new Date().toLocaleString()
      };
      
      // Save locally instantly
      localStorage.setItem('school_autosave', JSON.stringify(autoSaveData));
      
      // Debounce saving to Go backend to avoid spamming during fast-forward or rapid clicks
      if (backendSaveTimeoutRef.current) {
        clearTimeout(backendSaveTimeoutRef.current);
      }
      
      backendSaveTimeoutRef.current = setTimeout(() => {
        fetch('/api/save-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: 'autosave', data: autoSaveData })
        })
        .then(res => {
          if (res.ok) {
            setSaveSlots(prev => ({ ...prev, autosave: autoSaveData }));
          }
        })
        .catch(e => console.error("Failed to push autosave to backend", e));
      }, 1000); // 1-second debounce
    }
    
    return () => {
      if (backendSaveTimeoutRef.current) {
        clearTimeout(backendSaveTimeoutRef.current);
      }
    };
  }, [pointer, currentScenario, gameState, f, sprites, background, speaker, language, showOptions, historyLog]);

  // Load persistent global flags and save slots from backend on startup
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const state = await res.json();
          if (state.sf && Object.keys(state.sf).length > 0) {
            setSf(prev => ({ ...prev, ...state.sf }));
          } else {
            const savedSf = localStorage.getItem('school_school_sf');
            if (savedSf) setSf(prev => ({ ...prev, ...JSON.parse(savedSf) }));
          }
          if (state.slots) {
            setSaveSlots(prev => ({ ...prev, ...state.slots })); // Merge with local storage slots
          }
        }
      } catch (e) {
        console.error("Failed to load backend state, falling back to localStorage", e);
        const savedSf = localStorage.getItem('school_school_sf');
        if (savedSf) setSf(prev => ({ ...prev, ...JSON.parse(savedSf) }));
      }
    };
    init();
  }, []);

  // Update Audio Volume when config changes
  useEffect(() => {
    bgmPlayer.volume = sf.vol / 10;
    sePlayer.volume = sf.sevol / 10;
    voicePlayer.volume = sf.sevol / 10;
  }, [sf.vol, sf.sevol]);

  // Load scenarios from JSON
  const loadScenario = async (name, targetLabel = null, overridePointer = null, shouldWait = false) => {
    if (name === 'option' || name === 'systembutton') {
      setShowSettings(true);
      return;
    }
    // Intercept jumps back to the title screen and exit gameplay mode
    if (name === 'first' && (targetLabel === 'title' || targetLabel === 'begin' || (targetLabel && targetLabel.startsWith('title')))) {
      quitToTitle();
      return;
    }
    setScenarioData(null); // Clear old scenario to block runner during fetch
    setIsWaiting(true);    // Block interaction during loading
    try {
      const response = await fetch(`/scenarios/${name}.json`);
      if (!response.ok) throw new Error(`Failed to fetch scenario: ${name}`);
      const data = await response.json();
      setScenarioData(data.instructions);
      setCurrentScenario(name);
      
      let startIdx = 0;
      if (overridePointer !== null) {
        startIdx = overridePointer;
      } else if (targetLabel) {
        const idx = data.instructions.findIndex(i => i.type === 'label' && i.name === targetLabel);
        if (idx !== -1) {
          startIdx = idx;
        } else {
          console.warn(`Label ${targetLabel} not found in ${name}`);
        }
      }
      setPointer(startIdx);
      setIsWaiting(shouldWait);
      setShowOptions(false);
      console.log(`Loaded scenario ${name} at pointer ${startIdx}`);
    } catch (e) {
      console.error(e);
    }
  };

  const cleanKagExpression = (exp) => {
    if (!exp) return '';
    return exp.replace(/\[(sf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
              .replace(/\[(f\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1');
  };

  // Evaluate KAG JS expressions using active (possibly updated) loop scope variables to prevent stale state bugs
  const evaluateExpression = (exp, currentF = f, currentSf = sf) => {
    if (!exp) return true;
    try {
      const cleaned = cleanKagExpression(exp);
      const func = new Function('f', 'sf', `return (${cleaned});`);
      return func(currentF, currentSf);
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
      const cleaned = cleanKagExpression(exp);
      const func = new Function('f', 'sf', `${cleaned}; return { f, sf };`);
      const result = func(tempF, tempSf);
      setF(result.f);
      updateSf(result.sf);
    } catch (e) {
      console.error("Statement execution failed:", exp, e);
    }
  };

  // Skip to match block ending in [endif]
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

  // Audio Controllers
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
    sePlayer.play().catch(err => console.log("SE play failed", err));
  };

  const stopSe = () => {
    sePlayer.pause();
    sePlayer.src = '';
  };

  const playVoice = (storage) => {
    if (!storage) return;
    const url = resolveAsset(storage, 'voice');
    voicePlayer.src = url;
    voicePlayer.play().catch(err => console.log("Voice play failed", err));
  };

  // Scenario loop runner
  useEffect(() => {
    if (!scenarioData || isWaiting || showOptions || gameState !== 'PLAYING') return;

    let p = pointer;
    let shouldBlock = false;
    let newF = { ...f };
    let newSf = { ...sf };
    let tempSprites = { ...sprites };
    let tempBackground = background;

    while (p < scenarioData.length && !shouldBlock) {
      const inst = scenarioData[p];
      p++;

      switch (inst.type) {
        case 'label':
          // Re-sync label metadata if required
          break;
        case 'comment':
          break;
        case 'command':
          const args = inst.args || {};
          // Execute core game commands
          if (inst.name === 'playbgm' || inst.name === 'bgm' || inst.name === 'fadeinbgm') {
            playBgm(args.storage);
          } else if (inst.name === 'stbgm' || inst.name === 'stopbgm' || inst.name === 'fadeoutbgm') {
            stopBgm();
          } else if (inst.name === 'playse' || inst.name === 'se' || inst.name === 'fadeinse') {
            playSe(args.storage);
          } else if (inst.name === 'stopse' || inst.name === 'fadeoutse') {
            stopSe();
          } else if (inst.name === 'bg' || inst.name === 'bg2' || inst.name === 'bg_ch' || inst.name === 'b_ch') {
            tempBackground = args.str || args.storage || 'black';
            if (inst.name === 'b_ch' || inst.name === 'bg_ch') {
              // Hide sprites
              tempSprites = { 0: null, 1: null, 2: null };
            }
          } else if (inst.name === 'ev' || inst.name === 'ev_ch') {
            const cgStorage = args.str || args.storage;
            if (cgStorage) {
              tempBackground = cgStorage;
              newSf[cgStorage] = 1;
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
              // Sprite layers
              if (args.visible === 'false' || !storage) {
                tempSprites[layer] = null;
              } else {
                const isBgOrEv = storage.startsWith('bg') || storage.startsWith('ev_') || storage === 'black' || storage === 'white';
                if (isBgOrEv) {
                  tempBackground = storage;
                  if (storage.startsWith('ev_')) {
                    newSf[storage] = 1;
                  }
                } else {
                  tempSprites[layer] = storage;
                }
              }
            }
          } else if (inst.name === 'black') {
            tempBackground = 'black';
          } else if (inst.name === 'chr1') {
            tempSprites[2] = args.str; // Center
          } else if (inst.name === 'chr2') {
            tempSprites[1] = args.str; // Left
          } else if (inst.name === 'chr3') {
            tempSprites[0] = args.str; // Right
          } else if (inst.name === 'chr4') {
            tempSprites[1] = args.str; // Left 3-person pos
          } else if (inst.name === 'chr5') {
            tempSprites[0] = args.str; // Right 3-person pos
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
            const enName = resolveCharacterName(args.txt_en || args.t_en || args.t || '', 'EN');
            currentSpeakerRef.current = { jp: jpName, en: enName };
            setSpeaker(language === 'JP' ? jpName : enName);
            if (inst.name === 'nm' && args.s) {
              playVoice(args.s);
            }
          } else if (inst.name === 'l_moji') {
            setSideNarration({
              visible: true,
              side: 'left',
              text: language === 'JP' ? args.moji : args.moji_en,
              top: args.top ? parseInt(args.top) : 130
            });
            // Stop side narration automatically after 4.5s
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
          } else if (inst.name === 'jump') {
            const storage = args.storage ? args.storage.replace('.ks', '') : currentScenario;
            const target = args.target ? args.target.replace('*', '') : null;
            
            // Trigger storage jump
            loadScenario(storage, target);
            return;
          }
          break;
          
        case 'text':
          // Update speaker & block for click wait
          const displayTxt = language === 'JP' ? inst.text_jp : inst.text_en;
          const prevDiag = dialogueTextRef.current;
          const targetFullText = prevDiag + displayTxt;
          updateDialogueText(targetFullText);
          triggerTypewriter(prevDiag, displayTxt);
          setTextVisible(true);
          
          // Create state-rewind snapshot for backlog jumps
          const snapshot = {
            f: cleanFForSnapshot(newF),
            choicesCount: newF.choicesHistory ? newF.choicesHistory.length : 0,
            sprites: { ...tempSprites },
            background: tempBackground,
            speaker: language === 'JP' ? currentSpeakerRef.current.jp : currentSpeakerRef.current.en,
            currentSpeaker: { ...currentSpeakerRef.current },
            dialogueText: targetFullText,
            currentScenario,
            pointer: p, // standard pointer points to the instruction after this text
            showOptions: showOptions || null,
            bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null
          };
          
          // Append to log history
          setHistoryLog(prev => [
            ...prev.slice(-299), 
            { 
              speakerJp: currentSpeakerRef.current.jp, 
              speakerEn: currentSpeakerRef.current.en, 
              textJp: inst.text_jp, 
              textEn: inst.text_en,
              snapshot
            }
          ]);
          shouldBlock = true;
          break;
          
        case 'wait_click':
          if (p - 1 !== pointer) {
            shouldBlock = true;
          }
          break;
          
        case 'page_break':
          setTypewriterText('');
          updateDialogueText('');
          break;
          
        case 'clear_text':
          setTypewriterText('');
          updateDialogueText('');
          break;
          
        case 'line_feed':
          // Append newline wait in dialogueText and typewriter
          updateDialogueText(dialogueTextRef.current + '<br />');
          setTypewriterText(prev => prev + '<br />');
          break;
          
        case 'link_start':
          // Group following link_start inputs to show choices overlay
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
              // Find the text instruction right after
              let textValJp = "";
              let textValEn = "";
              let linkTextInst = scenarioData[tempP + 1];
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
              // Skip link_start, text, and link_end
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
            // Set pointer to end of link blocks
            p = tempP;
          }
          break;
          
        case 'if':
          if (!evaluateExpression(inst.exp, newF, newSf)) {
            p = skipToEndif(p);
          }
          break;
          
        case 'endif':
          break;
          
        case 'eval':
          try {
            const cleaned = cleanKagExpression(inst.exp);
            const result = new Function('f', 'sf', `${cleaned}; return { f, sf };`)(newF, newSf);
            newF = result.f;
            newSf = result.sf;
          } catch (err) {
            console.error("Inline eval error", err);
          }
          break;
      }
    }

    setPointer(p);
    setF(newF);
    if (JSON.stringify(newSf) !== JSON.stringify(sf)) {
      updateSf(newSf);
    } else {
      setSf(newSf);
    }
    setSprites(tempSprites);
    setBackground(tempBackground);
    
    if (shouldBlock) {
      setIsWaiting(true);
    }
  }, [scenarioData, pointer, isWaiting, showOptions, gameState, language]);

  // Update currently displayed text when language toggles
  useEffect(() => {
    if (!scenarioData || pointer <= 0 || pointer > scenarioData.length || gameState !== 'PLAYING') return;

    // Reconstruct accumulated text on the current page in the toggled language
    let accumulated = '';
    let lastClearIdx = -1;
    
    for (let i = pointer - 1; i >= 0; i--) {
      const inst = scenarioData[i];
      if (inst.type === 'page_break' || inst.type === 'clear_text') {
        lastClearIdx = i;
        break;
      }
    }
    
    for (let i = lastClearIdx + 1; i < pointer; i++) {
      const inst = scenarioData[i];
      if (inst.type === 'text') {
        accumulated += (language === 'JP' ? inst.text_jp : inst.text_en);
      } else if (inst.type === 'line_feed') {
        accumulated += '<br />';
      }
    }

    updateDialogueText(accumulated);
    setTypewriterText(accumulated); // Show full accumulated text instantly on language toggle
    
    // Look backward for the most recent name command to update character speaker translation
    let nameTxtJp = '';
    let nameTxtEn = '';
    for (let i = pointer - 1; i >= 0; i--) {
      const inst = scenarioData[i];
      if (inst.type === 'command' && inst.name === 'name') {
        nameTxtJp = inst.args.txt || '';
        nameTxtEn = resolveCharacterName(inst.args.txt_en || inst.args.txt || '', 'EN');
        break;
      }
    }
    currentSpeakerRef.current = { jp: nameTxtJp, en: nameTxtEn };
    setSpeaker(language === 'JP' ? nameTxtJp : nameTxtEn);
  }, [language, pointer, scenarioData, gameState]);

  // Typewriter effect handler (supports inline html rubies safely)
  const triggerTypewriter = (baseText, newText) => {
    if (textTimerRef.current) clearInterval(textTimerRef.current);
    
    // Reset typewriter text to base text immediately to avoid flashing previous full text
    setTypewriterText(baseText);
    
    // Retrieve active typewriter settings mode (default to 'WORD')
    const modeSetting = sf.typewriterMode || 'WORD';
    
    // Check if typewriter is turned off or we are fast-forwarding
    if (isFastForwardRef.current || modeSetting === 'OFF') {
      setTypewriterText(baseText + newText);
      return;
    }
    
    // Mode resolution: if 'WORD' setting is active and language is English, do word-by-word. Otherwise char-by-char.
    const mode = (modeSetting === 'WORD' && language === 'EN') ? 'EN' : 'JP';
    
    const tokens = tokenizeText(newText, mode);
    let tokenIndex = 0;
    let buffer = baseText;
    
    // 15ms per character for Japanese/Char, 80ms per word for English Word-by-Word
    const speed = mode === 'EN' ? 80 : 15;
    
    textTimerRef.current = setInterval(() => {
      if (tokenIndex >= tokens.length) {
        clearInterval(textTimerRef.current);
        setTypewriterText(baseText + newText);
        return;
      }
      
      buffer += tokens[tokenIndex];
      tokenIndex++;
      setTypewriterText(buffer);
    }, speed);
  };

  // Screen resize scaler to maintain fixed aspect ratio (800x600)
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 820;
      const scaleY = window.innerHeight / 620;
      setScale(Math.min(scaleX, scaleY, 1.5)); // cap scale at 1.5x max
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Advance on screen click
  const handleScreenClick = () => {
    if (showOptions || gameState !== 'PLAYING') return;
    
    // If dialogue box was hidden, restore it on click instead of advancing
    if (!textVisible) {
      setTextVisible(true);
      return;
    }
    
    // If typewriter is still typing, skip it and show full text instantly
    if (typewriterText !== dialogueText) {
      if (textTimerRef.current) clearInterval(textTimerRef.current);
      setTypewriterText(dialogueText);
      return;
    }
    
    if (isWaiting) {
      setIsWaiting(false);
    }
  };
  handleScreenClickRef.current = handleScreenClick;

  const resumeGame = () => {
    if (pointer > 0 && scenarioData) {
      setGameState('PLAYING');
      if (bgmPlayer.src && bgmPlayer.paused) {
        bgmPlayer.play().catch(e => console.log("BGM resume failed", e));
      }
    } else {
      // First attempt to resume from the backend-synced autosave slot
      if (saveSlots && saveSlots.autosave) {
        loadSaveSlot(saveSlots.autosave);
      } else {
        // Fallback to localStorage autosave
        const autosaveRaw = localStorage.getItem('school_autosave');
        if (autosaveRaw) {
          try {
            const slotData = JSON.parse(autosaveRaw);
            loadSaveSlot(slotData);
          } catch (e) {
            console.error("Failed to restore autosave", e);
          }
        }
      }
    }
  };

  const rewindToLastScene = () => {
    if (historyLog.length === 0) return;
    const lastEntry = historyLog[historyLog.length - 1];
    const snap = lastEntry.snapshot;
    
    // Restore states
    setF({
      ...snap.f,
      choicesHistory: (f.choicesHistory || []).slice(0, snap.choicesCount || 0)
    });
    setSprites(snap.sprites);
    setBackground(snap.background);
    setSpeaker(snap.speaker);
    currentSpeakerRef.current = snap.currentSpeaker || { jp: snap.speaker, en: snap.speaker };
    updateDialogueText(snap.dialogueText);
    setTypewriterText(snap.dialogueText);
    setCurrentScenario(snap.currentScenario);
    
    if (snap.currentScenario) {
      loadScenario(snap.currentScenario, null, snap.pointer, true);
    }
    
    if (snap.bgm) {
      playBgm(snap.bgm);
    } else {
      stopBgm();
    }
    
    setGameState('PLAYING');
    setIsWaiting(true);
  };

  const jumpToHistorySnapshot = async (snap, entryIdx) => {
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null);
    setIsWaiting(true);
    
    // Truncate history log to the selected point
    setHistoryLog(prev => prev.slice(0, entryIdx + 1));
    
    // Restore states
    setF({
      ...snap.f,
      choicesHistory: (f.choicesHistory || []).slice(0, snap.choicesCount || 0)
    });
    setSprites(snap.sprites);
    setBackground(snap.background);
    setSpeaker(snap.speaker);
    currentSpeakerRef.current = snap.currentSpeaker || { jp: snap.speaker || '', en: snap.speaker || '' };
    updateDialogueText(snap.dialogueText);
    setTypewriterText(snap.dialogueText);
    
    // Load scenario and restore pointer
    await loadScenario(snap.currentScenario, null, snap.pointer, true);
    
    if (snap.showOptions) {
      setShowOptions(snap.showOptions);
    } else {
      setShowOptions(false);
    }
    
    if (snap.bgm) {
      playBgm(snap.bgm);
    } else {
      stopBgm();
    }
    
    setIsWaiting(true);
    setGameState('PLAYING');
    setShowHistory(false);
  };

  const jumpToChoiceSnapshot = async (choice, choiceIdx) => {
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null);
    setIsWaiting(true);
    
    const snap = choice.snapshot;
    
    // Restore variables and truncate subsequent choice flowchart history
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
    
    // Load scenario and restore pointer
    await loadScenario(snap.currentScenario, null, snap.pointer, true);
    
    // Present the same options overlay again
    setShowOptions(choice.options.map(o => ({
      text_jp: o.jp,
      text_en: o.en,
      target: o.target,
      exp: o.exp
    })));
    
    if (snap.bgm) {
      playBgm(snap.bgm);
    } else {
      stopBgm();
    }
    
    setGameState('PLAYING');
  };

  // Start new playthrough
  const startNewGame = () => {
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setHistoryLog([]); // Clear history log for new game
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
      faceRecord: 0,
      chour: new Date().getHours(), // set title hourly backgrounds
      choicesHistory: [] // Initialize choices history
    });
    setSprites({ 0: null, 1: null, 2: null });
    setBackground('white');
    setDialogueMode('avg');
    setSpeaker('');
    updateDialogueText('');
    setTypewriterText('');
    setGameState('PLAYING');
    loadScenario('g01');
  };

  // Load from Save State
  const loadSaveSlot = async (slotData) => {
    setIsFastForward(false);
    isFastForwardRef.current = false;
    setScenarioData(null); // Clear old scenario to block runner during fetch
    setIsWaiting(true);    // Block interaction during loading
    setF({
      ...slotData.f,
      choicesHistory: slotData.choicesHistory || []
    });
    setSprites(slotData.sprites);
    setBackground(slotData.background);
    setSpeaker(slotData.speaker);
    currentSpeakerRef.current = slotData.currentSpeaker || { jp: slotData.speaker || '', en: slotData.speaker || '' };
    updateDialogueText(slotData.dialogueText);
    setTypewriterText(slotData.dialogueText);
    setDialogueMode(slotData.dialogueMode || 'avg');
    
    // Restore language preference
    if (slotData.language) {
      setLanguage(slotData.language);
    }
    
    if (slotData.historyLog) {
      setHistoryLog(slotData.historyLog);
    } else {
      setHistoryLog([]);
    }
    
    // Always fetch fresh scenarioData to ensure compiler bugfixes apply to existing saves
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
    
    setScenarioData(data);
    setCurrentScenario(slotData.currentScenario);
    setPointer(slotData.pointer);
    
    if (slotData.showOptions) {
      setShowOptions(slotData.showOptions);
    } else {
      setShowOptions(false);
    }
    // Set waiting to true so loading a save doesn't instantly skip the displayed text line
    setIsWaiting(true);
    setGameState('PLAYING');
    
    if (slotData.bgm) {
      playBgm(slotData.bgm);
    } else {
      stopBgm();
    }
    
    setShowSaveLoad(null);
  };

  const handleSaveSlot = (slotIdx) => {
    const slotKey = `school_save_slot_${slotIdx}`;
    const saveData = {
      f: cleanFForSnapshot(f),
      choicesHistory: cleanChoicesHistoryForSave(f.choicesHistory),
      sprites,
      background,
      speaker,
      currentSpeaker: currentSpeakerRef.current,
      dialogueText: dialogueTextRef.current,
      dialogueMode,
      language,
      currentScenario,
      pointer,
      showOptions: showOptions || null,
      historyLog: cleanHistoryLogForSave(historyLog),
      // scenarioData is omitted to keep backend saves lightweight
      bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null,
      date: new Date().toLocaleString()
    };
    localStorage.setItem(slotKey, JSON.stringify(saveData));
    
    // Save to backend API
    fetch('/api/save-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: String(slotIdx), data: saveData })
    }).catch(e => console.error("Failed to save slot to backend", e));

    // Update local React state to reflect instantly in the modal
    setSaveSlots(prev => ({ ...prev, [slotIdx]: saveData }));

    setShowSaveLoad(null);
  };

  // Select Choice Option
  const handleSelectOption = (opt) => {
    // Record choice point to history flowchart before execution modifies variables
    const choiceEntry = {
      scenario: currentScenario,
      pointer: pointer, // pointer where the choice was presented
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
        bgm: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace('.ogg', '') : null
      }
    };

    if (opt.exp) {
      executeStatement(opt.exp);
    }

    // Append to choice history
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
    
    // Find target pointer in current scenario
    const idx = scenarioData.findIndex(i => i.type === 'label' && i.name === opt.target);
    if (idx !== -1) {
      setPointer(idx);
    } else {
      console.error(`Target label ${opt.target} not found`);
    }
  };

  // Back to title screen
  const quitToTitle = () => {
    stopBgm();
    setGameState('TITLE');
    setShowSettings(false);
    setShowSaveLoad(null);
  };

  // Render hourly background image for title screen
  const getTitleBg = () => {
    const hour = f.chour;
    if (hour >= 7 && hour <= 16) return 'bg_106'; // Day
    if (hour >= 17 && hour <= 19) return 'bg_107'; // Evening
    return 'bg_108'; // Night
  };

  return (
    <div className="game-container" style={{ transform: `scale(${scale})` }}>
      <div className="game-screen shadow-premium">
        
        {/* === TITLE SCREEN VIEW === */}
        {gameState === 'TITLE' && (
          <TitleScreen 
            f={f}
            resolveAsset={resolveAsset}
            startNewGame={startNewGame}
            onShowLoad={() => setShowSaveLoad('LOAD')}
            onShowGallery={() => setGameState('GALLERY')}
            onShowSettings={() => setGameState('SETTINGS')}
            hasActiveGame={(pointer > 0 && scenarioData !== null) || localStorage.getItem('school_autosave') !== null || (saveSlots && saveSlots.autosave)}
            onResume={resumeGame}
            language={language}
            hasHistory={historyLog.length > 0}
            onRewind={rewindToLastScene}
            onShowFlowchart={() => setShowChoiceGraph(true)}
          />
        )}

        {/* === PLAYING SCREEN VIEW === */}
        {gameState === 'PLAYING' && (
          <GameplayScreen 
            language={language}
            background={background}
            sprites={sprites}
            sideNarration={sideNarration}
            textVisible={textVisible}
            speaker={speaker}
            typewriterText={typewriterText}
            dialogueText={dialogueText}
            isWaiting={isWaiting}
            showOptions={showOptions}
            resolveAsset={resolveAsset}
            handleScreenClick={handleScreenClick}
            handleWheel={handleWheel}
            handleSelectOption={handleSelectOption}
            setLanguage={setLanguage}
            setShowSaveLoad={setShowSaveLoad}
            setShowSettings={setShowSettings}
            quitToTitle={quitToTitle}
            setShowHistory={setShowHistory}
            onShowFlowchart={() => setShowChoiceGraph(true)}
            dialogueMode={dialogueMode}
          />
        )}

        {/* === CG GALLERY SCREEN VIEW === */}
        {gameState === 'GALLERY' && (
          <GalleryScreen 
            sf={sf}
            resolveAsset={resolveAsset}
            onBack={quitToTitle}
            setCgViewerUrl={setCgViewerUrl}
          />
        )}

        {/* === SETTINGS SCREEN VIEW === */}
        {gameState === 'SETTINGS' && (
          <SettingsPanel 
            language={language}
            setLanguage={setLanguage}
            sf={sf}
            setSf={updateSf}
            onBack={quitToTitle}
          />
        )}

        {/* === SAVE/LOAD OVERLAY MODAL === */}
        {showSaveLoad && (
          <SaveLoadModal 
            mode={showSaveLoad}
            onClose={() => setShowSaveLoad(null)}
            onSaveSlot={handleSaveSlot}
            onLoadSlot={loadSaveSlot}
            saveSlots={saveSlots}
          />
        )}

        {/* === SETTINGS OVERLAY MODAL (MID-GAMEPLAY) === */}
        {showSettings && gameState === 'PLAYING' && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <SettingsPanel 
                language={language}
                setLanguage={setLanguage}
                sf={sf}
                setSf={updateSf}
                onBack={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}

        {/* === CG VIEWER OVERLAY === */}
        {cgViewerUrl && (
          <div className="cg-viewer-overlay" onClick={() => setCgViewerUrl(null)}>
            <img src={cgViewerUrl} alt="CG Full View" className="full-cg-image" />
            <div className="cg-viewer-close-hint">Click anywhere to close</div>
          </div>
        )}

        {/* === CHOICE FLOWCHART / GRAPH OVERLAY === */}
        {showChoiceGraph && (
          <ChoiceGraphModal 
            onClose={() => setShowChoiceGraph(false)}
            f={f}
            language={language}
            onJumpToChoice={jumpToChoiceSnapshot}
          />
        )}

        {/* === BACKLOG / HISTORY OVERLAY === */}
        {showHistory && (
          <HistoryModal 
            onClose={() => setShowHistory(false)}
            historyLog={historyLog}
            language={language}
            onJumpToSnapshot={jumpToHistorySnapshot}
          />
        )}

        {/* === DEBUG PANEL OVERLAY === */}
        <DebugPanel 
          currentScenario={currentScenario}
          pointer={pointer}
          scenarioData={scenarioData}
          f={f}
          sf={sf}
          setF={setF}
          setSf={updateSf}
          loadScenario={loadScenario}
          sprites={sprites}
          background={background}
          dialogueMode={dialogueMode}
          speaker={speaker}
        />

      </div>
    </div>
  );
}
