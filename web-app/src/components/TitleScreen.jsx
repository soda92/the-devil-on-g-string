import React from 'react';

export default function TitleScreen({ f, resolveAsset, startNewGame, onShowLoad, onShowGallery, onShowMusic, onShowSettings, hasActiveGame, onResume, language, hasHistory, onRewind, onShowFlowchart, isBgmPlaying, onToggleBgm }) {
  // Render hourly background image for title screen
  const getTitleBg = () => {
    const hour = f.chour;
    if (hour >= 7 && hour <= 16) return 'bg_02a'; // Day
    if (hour >= 17 && hour <= 19) return 'bg_02b'; // Evening
    return 'bg_02c'; // Night
  };

  return (
    <div className="title-screen-layer" style={{ backgroundImage: `url(${resolveAsset(getTitleBg(), 'bgimage')})` }}>
      {/* BGM Toggle button in top-right corner */}
      <button 
        onClick={onToggleBgm}
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

      <div className="title-blur-panel glass-panel">
        <h1 className="title-heading" style={{ fontSize: '36px', letterSpacing: '2px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>G弦上的魔王</h1>
        <h2 className="title-subheading">The Devil on G-String</h2>
        
        <div className="title-menu-buttons">
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
    </div>
  );
}
