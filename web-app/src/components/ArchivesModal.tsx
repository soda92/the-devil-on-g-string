import React, { useState, useMemo } from 'react';
import { SaveSlotData, Language } from '../types/kag';
import { resolveCharacterName, isSensitiveAsset, getSceneThumbnailAsset } from '../utils/gameUtils';

export interface ArchivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveSlots: Record<string | number, SaveSlotData>;
  onLoadSlot: (slotData: SaveSlotData) => void;
  onSaveSlot: (slotIdx: number | string, note: string, pinned: boolean) => void;
  onUpdateNote: (slotIdx: number | string, note: string) => void;
  onTogglePin: (slotIdx: number | string) => void;
  onDeleteSlot: (slotIdx: number | string) => void;
  gameState: 'TITLE' | 'PLAYING';
  language: Language;
  currentScenario?: string;
  currentPointer?: number;
  currentDialogueText?: string;
  currentSpeaker?: string;
  config?: any;
}

// Chapter metadata lookup helper
const getChapterMeta = (scen: string) => {
  if (!scen) return { chapter: '未知章节', route: '通用', color: '#a855f7' };
  const s = scen.toLowerCase();
  if (s.startsWith('gt') || s === 'gted') return { chapter: '椿姬线 / Tsubaki Route', route: 'Tsubaki', color: '#ec4899' };
  if (s.startsWith('gk') || s === 'gked') return { chapter: '花音线 / Kanon Route', route: 'Kanon', color: '#3b82f6' };
  if (s.startsWith('gm') || s === 'gmed') return { chapter: '水羽线 / Mizuha Route', route: 'Mizuha', color: '#eab308' };
  if (s.startsWith('g5') || s.startsWith('g6')) return { chapter: '终章 · 真实 / True End', route: 'Haru', color: '#8b5cf6' };
  
  const num = parseInt(s.replace(/\D/g, ''), 10);
  if (!isNaN(num)) {
    if (num <= 6) return { chapter: '第一章 / Chapter 1', route: 'Main', color: '#6366f1' };
    if (num <= 13) return { chapter: '第二章 / Chapter 2', route: 'Main', color: '#3b82f6' };
    if (num <= 20) return { chapter: '第三章 / Chapter 3', route: 'Main', color: '#10b981' };
    if (num <= 27) return { chapter: '第四章 / Chapter 4', route: 'Main', color: '#f59e0b' };
    return { chapter: '第五章 / Chapter 5', route: 'Main', color: '#ef4444' };
  }
  return { chapter: '主线故事 / Main Story', route: 'Main', color: '#8b5cf6' };
};

