import React, { useState } from 'react';
import { GameVariables, Language, ChoiceHistoryItem } from '../types/kag';

export interface ChoiceGraphModalProps {
  onClose: () => void;
  f: GameVariables;
  language: Language | string;
  currentScenario?: string | null;
  onJumpToChoice: (choiceItem: ChoiceHistoryItem, choiceIdx: number) => void;
  isSidebar?: boolean;
}

export default function ChoiceGraphModal({ 
  onClose, 
  f, 
  language, 
  currentScenario, 
  onJumpToChoice,
  isSidebar = false
}: ChoiceGraphModalProps) {
  const [confirmChoiceIdx, setConfirmChoiceIdx] = useState<number | null>(null);
  
  const choices: ChoiceHistoryItem[] = f.choicesHistory || [];
  
  // G-String heroine route flags mapping
  const routes = [
    { nameJp: "美轮椿姬", nameEn: "Tsubaki", val: (f.flag_tubaki as number) || 0, max: 4, color: "#ec4899" },
    { nameJp: "美波花音", nameEn: "Kanon", val: (f.flag_kanon as number) || 0, max: 3, color: "#3b82f6" },
    { nameJp: "白鸟水羽", nameEn: "Mizuha", val: (f.flag_mizuha as number) || 0, max: 2, color: "#eab308" },
    { nameJp: "宇佐美哈尔", nameEn: "Haru", val: (f.flag_haru as number) || 0, max: 3, color: "#8b5cf6" }
  ];

  const getActiveRoute = (): string | null => {
    if (!currentScenario) return null;
    const scen = currentScenario.toLowerCase();
    if (scen.startsWith('gt') || scen.startsWith('gth') || scen === 'gted') return 'Tsubaki';
    if (scen.startsWith('gk') || scen.startsWith('gkh') || scen === 'gked') return 'Kanon';
    if (scen.startsWith('gm') || scen.startsWith('gmh') || scen === 'gmed') return 'Mizuha';
    if (f.tubaki_clear) return 'Tsubaki';
    if (f.kanon_clear) return 'Kanon';
    if (f.mizuha_clear) return 'Mizuha';
    if (scen.startsWith('g')) {
      const numPart = scen.substring(1);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num >= 43 && num <= 55) return 'Haru';
    }
    if (f.game_clear) return 'Haru';
    return null;
  };

  const innerContent = (
    <div 
      className={`glass-panel ${isSidebar ? 'choice-graph-sidebar shadow-premium' : 'choice-graph-modal'}`}
      style={isSidebar ? {
        position: 'relative',
        width: '380px',
        height: '600px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59, 130, 246, 0.45)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box',
        color: '#e2e8f0'
      } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', paddingBottom: '8px', width: '100%', flexShrink: 0 }}>
        <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🌿 {language === 'JP' ? '路线图谱' : 'Route & Choice Graph'}
        </span>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
          title="Close Flowchart"
        >
          ✕
        </button>
      </div>
        <style>{`
          .choice-graph-modal {
            width: 90%;
            max-width: 750px;
            max-height: 85%;
            padding: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: auto;
          }
          .route-meter-section {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
            box-sizing: border-box;
          }
          .route-meter-title {
            font-size: 14px;
            color: var(--color-text-muted);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
          }
          .route-bars-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .route-bar-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 10px 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid transparent;
            transition: all 0.3s ease;
          }
          .route-bar-card.active {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.04);
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
            animation: pulse-border 2s infinite ease-in-out;
          }
          .route-bar-card.bypassed {
            opacity: 0.35;
            filter: grayscale(70%);
          }
          .route-badge {
            position: absolute;
            top: -12px;
            font-size: 8px;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
          }
          .route-badge.active-badge {
            background: #f59e0b;
            color: #000;
          }
          .route-badge.bypassed-badge {
            background: #475569;
            color: #cbd5e1;
          }
          @keyframes pulse-border {
            0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
            50% { box-shadow: 0 0 16px rgba(245, 158, 11, 0.35); }
            100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
          }
          .route-bar-track {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
          }
          .route-bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
          .route-bar-value {
            font-size: 11px;
            color: var(--color-text-muted);
            margin-top: 4px;
          }
          .timeline-container {
            width: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          .timeline-scroll {
            width: 100%;
            max-height: 280px;
            overflow-y: auto;
            padding: 10px 5px;
            box-sizing: border-box;
          }
          .timeline-empty {
            text-align: center;
            color: var(--color-text-muted);
            padding: 40px 0;
            font-size: 14px;
          }
          .timeline-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            position: relative;
          }
          .timeline-card {
            width: 85%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 12px 18px;
            box-sizing: border-box;
            transition: transform 0.2s ease, border-color 0.2s ease;
            cursor: pointer;
            text-align: left;
          }
          .timeline-card:hover {
            transform: translateY(-2px);
            border-color: var(--color-primary);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
          }
          .node-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
            padding-bottom: 4px;
          }
          .node-title {
            font-size: 12px;
            color: var(--color-primary);
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .node-scene {
            font-size: 11px;
            color: var(--color-text-muted);
          }
          .option-row {
            font-size: 13px;
            padding: 4px 6px;
            margin: 2px 0;
            border-radius: 4px;
            color: var(--color-text-muted);
          }
          .option-row.selected {
            background: rgba(139, 92, 246, 0.15);
            border: 1px solid rgba(139, 92, 246, 0.3);
            color: var(--color-text-bright);
            font-weight: bold;
          }
          .timeline-arrow {
            font-size: 18px;
            color: var(--color-text-muted);
            margin: 8px 0;
            opacity: 0.5;
          }
          .graph-confirm-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 12px;
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .graph-confirm-dialog {
            background: #0f0a1d;
            border: 1px solid var(--color-border);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            width: 80%;
            max-width: 400px;
          }
        `}</style>
        
        <h2 className="screen-title">{language === 'JP' ? '路线进度与选择历史' : 'Route Flowchart / Choices'}</h2>

        {/* --- Route Affection Bars Section --- */}
        <div className="route-meter-section">
          <div className="route-meter-title">
            {language === 'JP' ? '女主角路线进度' : 'Heroine Route Status'}
          </div>
          <div className="route-bars-grid">
            {routes.map((r, i) => {
              const activeRoute = getActiveRoute();
              const isThisActive = activeRoute === r.nameEn;
              const isOthersActive = activeRoute !== null && activeRoute !== r.nameEn;
              
              let cardClass = "route-bar-card";
              if (isThisActive) cardClass += " active";
              if (isOthersActive) cardClass += " bypassed";
              
              return (
                <div key={i} className={cardClass}>
                  {isThisActive && (
                    <span className="route-badge active-badge">
                      {language === 'JP' ? '💖 选中' : '💖 Active'}
                    </span>
                  )}
                  {isOthersActive && (
                    <span className="route-badge bypassed-badge">
                      {language === 'JP' ? '🔒 关闭' : '🔒 Bypassed'}
                    </span>
                  )}
                  <span className="route-bar-label">{language === 'JP' ? r.nameJp : r.nameEn}</span>
                  <div className="route-bar-track">
                    <div 
                      className="route-bar-fill" 
                      style={{ 
                        width: `${(r.val / r.max) * 100}%`,
                        backgroundColor: isOthersActive ? '#475569' : r.color 
                      }} 
                    />
                  </div>
                  <span className="route-bar-value">{r.val} / {r.max}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Choice Timeline Section --- */}
        <div className="timeline-container">
          <div className="timeline-scroll">
            {choices.length > 0 ? (
              choices.map((node, idx) => {
                return (
                  <div key={idx} className="timeline-node">
                    <div 
                      className="timeline-card glass-panel"
                      onClick={() => setConfirmChoiceIdx(idx)}
                      title={language === 'JP' ? '回退到此选项节点' : 'Jump back to this choice point'}
                    >
                      <div className="node-header">
                        <span className="node-title">Choice #{idx + 1}</span>
                        <span className="node-scene">{node.scenario} (ptr {node.pointer})</span>
                      </div>
                      <div className="node-options">
                        {node.options.map((opt, oIdx) => {
                          const isSelected = opt.jp === node.selectedOption.jp && opt.target === node.selectedOption.target;
                          const optText = language === 'JP' ? opt.jp : opt.en;
                          return (
                            <div key={oIdx} className={`option-row ${isSelected ? 'selected' : ''}`}>
                              {isSelected ? '✓ ' : '• '} {optText}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {idx < choices.length - 1 && (
                      <div className="timeline-arrow">↓</div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="timeline-empty">
                {language === 'JP' ? '当前时间线暂无选择历史。继续进行游戏吧！' : 'No choices made in this timeline yet.'}
              </div>
            )}
          </div>
        </div>

      {!isSidebar && (
        <button className="modal-close-btn" onClick={onClose}>
          {language === 'JP' ? '关闭' : 'Close'}
        </button>
      )}

      {/* --- Jump Confirmation Box Overlay --- */}
      {confirmChoiceIdx !== null && (
        <div className="graph-confirm-overlay" onClick={() => setConfirmChoiceIdx(null)}>
          <div className="graph-confirm-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', color: '#fff' }}>
              {language === 'JP' ? '确认要回退到该选项节点吗？' : 'Jump back to this choice?'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {language === 'JP' ? '回退后，此节点之后的全部游戏进度和选择历史都将被重置。' : 'All progress and choices made after this point will be lost.'}
            </p>
            <div className="backlog-confirm-buttons">
              <button className="confirm-btn yes-btn" onClick={() => {
                onJumpToChoice(choices[confirmChoiceIdx], confirmChoiceIdx);
                setConfirmChoiceIdx(null);
                onClose();
              }}>
                {language === 'JP' ? '是' : 'Yes'}
              </button>
              <button className="confirm-btn no-btn" onClick={() => setConfirmChoiceIdx(null)}>
                {language === 'JP' ? '否' : 'No'}
              </button>
            </div>
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
