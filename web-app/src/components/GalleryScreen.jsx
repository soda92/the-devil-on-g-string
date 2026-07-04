import React, { useState, useEffect } from 'react';
import GALLERY_ITEMS from '../gallery_items.json';

export default function GalleryScreen({ sf, resolveAsset, onBack, setCgViewerUrl }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingVariants, setViewingVariants] = useState(null);
  const [viewingIdx, setViewingIdx] = useState(0);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(GALLERY_ITEMS.length / ITEMS_PER_PAGE);
  
  // Filter items by page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredItems = GALLERY_ITEMS.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      <div className="gallery-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button 
            key={pageNum}
            className={`gallery-tab-btn ${currentPage === pageNum ? 'active' : ''}`}
            onClick={() => setCurrentPage(pageNum)}
            style={{ minWidth: '40px', padding: '6px 12px', margin: '2px' }}
          >
            {pageNum}
          </button>
        ))}
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
