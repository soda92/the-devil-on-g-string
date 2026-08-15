import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';

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

  const CHUNK_SIZE = 1000;
  const totalLines = Math.max(1, maxPointer || 1000);
  const numChunks = Math.ceil(totalLines / CHUNK_SIZE);

  // Generate chunk descriptors
  const chunks = useMemo(() => {
    const list: Array<{ id: number; start: number; end: number; label: string }> = [];
    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE, totalLines);
      list.push({
        id: i,
        start,
        end,
        label: `${start + (start === 0 ? 0 : 1)} - ${end}`
      });
    }
    return list;
  }, [numChunks, totalLines]);

  const [selectedChunk, setSelectedChunk] = useState<number | 'ALL'>(() => {
    return Math.min(numChunks - 1, Math.floor(pointer / CHUNK_SIZE));
  });

  // Sync scrubValue when pointer prop updates externally
  useEffect(() => {
    setScrubValue(pointer);
  }, [pointer]);

  const activeRange = useMemo(() => {
    if (selectedChunk === 'ALL' || !chunks[selectedChunk]) {
      return { min: 0, max: totalLines };
    }
    return { min: chunks[selectedChunk].start, max: chunks[selectedChunk].end };
  }, [selectedChunk, chunks, totalLines]);

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScrubValue(val);
    onSeekPointer(val);
  };

  const handleSelectChunk = (chunkId: number | 'ALL') => {
    setSelectedChunk(chunkId);
    if (chunkId === 'ALL') {
      // Keep current scrubValue
    } else {
      const c = chunks[chunkId];
      if (c) {
        setScrubValue(c.start);
        onSeekPointer(c.start);
      }
    }
  };

  const handleBookmarkCurrent = () => {
    setBookmarkPtr(pointer);
  };

  const handleReturnToBookmark = () => {
    onSeekPointer(bookmarkPtr);
  };

  const handleStepChunk = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const target = Math.max(0, pointer - CHUNK_SIZE);
      const targetChunk = Math.floor(target / CHUNK_SIZE);
      setSelectedChunk(targetChunk);
      setScrubValue(target);
      onSeekPointer(target);
    } else {
      const target = Math.min(totalLines, pointer + CHUNK_SIZE);
      const targetChunk = Math.min(numChunks - 1, Math.floor(target / CHUNK_SIZE));
      setSelectedChunk(targetChunk);
      setScrubValue(target);
      onSeekPointer(target);
    }
  };

  const handleStep = (delta: number) => {
    const target = Math.max(0, Math.min(totalLines, pointer + delta));
    setScrubValue(target);
    if (selectedChunk !== 'ALL') {
      const targetChunk = Math.floor(target / CHUNK_SIZE);
      if (targetChunk !== selectedChunk && targetChunk < numChunks) {
        setSelectedChunk(targetChunk);
      }
    }
    onSeekPointer(target);
  };

  return (
    <div className="page-flipper-bar glass-panel">
      <style>{`
        .page-flipper-bar {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 860px;
          padding: 12px 20px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 24px;
          z-index: 120;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
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
        .flipper-chunk-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .flipper-chunk-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #d1d5db;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .flipper-chunk-pill:hover {
          background: rgba(245, 158, 11, 0.2);
          color: #fff;
        }
        .flipper-chunk-pill.active {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #000;
          font-weight: bold;
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
          gap: 5px;
          flex-wrap: wrap;
        }
        .flipper-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 3px;
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
            Line {pointer} / {totalLines}
          </span>
        </div>

        <div className="flipper-btns">
          {numChunks > 1 && (
            <>
              <button 
                className="flipper-btn" 
                onClick={() => handleStepChunk('prev')}
                title="Jump back 1000 lines"
                style={{ color: '#f59e0b' }}
              >
                ⏮ -1000
              </button>
            </>
          )}
          <button 
            className="flipper-btn" 
            onClick={() => handleStep(-10)}
            title="Step Back 10 lines"
          >
            -10
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => handleStep(-1)}
            title="Step Back 1 line"
          >
            ◀ -1
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => handleStep(1)}
            title="Step Forward 1 line"
          >
            +1 ▶
          </button>
          <button 
            className="flipper-btn" 
            onClick={() => handleStep(10)}
            title="Step Forward 10 lines"
          >
            +10
          </button>
          {numChunks > 1 && (
            <button 
              className="flipper-btn" 
              onClick={() => handleStepChunk('next')}
              title="Jump forward 1000 lines"
              style={{ color: '#f59e0b' }}
            >
              +1000 ⏭
            </button>
          )}

          <button 
            className="flipper-btn" 
            onClick={handleBookmarkCurrent}
            title="Bookmark this position"
          >
            🔖 {language === 'JP' ? '书签' : 'Mark'}
          </button>
          <button 
            className="flipper-btn" 
            onClick={handleReturnToBookmark}
            title={`Return to bookmarked line ${bookmarkPtr}`}
            style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
          >
            ↩ L{bookmarkPtr}
          </button>
          <button 
            className="flipper-btn" 
            onClick={onOpenToc}
            style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold' }}
          >
            📚 {language === 'JP' ? '目录' : 'Index'}
          </button>
          <button className="flipper-btn" onClick={onClose} style={{ borderRadius: '50%', padding: '3px 7px' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Multi-1000 Range Chunk Selector */}
      {numChunks > 1 && (
        <div className="flipper-chunk-pills">
          <span style={{ fontSize: '10px', color: '#9ca3af', marginRight: '4px' }}>
            {language === 'JP' ? '范围分卷:' : 'Range Window:'}
          </span>
          {chunks.map((c) => (
            <button
              key={c.id}
              className={`flipper-chunk-pill ${selectedChunk === c.id ? 'active' : ''}`}
              onClick={() => handleSelectChunk(c.id)}
            >
              {c.label}
            </button>
          ))}
          <button
            className={`flipper-chunk-pill ${selectedChunk === 'ALL' ? 'active' : ''}`}
            onClick={() => handleSelectChunk('ALL')}
          >
            {language === 'JP' ? `全场景 (0 - ${totalLines})` : `Full (0 - ${totalLines})`}
          </button>
        </div>
      )}

      <div className="flipper-slider-container">
        <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '35px', textAlign: 'right' }}>
          {activeRange.min}
        </span>
        <input
          type="range"
          min={activeRange.min}
          max={activeRange.max}
          value={Math.max(activeRange.min, Math.min(activeRange.max, scrubValue))}
          onChange={handleSliderChange}
          className="flipper-slider"
        />
        <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '35px' }}>
          {activeRange.max}
        </span>
      </div>

      <div className="flipper-preview-box">
        {speaker ? <strong>[{speaker}] </strong> : ''}
        {currentDialogueText || (language === 'JP' ? '(无对话文本)' : '(No dialogue text)')}
      </div>
    </div>
  );
}
