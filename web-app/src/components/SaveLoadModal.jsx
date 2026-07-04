import React, { useState } from 'react';

export default function SaveLoadModal({ mode, onClose, onSaveSlot, onLoadSlot, saveSlots }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Determine slot range based on page
  const startIndex = (currentPage - 1) * 6;
  const slotIndices = Array.from({ length: 6 }).map((_, i) => startIndex + i);

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
        
        <h2 className="screen-title">{mode} GAME</h2>

        <div className="saveload-tabs">
          <button 
            className={`saveload-tab-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(1)}
          >
            Page 1 (1-6)
          </button>
          <button 
            className={`saveload-tab-btn ${currentPage === 2 ? 'active' : ''}`}
            onClick={() => setCurrentPage(2)}
          >
            Page 2 (7-12)
          </button>
          <button 
            className={`saveload-tab-btn ${currentPage === 3 ? 'active' : ''}`}
            onClick={() => setCurrentPage(3)}
          >
            Page 3 (13-18)
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
                <div className="slot-index">Slot {idx + 1}</div>
                
                {slotData ? (
                  <div className="slot-meta">
                    <div className="slot-scene">{slotData.currentScenario} - pointer {slotData.pointer}</div>
                    <div className="slot-date">{slotData.date}</div>
                    <div className="slot-actions">
                      {mode === 'SAVE' ? (
                        <button className="slot-action-btn" onClick={() => onSaveSlot(idx)}>Overwrite</button>
                      ) : (
                        <button className="slot-action-btn" onClick={() => onLoadSlot(slotData)}>Load</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="slot-meta">
                    <div className="slot-scene">Empty Slot</div>
                    {mode === 'SAVE' && (
                      <button className="slot-action-btn" onClick={() => onSaveSlot(idx)}>Save Here</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
