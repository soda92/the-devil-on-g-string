import React, { useEffect, useRef, useState } from 'react';

export default function HistoryModal({ onClose, historyLog, language, onJumpToSnapshot, onReplayVoice }) {
  const contentAreaRef = useRef(null);
  const [confirmSnapshot, setConfirmSnapshot] = useState(null);

  // Auto scroll to the bottom of the log when opened
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = contentAreaRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="backlog-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="screen-title">{language === 'JP' ? 'バックログ' : 'Dialogue History'}</h2>
        
        <div className="backlog-content-area" ref={contentAreaRef}>
          {historyLog && historyLog.length > 0 ? (
            historyLog.map((entry, idx) => {
              const speaker = language === 'JP' ? entry.speakerJp : entry.speakerEn;
              const text = language === 'JP' ? entry.textJp : entry.textEn;
              const isClickable = !!entry.snapshot;
              
              return (
                <div 
                  key={idx} 
                  className={`backlog-entry ${isClickable ? 'clickable-backlog' : ''}`}
                  onClick={() => isClickable && setConfirmSnapshot({ snapshot: entry.snapshot, index: idx })}
                  style={isClickable ? { cursor: 'pointer' } : {}}
                  title={isClickable ? (language === 'JP' ? 'この会話の時点に戻る' : 'Jump back to this dialogue point') : ''}
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
                        title={language === 'JP' ? 'ボイスを再生' : 'Replay Voice'}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  <div 
                    className="backlog-entry-text" 
                    dangerouslySetInnerHTML={{ __html: text }}
                  />
                </div>
              );
            })
          ) : (
            <div className="backlog-empty">
              {language === 'JP' ? '履歴はありません。' : 'No history recorded yet.'}
            </div>
          )}
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>
          {language === 'JP' ? '閉じる' : 'Close'}
        </button>

        {/* --- Backlog Jump Confirmation Box Overlay --- */}
        {confirmSnapshot && (
          <div className="backlog-confirm-overlay" onClick={() => setConfirmSnapshot(null)}>
            <div className="backlog-confirm-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
              <h3>
                {language === 'JP' ? 'この会話の時点に戻りますか？' : 'Jump back to this dialogue point?'}
              </h3>
              <p>
                {language === 'JP' ? '現在の進行状況は失われます。' : 'Your current progress will be reset.'}
              </p>
              <div className="backlog-confirm-buttons">
                <button className="confirm-btn yes-btn" onClick={() => {
                  onJumpToSnapshot(confirmSnapshot.snapshot, confirmSnapshot.index);
                  setConfirmSnapshot(null);
                }}>
                  {language === 'JP' ? 'はい' : 'Yes'}
                </button>
                <button className="confirm-btn no-btn" onClick={() => setConfirmSnapshot(null)}>
                  {language === 'JP' ? 'いいえ' : 'No'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
