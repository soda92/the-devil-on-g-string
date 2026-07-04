import React, { useState } from 'react';

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export default function SaveLoadModal({ mode, onClose, onSaveSlot, onLoadSlot, saveSlots }) {
  // Remember and load the last selected page tab from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('school_last_save_page');
    return saved ? parseInt(saved, 10) : 1;
  });

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    localStorage.setItem('school_last_save_page', pageNumber.toString());
  };

  // Determine slot range based on page (8 slots per page)
  const startIndex = (currentPage - 1) * 8;
  const slotIndices = Array.from({ length: 8 }).map((_, i) => startIndex + i);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="save-load-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <style>{`
          .saveload-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            justify-content: center;
          }
          .saveload-tab-btn {
            background: var(--color-glass-light);
            border: 1px solid var(--color-border);
            color: var(--color-text-muted);
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .saveload-tab-btn:hover {
            background: var(--color-glass-medium);
            color: var(--color-text-bright);
          }
          .saveload-tab-btn.active {
            background: var(--color-primary);
            border-color: var(--color-primary);
            color: #fff;
            box-shadow: 0 0 10px var(--color-primary-glow);
          }
        `}</style>
        
        <h2 className="screen-title">{mode === 'SAVE' ? '保存游戏 / SAVE' : '读取游戏 / LOAD'}</h2>

        <div className="saveload-tabs">
          <button 
            className={`saveload-tab-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(1)}
          >
            Page 1 (1-8)
          </button>
          <button 
            className={`saveload-tab-btn ${currentPage === 2 ? 'active' : ''}`}
            onClick={() => handlePageChange(2)}
          >
            Page 2 (9-16)
          </button>
          <button 
            className={`saveload-tab-btn ${currentPage === 3 ? 'active' : ''}`}
            onClick={() => handlePageChange(3)}
          >
            Page 3 (17-24)
          </button>
        </div>
        
        <div className="save-slots-grid">
          {slotIndices.map((idx) => {
            const slotKey = `school_save_slot_${idx}`;
            const slotDataRaw = localStorage.getItem(slotKey);
            const localSlotData = slotDataRaw ? JSON.parse(slotDataRaw) : null;
            const slotData = (saveSlots && saveSlots[idx]) || localSlotData;
            
            return (
              <div key={idx} className="save-slot-card glass-panel">
                <div className="slot-index-header">
                  <span className="slot-index">Slot {String(idx + 1).padStart(2, '0')}</span>
                  {slotData && <span className="slot-date">{slotData.date}</span>}
                </div>
                
                {slotData ? (
                  <div className="slot-meta">
                    <div className="slot-scene">{slotData.currentScenario} - Pointer {slotData.pointer}</div>
                    
                    <div className="slot-preview" title={stripHtml(slotData.dialogueText)}>
                      {slotData.speaker && <span className="slot-preview-speaker">{slotData.speaker}:</span>}
                      {stripHtml(slotData.dialogueText) || 'No text recorded'}
                    </div>
                    
                    <div className="slot-actions">
                      {mode === 'SAVE' ? (
                        <button className="slot-action-btn" onClick={() => onSaveSlot(idx)}>Overwrite</button>
                      ) : (
                        <button className="slot-action-btn" onClick={() => onLoadSlot(slotData)}>Load</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="slot-meta empty-slot-meta">
                    <div className="slot-scene-empty">Empty Slot / 空白存档</div>
                    {mode === 'SAVE' && (
                      <div className="slot-actions">
                        <button className="slot-action-btn" onClick={() => onSaveSlot(idx)}>Save Here</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>关闭 / Close</button>
      </div>
    </div>
  );
}
