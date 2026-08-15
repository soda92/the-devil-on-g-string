import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { SCENARIO_INDEX, RouteType } from '../data/scenarioIndex';

export interface StoryNavigatorProps {
  initialTab?: 'flipper' | 'toc';
  pointer: number;
  maxPointer: number;
  currentScenario: string | null;
  scenarioData?: any;
  currentDialogueText: string;
  speaker: string;
  onSeekPointer: (pointer: number) => void;
  onSelectTopic: (scenId: string, startPtr: number, presets?: Record<string, any>) => void;
  onClose: () => void;
  language: 'JP' | 'EN';
  isSidebar?: boolean;
}

type TabFilter = 'ALL' | RouteType;

export default function StoryNavigator({
  initialTab = 'flipper',
  pointer,
  maxPointer,
  currentScenario,
  scenarioData,
  currentDialogueText,
  speaker,
  onSeekPointer,
  onSelectTopic,
  onClose,
  language,
  isSidebar = true
}: StoryNavigatorProps) {
  const [activeTab, setActiveTab] = useState<'flipper' | 'toc'>(initialTab);

  // Sync activeTab when initialTab changes externally
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ==========================================
  // 1. PAGE FLIPPER STATE & LOGIC
  // ==========================================
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

  // Sync scrubValue and automatically follow active chunk window when reading advances
  useEffect(() => {
    setScrubValue(pointer);
    if (selectedChunk !== 'ALL') {
      const currentPointerChunk = Math.min(numChunks - 1, Math.floor(pointer / CHUNK_SIZE));
      if (currentPointerChunk !== selectedChunk) {
        setSelectedChunk(currentPointerChunk);
      }
    }
  }, [pointer, numChunks, selectedChunk]);

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
      setScrubValue(pointer);
    } else {
      const c = chunks[chunkId];
      if (c) {
        if (pointer >= c.start && pointer <= c.end) {
          setScrubValue(pointer);
        } else {
          const target = c.start;
          setScrubValue(target);
          onSeekPointer(target);
        }
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

  // ==========================================
  // 2. TABLE OF CONTENTS STATE & LOGIC
  // ==========================================
  const [selectedRoute, setSelectedRoute] = useState<TabFilter>('ALL');
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active reading scenario card into view on mount or tab switch
  useEffect(() => {
    if (activeTab === 'toc' && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTab, currentScenario]);

  const routes: { id: TabFilter; labelJp: string; labelEn: string }[] = [
    { id: 'ALL', labelJp: '全部章节', labelEn: 'All Chapters' },
    { id: 'Main', labelJp: '主线 / 共通', labelEn: 'Main Common' },
    { id: 'Tsubaki', labelJp: '美轮椿姬篇', labelEn: 'Tsubaki Route' },
    { id: 'Kanon', labelJp: '美波花音篇', labelEn: 'Kanon Route' },
    { id: 'Mizuha', labelJp: '白鸟水羽篇', labelEn: 'Mizuha Route' },
    { id: 'Haru', labelJp: '宇佐美哈尔篇', labelEn: 'Haru Route' }
  ];

  const innerContent = (
    <div 
      className={`glass-panel story-navigator-sidebar shadow-premium`}
      style={isSidebar ? {
        position: 'relative',
        width: '380px',
        height: '600px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box',
        color: '#e2e8f0'
      } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        .story-nav-tab-btn {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
          color: #9ca3af;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .story-nav-tab-btn.active {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15));
          border-color: #f59e0b;
          color: #fbbf24;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }
        .flipper-step-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .flipper-step-btn:hover {
          background: rgba(245, 158, 11, 0.3);
          border-color: #f59e0b;
          color: #fbbf24;
        }
        .flipper-action-btn {
          flex: 1;
          padding: 6px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .flipper-action-btn:hover {
          filter: brightness(1.15);
        }
        .flipper-range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
        }
        .flipper-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          box-shadow: 0 0 8px #f59e0b;
        }
      `}</style>

      {/* Top Header: Tab Switcher + Close Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', paddingBottom: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
          <button 
            className={`story-nav-tab-btn ${activeTab === 'flipper' ? 'active' : ''}`}
            onClick={() => setActiveTab('flipper')}
          >
            <span>📖</span>
            <span>{language === 'JP' ? '翻页微调' : 'Page Flipper'}</span>
          </button>
          <button 
            className={`story-nav-tab-btn ${activeTab === 'toc' ? 'active' : ''}`}
            onClick={() => setActiveTab('toc')}
          >
            <span>📚</span>
            <span>{language === 'JP' ? '章节目录' : 'Chapters Index'}</span>
          </button>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
          title="Close Navigator"
        >
          ✕
        </button>
      </div>

      {/* ========================================================
          TAB 1: PAGE FLIPPER TIMELINE SCRUBBER
          ======================================================== */}
      {activeTab === 'flipper' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
          {/* 1. Sub-Header: Scenario Badge & Pointer Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.2)', 
              color: '#f59e0b', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              fontWeight: 'bold',
              border: '1px solid rgba(245, 158, 11, 0.4)'
            }}>
              {currentScenario ? `${currentScenario}.ks` : 'g01.ks'}
            </span>
            <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
              Line {pointer} / {totalLines}
            </span>
          </div>

          {/* 2. 1000-Line Range Window Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
              🎯 {language === 'JP' ? '分卷选择 (1000行/卷)' : 'Range Windows (1000 lines)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {chunks.map(c => {
                const isSelected = selectedChunk === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChunk(c.id)}
                    style={{
                      padding: '4px 2px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      color: isSelected ? '#fbbf24' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
              <button
                onClick={() => handleSelectChunk('ALL')}
                style={{
                  padding: '4px 2px',
                  borderRadius: '5px',
                  fontSize: '10px',
                  fontWeight: selectedChunk === 'ALL' ? 'bold' : 'normal',
                  border: selectedChunk === 'ALL' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedChunk === 'ALL' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  color: selectedChunk === 'ALL' ? '#fbbf24' : '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {language === 'JP' ? '全章节' : 'Full (All)'}
              </button>
            </div>
          </div>

          {/* 3. Slider Timeline Track */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            padding: '8px 10px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
              <span>Min: {activeRange.min}</span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                🎯 {language === 'JP' ? `指针: 第 ${scrubValue} 行` : `Line: ${scrubValue}`}
              </span>
              <span>Max: {activeRange.max}</span>
            </div>
            <input 
              type="range" 
              min={activeRange.min} 
              max={activeRange.max} 
              value={scrubValue} 
              onChange={handleSliderChange}
              className="flipper-range-slider"
            />
          </div>

          {/* 4. Fine & Chunk Stepping Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              <button className="flipper-step-btn" onClick={() => handleStepChunk('prev')} title="-1000 Lines">-1k</button>
              <button className="flipper-step-btn" onClick={() => handleStep(-10)} title="-10 Lines">-10</button>
              <button className="flipper-step-btn" onClick={() => handleStep(-1)} title="-1 Line">◀ -1</button>
              <button className="flipper-step-btn" onClick={() => handleStep(1)} title="+1 Line">+1 ▶</button>
              <button className="flipper-step-btn" onClick={() => handleStep(10)} title="+10 Lines">+10</button>
              <button className="flipper-step-btn" onClick={() => handleStepChunk('next')} title="+1000 Lines">+1k</button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className="flipper-action-btn" 
                onClick={handleBookmarkCurrent} 
                style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}
              >
                🔖 {language === 'JP' ? '书签' : 'Mark'}
              </button>
              <button 
                className="flipper-action-btn" 
                onClick={handleReturnToBookmark} 
                style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)' }}
              >
                ↩ {language === 'JP' ? `返回 L.${bookmarkPtr}` : `Return L.${bookmarkPtr}`}
              </button>
              <button 
                className="flipper-action-btn" 
                onClick={() => setActiveTab('toc')} 
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 'bold', border: 'none' }}
              >
                📚 {language === 'JP' ? '目录' : 'Index'}
              </button>
            </div>
          </div>

          {/* 5. Live Dialogue Preview Card (Scrollable) */}
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
      )}

      {/* ========================================================
          TAB 2: CHAPTERS TABLE OF CONTENTS INDEX
          ======================================================== */}
      {activeTab === 'toc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0 }}>
          {/* Route Filter Pills Grid */}
          <div className="toc-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flexShrink: 0 }}>
            {routes.map(r => (
              <button
                key={r.id}
                className={`toc-tab-btn ${selectedRoute === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRoute(r.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: selectedRoute === r.id ? 'bold' : 'normal',
                  border: selectedRoute === r.id ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedRoute === r.id ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedRoute === r.id ? '#000' : '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {language === 'JP' ? r.labelJp : r.labelEn}
              </button>
            ))}
          </div>

          {/* Scenario Chapters List (Scrollable) */}
          <div className="toc-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {SCENARIO_INDEX.map(ch => {
              const matchingScenarios = ch.scenarios.filter(scen => 
                selectedRoute === 'ALL' || scen.route === selectedRoute
              );
              if (matchingScenarios.length === 0) return null;

              return (
                <div key={ch.chapterId} className="toc-chapter-block" style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div className="toc-chapter-title" style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '4px' }}>
                    {language === 'JP' ? ch.titleJp : ch.titleEn}
                  </div>
                  <div className="toc-chapter-desc" style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                    {ch.description}
                  </div>
                  <div className="toc-scenarios-grid" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {matchingScenarios.map(scen => {
                      const isCurrent = currentScenario === scen.id;
                      return (
                        <div
                          key={scen.id}
                          ref={isCurrent ? activeCardRef : undefined}
                          className={`toc-scenario-card ${isCurrent ? 'current' : ''}`}
                          onClick={() => onSelectTopic(scen.id, scen.startPtr, scen.presets)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: isCurrent ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isCurrent ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.12))' : 'rgba(0, 0, 0, 0.4)',
                            boxShadow: isCurrent ? '0 0 14px rgba(245, 158, 11, 0.4)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <div className="toc-scen-name" style={{ fontWeight: isCurrent ? 'bold' : '600', color: isCurrent ? '#fbbf24' : '#f3f4f6', fontSize: '12px' }}>
                              {language === 'JP' ? scen.title : (scen.titleEn || scen.title)}
                            </div>
                            {isCurrent && (
                              <span style={{
                                background: '#f59e0b',
                                color: '#000',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                📍 {language === 'JP' ? '当前' : 'Active'} {pointer !== undefined && pointer > 0 ? `L.${pointer}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="toc-scen-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                            <span>{scen.id}.ks (ptr {scen.startPtr})</span>
                            <span className={`toc-badge badge-${scen.route.toLowerCase()}`}>{scen.route}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
