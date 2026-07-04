import React, { useState, useEffect } from 'react';

const GALLERY_ITEMS = [
  // Page 1 (12 items)
  { id: 0, title: "CG 1", base: "ev_00", variants: ["ev_00"] },
  { id: 1, title: "CG 2", base: "ev_01", variants: ["ev_01_a", "ev_01_b", "ev_01_c"] },
  { id: 2, title: "CG 3", base: "ev_02", variants: ["ev_02", "ev_022"] },
  { id: 3, title: "CG 4", base: "ev_03", variants: ["ev_03"] },
  { id: 4, title: "CG 5", base: "ev_04", variants: ["ev_04_a", "ev_04_b", "ev_04_c"] },
  { id: 5, title: "CG 6", base: "ev_05", variants: ["ev_05"] },
  { id: 6, title: "CG 7", base: "ev_06", variants: ["ev_06_a", "ev_06_b", "ev_06_c", "ev_06_d", "ev_06_e"] },
  { id: 7, title: "CG 8", base: "ev_07", variants: ["ev_07_a", "ev_07_b"] },
  { id: 8, title: "CG 9", base: "ev_08", variants: ["ev_08_a", "ev_08_b", "ev_08_c", "ev_08_d"] },
  { id: 9, title: "CG 10", base: "ev_09", variants: ["ev_09_a", "ev_09_b", "ev_09_c", "ev_09_d"] },
  { id: 10, title: "CG 11", base: "ev_10", variants: ["ev_10_a", "ev_10_b", "ev_10_c", "ev_10_d", "ev_10_e", "ev_10_f"] },
  { id: 11, title: "CG 12", base: "ev_26", variants: ["ev_26_a", "ev_26_b", "ev_26_c"] },

  // Page 2 (12 items)
  { id: 12, title: "CG 13", base: "ev_27", variants: ["ev_27_a", "ev_27_b", "ev_27_c"] },
  { id: 13, title: "CG 14", base: "ev_11", variants: ["ev_11_a", "ev_11_b", "ev_11_c", "ev_11_d", "ev_11_e", "ev_11_f"] },
  { id: 14, title: "CG 15", base: "ev_12", variants: ["ev_12_a", "ev_12_b", "ev_12_c"] },
  { id: 15, title: "CG 16", base: "ev_29", variants: ["ev_29_a", "ev_29_b", "ev_29_c", "ev_29_d", "ev_29_e"] },
  { id: 16, title: "CG 17", base: "ev_13", variants: ["ev_13_a", "ev_13_b", "ev_13_c", "ev_13_d"] },
  { id: 17, title: "CG 18", base: "ev_28", variants: ["ev_28_a", "ev_28_b", "ev_28_c"] },
  { id: 18, title: "CG 19", base: "ev_14", variants: ["ev_14_a", "ev_14_b", "ev_14_c", "ev_14_d"] },
  { id: 19, title: "CG 20", base: "ev_15", variants: ["ev_15_a", "ev_15_b", "ev_15_c", "ev_15_ｃ", "ev_15_d", "ev_15_e"] },
  { id: 20, title: "CG 21", base: "ev_16", variants: ["ev_16", "ev_25"] },
  { id: 21, title: "CG 22", base: "ev_17", variants: ["ev_17_a", "ev_17_b", "ev_21_b"] },
  { id: 22, title: "CG 23", base: "ev_18", variants: ["ev_18_a", "ev_18_b"] },
  { id: 23, title: "CG 24", base: "ev_19", variants: ["ev_19_a", "ev_24"] },

  // Page 3 (1 item)
  { id: 24, title: "CG 25", base: "ev_20", variants: ["ev_20_a", "ev_20_b", "ev_22"] }
];

export default function GalleryScreen({ sf, resolveAsset, onBack, setCgViewerUrl }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingVariants, setViewingVariants] = useState(null);
  const [viewingIdx, setViewingIdx] = useState(0);

  // Filter items by page
  const filteredItems = GALLERY_ITEMS.filter((_, idx) => {
    if (currentPage === 1) return idx < 12;
    if (currentPage === 2) return idx >= 12 && idx < 24;
    return idx === 24;
  });

  const handleItemClick = (item) => {
    const unlocked = item.variants.filter(v => sf[v] === 1);
    if (unlocked.length > 0) {
      setViewingVariants(unlocked);
      setViewingIdx(0);
    }
  };

  const handleNextCg = () => {
    if (viewingIdx < viewingVariants.length - 1) {
      setViewingIdx(prev => prev + 1);
    } else {
      setViewingVariants(null);
    }
  };

  // Keyboard controls for CG Viewer
  useEffect(() => {
    if (!viewingVariants) return;
    const handleKeyDown = (e) => {
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
  }, [viewingVariants, viewingIdx]);

  return (
    <div className="gallery-layer glass-panel">
      <style>{`
        .gallery-tabs {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .gallery-tab-btn {
          background: var(--color-glass-light);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          padding: 8px 20px;
          border-radius: 6px;
          font-size: 14px;
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

      <h2 className="screen-title">CG GALLERY</h2>

      <div className="gallery-tabs">
        <button 
          className={`gallery-tab-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => setCurrentPage(1)}
        >
          Page 1
        </button>
        <button 
          className={`gallery-tab-btn ${currentPage === 2 ? 'active' : ''}`}
          onClick={() => setCurrentPage(2)}
        >
          Page 2
        </button>
        <button 
          className={`gallery-tab-btn ${currentPage === 3 ? 'active' : ''}`}
          onClick={() => setCurrentPage(3)}
        >
          Page 3
        </button>
      </div>
      
      <div className="gallery-grid-container">
        {filteredItems.map((item) => {
          const unlockedVariants = item.variants.filter(v => sf[v] === 1);
          const isUnlocked = unlockedVariants.length > 0;
          const thumbName = isUnlocked ? unlockedVariants[0] : null;
          
          return (
            <div 
              key={item.id} 
              className="gallery-grid-item glass-panel" 
              onClick={() => isUnlocked && handleItemClick(item)}
            >
              {isUnlocked ? (
                <img 
                  src={resolveAsset(thumbName, 'bgimage')} 
                  alt={item.title} 
                  className="gallery-thumb" 
                />
              ) : (
                <div className="gallery-locked">🔒 LOCKED</div>
              )}
            </div>
          );
        })}
      </div>
      
      <button className="back-btn glass-panel" onClick={onBack}>Back to Title</button>

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
