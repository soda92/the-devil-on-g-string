import React, { useState, useEffect, useMemo } from 'react';
import GALLERY_ITEMS from '../gallery_items.json';
import { SystemFlags, Language } from '../types/kag';
import { isSensitiveAsset, getSceneThumbnailAsset } from '../utils/gameUtils';

interface GalleryItem {
  id: string | number;
  title: string;
  base: string;
  variants: string[];
}

const typedGalleryItems: GalleryItem[] = GALLERY_ITEMS as GalleryItem[];

interface CgCategoryMeta {
  key: string;
  labelJp: string;
  labelEn: string;
  icon: string;
  color: string;
}

const CG_CATEGORIES: CgCategoryMeta[] = [
  { key: 'ALL', labelJp: '全部', labelEn: 'All CGs', icon: '🌟', color: '#c084fc' },
  { key: 'Haru', labelJp: '宇佐美 春', labelEn: 'Haru Usami', icon: '🎻', color: '#8b5cf6' },
  { key: 'Tsubaki', labelJp: '宇佐美 椿姬', labelEn: 'Tsubaki Miwa', icon: '🌸', color: '#ec4899' },
  { key: 'Kanon', labelJp: '美轮 花音', labelEn: 'Kanon Mizuhara', icon: '❄️', color: '#3b82f6' },
  { key: 'Mizuha', labelJp: '白鸟 水羽', labelEn: 'Mizuha Shiratori', icon: '🍁', color: '#eab308' },
  { key: 'Maou', labelJp: '魔王', labelEn: 'Maou', icon: '🎭', color: '#ef4444' },
  { key: 'Other', labelJp: '剧情事件', labelEn: 'Story / Others', icon: '🏙️', color: '#10b981' }
];

const getCgCategoryKey = (base: string): string => {
  const b = base.toLowerCase();
  if (b.startsWith('ev_haru')) return 'Haru';
  if (b.startsWith('ev_tubaki')) return 'Tsubaki';
  if (b.startsWith('ev_kanon') || b.startsWith('st_kanon')) return 'Kanon';
  if (b.startsWith('ev_mizuha')) return 'Mizuha';
  if (b.startsWith('ev_maou')) return 'Maou';
  return 'Other';
};

const formatCgTitle = (base: string, fallbackTitle: string): string => {
  const b = base.toLowerCase();
  const match = b.match(/ev_([a-z]+)_(?:(h)_)?(\d+[a-z]?)/i) || b.match(/st_([a-z]+)_(\d+[a-z]?)/i);
  if (!match) return fallbackTitle;

  const charMap: Record<string, string> = {
    haru: '春',
    tubaki: '椿姬',
    kanon: '花音',
    mizuha: '水羽',
    maou: '魔王',
    other: '事件'
  };
  const char = charMap[match[1]] || match[1];
  const isH = match[2] ? ' 🔞' : '';
  const num = match[3] || '';
  return `${char}${isH} · ${num}`;
};

export interface SpecialScene {
  id: string;
  scenario: string;
  heroine: 'Tsubaki' | 'Kanon' | 'Mizuha' | 'Haru';
  heroineNameJp: string;
  heroineNameEn: string;
  titleJp: string;
  titleEn: string;
  descJp: string;
  descEn: string;
  cgBase: string;
  color: string;
}

