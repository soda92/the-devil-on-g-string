import React, { useEffect, useRef, useState } from 'react';
import { HistoryLogItem, Language } from '../types/kag';

export interface HistoryModalProps {
  onClose: () => void;
  historyLog: HistoryLogItem[];
  language: Language | string;
  onJumpToSnapshot: (snapshot: any, index?: number) => void;
  onReplayVoice?: (voice: string) => void;
  autoFocusSearch?: boolean;
  isSidebar?: boolean;
}

export default function HistoryModal({
  onClose,
  historyLog,
  language,
  onJumpToSnapshot,
  onReplayVoice,
  autoFocusSearch = true,
  isSidebar = false
}: HistoryModalProps) {
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [confirmSnapshot, setConfirmSnapshot] = useState<{ snapshot: any; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto scroll to the bottom of the log when opened
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = contentAreaRef.current.scrollHeight;
    }
  }, []);

  // Auto-focus search input on mount
  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocusSearch]);

  // Preserve original indexes while filtering search results
  const filteredLog = (historyLog || [])
    .map((entry, idx) => ({ ...entry, originalIdx: idx }))
    .filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const speaker = (language === 'JP' ? (item.speakerJp || item.speaker_jp) : (item.speakerEn || item.speaker_en)) || item.speaker || '';
      const text = (language === 'JP' ? (item.textJp || item.text_jp) : (item.textEn || item.text_en)) || item.textJp || item.text_jp || item.text || '';
      return speaker.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });

  // Highlight search text safely (avoiding HTML tag corruption)
  const highlightText = (htmlText?: string) => {
    if (!htmlText) return '';
    if (!searchQuery) return htmlText;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})(?![^<>]*>)`, 'gi');
    return htmlText.replace(regex, '<mark class="search-highlight" style="background-color: #ffeb3b; color: #000; padding: 0 2px; border-radius: 2px;">$1</mark>');
  };

  const innerContent = (
    <div 
      className={`glass-panel ${isSidebar ? 'backlog-sidebar shadow-premium' : 'backlog-modal'}`}
      style={isSidebar ? {
        position: 'relative',
        width: '380px',
        height: '600px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box',
        color: '#e2e8f0'
      } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.3)', paddingBottom: '8px', flexShrink: 0 }}>
        <span style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📜</span>
          <span>{language === 'JP' ? '历史记录' : 'Dialogue History'}</span>
        </span>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
          title="Close History"
        >
          ✕
        </button>
      </div>
      
      {/* Backlog Search Header Input */}
      <div className="backlog-search-container" style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <input
          ref={searchInputRef}
          type="text"
          className="backlog-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'JP' ? '搜索对白或角色名...' : 'Search dialogue or speaker...'}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#fff',
            fontSize: '12px',
            outline: 'none'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: 'rgba(170, 59, 255, 0.2)',
              color: '#e9d5ff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {language === 'JP' ? '清除' : 'Clear'}
          </button>
        )}
      </div>
      
      <div className="backlog-content-area" ref={contentAreaRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {filteredLog && filteredLog.length > 0 ? (
          filteredLog.map((entry, idx) => {
            const speaker = (language === 'JP' ? (entry.speakerJp || entry.speaker_jp) : (entry.speakerEn || entry.speaker_en)) || entry.speaker || '';
            const text = (language === 'JP' ? (entry.textJp || entry.text_jp) : (entry.textEn || entry.text_en)) || entry.textJp || entry.text_jp || entry.text || '';
            const isClickable = !!entry.snapshot;
            
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
                        onReplayVoice?.(entry.voice);
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
      
      {!isSidebar && (
        <button className="modal-close-btn" onClick={onClose}>
          {language === 'JP' ? '关闭' : 'Close'}
        </button>
      )}

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
  );

  if (isSidebar) {
    return innerContent;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {innerContent}
    </div>
  );
}
