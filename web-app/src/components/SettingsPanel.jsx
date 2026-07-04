import React from 'react';

export default function SettingsPanel({ 
  language, 
  setLanguage, 
  sf, 
  setSf, 
  onBack, 
  isGameplay, 
  onSave, 
  onLoad, 
  onQuit 
}) {
  const vol = sf.vol !== undefined && !isNaN(sf.vol) ? sf.vol : 8;
  const sevol = sf.sevol !== undefined && !isNaN(sf.sevol) ? sf.sevol : 8;

  return (
    <div className="settings-layer glass-panel">
      <h2 className="screen-title">{language === 'JP' ? '设置' : 'SETTINGS'}</h2>
      
      <div className="settings-options-container">
        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '语言 / Language' : 'Language / 语言'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${language === 'EN' ? 'active' : ''}`} onClick={() => setLanguage('EN')}>English</button>
            <button className={`control-btn ${language === 'JP' ? 'active' : ''}`} onClick={() => setLanguage('JP')}>简体中文</button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '文字显示速度' : 'Text Speed'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.typewriterMode === 'WORD' || !sf.typewriterMode ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'WORD' }))}>
              {language === 'JP' ? '按单词 (仅英文)' : 'Word-by-Word'}
            </button>
            <button className={`control-btn ${sf.typewriterMode === 'CHAR' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'CHAR' }))}>
              {language === 'JP' ? '按字符' : 'Char-by-Char'}
            </button>
            <button className={`control-btn ${sf.typewriterMode === 'OFF' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'OFF' }))}>
              {language === 'JP' ? '即时显示' : 'Instant'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '背景音乐音量' : 'Music Volume'}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={vol} 
            onChange={(e) => {
              const newVol = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, vol: newVol }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{vol * 10}%</span>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '语音与音效音量' : 'Voice & Sound Effects'}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={sevol} 
            onChange={(e) => {
              const newVol = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, sevol: newVol }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{sevol * 10}%</span>
        </div>
      </div>
      
      <div className="settings-actions-footer">
        {isGameplay ? (
          <>
            <button className="settings-footer-btn" onClick={onBack}>
              {language === 'JP' ? '返回' : 'Back'}
            </button>
            <button className="settings-footer-btn" onClick={onSave}>
              {language === 'JP' ? '保存' : 'Save'}
            </button>
            <button className="settings-footer-btn" onClick={onLoad}>
              {language === 'JP' ? '读取' : 'Load'}
            </button>
            <button className="settings-footer-btn quit-danger-btn" onClick={onQuit}>
              {language === 'JP' ? '返回标题' : 'Quit to Title'}
            </button>
          </>
        ) : (
          <button className="back-btn glass-panel" onClick={onBack}>
            {language === 'JP' ? '返回标题' : 'Back to Title'}
          </button>
        )}
      </div>
    </div>
  );
}
