import React, { useState, useEffect } from 'react';
import './App.css';
import gameConfig from './game_config.json';

// --- Sub Components ---
import TitleScreen from './components/TitleScreen';
import SaveLoadModal from './components/SaveLoadModal';
import GalleryScreen from './components/GalleryScreen';
import SettingsPanel from './components/SettingsPanel';
import HistoryModal from './components/HistoryModal';
import GameplayScreen from './components/GameplayScreen';
import ChoiceGraphModal from './components/ChoiceGraphModal';
import DebugPanel from './components/DebugPanel';
import MusicRoom from './components/MusicRoom';

// --- Custom Hooks ---
import { useGameAudio } from './hooks/useGameAudio';
import { useKagRunner } from './hooks/useKagRunner';

// --- Utility Helpers ---
import { resolveAsset } from './utils/gameUtils';

export default function App() {
  // Screen scaling to fit browser viewport
  const [scale, setScale] = useState(1);
  const [cgViewerUrl, setCgViewerUrl] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const targetWidth = debugOpen ? 1140 : 800;
      const scaleX = w / targetWidth;
      const scaleY = h / 600;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debugOpen]);

  // Keydown listener in App to toggle debug panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setDebugOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize modular Audio Hook with localStorage values if available
  const savedSfStr = localStorage.getItem(`${gameConfig.storagePrefix || 'school'}_sf`);
  let initialVol = 8;
  let initialSeVol = 8;
  if (savedSfStr) {
    try {
      const parsed = JSON.parse(savedSfStr);
      if (parsed.vol !== undefined) initialVol = parsed.vol;
      if (parsed.sevol !== undefined) initialSeVol = parsed.sevol;
    } catch (e) {}
  }

  const audio = useGameAudio(initialVol, initialSeVol);

  // Initialize main KAG Engine interpreter state loop
  const runner = useKagRunner({
    config: gameConfig,
    playBgm: audio.playBgm,
    stopBgm: audio.stopBgm,
    playSe: audio.playSe,
    playVoice: audio.playVoice,
    currentVoiceRef: audio.currentVoiceRef,
    bgmPlayer: audio.bgmPlayer,
    sePlayer: audio.sePlayer,
    voicePlayer: audio.voicePlayer,
    toggleBgm: audio.toggleBgm
  });

  // Re-sync volume changes when sf settings are updated live in settings panel
  useEffect(() => {
    const vol = runner.sf.vol !== undefined ? runner.sf.vol : 8;
    const sevol = runner.sf.sevol !== undefined ? runner.sf.sevol : 8;
    audio.bgmPlayer.volume = vol / 10;
    audio.sePlayer.volume = sevol / 10;
    audio.voicePlayer.volume = sevol / 10;
  }, [runner.sf.vol, runner.sf.sevol]);

  // Read URL search params on mount, restoring from autosave if they match the URL scenario/pointer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scen = params.get('scen');
    const ptr = params.get('ptr');
    if (scen) {
      const parsedPtr = parseInt(ptr) || 0;
      const autoStr = localStorage.getItem('school_autosave');
      let loadedFromAuto = false;
      if (autoStr) {
        try {
          const autoData = JSON.parse(autoStr);
          if (autoData.currentScenario === scen && autoData.pointer === parsedPtr) {
            runner.loadSaveSlot(autoData);
            loadedFromAuto = true;
          }
        } catch (e) {}
      }
      if (!loadedFromAuto) {
        runner.setGameState('PLAYING');
        runner.loadScenario(scen, null, parsedPtr);
      }
    }
  }, []);

  // Sync current scenario and pointer to URL query parameters for debugging
  useEffect(() => {
    if (runner.gameState === 'PLAYING' && runner.currentScenario) {
      const url = new URL(window.location.href);
      url.searchParams.set('scen', runner.currentScenario);
      url.searchParams.set('ptr', runner.pointer.toString());
      window.history.replaceState(null, '', url.pathname + url.search);
    } else if (runner.gameState === 'TITLE') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('scen') || url.searchParams.has('ptr')) {
        url.searchParams.delete('scen');
        url.searchParams.delete('ptr');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  }, [runner.currentScenario, runner.pointer, runner.gameState]);

  // Handle ESC key to close active overlays
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (runner.showHistory) {
          runner.setShowHistory(false);
        } else if (runner.showSettings) {
          runner.setShowSettings(false);
        } else if (runner.showSaveLoad) {
          runner.setShowSaveLoad(null);
        } else if (runner.showChoiceGraph) {
          runner.setShowChoiceGraph(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [runner.showHistory, runner.showSettings, runner.showSaveLoad, runner.showChoiceGraph]);

  const handleNextChapter = () => {
    const slotData = runner.saveSlots[150];
    if (slotData) {
      runner.setTf({ go_next_chapter: true });
      runner.loadSaveSlot(slotData);
    }
  };

  return (
    <div 
      className="game-container" 
      style={{ 
        transform: `scale(${scale})`,
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className={`game-screen shadow-premium ${runner.quakeActive ? 'shake-effect' : ''}`}>
        
        {/* === TITLE SCREEN VIEW === */}
        {runner.gameState === 'TITLE' && (
          <TitleScreen 
            f={runner.f}
            resolveAsset={resolveAsset}
            startNewGame={runner.startNewGame}
            onShowLoad={() => runner.setShowSaveLoad('LOAD')}
            onShowGallery={() => runner.setGameState('GALLERY')}
            onShowMusic={() => runner.setGameState('MUSIC')}
            onShowSettings={() => runner.setGameState('SETTINGS')}
            hasActiveGame={(runner.pointer > 0 && runner.scenarioData !== null) || localStorage.getItem('school_autosave') !== null || (runner.saveSlots && runner.saveSlots.autosave)}
            onResume={runner.resumeGame}
            language={runner.language}
            hasHistory={runner.historyLog.length > 0}
            onRewind={runner.rewindToLastScene}
            onShowFlowchart={() => runner.setShowChoiceGraph(true)}
            isBgmPlaying={audio.isBgmPlaying}
            onToggleBgm={audio.toggleBgm}
            showNextChapter={runner.sf.show_next_chapter === 1 || runner.sf.show_next_chapter === true || runner.sf.show_next_chapter === 'true'}
            onNextChapter={handleNextChapter}
          />
        )}

        {/* === PLAYING SCREEN VIEW === */}
        {runner.gameState === 'PLAYING' && (
          <GameplayScreen 
            language={runner.language}
            background={runner.background}
            sprites={runner.sprites}
            faceIcon={runner.faceIcon}
            sideNarration={runner.sideNarration}
            textVisible={runner.textVisible}
            speaker={runner.speaker}
            typewriterText={runner.typewriterText}
            currentVoice={runner.currentVoice}
            replayCurrentVoice={runner.replayCurrentVoice}
            dialogueText={runner.dialogueText}
            isWaiting={runner.isWaiting}
            showOptions={runner.showOptions}
            resolveAsset={resolveAsset}
            handleScreenClick={runner.handleScreenClick}
            handleWheel={runner.handleWheel}
            handleSelectOption={runner.handleSelectOption}
            setLanguage={runner.setLanguage}
            setShowSaveLoad={(mode) => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              runner.setShowSaveLoad(mode);
            }}
            setShowSettings={(show) => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              runner.setShowSettings(show);
            }}
            quitToTitle={() => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              runner.quitToTitle();
            }}
            setShowHistory={(show) => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              runner.setShowHistory(show);
            }}
            onShowFlowchart={() => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              runner.setShowChoiceGraph(true);
            }}
            dialogueMode={runner.dialogueMode}
            isAutoMode={runner.isAutoMode}
            isFastForward={runner.isFastForward}
            onToggleAuto={() => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              const nextAuto = !runner.isAutoMode;
              console.log(
                `%c[SYSTEM] Auto Mode toggled to: %c${nextAuto ? 'ON' : 'OFF'}`,
                'color: #abb2bf; font-weight: bold;',
                nextAuto ? 'color: #98c379; font-weight: bold;' : 'color: #e06c75; font-weight: bold;'
              );
              runner.setIsAutoMode(nextAuto);
              runner.setIsFastForward(false);
            }}
            onToggleSkip={() => {
              if (!runner.isAudioUnlocked) {
                runner.setIsAudioUnlocked(true);
              }
              const nextSkip = !runner.isFastForward;
              console.log(
                `%c[SYSTEM] Skip Mode toggled to: %c${nextSkip ? 'ON' : 'OFF'}`,
                'color: #abb2bf; font-weight: bold;',
                nextSkip ? 'color: #98c379; font-weight: bold;' : 'color: #e06c75; font-weight: bold;'
              );
              runner.setIsFastForward(nextSkip);
              runner.setIsAutoMode(false);
            }}
            sf={runner.sf}
            updateSf={runner.updateSf}
          />
        )}

        {/* === CG GALLERY SCREEN VIEW === */}
        {runner.gameState === 'GALLERY' && (
          <GalleryScreen 
            sf={runner.sf}
            resolveAsset={resolveAsset}
            onBack={runner.quitToTitle}
            setCgViewerUrl={setCgViewerUrl}
          />
        )}

        {/* === MUSIC GALLERY SCREEN VIEW === */}
        {runner.gameState === 'MUSIC' && (
          <MusicRoom 
            playBgm={audio.playBgm}
            stopBgm={audio.stopBgm}
            currentBgmName={audio.bgmPlayer.src ? audio.bgmPlayer.src.split('/').pop().split('.')[0] : ''}
            onBack={runner.quitToTitle}
            sf={runner.sf}
            setSf={runner.updateSf}
          />
        )}

        {/* === SETTINGS SCREEN VIEW === */}
        {runner.gameState === 'SETTINGS' && (
          <SettingsPanel 
            language={runner.language}
            setLanguage={runner.setLanguage}
            sf={runner.sf}
            setSf={runner.updateSf}
            onBack={runner.quitToTitle}
            isGameplay={false}
            username={runner.username}
            onSwitchUser={() => {
              setNewUsernameInput(runner.username);
              setShowUserModal(true);
            }}
          />
        )}

        {/* === SCREEN FLASH VISUAL EFFECT === */}
        {runner.flashActive && (
          <div 
            className="screen-flash-overlay" 
            style={{ backgroundColor: runner.flashActive }}
          />
        )}

        {/* === SAVE/LOAD OVERLAY MODAL === */}
        {runner.showSaveLoad && (
          <SaveLoadModal 
            mode={runner.showSaveLoad}
            onClose={() => runner.setShowSaveLoad(null)}
            onSaveSlot={runner.handleSaveSlot}
            onLoadSlot={runner.loadSaveSlot}
            saveSlots={runner.saveSlots}
          />
        )}

        {/* === SETTINGS OVERLAY MODAL (MID-GAMEPLAY) === */}
        {runner.showSettings && runner.gameState === 'PLAYING' && (
          <div className="modal-overlay" onClick={() => runner.setShowSettings(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <SettingsPanel 
                language={runner.language}
                setLanguage={runner.setLanguage}
                sf={runner.sf}
                setSf={runner.updateSf}
                onBack={() => runner.setShowSettings(false)}
                isGameplay={true}
                username={runner.username}
                onSwitchUser={() => {
                  setNewUsernameInput(runner.username);
                  setShowUserModal(true);
                }}
                onSave={() => {
                  runner.setShowSettings(false);
                  runner.setShowSaveLoad('SAVE');
                }}
                onLoad={() => {
                  runner.setShowSettings(false);
                  runner.setShowSaveLoad('LOAD');
                }}
                onQuit={() => {
                  runner.setShowSettings(false);
                  runner.quitToTitle();
                }}
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
        {runner.showChoiceGraph && (
          <ChoiceGraphModal 
            onClose={() => runner.setShowChoiceGraph(false)}
            f={runner.f}
            language={runner.language}
            currentScenario={runner.currentScenario}
            onJumpToChoice={runner.jumpToChoiceSnapshot}
          />
        )}

        {/* === BACKLOG / HISTORY OVERLAY === */}
        {runner.showHistory && (
          <HistoryModal 
            onClose={() => runner.setShowHistory(false)}
            historyLog={runner.historyLog}
            language={runner.language}
            onJumpToSnapshot={runner.jumpToHistorySnapshot}
            onReplayVoice={(voice) => {
              setTimeout(() => {
                audio.playVoice(voice);
              }, 150);
            }}
            autoFocusSearch={runner.historySearchFocused}
          />
        )}

        {/* === SESSION CONFLICT LOCKOUT OVERLAY === */}
        {runner.sessionConflict && (
          <div className="modal-overlay session-conflict-overlay glass-panel" style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            textAlign: 'center',
            padding: '20px'
          }}>
            <h2 style={{ color: '#e06c75', fontSize: '2rem', marginBottom: '15px' }}>
              ⚠️ {runner.language === 'JP' ? '会话冲突' : 'Session Conflict'}
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#abb2bf', maxWidth: '400px', lineHeight: '1.6' }}>
              {runner.language === 'JP' 
                ? `用户 "${runner.username}" 已在另一个浏览器窗口中登录并处于活跃状态。为了防止存档损坏，该窗口的操作已被暂停。`
                : `User "${runner.username}" is already active in another browser window. This session has been suspended to prevent save data corruption.`}
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="control-btn active" onClick={() => window.location.reload()}>
                {runner.language === 'JP' ? '刷新此窗口' : 'Refresh This Tab'}
              </button>
            </div>
          </div>
        )}

        {/* === USER PROFILE SWITCHER MODAL === */}
        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="glass-panel save-load-modal" onClick={(e) => e.stopPropagation()} style={{
              width: '400px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.5rem', color: '#61afef' }}>
                👤 {runner.language === 'JP' ? '切换用户配置文件' : 'Switch User Profile'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: '#abb2bf' }}>
                  {runner.language === 'JP' ? '当前激活的用户:' : 'Currently active:'} <strong>{runner.username}</strong>
                </label>
                <input 
                  type="text"
                  placeholder={runner.language === 'JP' ? '输入用户名...' : 'Enter profile name...'}
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: '1px solid #4b5263',
                    backgroundColor: '#282c34',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newUsernameInput.trim()) {
                      runner.setUsername(newUsernameInput.trim());
                      setShowUserModal(false);
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button className="control-btn" onClick={() => setShowUserModal(false)}>
                  {runner.language === 'JP' ? '取消' : 'Cancel'}
                </button>
                <button 
                  className="control-btn active"
                  disabled={!newUsernameInput.trim()}
                  onClick={() => {
                    if (newUsernameInput.trim()) {
                      runner.setUsername(newUsernameInput.trim());
                      setShowUserModal(false);
                    }
                  }}
                >
                  {runner.language === 'JP' ? '确认切换' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* === DEBUG PANEL OVERLAY === */}
      {debugOpen && (
        <DebugPanel 
          currentScenario={runner.currentScenario}
          pointer={runner.pointer}
          scenarioData={runner.scenarioData}
          f={runner.f}
          sf={runner.sf}
          setF={runner.setF}
          setSf={runner.updateSf}
          loadScenario={runner.loadScenario}
          sprites={runner.sprites}
          background={runner.background}
          dialogueMode={runner.dialogueMode}
          speaker={runner.speaker}
          bgmPlayer={audio.bgmPlayer}
          playVoice={audio.playVoice}
          onClose={() => setDebugOpen(false)}
        />
      )}
    </div>
  );
}
