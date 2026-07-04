import React from 'react';

export default function DialogueBox({ dialogueMode, speaker, typewriterText, dialogueText, isWaiting, language, setLanguage, onSave, onLoad, onConfig, onQuit, onScreenClick, onShowHistory, onShowFlowchart }) {
  return (
    <div className={`dialogue-box-layer glass-panel ${dialogueMode === 'novel' ? 'novel-mode' : 'avg-mode'}`} onClick={(e) => e.stopPropagation()}>
      {speaker && dialogueMode !== 'novel' && <div className="dialogue-speaker">{speaker}</div>}
      
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
        <button className="sys-action-btn" onClick={onShowHistory}>历史</button>
        {onShowFlowchart && <button className="sys-action-btn" onClick={onShowFlowchart}>路线</button>}
        <button className="sys-action-btn" onClick={onSave}>保存</button>
        <button className="sys-action-btn" onClick={onLoad}>读取</button>
        <button className="sys-action-btn" onClick={onConfig}>设置</button>
        <button className="sys-action-btn" onClick={onQuit}>菜单</button>
      </div>
    </div>
  );
}
