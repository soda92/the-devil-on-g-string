import React, { useState } from 'react';
import scenarioNames from '../scenario_names.json';

export default function DebugPanel({ 
  currentScenario, 
  pointer, 
  scenarioData, 
  f, 
  sf, 
  setF, 
  setSf, 
  loadScenario, 
  sprites, 
  background,
  dialogueMode,
  speaker
}) {
  const [showButton, setShowButton] = useState(() => {
    return localStorage.getItem('school_debug_button_visible') === 'true';
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(currentScenario);
  const [targetPointer, setTargetPointer] = useState(pointer);
  const [customVarName, setCustomVarName] = useState('');
  const [customVarValue, setCustomVarValue] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowButton(prev => {
          const next = !prev;
          localStorage.setItem('school_debug_button_visible', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJump = () => {
    loadScenario(selectedScenario, null, parseInt(targetPointer) || 0);
  };

  const handleSetVar = () => {
    if (!customVarName) return;
    const val = isNaN(customVarValue) ? customVarValue : parseInt(customVarValue);
    if (customVarName.startsWith('sf.')) {
      const name = customVarName.replace('sf.', '');
      setSf(prev => ({ ...prev, [name]: val }));
    } else {
      const name = customVarName.replace('f.', '');
      setF(prev => ({ ...prev, [name]: val }));
    }
  };

  if (!showButton && !isOpen) {
    return null;
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 100000,
          background: 'rgba(255, 68, 68, 0.95)',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '11px',
          letterSpacing: '1px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          fontFamily: 'monospace'
        }}
      >
        🛠️ DEBUG
      </button>
    );
  }

  return (
    <div 
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '320px',
        maxHeight: '580px',
        overflowY: 'auto',
        zIndex: 100000,
        background: 'rgba(20, 20, 20, 0.96)',
        border: '2px solid #ff4444',
        borderRadius: '8px',
        padding: '15px',
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 5px 25px rgba(0,0,0,0.8)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #ff4444', paddingBottom: '5px' }}>
        <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '13px' }}>🛠️ Scenario & State Debugger</span>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
      </div>

      {/* Jump section */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '12px' }}>1. Jump to Scenario</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(e.target.value)}
            style={{ width: '100%', background: '#333', color: '#fff', border: '1px solid #555', padding: '4px' }}
          >
            {scenarioNames.map(name => (
              <option key={name} value={name}>{name}.ks</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>Ptr:</span>
            <input 
              type="number" 
              value={targetPointer} 
              onChange={(e) => setTargetPointer(e.target.value)}
              style={{ width: '60px', background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px' }}
            />
            <button 
              onClick={handleJump} 
              style={{ flex: 1, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              JUMP
            </button>
          </div>
        </div>
      </div>

      {/* Current States */}
      <div style={{ marginBottom: '15px', background: '#111', padding: '8px', borderRadius: '4px', lineHeight: '1.4' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#fff', borderBottom: '1px solid #333', fontSize: '11px' }}>2. Active Runner State</h4>
        <div><strong>Scenario:</strong> {currentScenario}.ks</div>
        <div><strong>Pointer:</strong> {pointer} / {scenarioData ? scenarioData.length : 0}</div>
        <div><strong>Speaker:</strong> "{speaker}"</div>
        <div><strong>Layout:</strong> {dialogueMode.toUpperCase()}</div>
        <div><strong>Background:</strong> "{background}"</div>
        <div><strong>Sprites:</strong> {JSON.stringify(sprites)}</div>
      </div>

      {/* Variable Inspector/Mutator */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '12px' }}>3. Variables (f and sf)</h4>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          <input 
            placeholder="f.flag_haru" 
            value={customVarName} 
            onChange={(e) => setCustomVarName(e.target.value)}
            style={{ flex: 2, background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px' }}
          />
          <input 
            placeholder="Val" 
            value={customVarValue} 
            onChange={(e) => setCustomVarValue(e.target.value)}
            style={{ flex: 1, width: '40px', background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px' }}
          />
          <button onClick={handleSetVar} style={{ background: '#555', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '2px 8px' }}>SET</button>
        </div>
        <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px' }}>
          <div style={{ color: '#44ff44' }}><strong>Local variables (f):</strong></div>
          {Object.entries(f).filter(([k]) => k !== 'choicesHistory').map(([k, v]) => (
            <div key={k}>{k}: {JSON.stringify(v)}</div>
          ))}
          <div style={{ color: '#44bbff', marginTop: '5px' }}><strong>System variables (sf):</strong></div>
          {Object.entries(sf).map(([k, v]) => (
            <div key={k}>{k}: {JSON.stringify(v)}</div>
          ))}
        </div>
      </div>

      {/* Instruction History */}
      <div>
        <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '12px' }}>4. Runner History</h4>
        <div style={{ maxHeight: '110px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {scenarioData && scenarioData.slice(Math.max(0, pointer - 4), pointer + 4).map((inst, idx) => {
            const absoluteIdx = Math.max(0, pointer - 4) + idx;
            const isCurrent = absoluteIdx === pointer;
            return (
              <div key={idx} style={{ color: isCurrent ? '#fff' : '#777', background: isCurrent ? '#333' : 'transparent', padding: '2px 0' }}>
                {isCurrent ? '➔' : ' '} [{absoluteIdx}] {inst.type.toUpperCase()}: {inst.type === 'command' ? inst.name : (inst.type === 'text' ? inst.text_jp.slice(0, 15) : '')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
