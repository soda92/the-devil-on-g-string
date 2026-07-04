import React from 'react';

export default function TitleScreen({ f, resolveAsset, startNewGame, onShowLoad, onShowGallery, onShowSettings, hasActiveGame, onResume, language, hasHistory, onRewind, onShowFlowchart }) {
  // Render hourly background image for title screen
  const getTitleBg = () => {
    const hour = f.chour;
    if (hour >= 7 && hour <= 16) return 'bg_106'; // Day
    if (hour >= 17 && hour <= 19) return 'bg_107'; // Evening
    return 'bg_108'; // Night
  };

  return (
    <div className="title-screen-layer" style={{ backgroundImage: `url(${resolveAsset(getTitleBg(), 'bgimage')})` }}>
      <div className="title-blur-panel glass-panel">
        <h1 className="title-heading">SCHOOL★SCHOOL</h1>
        <h2 className="title-subheading">Re:imagined</h2>
        
        <div className="title-menu-buttons">
          {hasActiveGame && (
            <button className="premium-btn title-menu-btn resume-btn" onClick={onResume}>
              {language === 'JP' ? 'ゲーム再開' : 'Resume Game'}
            </button>
          )}
          {hasHistory && (
            <button className="premium-btn title-menu-btn rewind-btn" onClick={onRewind} style={{ borderColor: 'var(--color-primary)' }}>
              {language === 'JP' ? '直前のシーンに戻る' : 'Rewind Last Scene'}
            </button>
          )}
          {f.choicesHistory && f.choicesHistory.length > 0 && (
            <button className="premium-btn title-menu-btn flowchart-btn" onClick={onShowFlowchart}>
              {language === 'JP' ? 'ルート状況・履歴' : 'Route Flowchart'}
            </button>
          )}
          <button className="premium-btn title-menu-btn" onClick={startNewGame}>
            {language === 'JP' ? 'はじめから' : 'New Game'}
          </button>
          <button className="premium-btn title-menu-btn" onClick={onShowLoad}>
            {language === 'JP' ? 'つづきから' : 'Load Game'}
          </button>
          <button className="premium-btn title-menu-btn" onClick={onShowGallery}>
            {language === 'JP' ? 'CG鑑賞' : 'CG Gallery'}
          </button>
          <button className="premium-btn title-menu-btn" onClick={onShowSettings}>
            {language === 'JP' ? '環境設定' : 'Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