const SPECIAL_SCENES: SpecialScene[] = [
  // Tsubaki Miwa
  {
    id: 'gth1',
    scenario: 'gth1',
    heroine: 'Tsubaki',
    heroineNameJp: '宇佐美 椿姬',
    heroineNameEn: 'Tsubaki Miwa',
    titleJp: '初夜 · 誓言之夜',
    titleEn: 'First Night · The Vow',
    descJp: '椿姬路线 第一个特殊场景',
    descEn: 'Tsubaki Route First Intimate Scene',
    cgBase: 'ev_tubaki_h_01a',
    color: '#ec4899'
  },
  {
    id: 'gth2',
    scenario: 'gth2',
    heroine: 'Tsubaki',
    heroineNameJp: '宇佐美 椿姬',
    heroineNameEn: 'Tsubaki Miwa',
    titleJp: '恋人们的温存',
    titleEn: 'Lovers’ Warmth',
    descJp: '椿姬路线 第二个特殊场景',
    descEn: 'Tsubaki Route Second Intimate Scene',
    cgBase: 'ev_tubaki_h_03a',
    color: '#ec4899'
  },
  {
    id: 'gthb',
    scenario: 'gthb',
    heroine: 'Tsubaki',
    heroineNameJp: '宇佐美 椿姬',
    heroineNameEn: 'Tsubaki Miwa',
    titleJp: '椿姬 坏结局特别篇',
    titleEn: 'Tsubaki Bad End Special',
    descJp: '椿姬路线 坏结局 (Bad End) 特殊场景',
    descEn: 'Tsubaki Route Bad End Intimate Scene',
    cgBase: 'ev_tubaki_h_05a',
    color: '#f43f5e'
  },
  // Kanon Mizuhara
  {
    id: 'gkh1',
    scenario: 'gkh1',
    heroine: 'Kanon',
    heroineNameJp: '美轮 花音',
    heroineNameEn: 'Kanon Mizuhara',
    titleJp: '冰场后的秘密',
    titleEn: 'Secret After the Rink',
    descJp: '花音路线 第一个特殊场景',
    descEn: 'Kanon Route First Intimate Scene',
    cgBase: 'ev_kanon_h_04a',
    color: '#3b82f6'
  },
  {
    id: 'gkh2',
    scenario: 'gkh2',
    heroine: 'Kanon',
    heroineNameJp: '美轮 花音',
    heroineNameEn: 'Kanon Mizuhara',
    titleJp: '相互依偎的温度',
    titleEn: 'Warmth of Closeness',
    descJp: '花音路线 第二个特殊场景',
    descEn: 'Kanon Route Second Intimate Scene',
    cgBase: 'ev_kanon_h_05a',
    color: '#3b82f6'
  },
  {
    id: 'gkhb',
    scenario: 'gkhb',
    heroine: 'Kanon',
    heroineNameJp: '美轮 花音',
    heroineNameEn: 'Kanon Mizuhara',
    titleJp: '花音 坏结局特别篇',
    titleEn: 'Kanon Bad End Special',
    descJp: '花音路线 坏结局 (Bad End) 特殊场景',
    descEn: 'Kanon Route Bad End Intimate Scene',
    cgBase: 'ev_kanon_h_02a',
    color: '#f43f5e'
  },
  // Mizuha Shiratori
  {
    id: 'gmh1',
    scenario: 'gmh1',
    heroine: 'Mizuha',
    heroineNameJp: '白鸟 水羽',
    heroineNameEn: 'Mizuha Shiratori',
    titleJp: '属于两人的房间',
    titleEn: 'A Room for Two',
    descJp: '水羽路线 第一个特殊场景',
    descEn: 'Mizuha Route First Intimate Scene',
    cgBase: 'ev_mizuha_h_01a',
    color: '#eab308'
  },
  {
    id: 'gmh2',
    scenario: 'gmh2',
    heroine: 'Mizuha',
    heroineNameJp: '白鸟 水羽',
    heroineNameEn: 'Mizuha Shiratori',
    titleJp: '心意相通之夜',
    titleEn: 'Night of United Hearts',
    descJp: '水羽路线 第二个特殊场景',
    descEn: 'Mizuha Route Second Intimate Scene',
    cgBase: 'ev_mizuha_h_05a',
    color: '#eab308'
  },
  // Haru Usami (True Route)
  {
    id: 'ghh1',
    scenario: 'ghh1',
    heroine: 'Haru',
    heroineNameJp: '宇佐美 春',
    heroineNameEn: 'Haru Usami',
    titleJp: '真实的情感与温度',
    titleEn: 'True Emotion & Warmth',
    descJp: '真实路线 第一个特殊场景',
    descEn: 'True Route First Intimate Scene',
    cgBase: 'ev_haru_h_01b',
    color: '#8b5cf6'
  },
  {
    id: 'ghh2',
    scenario: 'ghh2',
    heroine: 'Haru',
    heroineNameJp: '宇佐美 春',
    heroineNameEn: 'Haru Usami',
    titleJp: '决战前夕的约定',
    titleEn: 'Promise Before the Climax',
    descJp: '真实路线 第二个特殊场景',
    descEn: 'True Route Second Intimate Scene',
    cgBase: 'ev_haru_h_05a',
    color: '#8b5cf6'
  }
];

