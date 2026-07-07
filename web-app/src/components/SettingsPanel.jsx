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
  onQuit,
  username = 'default',
  onSwitchUser
}) {
  const vol = sf.vol !== undefined && !isNaN(sf.vol) ? sf.vol : 8;
  const sevol = sf.sevol !== undefined && !isNaN(sf.sevol) ? sf.sevol : 8;
  const avgOpacity = sf.avgOpacity !== undefined && !isNaN(sf.avgOpacity) ? sf.avgOpacity : 6;
  const avgBlur = sf.avgBlur !== undefined && !isNaN(sf.avgBlur) ? sf.avgBlur : 16;
  const novelOpacity = sf.novelOpacity !== undefined && !isNaN(sf.novelOpacity) ? sf.novelOpacity : 8;
  const novelBlur = sf.novelBlur !== undefined && !isNaN(sf.novelBlur) ? sf.novelBlur : 8;

  return (
    <div className="settings-layer glass-panel">
      <h2 className="screen-title">{language === 'JP' ? '设置' : 'SETTINGS'}</h2>
      
      <div className="settings-options-container">
        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '当前用户 / Profile' : 'Current Profile'}</label>
          <div className="settings-control-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#ce9178', fontWeight: 'bold', minWidth: '80px' }}>👤 {username}</span>
            <button className="control-btn" onClick={onSwitchUser}>
              {language === 'JP' ? '切换用户' : 'Switch User'}
            </button>
          </div>
        </div>

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
          <label className="settings-label">{language === 'JP' ? '快进模式 (Skip Mode)' : 'Skip Mode'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.skipMode !== 'READ_ONLY' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, skipMode: 'ALL' }))}>
              {language === 'JP' ? '全部文字' : 'All Text'}
            </button>
            <button className={`control-btn ${sf.skipMode === 'READ_ONLY' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, skipMode: 'READ_ONLY' }))}>
              {language === 'JP' ? '仅已读文字' : 'Read Text Only'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '鼠标滚轮开启历史' : 'Scroll Wheel History'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${!sf.disableWheelHistory ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, disableWheelHistory: false }))}>
              {language === 'JP' ? '开启' : 'Enabled'}
            </button>
            <button className={`control-btn ${sf.disableWheelHistory ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, disableWheelHistory: true }))}>
              {language === 'JP' ? '关闭' : 'Disabled'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '对话框文字垂直对齐' : 'Text Vertical Align'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.vAlign === 'TOP' || !sf.vAlign ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, vAlign: 'TOP' }))}>
              {language === 'JP' ? '靠上' : 'Top'}
            </button>
            <button className={`control-btn ${sf.vAlign === 'CENTER' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, vAlign: 'CENTER' }))}>
              {language === 'JP' ? '居中' : 'Center'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '对话框文字水平对齐' : 'Text Horizontal Align'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.hAlign === 'LEFT' || !sf.hAlign ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, hAlign: 'LEFT' }))}>
              {language === 'JP' ? '靠左' : 'Left'}
            </button>
            <button className={`control-btn ${sf.hAlign === 'CENTER' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, hAlign: 'CENTER' }))}>
              {language === 'JP' ? '居中' : 'Center'}
            </button>
            <button className={`control-btn ${sf.hAlign === 'RIGHT' ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, hAlign: 'RIGHT' }))}>
              {language === 'JP' ? '靠右' : 'Right'}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? '字幕沉浸模式 (快捷键: I)' : 'Immersive Subtitle Mode (Key: I)'}</label>
          <div className="settings-control-buttons">
            <button className={`control-btn ${sf.immerseMode ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, immerseMode: true }))}>
              {language === 'JP' ? '开启' : 'Enabled'}
            </button>
            <button className={`control-btn ${!sf.immerseMode ? 'active' : ''}`} onClick={() => setSf(prev => ({ ...prev, immerseMode: false }))}>
              {language === 'JP' ? '关闭' : 'Disabled'}
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

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? 'AVG 对话框不透明度' : 'AVG Opacity'}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={avgOpacity} 
            onChange={(e) => {
              const newOpacity = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, avgOpacity: newOpacity }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{avgOpacity * 10}%</span>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? 'AVG 对话框模糊度' : 'AVG Blur'}</label>
          <input 
            type="range" 
            min="0" 
            max="20" 
            value={avgBlur} 
            onChange={(e) => {
              const newBlur = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, avgBlur: newBlur }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{avgBlur}px</span>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? 'Novel 对话框不透明度' : 'Novel Opacity'}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={novelOpacity} 
            onChange={(e) => {
              const newOpacity = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, novelOpacity: newOpacity }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{novelOpacity * 10}%</span>
        </div>

        <div className="settings-row">
          <label className="settings-label">{language === 'JP' ? 'Novel 对话框模糊度' : 'Novel Blur'}</label>
          <input 
            type="range" 
            min="0" 
            max="20" 
            value={novelBlur} 
            onChange={(e) => {
              const newBlur = parseInt(e.target.value) || 0;
              setSf(prev => ({ ...prev, novelBlur: newBlur }));
            }}
            className="volume-slider"
          />
          <span className="vol-indicator">{novelBlur}px</span>
        </div>
      </div>
      
      <div className="settings-actions-footer">
        {isGameplay ? (
          <>
            <button className="settings-footer-btn quit-danger-btn" onClick={onQuit}>
              {language === 'JP' ? '返回标题' : 'Quit to Title'}
            </button>
            <button className="settings-footer-btn" onClick={onSave}>
              {language === 'JP' ? '保存' : 'Save'}
            </button>
            <button className="settings-footer-btn" onClick={onLoad}>
              {language === 'JP' ? '读取' : 'Load'}
            </button>
            <button className="settings-footer-btn" onClick={onBack}>
              {language === 'JP' ? '返回' : 'Back'}
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
