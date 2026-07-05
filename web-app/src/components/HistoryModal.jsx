import React, { useEffect, useRef, useState } from 'react';

export default function HistoryModal({ onClose, historyLog, language, onJumpToSnapshot, onReplayVoice }) {
  const contentAreaRef = useRef(null);
  const searchInputRef = useRef(null);
  const [confirmSnapshot, setConfirmSnapshot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto scroll to the bottom of the log when opened
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = contentAreaRef.current.scrollHeight;
    }
  }, []);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Preserve original indexes while filtering search results
  const filteredLog = (historyLog || [])
    .map((entry, idx) => ({ ...entry, originalIdx: idx }))
    .filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const speaker = (language === 'JP' ? item.speakerJp : item.speakerEn) || '';
      const text = (language === 'JP' ? item.textJp : item.textEn) || '';
      return speaker.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });

  // Highlight search text safely (avoiding HTML tag corruption)
  const highlightText = (htmlText) => {
    if (!searchQuery) return htmlText;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})(?![^<>]*>)`, 'gi');
    return htmlText.replace(regex, '<mark class="search-highlight" style="background-color: #ffeb3b; color: #000; padding: 0 2px; border-radius: 2px;">$1</mark>');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="backlog-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="screen-title">{language === 'JP' ? '历史记录' : 'Dialogue History'}</h2>
        
        {/* Backlog Search Header Input */}
        <div className="backlog-search-container" style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <input
            ref={searchInputRef}
            type="text"
            className="backlog-search-input"
            placeholder={language === 'JP' ? '输入关键字搜索记录...' : 'Type keyword to search history...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                onClose();
              }
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-primary-hover)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--color-text-bright)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                if (searchInputRef.current) searchInputRef.current.focus();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-primary-hover)',
                background: 'rgba(170, 59, 255, 0.2)',
                color: 'var(--color-text-bright)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {language === 'JP' ? '清除' : 'Clear'}
            </button>
          )}
        </div>
        
        <div className="backlog-content-area" ref={contentAreaRef}>
          {filteredLog && filteredLog.length > 0 ? (
            filteredLog.map((entry, idx) => {
              const speaker = language === 'JP' ? entry.speakerJp : entry.speakerEn;
              const text = language === 'JP' ? entry.textJp : entry.textEn;
              const isClickable = !!entry.snapshot || (!!entry.currentScenario && entry.pointer !== undefined);
              
              return (
                <div 
                  key={idx} 
                  className={`backlog-entry ${isClickable ? 'clickable-backlog' : ''}`}
                  onClick={() => isClickable && setConfirmSnapshot({ snapshot: entry.snapshot, index: entry.originalIdx })}
                  style={isClickable ? { cursor: 'pointer' } : {}}
                  title={isClickable ? (language === 'JP' ? '跳转回此对话点' : 'Jump back to this dialogue point') : ''}
                >
                  <div className="backlog-entry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {speaker && <div className="backlog-entry-speaker">{speaker}</div>}
                    {entry.voice && (
                      <button 
                        className="backlog-voice-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplayVoice && onReplayVoice(entry.voice);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        title={language === 'JP' ? '播放语音' : 'Replay Voice'}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  <div 
                    className="backlog-entry-text" 
                    dangerouslySetInnerHTML={{ __html: highlightText(text) }}
                  />
                </div>
              );
            })
          ) : (
            <div className="backlog-empty">
              {language === 'JP' ? '暂无历史记录。' : 'No history recorded yet.'}
            </div>
          )}
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>
          {language === 'JP' ? '关闭' : 'Close'}
        </button>

        {/* --- Backlog Jump Confirmation Box Overlay --- */}
        {confirmSnapshot && (
          <div className="backlog-confirm-overlay" onClick={() => setConfirmSnapshot(null)}>
            <div className="backlog-confirm-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
              <h3>
                {language === 'JP' ? '要跳转回此对话点吗？' : 'Jump back to this dialogue point?'}
              </h3>
              <p>
                {language === 'JP' ? '当前游戏进度将会丢失。' : 'Your current progress will be reset.'}
              </p>
              <div className="backlog-confirm-buttons">
                <button className="confirm-btn yes-btn" onClick={() => {
                  onJumpToSnapshot(confirmSnapshot.snapshot, confirmSnapshot.index);
                  setConfirmSnapshot(null);
                }}>
                  {language === 'JP' ? '确定' : 'Yes'}
                </button>
                <button className="confirm-btn no-btn" onClick={() => setConfirmSnapshot(null)}>
                  {language === 'JP' ? '取消' : 'No'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
