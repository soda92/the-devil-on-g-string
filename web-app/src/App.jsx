import React, { useState, useEffect } from 'react';
import './App.css';

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

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = w / 800;
      const scaleY = h / 600;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize modular Audio Hook with localStorage values if available
  const savedSfStr = localStorage.getItem('school_school_sf');
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
    playBgm: audio.playBgm,
    stopBgm: audio.stopBgm,
    playSe: audio.playSe,
    playVoice: audio.playVoice,
    currentVoiceRef: audio.currentVoiceRef,
    bgmPlayer: audio.bgmPlayer,
    sePlayer: audio.sePlayer,
    voicePlayer: audio.voicePlayer
  });

  // Re-sync volume changes when sf settings are updated live in settings panel
  useEffect(() => {
    const vol = runner.sf.vol !== undefined ? runner.sf.vol : 8;
    const sevol = runner.sf.sevol !== undefined ? runner.sf.sevol : 8;
    audio.bgmPlayer.volume = vol / 10;
    audio.sePlayer.volume = sevol / 10;
    audio.voicePlayer.volume = sevol / 10;
  }, [runner.sf.vol, runner.sf.sevol]);

  // Read URL search params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scen = params.get('scen');
    const ptr = params.get('ptr');
    if (scen) {
      const parsedPtr = parseInt(ptr) || 0;
      runner.setGameState('PLAYING');
      runner.loadScenario(scen, null, parsedPtr);
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

  return (
    <div className="game-container" style={{ transform: `scale(${scale})` }}>
      <div className="game-screen shadow-premium">
        
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
          />
        )}

        {/* === PLAYING SCREEN VIEW === */}
        {runner.gameState === 'PLAYING' && (
          <GameplayScreen 
            language={runner.language}
            background={runner.background}
            sprites={runner.sprites}
            sideNarration={runner.sideNarration}
            textVisible={runner.textVisible}
            speaker={runner.speaker}
            typewriterText={runner.typewriterText}
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
                audio.playBgm('bgm_01');
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
            onReplayVoice={audio.playVoice}
          />
        )}

        {/* === DEBUG PANEL OVERLAY === */}
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
        />

      </div>
    </div>
  );
}
