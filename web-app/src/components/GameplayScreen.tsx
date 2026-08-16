import React from 'react';
import DialogueBox from './DialogueBox';
import BgmToast from './BgmToast';
import spritePositions from '../sprite_positions.json';
import { DialogueMode, Language, SpritesState, SystemFlags, ChoiceOption } from '../types/kag';

interface PositionInfo {
  base: string;
  base_h?: number;
  base_w?: number;
  left_pct?: number;
  top_pct?: number;
  width_pct?: number;
}

const typedSpritePositions: Record<string, PositionInfo> = spritePositions as unknown as Record<string, PositionInfo>;

interface SpriteProps {
  spriteName?: string | null;
  resolveAsset: (name?: string | null, type?: string) => string;
  positionClass: string;
}

function Sprite({ spriteName, resolveAsset, positionClass }: SpriteProps) {
  if (!spriteName) return null;
  const cleanName = spriteName.split('.')[0];
  let positionInfo: PositionInfo | undefined = typedSpritePositions[cleanName] || typedSpritePositions['st_' + cleanName];
  
  let isBaseBodyOnly = false;
  if (!positionInfo) {
    // Find any key in sprite_positions that uses this as base body
    const searchBaseName = cleanName.startsWith('st_') ? cleanName : 'st_' + cleanName;
    const cleanSearchBaseName = cleanName.startsWith('st_') ? cleanName.slice(3) : cleanName;
    const foundEntry = Object.values(typedSpritePositions).find(
      posVal => posVal.base === searchBaseName || posVal.base === cleanSearchBaseName
    );
    if (foundEntry) {
      positionInfo = {
        base: searchBaseName,
        base_h: foundEntry.base_h,
        base_w: foundEntry.base_w
      };
      isBaseBodyOnly = true;
    }
  }

  let height = '530px';
  if (positionInfo && positionInfo.base_h) {
    const isStandard = cleanName.endsWith('_s');
    const refH = isStandard ? 1120 : 1728;
    const computedH = Math.min(580, Math.round(525 * (positionInfo.base_h / refH)));
    height = `${computedH}px`;
  }

  if (positionInfo) {
    const baseSrc = resolveAsset(positionInfo.base, 'fgimage');
    const overlaySrc = resolveAsset(spriteName, 'fgimage');
    return (
      <div className={`sprite-img ${positionClass}`} style={{ height, overflow: 'visible', width: 'fit-content' }}>
        <img src={baseSrc} alt="base body" style={{ height: '100%', width: 'auto', display: 'block' }} />
        {!isBaseBodyOnly && (
          <img 
            src={overlaySrc} 
            alt="face overlay" 
            style={{ 
              position: 'absolute', 
              left: `${positionInfo.left_pct}%`, 
              top: `${positionInfo.top_pct}%`, 
              width: `${positionInfo.width_pct}%`,
              display: 'block'
            }} 
          />
        )}
      </div>
    );
  }
  
  return <img className={`sprite-img ${positionClass}`} src={resolveAsset(spriteName, 'fgimage')} alt={`${positionClass} sprite`} style={{ height }} />;
}

export interface GameplayScreenProps {
  language: Language | string;
  background: string;
  sprites: SpritesState;
  faceIcon?: string | null;
  sideNarration?: { visible: boolean; text: string; side: 'left' | 'right'; top: number };
  textVisible: boolean;
  speaker?: string;
  typewriterText: string;
  dialogueText: string;
  currentVoice?: string;
  replayCurrentVoice?: () => void;
  isWaiting: boolean;
  showOptions?: ChoiceOption[] | null;
  resolveAsset: (name?: string | null, type?: string) => string;
  handleScreenClick: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleSelectOption: (opt: ChoiceOption) => void;
  setLanguage: (lang: Language) => void;
  onOpenArchives?: () => void;
  setShowSaveLoad?: (mode: any) => void;
  setShowSettings: (show: boolean) => void;
  quitToTitle: () => void;
  setShowHistory: (show: boolean) => void;
  onShowFlowchart?: () => void;
  dialogueMode: DialogueMode | string;
  isAutoMode: boolean;
  isFastForward: boolean;
  onToggleAuto: () => void;
  onToggleSkip: () => void;
  onOpenToc?: () => void;
  onToggleFlipper?: () => void;
  isSceneReplayMode?: boolean;
  currentBgm?: string | null;
  sf?: SystemFlags;
  updateSf?: (sf: SystemFlags) => void;
}

