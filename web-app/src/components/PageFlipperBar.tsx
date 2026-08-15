import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';

interface PageFlipperBarProps {
  pointer: number;
  maxPointer: number;
  currentScenario: string | null;
  scenarioData?: any;
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
  scenarioData,
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
  const maxPointerRef = useRef<number>(maxPointer || 1000);
  if (maxPointer && maxPointer > 1000) {
    maxPointerRef.current = maxPointer;
  }
  const totalLines = Math.max(maxPointerRef.current, maxPointer || 1000);
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

  // Synchronously compute preview dialogue text from scenarioData while scrubbing
  const previewData = useMemo(() => {
    const list = Array.isArray(scenarioData) ? scenarioData : scenarioData?.instructions;
    if (!list || !Array.isArray(list) || list.length === 0) {
      return {
        speaker,
        text: currentDialogueText
      };
    }

    let targetIdx = Math.min(scrubValue, list.length - 1);
    while (targetIdx >= 0 && list[targetIdx]?.type !== 'text') {
      targetIdx--;
    }

    if (targetIdx >= 0 && list[targetIdx]) {
      const inst = list[targetIdx];
      const txt = language === 'JP' 
        ? (inst.text_jp || inst.textJp || inst.text || '') 
        : (inst.text_en || inst.textEn || inst.text || '');
      let spk = language === 'JP' 
        ? (inst.speaker_jp || inst.speakerJp || inst.speaker || '') 
        : (inst.speaker_en || inst.speakerEn || inst.speaker || '');

      if (!spk) {
        let sIdx = targetIdx;
        while (sIdx >= 0) {
          const item = list[sIdx];
          if (item?.type === 'speaker' || item?.speaker || item?.speaker_jp) {
            spk = language === 'JP' 
              ? (item.speaker_jp || item.speakerJp || item.speaker || '') 
              : (item.speaker_en || item.speakerEn || item.speaker || '');
            break;
          }
          sIdx--;
        }
      }

      return {
        speaker: spk || speaker,
        text: txt || currentDialogueText
      };
    }

    return {
      speaker,
      text: currentDialogueText
    };
  }, [scenarioData, scrubValue, language, speaker, currentDialogueText]);

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
    const list = Array.isArray(scenarioData) ? scenarioData : scenarioData?.instructions;
    let target = Math.max(0, Math.min(totalLines, pointer + delta));

    if (list && list.length > 0 && Math.abs(delta) === 1) {
      let cur = pointer + delta;
      if (delta > 0) {
        while (cur < list.length && list[cur]?.type !== 'text') {
          cur++;
        }
      } else {
        while (cur >= 0 && list[cur]?.type !== 'text') {
          cur--;
        }
      }
      if (cur >= 0 && cur < list.length) {
        target = cur;
      }
    }

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
    <div 
      className="page-flipper-sidebar glass-panel shadow-premium"
      style={{
        position: 'relative',
        width: '350px',
        height: '600px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        .flipper-chunk-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #d1d5db;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .flipper-chunk-pill:hover {
          background: rgba(245, 158, 11, 0.25);
          color: #fff;
          border-color: #f59e0b;
        }
        .flipper-chunk-pill.active {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #000;
          font-weight: bold;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        .flipper-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
        }
        .flipper-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.8);
          transition: transform 0.1s ease;
        }
        .flipper-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .flipper-action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .flipper-action-btn:hover {
          background: rgba(245, 158, 11, 0.25);
          border-color: #f59e0b;
          color: #fff;
        }
      `}</style>

      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', paddingBottom: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>
            📖 {language === 'JP' ? '翻页导航' : 'Book Flip Navigator'}
          </span>
          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
            {currentScenario}.ks
          </span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
          title="Close Navigator"
        >
          ✕
        </button>
      </div>

      {/* 2. Range Window Chunk Selector */}
      {numChunks > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>📑 {language === 'JP' ? '分卷选择' : 'Range Windows'}</span>
            <span style={{ color: '#f59e0b' }}>{totalLines} lines total</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
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
              style={{ gridColumn: numChunks % 3 === 2 ? 'span 1' : 'span 2' }}
            >
              {language === 'JP' ? `全章节 (0 - ${totalLines})` : `Full (0 - ${totalLines})`}
            </button>
          </div>
        </div>
      )}

      {/* 3. Slider Timeline Track */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#9ca3af' }}>{language === 'JP' ? '指针位置' : 'Pointer'}:</span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
            Line {scrubValue} / {totalLines}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af', minWidth: '32px', textAlign: 'right' }}>
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
          <span style={{ fontSize: '10px', color: '#9ca3af', minWidth: '32px' }}>
            {activeRange.max}
          </span>
        </div>
      </div>

      {/* 4. Fine & Chunk Step Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: numChunks > 1 ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)', gap: '4px' }}>
          {numChunks > 1 && (
            <button className="flipper-action-btn" onClick={() => handleStepChunk('prev')} title="Jump back 1000 lines" style={{ color: '#f59e0b' }}>
              -1k
            </button>
          )}
          <button className="flipper-action-btn" onClick={() => handleStep(-10)} title="Step back 10 lines">
            -10
          </button>
          <button className="flipper-action-btn" onClick={() => handleStep(-1)} title="Step back 1 line">
            ◀ -1
          </button>
          <button className="flipper-action-btn" onClick={() => handleStep(1)} title="Step forward 1 line">
            +1 ▶
          </button>
          <button className="flipper-action-btn" onClick={() => handleStep(10)} title="Step forward 10 lines">
            +10
          </button>
          {numChunks > 1 && (
            <button className="flipper-action-btn" onClick={() => handleStepChunk('next')} title="Jump forward 1000 lines" style={{ color: '#f59e0b' }}>
              +1k
            </button>
          )}
        </div>

        {/* Bookmarking & TOC Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          <button className="flipper-action-btn" onClick={handleBookmarkCurrent} title="Bookmark this position">
            🔖 {language === 'JP' ? '书签' : 'Mark'}
          </button>
          <button 
            className="flipper-action-btn" 
            onClick={handleReturnToBookmark} 
            title={`Return to bookmarked line ${bookmarkPtr}`}
            style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
          >
            ↩ L{bookmarkPtr}
          </button>
          <button 
            className="flipper-action-btn" 
            onClick={onOpenToc} 
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 'bold', border: 'none' }}
          >
            📚 {language === 'JP' ? '目录' : 'Index'}
          </button>
        </div>
      </div>

      {/* 5. Live Dialogue Preview Card (Flex 1 Scrollable) */}
      <div style={{ 
        flex: 1, 
        minHeight: 0,
        background: 'rgba(0, 0, 0, 0.45)', 
        padding: '10px 12px', 
        borderRadius: '10px', 
        borderLeft: '4px solid #f59e0b',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '4px' }}>
          💬 {language === 'JP' ? '当前台词预览' : 'Live Dialogue Preview'}
        </div>
        {previewData.speaker && (
          <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '13px' }}>
            【{previewData.speaker}】
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#f1f5f9', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {previewData.text || <span style={{ color: '#64748b', fontStyle: 'italic' }}>{language === 'JP' ? '(无对话文本)' : '(No dialogue text)'}</span>}
        </div>
      </div>
    </div>
  );
}
