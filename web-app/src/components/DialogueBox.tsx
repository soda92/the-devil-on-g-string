import React, { useEffect, useRef, useState } from 'react';
import { DialogueMode, Language, SystemFlags } from '../types/kag';

export interface DialogueBoxProps {
  dialogueMode: DialogueMode | string;
  speaker?: string;
  faceIcon?: string | null;
  resolveAsset: (name?: string | null, type?: string) => string;
  typewriterText: string;
  dialogueText: string;
  currentVoice?: string;
  replayCurrentVoice?: () => void;
  isWaiting: boolean;
  language: Language | string;
  _setLanguage?: (lang: Language) => void;
  onSave: () => void;
  onLoad: () => void;
  onConfig: () => void;
  onQuit: () => void;
  onScreenClick: () => void;
  onShowHistory: () => void;
  onShowFlowchart?: () => void;
  isAutoMode: boolean;
  isFastForward: boolean;
  onToggleAuto: () => void;
  onToggleSkip: () => void;
  onOpenToc?: () => void;
  onToggleFlipper?: () => void;
  sf?: SystemFlags;
  updateSf?: (sf: SystemFlags) => void;
}

export default function DialogueBox({ 
  dialogueMode, 
  speaker, 
  faceIcon,
  resolveAsset,
  typewriterText, 
  dialogueText, 
  currentVoice, 
  replayCurrentVoice, 
  isWaiting, 
  language, 
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
  onOpenToc,
  onToggleFlipper,
  sf,
  updateSf
}: DialogueBoxProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<boolean>(false);

  const showFace = faceIcon && dialogueMode === 'avg' && !sf?.immerseMode;

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

  const bgStyle: React.CSSProperties = sf?.immerseMode
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

  const handleExitImmerse = () => {
    if (sf) {
      const nextSf: SystemFlags = { ...sf, immerseMode: false };
      localStorage.setItem('school_sf', JSON.stringify(nextSf));
      if (updateSf) {
        updateSf(nextSf);
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div 
      className={`dialogue-box-layer glass-panel ${dialogueMode === 'novel' ? 'novel-mode' : 'avg-mode'} ${sf?.immerseMode ? 'immerse-mode' : ''} ${showFace ? 'has-face-icon' : ''}`} 
      onClick={(e) => {
        if (!sf?.immerseMode) {
          e.stopPropagation();
        }
      }}
      style={bgStyle}
    >
      {showFace && (
        <div className="dialogue-face-icon-container">
          <img src={resolveAsset(faceIcon, 'face')} alt="speaker face" className="dialogue-face-icon-img" />
        </div>
      )}
      {speaker && dialogueMode !== 'novel' && !sf?.immerseMode && (
        <div 
          className="dialogue-speaker" 
          onClick={currentVoice ? (e) => {
            e.stopPropagation();
            replayCurrentVoice?.();
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: sf?.vAlign === 'CENTER' ? 'center' : 'flex-start',
          textAlign: sf?.hAlign === 'CENTER' ? 'center' : (sf?.hAlign === 'RIGHT' ? 'right' : 'left'),
          position: 'relative'
        }}
      >
        <div style={{ display: 'inline', cursor: sf?.immerseMode ? 'default' : 'pointer' }}>
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

          {sf?.immerseMode && hovered && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleExitImmerse();
              }}
              style={{
                display: 'inline-block',
                marginLeft: '15px',
                background: 'rgba(255, 68, 68, 0.25)',
                color: '#ff8a8a',
                border: '1px solid #ff4444',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                verticalAlign: 'middle',
                lineHeight: '1.2',
                transition: 'background 0.2s, color 0.2s',
                textShadow: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.background = 'rgba(255, 68, 68, 0.45)';
                target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.background = 'rgba(255, 68, 68, 0.25)';
                target.style.color = '#ff8a8a';
              }}
            >
              {language === 'JP' ? '退出沉浸' : 'Exit Subtitles'}
            </button>
          )}
        </div>
      </div>
      
      {/* Floating System Actions Bar (Only in Normal Mode) */}
      {!sf?.immerseMode && (
        <div className="system-actions-bar">
          <button className="sys-action-btn" onClick={onShowHistory}>历史</button>
          {onShowFlowchart && <button className="sys-action-btn" onClick={onShowFlowchart}>路线</button>}
          {onOpenToc && <button className="sys-action-btn" onClick={onOpenToc} style={{ color: '#f59e0b', fontWeight: 'bold' }}>目录</button>}
          {onToggleFlipper && <button className="sys-action-btn" onClick={onToggleFlipper} style={{ color: '#f59e0b', fontWeight: 'bold' }}>翻页</button>}
          <button className={`sys-action-btn ${isAutoMode ? 'active-auto' : ''}`} onClick={onToggleAuto}>自动</button>
          <button className={`sys-action-btn ${isFastForward ? 'active-skip' : ''}`} onClick={onToggleSkip}>快进</button>
          <button className="sys-action-btn" onClick={onSave}>保存</button>
          <button className="sys-action-btn" onClick={onLoad}>读取</button>
          <button className="sys-action-btn" onClick={onConfig}>设置</button>
          <button className="sys-action-btn" onClick={onQuit}>菜单</button>
        </div>
      )}
    </div>
  );
}