export interface GalleryScreenProps {
  sf: SystemFlags;
  resolveAsset: (name?: string | null, type?: string) => string;
  onBack: () => void;
  setCgViewerUrl?: (url: string | null) => void;
  language?: Language | string;
  onPlayScene?: (scenario: string) => void;
  initialViewMode?: 'CG' | 'SCENES';
}

export default function GalleryScreen({ 
  sf, 
  resolveAsset, 
  onBack, 
  setCgViewerUrl: _setCgViewerUrl,
  language = 'JP',
  onPlayScene,
  initialViewMode = 'CG'
}: GalleryScreenProps) {
  const [viewMode, setViewMode] = useState<'CG' | 'SCENES'>(initialViewMode);
  const [cgCategoryFilter, setCgCategoryFilter] = useState<string>('ALL');
  const [heroineFilter, setHeroineFilter] = useState<'ALL' | 'Tsubaki' | 'Kanon' | 'Mizuha' | 'Haru'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewingVariants, setViewingVariants] = useState<string[] | null>(null);
  const [viewingIdx, setViewingIdx] = useState<number>(0);
  const [revealedThumbs, setRevealedThumbs] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 12;

  // Filter CG items by category
  const filteredCategoryItems = useMemo(() => {
    if (cgCategoryFilter === 'ALL') return typedGalleryItems;
    return typedGalleryItems.filter(item => getCgCategoryKey(item.base) === cgCategoryFilter);
  }, [cgCategoryFilter]);

  const totalPages = Math.ceil(filteredCategoryItems.length / ITEMS_PER_PAGE) || 1;
  
  // Reset page to 1 when changing category
  useEffect(() => {
    setCurrentPage(1);
  }, [cgCategoryFilter]);

  // Filter CG items by current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredItems = filteredCategoryItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Calculate unlock statistics per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {};
    for (const cat of CG_CATEGORIES) {
      stats[cat.key] = { total: 0, unlocked: 0 };
    }

    for (const item of typedGalleryItems) {
      const catKey = getCgCategoryKey(item.base);
      const isItemUnlocked = item.variants.some(v => sf[v] === 1);

      // Add to ALL
      stats['ALL'].total++;
      if (isItemUnlocked) stats['ALL'].unlocked++;

      // Add to specific category
      if (stats[catKey]) {
        stats[catKey].total++;
        if (isItemUnlocked) stats[catKey].unlocked++;
      }
    }
    return stats;
  }, [sf]);

  // Filter scenes by selected heroine
  const filteredScenes = useMemo(() => {
    if (heroineFilter === 'ALL') return SPECIAL_SCENES;
    return SPECIAL_SCENES.filter(s => s.heroine === heroineFilter);
  }, [heroineFilter]);

  const handleItemClick = (item: GalleryItem) => {
    const unlocked = item.variants.filter(v => sf[v] === 1);
    if (unlocked.length > 0) {
      setViewingVariants(unlocked);
      setViewingIdx(0);
    }
  };

  const handleNextCg = () => {
    if (!viewingVariants) return;
    if (viewingIdx < viewingVariants.length - 1) {
      setViewingIdx(prev => prev + 1);
    } else {
      setViewingVariants(null);
    }
  };

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedThumbs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Keyboard controls for CG Viewer
  useEffect(() => {
    if (!viewingVariants) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingVariants(null);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        handleNextCg();
      } else if (e.key === 'ArrowLeft') {
        if (viewingIdx > 0) {
          setViewingIdx(prev => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingVariants, viewingIdx]);

  return (
    <div className="gallery-layer glass-panel" style={{ width: '100%', height: '100%', padding: '16px 20px', boxSizing: 'border-box' }}>
      <style>{`
        .gallery-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .gallery-tab-btn {
          background: var(--color-glass-light);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gallery-tab-btn:hover {
          background: var(--color-glass-medium);
          color: var(--color-text-bright);
        }
        .gallery-tab-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
          box-shadow: 0 0 10px var(--color-primary-glow);
        }
        .gallery-layer {
          position: relative;
        }
        .cg-viewer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .cg-viewer-img {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
        }
        .cg-viewer-counter {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          pointer-events: none;
          letter-spacing: 1px;
          border: 1px solid var(--color-border);
        }
      `}</style>

      {/* Header Bar with Title, Mode Switcher, and Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 className="screen-title" style={{ margin: 0, fontSize: '18px', letterSpacing: '1px' }}>
            {viewMode === 'CG' ? 'CG 鉴赏' : '场景回顾'}
          </h2>
          {viewMode === 'CG' && (
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '10px' }}>
              已解锁 {categoryStats[cgCategoryFilter]?.unlocked || 0} / {categoryStats[cgCategoryFilter]?.total || 0}
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('CG')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: viewMode === 'CG' ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'CG' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'CG' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer'
            }}
          >
            🎨 CG 鉴赏
          </button>
          <button
            onClick={() => setViewMode('SCENES')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: viewMode === 'SCENES' ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'SCENES' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'SCENES' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer'
            }}
          >
            🎬 场景回顾
          </button>
        </div>

        {/* Top-Right Compact Back Button */}
        <button 
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.18)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          ⬅️ {language === 'JP' ? '返回主菜单' : 'Back to Title'}
        </button>
      </div>

      {/* === CG GALLERY VIEW === */}
      {viewMode === 'CG' && (
        <>
          {/* Character / Category Filter Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
            {CG_CATEGORIES.map((cat) => {
              const active = cgCategoryFilter === cat.key;
              const stats = categoryStats[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setCgCategoryFilter(cat.key)}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: active ? 600 : 400,
                    borderRadius: '6px',
                    border: `1px solid ${active ? cat.color : 'rgba(255,255,255,0.08)'}`,
                    background: active ? `${cat.color}33` : 'rgba(255,255,255,0.04)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{language === 'JP' ? cat.labelJp : cat.labelEn}</span>
                  {stats && (
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>
                      ({stats.unlocked}/{stats.total})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pagination Tabs (if > 1 page in this category) */}
          {totalPages > 1 && (
            <div className="gallery-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button 
                  key={pageNum}
                  className={`gallery-tab-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{ minWidth: '32px', padding: '3px 8px' }}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
          
          <div className="gallery-grid-container" style={{ maxHeight: totalPages > 1 ? '420px' : '450px', overflowY: 'auto' }}>
            {filteredItems.map((item) => {
              const unlockedVariants = item.variants.filter(v => sf[v] === 1);
              const isUnlocked = unlockedVariants.length > 0;
              const thumbName = isUnlocked ? unlockedVariants[0] : null;
              const isSensitive = isSensitiveAsset(thumbName);
              const isRevealed = revealedThumbs.has(String(item.id));
              const shouldBlur = isSensitive && !isRevealed;
              const formattedTitle = formatCgTitle(item.base, item.title);
              
              return (
                <div 
                  key={item.id} 
                  className="gallery-grid-item glass-panel" 
                  onClick={() => isUnlocked && handleItemClick(item)}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {isUnlocked ? (
                    <>
                      <img 
                        src={resolveAsset(thumbName, 'bgimage')} 
                        alt={item.title} 
                        className="gallery-thumb"
                        style={{
                          filter: shouldBlur ? 'blur(10px) brightness(0.6)' : 'none',
                          transform: shouldBlur ? 'scale(1.1)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      />

                      {/* Bottom title label */}
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '2px 6px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                          fontSize: '10px',
                          color: '#e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          zIndex: 3
                        }}
                      >
                        <span>{formattedTitle}</span>
                        {unlockedVariants.length > 1 && (
                          <span style={{ fontSize: '9px', color: '#c084fc' }}>
                            {unlockedVariants.length}P
                          </span>
                        )}
                      </div>

                      {shouldBlur && (
                        <div 
                          onClick={(e) => toggleReveal(String(item.id), e)}
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
                            background: 'rgba(0, 0, 0, 0.4)',
                            color: '#fda4af',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            zIndex: 4
                          }}
                        >
                          <span>🔞</span>
                          <span>点击揭开</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="gallery-locked">🔒 LOCKED</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* === SCENE REPLAY VIEW === */}
      {viewMode === 'SCENES' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
          {/* Heroine Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center' }}>
            <button
              onClick={() => setHeroineFilter('ALL')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                background: heroineFilter === 'ALL' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                color: heroineFilter === 'ALL' ? '#c084fc' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              全部场景 (All)
            </button>
            <button
              onClick={() => setHeroineFilter('Tsubaki')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                background: heroineFilter === 'Tsubaki' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.06)',
                color: heroineFilter === 'Tsubaki' ? '#f472b6' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              🌸 宇佐美椿姬
            </button>
            <button
              onClick={() => setHeroineFilter('Kanon')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                background: heroineFilter === 'Kanon' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.06)',
                color: heroineFilter === 'Kanon' ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              ❄️ 美轮花音
            </button>
            <button
              onClick={() => setHeroineFilter('Mizuha')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                background: heroineFilter === 'Mizuha' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.06)',
                color: heroineFilter === 'Mizuha' ? '#facc15' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              🍁 白鸟水羽
            </button>
            <button
              onClick={() => setHeroineFilter('Haru')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                background: heroineFilter === 'Haru' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.06)',
                color: heroineFilter === 'Haru' ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              🎻 宇佐美春
            </button>
          </div>

          {/* Scene Cards Grid */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              paddingRight: '6px'
            }}
          >
            {filteredScenes.map((scene) => {
              // Unlocked if player read the scenario or saw any variant of the CG
              const isSceneUnlocked = Boolean(
                (sf.readScenarios && sf.readScenarios[scene.scenario]) ||
                sf[scene.cgBase] === 1 ||
                sf[scene.cgBase.replace(/[a-z]$/, '')] === 1
              );
              const thumbUrl = getSceneThumbnailAsset(scene.cgBase, scene.scenario);
              const isRevealed = revealedThumbs.has(scene.id);

              return (
                <div 
                  key={scene.id}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${scene.color}`,
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    alignItems: 'center'
                  }}
                >
                  {/* Thumbnail with Sensitive Blur (skips true black to first non-black visual) */}
                  <div 
                    onClick={(e) => toggleReveal(scene.id, e)}
                    title={!isRevealed ? "🔞 点击揭开预览" : "点击重新模糊"}
                    style={{
                      width: '110px',
                      height: '75px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#000',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                      cursor: 'pointer'
                    }}
                  >
                    {thumbUrl ? (
                      <img 
                        src={thumbUrl} 
                        alt={scene.titleJp}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: !isRevealed ? 'blur(10px) brightness(0.6)' : 'none',
                          transform: !isRevealed ? 'scale(1.15)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        🎬
                      </div>
                    )}
                    {!isRevealed && (
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
                          background: 'rgba(0,0,0,0.3)',
                          color: '#fda4af',
                          fontSize: '10px',
                          fontWeight: 600
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>🔞</span>
                        <span>点击揭开</span>
                      </div>
                    )}
                  </div>

                  {/* Scene Metadata & Play Button */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span 
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: `${scene.color}22`,
                            color: scene.color,
                            border: `1px solid ${scene.color}44`
                          }}
                        >
                          {language === 'JP' ? scene.heroineNameJp : scene.heroineNameEn}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                          [{scene.scenario}]
                        </span>
                      </div>

                      <h4 style={{ margin: 0, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {language === 'JP' ? scene.titleJp : scene.titleEn}
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {language === 'JP' ? scene.descJp : scene.descEn}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        onClick={() => onPlayScene?.(scene.scenario)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          background: isSceneUnlocked ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
                          color: isSceneUnlocked ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                          cursor: 'pointer',
                          boxShadow: isSceneUnlocked ? '0 2px 8px rgba(236, 72, 153, 0.4)' : 'none'
                        }}
                      >
                        ▶️ {language === 'JP' ? '回顾场景' : 'Replay Scene'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen CG Variant Viewer */}
      {viewingVariants && (
        <div className="cg-viewer-overlay" onClick={handleNextCg}>
          <div 
            className="cg-viewer-img" 
            style={{ 
              backgroundImage: `url(${resolveAsset(viewingVariants[viewingIdx], 'bgimage')})` 
            }} 
          />
          <div className="cg-viewer-counter">
            {viewingIdx + 1} / {viewingVariants.length} — Click to cycle, Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
