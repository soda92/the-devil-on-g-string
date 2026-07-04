import React from 'react';

export default function DialogueBox({ speaker, typewriterText, dialogueText, isWaiting, language, setLanguage, onSave, onLoad, onConfig, onQuit, onScreenClick, onShowHistory, onShowFlowchart }) {
  return (
    <div className="dialogue-box-layer glass-panel" onClick={(e) => e.stopPropagation()}>
      {speaker && <div className="dialogue-speaker">{speaker}</div>}
      
      <div 
        className="dialogue-text" 
        dangerouslySetInnerHTML={{ __html: typewriterText }} 
        onClick={onScreenClick}
      />
      
      {/* Text cursor arrow indicator */}
      {isWaiting && typewriterText === dialogueText && (
        <div className="dialogue-cursor" onClick={onScreenClick}>▼</div>
      )}
      
      {/* Floating System Actions Bar */}
      <div className="system-actions-bar">
        <button className="sys-action-btn" onClick={onShowHistory}>Log</button>
        {onShowFlowchart && <button className="sys-action-btn" onClick={onShowFlowchart}>Flowchart</button>}
        <button className="sys-action-btn" onClick={onSave}>Save</button>
        <button className="sys-action-btn" onClick={onLoad}>Load</button>
        <button className="sys-action-btn" onClick={onConfig}>Config</button>
        <button className="sys-action-btn" onClick={() => setLanguage(l => l === 'JP' ? 'EN' : 'JP')}>
          {language === 'JP' ? 'ENG' : '日本語'}
        </button>
        <button className="sys-action-btn" onClick={onQuit}>Menu</button>
      </div>
    </div>
  );
}
