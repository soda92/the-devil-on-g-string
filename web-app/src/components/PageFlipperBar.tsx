import React, { useState, useEffect, ChangeEvent } from 'react';

interface PageFlipperBarProps {
  pointer: number;
  maxPointer: number;
  currentScenario: string | null;
  currentDialogueText: string;
  speaker: string;
  onSeekPointer: (pointer: number) => void;
  onOpenToc: () => void;
  onClose: () => void;
  language: 'JP' | 'EN';
}

export default function PageFlipperBar({
  pointer,
  maxPointer,
  currentScenario,
  currentDialogueText,
  speaker,
  onSeekPointer,
  onOpenToc,
  onClose,
  language
}: PageFlipperBarProps) {
  const [bookmarkPtr, setBookmarkPtr] = useState<number>(pointer);
  const [scrubValue, setScrubValue] = useState<number>(pointer);

  useEffect(() => {
    setScrubValue(pointer);
  }, [pointer]);

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScrubValue(val);
    onSeekPointer(val);
  };

  const handleBookmarkCurrent = () => {
    setBookmarkPtr(pointer);
  };

  const handleReturnToBookmark = () => {
    onSeekPointer(bookmarkPtr);
  };

  return (
    <div className="page-flipper-bar glass-panel">
      <style>{`
        .page-flipper-bar {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 85%;
          max-width: 800px;
          padding: 10px 20px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 30px;
          z-index: 120;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        .flipper-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .flipper-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #f3f4f6;
          font-weight: 500;
        }
        .flipper-scen-tag {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .flipper-slider-container {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .flipper-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          cursor: pointer;
        }
        .flipper-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
          transition: transform 0.1s ease;
        }
        .flipper-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        .flipper-btns {
          display: flex;
          gap: 6px;
        }
        .flipper-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .flipper-btn:hover {
          background: rgba(245, 158, 11, 0.2);
          border-color: #f59e0b;
          color: #fff;
        }
        .flipper-preview-box {
          font-size: 12px;
          color: #9ca3af;
          background: rgba(0, 0, 0, 0.4);
          padding: 6px 12px;
          border-radius: 8px;
          border-left: 3px solid #f59e0b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <div className="flipper-controls-row">
        <div className="flipper-info">
          <span>📖 {language === 'JP' ? '翻页模式' : 'Book Flip Mode'}</span>
          <span className="flipper-scen-tag">{currentScenario}.ks</span>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            Line {pointer} / {maxPointer || '?'}
          </span>
        </div>

        <div className="flipper-btns">
          <button 
            className="flipper-btn" 
            onClick={() => onSeekPointer(Math.max(0, pointer - 10))}
            title="Step Back 10 lines"
          >
            ⏮ -10
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => onSeekPointer(Math.max(0, pointer - 1))}
            title="Step Back 1 line"
          >
            ◀ -1
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => onSeekPointer(Math.min(maxPointer || pointer, pointer + 1))}
            title="Step Forward 1 line"
          >
            +1 ▶
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => onSeekPointer(Math.min(maxPointer || pointer, pointer + 10))}
            title="Step Forward 10 lines"
          >
            +10 ⏭
          </button>

          <button 
            className="flipper-btn" 
            onClick={handleBookmarkCurrent}
            title="Bookmark this page position"
          >
            🔖 {language === 'JP' ? '书签' : 'Mark'}
          </button>
          <button 
            className="flipper-btn" 
            onClick={handleReturnToBookmark}
            title={`Return to bookmarked line ${bookmarkPtr}`}
            style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
          >
            ↩ {language === 'JP' ? `返回 (L${bookmarkPtr})` : `Return (L${bookmarkPtr})`}
          </button>
          <button 
            className="flipper-btn" 
            onClick={onOpenToc}
            style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold' }}
          >
            📚 {language === 'JP' ? '目录' : 'Index'}
          </button>
          <button className="flipper-btn" onClick={onClose} style={{ borderRadius: '50%', padding: '4px 8px' }}>
            ✕
          </button>
        </div>
      </div>

      <div className="flipper-slider-container">
        <input
          type="range"
          min="0"
          max={maxPointer || 1000}
          value={scrubValue}
          onChange={handleSliderChange}
          className="flipper-slider"
        />
      </div>

      <div className="flipper-preview-box">
        {speaker ? <strong>[{speaker}] </strong> : ''}
        {currentDialogueText || (language === 'JP' ? '(无对话文本)' : '(No dialogue text)')}
      </div>
    </div>
  );
}