export const ArchivesModal: React.FC<ArchivesModalProps> = ({
  isOpen,
  onClose,
  saveSlots,
  onLoadSlot,
  onSaveSlot,
  onUpdateNote,
  onTogglePin,
  onDeleteSlot,
  gameState,
  language,
  currentScenario = '',
  currentPointer = 0,
  currentDialogueText = '',
  currentSpeaker = '',
  config
}) => {
  const [activeTab, setActiveTab] = useState<'RECENT' | 'CHAPTERS' | 'PINNED'>('RECENT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Save/Note Prompt Modal States
  const [saveModalTargetSlot, setSaveModalTargetSlot] = useState<number | string | null>(null);
  const [saveNoteInput, setSaveNoteInput] = useState<string>('');
  const [savePinInput, setSavePinInput] = useState<boolean>(false);
  const [editingNoteSlot, setEditingNoteSlot] = useState<number | string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | string | null>(null);
  const [revealedSlots, setRevealedSlots] = useState<Set<string | number>>(new Set());

  // Collect all occupied slots (excluding internal 150 unless needed)
  const allOccupiedSlots: SaveSlotData[] = useMemo(() => {
    return Object.entries(saveSlots)
      .filter(([id, data]) => id !== '150' && data && (data.currentScenario || data.pointer !== undefined))
      .map(([id, data]) => ({ ...data, slotId: id }));
  }, [saveSlots]);

  // Find next available slot ID (unlimited dynamic allocation, strictly avoiding slot 150)
  const nextAvailableSlotId = useMemo(() => {
    let i = 0;
    while (i === 150 || saveSlots[i]) {
      i++;
    }
    return i;
  }, [saveSlots]);

  // Filter slots by search query
  const filteredSlots = useMemo(() => {
    let list = [...allOccupiedSlots];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(slot => {
        const noteMatch = slot.note && slot.note.toLowerCase().includes(q);
        const textMatch = slot.dialogueText && slot.dialogueText.toLowerCase().includes(q);
        const speakerMatch = slot.speaker && slot.speaker.toLowerCase().includes(q);
        const scenMatch = slot.currentScenario && slot.currentScenario.toLowerCase().includes(q);
        const dateMatch = slot.date && slot.date.toLowerCase().includes(q);
        const chapterMeta = getChapterMeta(slot.currentScenario);
        const chapterMatch = chapterMeta.chapter.toLowerCase().includes(q);
        return noteMatch || textMatch || speakerMatch || scenMatch || dateMatch || chapterMatch;
      });
    }

    if (activeTab === 'PINNED') {
      list = list.filter(slot => slot.pinned);
    }

    // Default sort: Autosave first, then pinned, then newest timestamp
    return list.sort((a, b) => {
      if (a.slotId === 'autosave') return -1;
      if (b.slotId === 'autosave') return 1;
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [allOccupiedSlots, searchQuery, activeTab]);

  // Group slots by chapter for the CHAPTERS view
  const groupedByChapter = useMemo(() => {
    const map = new Map<string, { meta: ReturnType<typeof getChapterMeta>; slots: SaveSlotData[] }>();
    for (const slot of filteredSlots) {
      const meta = getChapterMeta(slot.currentScenario);
      if (!map.has(meta.chapter)) {
        map.set(meta.chapter, { meta, slots: [] });
      }
      map.get(meta.chapter)!.slots.push(slot);
    }
    return Array.from(map.entries());
  }, [filteredSlots]);

  // Initiate New Save Flow
  const handleOpenNewSave = () => {
    setSaveModalTargetSlot(nextAvailableSlotId);
    const meta = getChapterMeta(currentScenario);
    setSaveNoteInput(`[${currentScenario}] ${meta.chapter.split('/')[0].trim()} - 对话中`);
    setSavePinInput(false);
  };

  // Initiate Overwrite Flow
  const handleOpenOverwrite = (slotId: number | string) => {
    setSaveModalTargetSlot(slotId);
    const existing = saveSlots[slotId];
    setSaveNoteInput(existing?.note || '');
    setSavePinInput(existing?.pinned || false);
  };

  // Confirm Save
  const handleConfirmSave = () => {
    if (saveModalTargetSlot !== null) {
      onSaveSlot(saveModalTargetSlot, saveNoteInput.trim(), savePinInput);
      setSaveModalTargetSlot(null);
    }
  };

  // Save Inline Note Edit
  const handleConfirmNoteEdit = () => {
    if (editingNoteSlot !== null) {
      onUpdateNote(editingNoteSlot, editNoteText.trim());
      setEditingNoteSlot(null);
    }
  };

  const renderSlotCard = (slot: SaveSlotData) => {
    const meta = getChapterMeta(slot.currentScenario);
    const isAutosave = slot.slotId === 'autosave';
    const bgUrl = getSceneThumbnailAsset(slot.background, slot.currentScenario);
    const translatedSpeaker = resolveCharacterName(slot.speaker, language, config?.characterNames);
    const isSensitive = isSensitiveAsset(slot.background, slot.currentScenario);
    const isRevealed = Boolean(slot.slotId !== undefined && revealedSlots.has(slot.slotId));
    const shouldBlur = isSensitive && !isRevealed;

    const handleToggleReveal = (e: React.MouseEvent) => {
      if (!isSensitive || slot.slotId === undefined) return;
      e.stopPropagation();
      setRevealedSlots(prev => {
        const next = new Set(prev);
        if (next.has(slot.slotId!)) {
          next.delete(slot.slotId!);
        } else {
          next.add(slot.slotId!);
        }
        return next;
      });
    };

    return (
      <div 
        key={String(slot.slotId)} 
        className={`archive-card glass-panel ${slot.pinned ? 'card-pinned' : ''} ${isAutosave ? 'card-autosave' : ''}`}
        style={{
          borderLeft: `4px solid ${meta.color}`,
          position: 'relative',
          display: 'flex',
          gap: '15px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Visual Scene Thumbnail */}
        <div 
          onClick={isSensitive ? handleToggleReveal : undefined}
          title={isSensitive ? (shouldBlur ? '🔞 敏感场景，点击揭开预览' : '点击重新模糊') : undefined}
          style={{
            width: '130px',
            height: '85px',
            borderRadius: '6px',
            overflow: 'hidden',
            position: 'relative',
            background: '#000',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            cursor: isSensitive ? 'pointer' : 'default'
          }}
        >
          {bgUrl && (
            <img 
              src={bgUrl} 
              alt="Scene Thumbnail"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                filter: shouldBlur ? 'blur(12px) brightness(0.65)' : 'none',
                transform: shouldBlur ? 'scale(1.15)' : 'none',
                transition: 'filter 0.3s ease, transform 0.3s ease'
              }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          )}

          {/* Sensitive Badge / Click to Reveal Prompt */}
          {shouldBlur && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.35)',
                color: '#f43f5e',
                fontSize: '11px',
                fontWeight: 600,
                textAlign: 'center',
                gap: '2px',
                padding: '4px',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                zIndex: 2
              }}
            >
              <span style={{ fontSize: '15px' }}>🔞</span>
              <span style={{ fontSize: '10px', color: '#fda4af' }}>点击揭开</span>
            </div>
          )}

          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '2px 6px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              fontSize: '10px',
              color: '#cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              zIndex: 3
            }}
          >
            <span>{isAutosave ? '⚡ 自动存档' : `Slot #${typeof slot.slotId === 'number' ? slot.slotId + 1 : slot.slotId}`}</span>
            <span>{slot.currentScenario}:{slot.pointer}</span>
          </div>
        </div>

        {/* Card Content & Metadata */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Header row: Chapter badge, date, pin */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${meta.color}22`,
                  color: meta.color,
                  border: `1px solid ${meta.color}44`
                }}
              >
                {meta.chapter}
              </span>
              {slot.f?.flag_tubaki ? <span style={{ fontSize: '10px', color: '#ec4899' }}>🌸 椿姬:{slot.f.flag_tubaki}</span> : null}
              {slot.f?.flag_kanon ? <span style={{ fontSize: '10px', color: '#3b82f6' }}>❄️ 花音:{slot.f.flag_kanon}</span> : null}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                📅 {slot.date || new Date(slot.timestamp || 0).toLocaleString()}
              </span>
              {!isAutosave && (
                <button
                  onClick={() => onTogglePin(slot.slotId!)}
                  title={slot.pinned ? '取消标星收藏' : '标星收藏 / 锁定保护'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: slot.pinned ? '#eab308' : 'rgba(255, 255, 255, 0.25)',
                    padding: 0
                  }}
                >
                  {slot.pinned ? '⭐' : '☆'}
                </button>
              )}
            </div>
          </div>

          {/* User Note Banner */}
          <div 
            style={{
              fontSize: '12px',
              color: slot.note ? '#f3e8ff' : 'rgba(255, 255, 255, 0.35)',
              background: slot.note ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              padding: '3px 8px',
              borderRadius: '4px',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: slot.note ? '1px solid rgba(168, 85, 247, 0.3)' : '1px dashed rgba(255, 255, 255, 0.1)'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {slot.note ? `📝 ${slot.note}` : '（点击右侧铅笔添加备忘笔记）'}
            </span>
            {!isAutosave && (
              <button
                onClick={() => {
                  setEditingNoteSlot(slot.slotId!);
                  setEditNoteText(slot.note || '');
                }}
                title="编辑备忘笔记"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '0 4px',
                  marginLeft: '6px'
                }}
              >
                ✏️
              </button>
            )}
          </div>

          {/* Spoken quote snippet */}
          <div 
            style={{
              fontSize: '12px',
              color: '#e2e8f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.4
            }}
          >
            {translatedSpeaker && (
              <span style={{ color: '#a855f7', fontWeight: 600, marginRight: '6px' }}>
                【{translatedSpeaker}】
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: slot.dialogueText ? slot.dialogueText.replace(/<br\s*\/?>/gi, ' ') : '...' }} />
          </div>

          {/* Action buttons bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            {gameState === 'PLAYING' && !isAutosave && (
              <button
                onClick={() => handleOpenOverwrite(slot.slotId!)}
                className="sys-btn"
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                💾 覆盖
              </button>
            )}

            {!isAutosave && (
              <button
                onClick={() => setConfirmDeleteSlot(slot.slotId!)}
                className="sys-btn"
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '4px',
                  color: '#f87171',
                  cursor: 'pointer'
                }}
              >
                🗑️
              </button>
            )}

            <button
              onClick={() => onLoadSlot(slot)}
              className="sys-btn"
              style={{
                padding: '3px 14px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)'
              }}
            >
              ▶️ 读取存档
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fade-in 0.2s ease-out'
      }}
    >
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '740px',
          height: '540px',
          background: 'rgba(18, 18, 24, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* === HEADER BAR === */}
        <div 
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🗄️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', letterSpacing: '0.5px' }}>
                档案记录管理 / Document Archives
              </h2>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                {language === 'JP' ? `已保存 ${allOccupiedSlots.length} 份档案记录 (无上限)` : `Saved ${allOccupiedSlots.length} Documents (Unlimited)`}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '240px' }}>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 搜索备忘笔记、台词、场景..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
              transition: 'color 0.2s'
            }}
            title="关闭 (Escape)"
          >
            ✕
          </button>
        </div>

        {/* === FILTER TABS & QUICK SAVE BAR === */}
        <div 
          style={{
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('RECENT')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'RECENT' ? 600 : 400,
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'RECENT' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'RECENT' ? '#c084fc' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer'
              }}
            >
              🕒 全部档案 (最新优先)
            </button>
            <button
              onClick={() => setActiveTab('CHAPTERS')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'CHAPTERS' ? 600 : 400,
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'CHAPTERS' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'CHAPTERS' ? '#c084fc' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer'
              }}
            >
              📖 按章节分类
            </button>
            <button
              onClick={() => setActiveTab('PINNED')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'PINNED' ? 600 : 400,
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'PINNED' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                color: activeTab === 'PINNED' ? '#facc15' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer'
              }}
            >
              ⭐ 标星收藏
            </button>
          </div>

          {/* In-Game New Save Button */}
          {gameState === 'PLAYING' && (
            <button
              onClick={handleOpenNewSave}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>➕</span>
              <span>新建当前存档</span>
            </button>
          )}
        </div>

        {/* === SCROLLABLE ARCHIVES CONTENT === */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {filteredSlots.length === 0 ? (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.35)',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '32px' }}>📂</span>
              <span>{searchQuery ? '未找到符合条件的档案记录' : '暂无档案记录'}</span>
            </div>
          ) : activeTab === 'CHAPTERS' ? (
            groupedByChapter.map(([chapterName, { meta, slots }]) => (
              <div key={chapterName} style={{ marginBottom: '16px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingBottom: '6px',
                    borderBottom: `1px solid ${meta.color}44`,
                    marginBottom: '10px'
                  }}
                >
                  <span style={{ color: meta.color, fontSize: '14px', fontWeight: 600 }}>
                    {chapterName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    ({slots.length} 个档案)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {slots.map(renderSlotCard)}
                </div>
              </div>
            ))
          ) : (
            filteredSlots.map(renderSlotCard)
          )}
        </div>

        {/* === PROMPT: CREATE / OVERWRITE SAVE MODAL === */}
        {saveModalTargetSlot !== null && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110
            }}
          >
            <div 
              style={{
                width: '420px',
                background: '#181824',
                borderRadius: '10px',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                padding: '20px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)'
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#fff' }}>
                💾 保存到档案槽位 #{typeof saveModalTargetSlot === 'number' ? saveModalTargetSlot + 1 : saveModalTargetSlot}
              </h3>
              
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                当前场景：{currentScenario} | 指针：{currentPointer}
                {currentSpeaker && <div style={{ marginTop: '2px', color: '#c084fc' }}>说话角色：【{currentSpeaker}】</div>}
                <div style={{ marginTop: '2px', fontStyle: 'italic', color: '#cbd5e1' }}>
                  「{currentDialogueText ? currentDialogueText.replace(/<br\s*\/?>/gi, ' ') : '...'}」
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '12px', color: '#e2e8f0', marginBottom: '6px' }}>
                📝 备忘笔记（可选，方便日后回忆为何存档）：
              </label>
              <input 
                type="text"
                value={saveNoteInput}
                onChange={(e) => setSaveNoteInput(e.target.value)}
                placeholder="例如：做出选择之前、椿姬线高潮等..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '12px'
                }}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#facc15', cursor: 'pointer', marginBottom: '16px' }}>
                <input 
                  type="checkbox"
                  checked={savePinInput}
                  onChange={(e) => setSavePinInput(e.target.checked)}
                />
                ⭐ 标星保护（防止被快速保存覆盖）
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setSaveModalTargetSlot(null)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  style={{
                    padding: '6px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  确认保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === PROMPT: EDIT NOTE MODAL === */}
        {editingNoteSlot !== null && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110
            }}
          >
            <div 
              style={{
                width: '380px',
                background: '#181824',
                borderRadius: '10px',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                padding: '20px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)'
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#fff' }}>
                ✏️ 修改备忘笔记 (Slot #{typeof editingNoteSlot === 'number' ? editingNoteSlot + 1 : editingNoteSlot})
              </h3>
              
              <input 
                type="text"
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                placeholder="输入新的备忘内容..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setEditingNoteSlot(null)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmNoteEdit}
                  style={{
                    padding: '6px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === PROMPT: DELETE CONFIRMATION === */}
        {confirmDeleteSlot !== null && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110
            }}
          >
            <div 
              style={{
                width: '320px',
                background: '#1f1620',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '18px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#f87171' }}>
                ⚠️ 确认删除档案？
              </h3>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 16px 0' }}>
                删除 Slot #{typeof confirmDeleteSlot === 'number' ? confirmDeleteSlot + 1 : confirmDeleteSlot} 后无法恢复。
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setConfirmDeleteSlot(null)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onDeleteSlot(confirmDeleteSlot);
                    setConfirmDeleteSlot(null);
                  }}
                  style={{
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