export default function GameplayScreen({
  language,
  background,
  sprites,
  faceIcon,
  sideNarration,
  textVisible,
  speaker,
  typewriterText,
  dialogueText,
  currentVoice,
  replayCurrentVoice,
  isWaiting,
  showOptions,
  resolveAsset,
  handleScreenClick,
  handleWheel,
  handleSelectOption,
  setLanguage,
  onOpenArchives,
  setShowSaveLoad,
  setShowSettings,
  quitToTitle,
  setShowHistory,
  onShowFlowchart,
  dialogueMode,
  isAutoMode,
  isFastForward,
  onToggleAuto,
  onToggleSkip,
  onOpenToc,
  onToggleFlipper,
  isSceneReplayMode,
  currentBgm,
  sf,
  updateSf
}: GameplayScreenProps) {
  return (
    <div className="playing-layer" onClick={handleScreenClick} onWheel={!sf?.disableWheelHistory ? handleWheel : undefined}>
      
      {/* Background Image/Color */}
      <div 
        className="bg-layer" 
        style={{ 
          backgroundImage: background && background !== 'black' && background !== 'white' ? `url(${resolveAsset(background, 'bgimage')})` : 'none',
          backgroundColor: background === 'white' ? '#fff' : '#000'
        }} 
      />

      {/* Floating Top-Left BGM Change Toast Notification */}
      <BgmToast currentBgm={currentBgm} disabled={Boolean(sf?.disableBgmToast)} language={language} />

      {/* Character Sprites Layer */}
      <div className="sprites-container">
        <Sprite spriteName={sprites[1]} resolveAsset={resolveAsset} positionClass="sprite-left" />
        <Sprite spriteName={sprites[2]} resolveAsset={resolveAsset} positionClass="sprite-center" />
        <Sprite spriteName={sprites[0]} resolveAsset={resolveAsset} positionClass="sprite-right" />
      </div>

      {/* Side Narration (Vertical left/right border popups) */}
      {sideNarration && sideNarration.visible && (
        <div className={`side-narration-overlay side-narration-${sideNarration.side}`} style={{ top: `${sideNarration.top}px` }}>
          {language === 'JP' ? (
            sideNarration.text.split('').map((char, index) => (
              <span key={index} className="narration-char">{char}</span>
            ))
          ) : (
            <span className="narration-text-horizontal">{sideNarration.text}</span>
          )}
        </div>
      )}

      {/* Floating Scene Replay Return Badge (Only in Scene Replay Mode) */}
      {isSceneReplayMode && (
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '20px',
            padding: '4px 12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
            animation: 'fade-in 0.3s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '11px', color: '#f472b6', fontWeight: 600 }}>🎬 场景回顾中</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              quitToTitle();
            }}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 10px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(236, 72, 153, 0.4)'
            }}
          >
            ⬅️ {language === 'JP' ? '返回鉴赏' : 'Return to Gallery'}
          </button>
        </div>
      )}

      {/* Text Dialogue Layer */}
      {textVisible && (
        <DialogueBox 
          dialogueMode={dialogueMode}
          speaker={speaker}
          faceIcon={faceIcon}
          resolveAsset={resolveAsset}
          typewriterText={typewriterText}
          dialogueText={dialogueText}
          currentVoice={currentVoice}
          replayCurrentVoice={replayCurrentVoice}
          isWaiting={isWaiting}
          language={language}
          _setLanguage={setLanguage}
          onOpenArchives={onOpenArchives || (() => setShowSaveLoad?.('SAVE'))}
          onSave={() => setShowSaveLoad ? setShowSaveLoad('SAVE') : onOpenArchives?.()}
          onLoad={() => setShowSaveLoad ? setShowSaveLoad('LOAD') : onOpenArchives?.()}
          onConfig={() => setShowSettings(true)}
          onQuit={quitToTitle}
          onScreenClick={handleScreenClick}
          onShowHistory={() => setShowHistory(true)}
          onShowFlowchart={onShowFlowchart}
          onOpenToc={onOpenToc}
          onToggleFlipper={onToggleFlipper}
          isAutoMode={isAutoMode}
          isFastForward={isFastForward}
          onToggleAuto={onToggleAuto}
          onToggleSkip={onToggleSkip}
          isSceneReplayMode={isSceneReplayMode}
          sf={sf}
          updateSf={updateSf}
        />
      )}

      {/* Choices Overlay Option Overlay */}
      {showOptions && (
        <div className="choices-overlay-panel" onClick={(e) => e.stopPropagation()}>
          <div className="choices-list-container">
            {showOptions.map((opt, idx) => (
              <button 
                key={idx} 
                className="choice-premium-btn glass-panel" 
                onClick={() => handleSelectOption(opt)}
              >
                {language === 'JP' ? opt.text_jp : opt.text_en}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
