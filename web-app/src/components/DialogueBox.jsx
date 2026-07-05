import React, { useEffect, useRef, useState } from 'react';

export default function DialogueBox({ 
  dialogueMode, 
  speaker, 
  typewriterText, 
  dialogueText, 
  currentVoice, 
  replayCurrentVoice, 
  isWaiting, 
  language, 
  setLanguage, 
  onSave, 
  onLoad, 
  onConfig, 
  onQuit, 
  onScreenClick, 
  onShowHistory, 
  onShowFlowchart, 
  isAutoMode, 
  isFastForward, 
  onToggleAuto, 
  onToggleSkip, 
  sf 
}) {
  const textRef = useRef(null);
  const [hovered, setHovered] = useState(false);

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

  const bgStyle = sf?.immerseMode
    ? {
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: 'none',
        boxShadow: 'none'
      }
    : (dialogueMode === 'novel' 
        ? { 
            backgroundColor: `rgba(10, 10, 10, ${opacityVal / 10})`,
            backdropFilter: `blur(${blurVal}px)`,
            WebkitBackdropFilter: `blur(${blurVal}px)`
          }
        : { 
            backgroundColor: `rgba(15, 10, 30, ${opacityVal / 10})`,
            backdropFilter: `blur(${blurVal}px)`,
            WebkitBackdropFilter: `blur(${blurVal}px)`
          });

  const ccText = (sf?.immerseMode && speaker) 
    ? `<span class="cc-speaker">[${speaker}]</span>${typewriterText}`
    : typewriterText;

  return (
    <div 
      className={`dialogue-box-layer glass-panel ${dialogueMode === 'novel' ? 'novel-mode' : 'avg-mode'} ${sf?.immerseMode ? 'immerse-mode' : ''}`} 
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={bgStyle}
    >
      {speaker && dialogueMode !== 'novel' && !sf?.immerseMode && (
        <div 
          className="dialogue-speaker" 
          onClick={currentVoice ? (e) => {
            e.stopPropagation();
            replayCurrentVoice && replayCurrentVoice();
          } : undefined}
          style={{ 
            cursor: currentVoice ? 'pointer' : 'default'
          }}
          title={currentVoice ? "播放语音 / Replay Voice" : undefined}
        >
          <span>{speaker}</span>
        </div>
      )}
      
      <div 
        ref={textRef}
        className="dialogue-text" 
        onClick={onScreenClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: sf?.vAlign === 'CENTER' ? 'center' : 'flex-start',
          textAlign: sf?.hAlign === 'CENTER' ? 'center' : (sf?.hAlign === 'RIGHT' ? 'right' : 'left'),
          position: 'relative'
        }}
      >
        <div style={{ display: 'inline' }}>
          <span dangerouslySetInnerHTML={{ __html: ccText }} />
          {isWaiting && typewriterText === dialogueText && (
            <svg 
              viewBox="0 0 24 24" 
              className="cc-snowflake-cursor"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginLeft: '6px',
                width: '14px',
                height: '14px'
              }}
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 5l-3-3M12 5l3-3M12 19l-3 3M12 19l3 3M5 12l-3-3M5 12l-3 3M19 12l3-3M19 12l3 3M7.05 7.05l-3.54 0M7.05 7.05l0-3.54M16.95 16.95l3.54 0M16.95 16.95l0 3.54M7.05 16.95l-3.54 0M7.05 16.95l0 3.54M16.95 7.05l3.54 0M16.95 7.05l0-3.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      </div>
      
      {/* Floating System Actions Bar */}
      <div 
        className="system-actions-bar"
        style={{
          opacity: (sf?.immerseMode && !hovered) ? 0 : 1,
          transition: 'opacity 0.2s ease',
          pointerEvents: (sf?.immerseMode && !hovered) ? 'none' : 'auto'
        }}
      >
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
