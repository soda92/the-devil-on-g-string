import React from 'react';
import DialogueBox from './DialogueBox';
import spritePositions from '../sprite_positions.json';

function Sprite({ spriteName, resolveAsset, positionClass }) {
  if (!spriteName) return null;
  const cleanName = spriteName.split('.')[0];
  const positionInfo = spritePositions[cleanName] || spritePositions['st_' + cleanName];
  
  let height = '580px';
  if (positionInfo && positionInfo.base_h) {
    const isStandard = cleanName.endsWith('_s');
    const refH = isStandard ? 1120 : 1728;
    height = `${580 * (positionInfo.base_h / refH)}px`;
  }

  if (positionInfo) {
    const baseSrc = resolveAsset(positionInfo.base, 'fgimage');
    const overlaySrc = resolveAsset(spriteName, 'fgimage');
    return (
      <div className={`sprite-img ${positionClass}`} style={{ height, overflow: 'visible', width: 'fit-content' }}>
        <img src={baseSrc} alt="base body" style={{ height: '100%', width: 'auto', display: 'block' }} />
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
      </div>
    );
  }
  
  return <img className={`sprite-img ${positionClass}`} src={resolveAsset(spriteName, 'fgimage')} alt={`${positionClass} sprite`} style={{ height }} />;
}

export default function GameplayScreen({
  language,
  background,
  sprites,
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
  sf,
  updateSf
}) {
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

      {/* Text Dialogue Layer */}
      {textVisible && (
        <DialogueBox 
          dialogueMode={dialogueMode}
          speaker={speaker}
          typewriterText={typewriterText}
          dialogueText={dialogueText}
          currentVoice={currentVoice}
          replayCurrentVoice={replayCurrentVoice}
          isWaiting={isWaiting}
          language={language}
          setLanguage={setLanguage}
          onSave={() => setShowSaveLoad('SAVE')}
          onLoad={() => setShowSaveLoad('LOAD')}
          onConfig={() => setShowSettings(true)}
          onQuit={quitToTitle}
          onScreenClick={handleScreenClick}
          onShowHistory={() => setShowHistory(true)}
          onShowFlowchart={onShowFlowchart}
          isAutoMode={isAutoMode}
          isFastForward={isFastForward}
          onToggleAuto={onToggleAuto}
          onToggleSkip={onToggleSkip}
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
