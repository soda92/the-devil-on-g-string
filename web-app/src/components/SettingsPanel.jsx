import React from 'react';

export default function SettingsPanel({ language, setLanguage, sf, setSf, onBack }) {
  return (
    <div className="settings-layer glass-panel">
      <h2 className="screen-title">SETTINGS</h2>
      
      <div className="settings-options-container">
        <div className="settings-row">
          <label className="settings-label">Language / 言語</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${language === 'EN' ? 'active' : ''}`} onClick={() => setLanguage('EN')}>English</button>
            <button className={`control-btn ${language === 'JP' ? 'active' : ''}`} onClick={() => setLanguage('JP')}>日本語</button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '文字表示速度' : 'Text Speed'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.typewriterMode === 'WORD' || !sf.typewriterMode ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'WORD' }))}>
              {language === 'JP' ? 'ワードごと (英語のみ)' : 'Word-by-Word'}
            </button>
            <button className={`control-btn ${sf.typewriterMode === 'CHAR' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'CHAR' }))}>
              {language === 'JP' ? '一文字ごと' : 'Char-by-Char'}
            </button>
            <button className={`control-btn ${sf.typewriterMode === 'OFF' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, typewriterMode: 'OFF' }))}>
              {language === 'JP' ? '瞬間表示' : 'Instant'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">Music Volume</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={sf.vol} 
            onChange={(e) => {
              const newVol = parseInt(e.target.value);
              setSf(prev => ({ ...prev, vol: newVol }));
              localStorage.setItem('school_school_sf', JSON.stringify({ ...sf, vol: newVol }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{sf.vol * 10}%</span>
        </div>

        <div className="settings-row">
          <label className="settings-label">Voice & Sound Effects</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={sf.sevol} 
            onChange={(e) => {
              const newVol = parseInt(e.target.value);
              setSf(prev => ({ ...prev, sevol: newVol }));
              localStorage.setItem('school_school_sf', JSON.stringify({ ...sf, sevol: newVol }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{sf.sevol * 10}%</span>
        </div>
      </div>
      
      <button className="back-btn glass-panel" onClick={onBack}>Back to Title</button>
    </div>
  );
}
