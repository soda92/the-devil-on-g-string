import React, { useState, useEffect } from 'react';
import { GameVariables, Language } from '../types/kag';

export interface TitleScreenProps {
  f: GameVariables;
  resolveAsset: (name?: string | null, type?: string) => string;
  startNewGame: () => void;
  onShowLoad: () => void;
  onShowGallery: () => void;
  onShowMusic: () => void;
  onShowSettings: () => void;
  hasActiveGame: boolean;
  onResume: () => void;
  language: Language | string;
  hasHistory: boolean;
  onRewind: () => void;
  onShowFlowchart?: () => void;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  showNextChapter: boolean;
  onNextChapter: () => void;
}

export default function TitleScreen({
  f,
  resolveAsset,
  startNewGame,
  onShowLoad,
  onShowGallery,
  onShowMusic,
  onShowSettings,
  hasActiveGame,
  onResume,
  language,
  hasHistory,
  onRewind,
  onShowFlowchart,
  isBgmPlaying,
  onToggleBgm,
  showNextChapter,
  onNextChapter
}: TitleScreenProps) {
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(true);

  // Render hourly background image for title screen
  const getTitleBg = () => {
    const hour = f.chour ?? new Date().getHours();
    if (hour >= 7 && hour <= 16) return 'bg_02a'; // Day
    if (hour >= 17 && hour <= 19) return 'bg_02b'; // Evening
    return 'bg_02c'; // Night
  };

  // Keyboard shortcut for space to hide/show menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsMenuVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackgroundClick = () => {
    setIsMenuVisible(prev => !prev);
  };

  return (
    <div 
      className="title-screen-layer" 
      style={{ 
        backgroundImage: `url(${resolveAsset(getTitleBg(), 'bgimage')})`,
        cursor: isMenuVisible ? 'default' : 'pointer'
      }}
      onClick={handleBackgroundClick}
    >
      {/* BGM Toggle button in top-right corner */}
      {isMenuVisible && (
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggling the main menu
            onToggleBgm();
          }}
          className="title-audio-toggle"
          title={isBgmPlaying ? "暂停音乐" : "播放音乐"}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--color-glass)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-bright)',
            fontSize: '18px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
        >
          {isBgmPlaying ? '🔊' : '🔇'}
        </button>
      )}

      {isMenuVisible ? (
        <div className="title-blur-panel glass-panel" onClick={(e) => e.stopPropagation()}>
          <h1 className="title-heading" style={{ fontSize: '36px', letterSpacing: '2px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>G弦上的魔王</h1>
          <h2 className="title-subheading">The Devil on G-String</h2>
          
          <div className="title-menu-buttons">
            {showNextChapter && (
              <button className="premium-btn title-menu-btn resume-btn" onClick={onNextChapter} style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary-hover)' }}>
                {language === 'JP' ? '进入下一章' : 'Enter Next Chapter'}
              </button>
            )}
            {hasActiveGame && (
              <button className="premium-btn title-menu-btn resume-btn" onClick={onResume}>
                继续游戏
              </button>
            )}
            {hasHistory && (
              <button className="premium-btn title-menu-btn rewind-btn" onClick={onRewind} style={{ borderColor: 'var(--color-primary)' }}>
                回到前一幕
              </button>
            )}
            {f.choicesHistory && f.choicesHistory.length > 0 && (
              <button className="premium-btn title-menu-btn flowchart-btn" onClick={onShowFlowchart}>
                路线流程图
              </button>
            )}
            <button className="premium-btn title-menu-btn" onClick={startNewGame}>
              开始游戏
            </button>
            <button className="premium-btn title-menu-btn" onClick={onShowLoad}>
              读取存档
            </button>
            <button className="premium-btn title-menu-btn" onClick={onShowGallery}>
              CG 鉴赏
            </button>
            <button className="premium-btn title-menu-btn" onClick={onShowMusic}>
              音乐鉴赏
            </button>
            <button className="premium-btn title-menu-btn" onClick={onShowSettings}>
              游戏设置
            </button>
          </div>
        </div>
      ) : (
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-glass)',
            border: '1px solid var(--color-border)',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            animation: 'text-cursor 1s infinite alternate',
            pointerEvents: 'none',
            letterSpacing: '1px'
          }}
        >
          点击屏幕或按空格键返回菜单 / Click anywhere or press Space to show menu
        </div>
      )}
    </div>
  );
}
