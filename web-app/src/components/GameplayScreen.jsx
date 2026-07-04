import React from 'react';
import DialogueBox from './DialogueBox';

export default function GameplayScreen({
  language,
  background,
  sprites,
  sideNarration,
  textVisible,
  speaker,
  typewriterText,
  dialogueText,
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
  onShowFlowchart
}) {
  return (
    <div className="playing-layer" onClick={handleScreenClick} onWheel={handleWheel}>
      
      {/* Background Image/Color */}
      <div 
        className="bg-layer" 
        style={{ 
          backgroundColor: background === 'white' ? '#fff' : (background === 'black' ? '#000' : 'transparent'),
          backgroundImage: (background !== 'white' && background !== 'black') ? `url(${resolveAsset(background, 'bgimage')})` : 'none'
        }} 
      />

      {/* Character Sprites Stacked Layers */}
      <div className="sprites-container">
        {sprites[1] && <img className="sprite-img sprite-left" src={resolveAsset(sprites[1], 'fgimage')} alt="left sprite" />}
        {sprites[2] && <img className="sprite-img sprite-center" src={resolveAsset(sprites[2], 'fgimage')} alt="center sprite" />}
        {sprites[0] && <img className="sprite-img sprite-right" src={resolveAsset(sprites[0], 'fgimage')} alt="right sprite" />}
      </div>

      {/* Side Narration (Vertical/Horizontal) Overlay */}
      {sideNarration.visible && (
        <div className={`side-narration-overlay side-${sideNarration.side} language-${language}`} style={{ top: `${sideNarration.top}px` }}>
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
          speaker={speaker}
          typewriterText={typewriterText}
          dialogueText={dialogueText}
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
