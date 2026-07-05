import React, { useState } from 'react';
import scenarioNames from '../scenario_names.json';
import { resolveAsset } from '../utils/gameUtils';

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
  speaker,
  bgmPlayer,
  onClose
}) {
  const [selectedScenario, setSelectedScenario] = useState(currentScenario);
  const [targetPointer, setTargetPointer] = useState(pointer);
  const [customVarName, setCustomVarName] = useState('');
  const [customVarValue, setCustomVarValue] = useState('');
  const [bgmState, setBgmState] = useState({ src: 'None', paused: true, volume: 1, muted: false });

  React.useEffect(() => {
    if (!bgmPlayer) return;
    const updateStatus = () => {
      setBgmState({
        src: bgmPlayer.src ? bgmPlayer.src.split('/').pop().replace(/\.[^/.]+$/, "") : 'None',
        paused: bgmPlayer.paused,
        volume: bgmPlayer.volume,
        muted: bgmPlayer.muted
      });
    };
    updateStatus();

    bgmPlayer.addEventListener('play', updateStatus);
    bgmPlayer.addEventListener('pause', updateStatus);
    bgmPlayer.addEventListener('volumechange', updateStatus);
    
    return () => {
      bgmPlayer.removeEventListener('play', updateStatus);
      bgmPlayer.removeEventListener('pause', updateStatus);
      bgmPlayer.removeEventListener('volumechange', updateStatus);
    };
  }, [bgmPlayer]);

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

  return (
    <div 
      style={{
        position: 'relative',
        width: '320px',
        height: '600px',
        zIndex: 100000,
        background: 'rgba(20, 20, 20, 0.96)',
        border: '2px solid #ff4444',
        borderRadius: '12px',
        padding: '15px',
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 5px 25px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #ff4444', paddingBottom: '5px', flexShrink: 0 }}>
        <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '13px' }}>🛠️ Side Debugger</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
      </div>

      {/* Scrollable Contents */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '2px' }}>
        {/* Jump section */}
        <div>
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
        <div style={{ background: '#111', padding: '8px', borderRadius: '4px', lineHeight: '1.4' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#fff', borderBottom: '1px solid #333', fontSize: '11px' }}>2. Active Runner State</h4>
          <div><strong>Scenario:</strong> {currentScenario}.ks</div>
          <div><strong>Pointer:</strong> {pointer} / {scenarioData ? scenarioData.length : 0}</div>
          <div><strong>Speaker:</strong> "{speaker}"</div>
          <div><strong>Layout:</strong> {dialogueMode.toUpperCase()}</div>
          <div><strong>Background:</strong> "{background}"</div>
          <div><strong>Sprites:</strong> {JSON.stringify(sprites)}</div>
        </div>

        {/* Audio Status & Controls */}
        <div style={{ background: '#111', padding: '8px', borderRadius: '4px', lineHeight: '1.4' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#fff', borderBottom: '1px solid #333', fontSize: '11px' }}>2b. Audio Player Status</h4>
          <div><strong>BGM Track:</strong> "{bgmState.src}"</div>
          <div><strong>BGM State:</strong> {bgmState.paused ? '⏸️ PAUSED' : '▶️ PLAYING'}</div>
          <div><strong>BGM Vol  :</strong> {(bgmState.volume * 100).toFixed(0)}% {bgmState.muted ? '(MUTED)' : ''}</div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
            <button 
              onClick={() => {
                if (bgmPlayer) {
                  if (bgmPlayer.paused) {
                    bgmPlayer.play().catch(err => console.log(err));
                  } else {
                    bgmPlayer.pause();
                  }
                }
              }}
              style={{
                flex: 1,
                background: bgmState.paused ? '#ffcc00' : '#44bbff',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                padding: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            >
              {bgmState.paused ? '▶️ PLAY' : '⏸️ PAUSE'}
            </button>
            <button 
              onClick={() => {
                if (bgmPlayer) {
                  bgmPlayer.muted = !bgmPlayer.muted;
                }
              }}
              style={{
                flex: 1,
                background: bgmState.muted ? '#ff4444' : '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            >
              {bgmState.muted ? '🔊 UNMUTE' : '🔇 MUTE'}
            </button>
          </div>
        </div>

        {/* Variable Inspector/Mutator */}
        <div>
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
    </div>
  );
}
