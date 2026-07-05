import React, { useEffect, useRef } from 'react';

export default function DialogueBox({ dialogueMode, speaker, typewriterText, dialogueText, currentVoice, replayCurrentVoice, isWaiting, language, setLanguage, onSave, onLoad, onConfig, onQuit, onScreenClick, onShowHistory, onShowFlowchart, isAutoMode, isFastForward, onToggleAuto, onToggleSkip, sf }) {
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [typewriterText]);

  const opacityVal = dialogueMode === 'novel' 
    ? (sf && sf.novelOpacity !== undefined ? sf.novelOpacity : 8)
    : (sf && sf.avgOpacity !== undefined ? sf.avgOpacity : 6);
    
  const blurVal = dialogueMode === 'novel'
    ? (sf && sf.novelBlur !== undefined ? sf.novelBlur : 8)
    : (sf && sf.avgBlur !== undefined ? sf.avgBlur : 16);

  const bgStyle = dialogueMode === 'novel' 
    ? { 
        backgroundColor: `rgba(10, 10, 10, ${opacityVal / 10})`,
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`
      }
    : { 
        backgroundColor: `rgba(15, 10, 30, ${opacityVal / 10})`,
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`
      };

  return (
    <div 
      className={`dialogue-box-layer glass-panel ${dialogueMode === 'novel' ? 'novel-mode' : 'avg-mode'}`} 
      onClick={(e) => e.stopPropagation()}
      style={bgStyle}
    >
      {speaker && dialogueMode !== 'novel' && (
        <div className="dialogue-speaker" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{speaker}</span>
          {currentVoice && (
            <button 
              className="voice-replay-btn" 
              onClick={(e) => {
                e.stopPropagation();
                replayCurrentVoice && replayCurrentVoice();
              }}
              title="播放语音 / Replay Voice"
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '0 2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
                transition: 'opacity 0.2s',
                opacity: 0.8
              }}
            >
              🔊
            </button>
          )}
        </div>
      )}
      
      <div 
        ref={textRef}
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
        <button className={`sys-action-btn ${isAutoMode ? 'active-auto' : ''}`} onClick={onToggleAuto}>自动</button>
        <button className={`sys-action-btn ${isFastForward ? 'active-skip' : ''}`} onClick={onToggleSkip}>快进</button>
        <button className="sys-action-btn" onClick={onSave}>保存</button>
        <button className="sys-action-btn" onClick={onLoad}>读取</button>
        <button className="sys-action-btn" onClick={onConfig}>设置</button>
        <button className="sys-action-btn" onClick={onQuit}>菜单</button>
      </div>
    </div>
  );
}
