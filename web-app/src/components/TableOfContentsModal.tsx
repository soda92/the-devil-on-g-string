import React, { useState } from 'react';
import { SCENARIO_INDEX, RouteType } from '../data/scenarioIndex';

interface TableOfContentsModalProps {
  onClose: () => void;
  onSelectTopic: (scenId: string, startPtr: number, presets?: Record<string, any>) => void;
  currentScenario: string | null;
  language: 'JP' | 'EN';
}

type TabFilter = 'ALL' | RouteType;

export default function TableOfContentsModal({ 
  onClose, 
  onSelectTopic, 
  currentScenario, 
  language 
}: TableOfContentsModalProps) {
  const [selectedRoute, setSelectedRoute] = useState<TabFilter>('ALL');

  const routes: { id: TabFilter; labelJp: string; labelEn: string }[] = [
    { id: 'ALL', labelJp: '全部章节', labelEn: 'All Chapters' },
    { id: 'Main', labelJp: '主线 / 共通', labelEn: 'Main Common' },
    { id: 'Tsubaki', labelJp: '美轮椿姬篇', labelEn: 'Tsubaki Route' },
    { id: 'Kanon', labelJp: '美波花音篇', labelEn: 'Kanon Route' },
    { id: 'Mizuha', labelJp: '白鸟水羽篇', labelEn: 'Mizuha Route' },
    { id: 'Haru', labelJp: '宇佐美哈尔篇', labelEn: 'Haru Route' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="toc-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <style>{`
          .toc-modal {
            width: 90%;
            max-width: 820px;
            max-height: 85vh;
            padding: 25px 30px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            color: #fff;
          }
          .toc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .toc-title {
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #f59e0b;
            letter-spacing: 0.5px;
          }
          .toc-route-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }
          .toc-tab-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #d1d5db;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .toc-tab-btn:hover {
            background: rgba(245, 158, 11, 0.15);
            border-color: #f59e0b;
            color: #fff;
          }
          .toc-tab-btn.active {
            background: #f59e0b;
            color: #000;
            font-weight: 600;
            border-color: #f59e0b;
          }
          .toc-chapter-block {
            margin-bottom: 25px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 10px;
            padding: 16px 20px;
          }
          .toc-chapter-title {
            font-size: 16px;
            font-weight: 600;
            color: #e5e7eb;
            margin-bottom: 6px;
          }
          .toc-chapter-desc {
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 14px;
          }
          .toc-scenarios-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap: 12px;
          }
          .toc-scenario-card {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .toc-scenario-card:hover {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
            transform: translateY(-2px);
          }
          .toc-scenario-card.current {
            border-color: #3b82f6;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          }
          .toc-scen-name {
            font-size: 14px;
            font-weight: 600;
            color: #f3f4f6;
          }
          .toc-scen-meta {
            font-size: 11px;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
          }
          .toc-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          .badge-main { background: rgba(107, 114, 128, 0.3); color: #d1d5db; }
          .badge-tsubaki { background: rgba(236, 72, 153, 0.25); color: #f472b6; }
          .badge-kanon { background: rgba(59, 130, 246, 0.25); color: #60a5fa; }
          .badge-mizuha { background: rgba(234, 179, 8, 0.25); color: #facc15; }
          .badge-haru { background: rgba(139, 92, 246, 0.25); color: #c084fc; }
        `}</style>

        <div className="toc-header">
          <div className="toc-title">
            <span>📖</span>
            <span>{language === 'JP' ? '章节与主题目录 (Table of Contents)' : 'Table of Contents & Scene Index'}</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="toc-route-tabs">
          {routes.map(r => (
            <button
              key={r.id}
              className={`toc-tab-btn ${selectedRoute === r.id ? 'active' : ''}`}
              onClick={() => setSelectedRoute(r.id)}
            >
              {language === 'JP' ? r.labelJp : r.labelEn}
            </button>
          ))}
        </div>

        <div className="toc-content">
          {SCENARIO_INDEX.map(ch => {
            const matchingScenarios = ch.scenarios.filter(scen => 
              selectedRoute === 'ALL' || scen.route === selectedRoute
            );
            if (matchingScenarios.length === 0) return null;

            return (
              <div key={ch.chapterId} className="toc-chapter-block">
                <div className="toc-chapter-title">
                  {language === 'JP' ? ch.titleJp : ch.titleEn}
                </div>
                <div className="toc-chapter-desc">{ch.description}</div>
                <div className="toc-scenarios-grid">
                  {matchingScenarios.map(scen => (
                    <div
                      key={scen.id}
                      className={`toc-scenario-card ${currentScenario === scen.id ? 'current' : ''}`}
                      onClick={() => onSelectTopic(scen.id, scen.startPtr, scen.presets)}
                    >
                      <div className="toc-scen-name">{scen.title}</div>
                      <div className="toc-scen-meta">
                        <span>{scen.id}.ks (ptr {scen.startPtr})</span>
                        <span className={`toc-badge badge-${scen.route.toLowerCase()}`}>{scen.route}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
