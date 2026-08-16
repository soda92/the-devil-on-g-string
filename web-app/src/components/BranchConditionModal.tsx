import React from 'react';

export interface BranchConditionInfo {
  scenario: string;
  pointer: number;
  condition: string;
  passed: boolean;
  variables: Record<string, any>;
  target?: string | null;
  storage?: string | null;
  description?: string;
}

interface BranchConditionModalProps {
  info: BranchConditionInfo;
  f: Record<string, any>;
  onUpdateF: (newF: Record<string, any>) => void;
  onProceed: () => void;
  onAutoFixAndProceed: () => void;
  onClose: () => void;
  language: 'JP' | 'EN';
}

export default function BranchConditionModal({
  info,
  f,
  onUpdateF,
  onProceed,
  onAutoFixAndProceed,
  onClose,
  language
}: BranchConditionModalProps) {
  const isHaru = info.condition.includes('flag_haru') || info.scenario >= 'g43';
  const isTsubaki = info.condition.includes('flag_tubaki') || info.scenario.startsWith('gt');
  const isKanon = info.condition.includes('flag_kanon') || info.scenario.startsWith('gk');
  const isMizuha = info.condition.includes('flag_mizuha') || info.scenario.startsWith('gm');

  const handleAdjustFlag = (key: string, delta: number) => {
    const currentVal = typeof f[key] === 'number' ? f[key] : 0;
    const nextVal = Math.max(0, currentVal + delta);
    onUpdateF({ ...f, [key]: nextVal });
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 500,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="glass-panel shadow-premium"
        style={{
          width: '500px',
          maxWidth: '95%',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(245, 158, 11, 0.6)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          color: '#fff',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(245, 158, 11, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚖️</span>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fbbf24' }}>
              {language === 'JP' ? '分支条件判定与路线拦截' : 'Branch Condition & Route Interceptor'}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Condition details card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
            <span>{language === 'JP' ? '当前场景' : 'Scenario'}: <strong style={{ color: '#f59e0b' }}>{info.scenario}.ks (Line {info.pointer})</strong></span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold',
              background: info.passed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              color: info.passed ? '#34d399' : '#f87171',
              border: info.passed ? '1px solid #10b981' : '1px solid #ef4444'
            }}>
              {info.passed 
                ? (language === 'JP' ? '✅ 判定通过' : '✅ Condition Met') 
                : (language === 'JP' ? '❌ 判定未通过 (可能进入Bad End/分歧)' : '❌ Condition Failed (Risk of Bad End)')}
            </span>
          </div>

          <div style={{ fontSize: '12px', background: 'rgba(0, 0, 0, 0.5)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'monospace', color: '#38bdf8' }}>
            cond: {info.condition}
          </div>

          {info.description && (
            <div style={{ fontSize: '12px', color: '#d1d5db', lineHeight: 1.5 }}>
              💡 {info.description}
            </div>
          )}
        </div>

        {/* Heroine Point Adjusters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }}>
            🎯 {language === 'JP' ? '女主好感度与关键点数调节 (Point Adjuster)' : 'Heroine Points & Route Flag Adjuster'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Haru */}
            <div style={{
              background: isHaru ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: isHaru ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 'bold' }}>🎻 宇佐美哈尔</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => handleAdjustFlag('flag_haru', -1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{f.flag_haru || 0}</span>
                <button 
                  onClick={() => handleAdjustFlag('flag_haru', 1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Tsubaki */}
            <div style={{
              background: isTsubaki ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: isTsubaki ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#f472b6', fontWeight: 'bold' }}>🌸 美轮椿姬</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => handleAdjustFlag('flag_tubaki', -1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{f.flag_tubaki || 0}</span>
                <button 
                  onClick={() => handleAdjustFlag('flag_tubaki', 1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Kanon */}
            <div style={{
              background: isKanon ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: isKanon ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 'bold' }}>⛸️ 美波花音</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => handleAdjustFlag('flag_kanon', -1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{f.flag_kanon || 0}</span>
                <button 
                  onClick={() => handleAdjustFlag('flag_kanon', 1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Mizuha */}
            <div style={{
              background: isMizuha ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: isMizuha ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#facc15', fontWeight: 'bold' }}>🦢 白鸟水羽</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => handleAdjustFlag('flag_mizuha', -1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{f.flag_mizuha || 0}</span>
                <button 
                  onClick={() => handleAdjustFlag('flag_mizuha', 1)} 
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={onAutoFixAndProceed}
            style={{
              flex: 1.2,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>✨</span>
            <span>{language === 'JP' ? '一键修正并继续 (Fix & Run)' : 'Auto-Fix Flags & Proceed'}</span>
          </button>

          <button
            onClick={onProceed}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {language === 'JP' ? '保持原样继续 (Proceed)' : 'Proceed As-Is'}
          </button>
        </div>
      </div>
    </div>
  );
}
