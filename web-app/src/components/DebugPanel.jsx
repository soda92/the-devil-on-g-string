import React, { useState, useEffect, useRef } from 'react';
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
  playVoice,
  onClose
}) {
  // Remember the active tab in localStorage across panel opens/closes
  const [tab, setTab] = useState(() => {
    return localStorage.getItem('debug_panel_active_tab') || 'debug';
  });
  
  const [selectedScenario, setSelectedScenario] = useState(currentScenario);
  const [targetPointer, setTargetPointer] = useState(pointer);
  const [customVarName, setCustomVarName] = useState('');
  const [customVarValue, setCustomVarValue] = useState('');
  const [bgmState, setBgmState] = useState({ src: 'None', paused: true, volume: 1, muted: false });
  const [searchQuery, setSearchQuery] = useState('');

  const activeCardRef = useRef(null);

  // Update selectedScenario and targetPointer when props change
  useEffect(() => {
    setSelectedScenario(currentScenario);
  }, [currentScenario]);

  useEffect(() => {
    setTargetPointer(pointer);
  }, [pointer]);

  // Clear search query when the scenario changes to ensure dialogues are visible
  useEffect(() => {
    setSearchQuery('');
  }, [currentScenario]);

  // Auto-scroll active dialogue into view. Includes scenarioData in dependency array
  // to ensure centering happens once the async scenario load finishes.
  useEffect(() => {
    if (tab === 'dialogues' && activeCardRef.current) {
      const timer = setTimeout(() => {
        activeCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [tab, pointer, scenarioData]);

  useEffect(() => {
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

  const handleTabChange = (newTab) => {
    setTab(newTab);
    localStorage.setItem('debug_panel_active_tab', newTab);
  };

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

  // Helper to extract dialogues and associated audio/BGM from scenario instructions
  const getDialogues = () => {
    if (!scenarioData) return [];
    const list = [];
    let currentSpeaker = '';
    let currentVoice = '';
    let currentBgm = '';
    for (let idx = 0; idx < scenarioData.length; idx++) {
      const inst = scenarioData[idx];
      if (inst.type === 'command') {
        if (inst.name === 'nm' || inst.name === 'name') {
          currentSpeaker = inst.args?.t || inst.args?.txt || '';
          currentVoice = inst.args?.s || '';
        } else if (inst.name === 'playbgm' || inst.name === 'bgm' || inst.name === 'fadeinbgm' || inst.name === 'fibgm' || inst.name === 'xbgm') {
          currentBgm = inst.args?.storage || '';
        } else if (inst.name === 'stbgm' || inst.name === 'stopbgm' || inst.name === 'fadeoutbgm' || inst.name === 'fobgm' || inst.name === 'sbgm') {
          currentBgm = '';
        }
      } else if (inst.type === 'page_break' || inst.type === 'clear_text') {
        currentSpeaker = '';
        currentVoice = '';
      } else if (inst.type === 'text') {
        list.push({
          ptr: idx,
          speaker: currentSpeaker,
          voice: currentVoice,
          bgm: currentBgm,
          text_jp: inst.text_jp || '',
          text_en: inst.text_en || ''
        });
        currentVoice = ''; // Voice plays once per text dialogue block
      }
    }
    return list;
  };

  const dialogues = getDialogues();
  const filteredDialogues = dialogues.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.text_jp.toLowerCase().includes(q) || 
           d.text_en.toLowerCase().includes(q) || 
           d.speaker.toLowerCase().includes(q) ||
           String(d.ptr).includes(q);
  });

  return (
    <div 
      className="debug-panel shadow-premium"
      style={{
        position: 'relative',
        width: '360px',
        height: '600px',
        zIndex: 100000,
        background: 'rgba(20, 20, 20, 0.96)',
        border: '2px solid #ff4444',
        borderRadius: '12px',
        padding: '15px',
        color: '#ccc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 68, 68, 0.3)', paddingBottom: '8px', flexShrink: 0 }}>
        <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🛠️ Engine Debugger
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '20px', padding: '0 5px' }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexShrink: 0 }}>
        <button 
          onClick={() => handleTabChange('debug')} 
          style={{
            flex: 1,
            background: tab === 'debug' ? '#ff4444' : '#222',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px',
            transition: 'background 0.2s'
          }}
        >
          Runner & Vars
        </button>
        <button 
          onClick={() => handleTabChange('dialogues')} 
          style={{
            flex: 1,
            background: tab === 'dialogues' ? '#ff4444' : '#222',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px',
            transition: 'background 0.2s'
          }}
        >
          Dialog Inspector
        </button>
      </div>

      {/* Tab Contents */}
      {tab === 'debug' ? (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '2px' }}>
          {/* Jump section */}
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '12px' }}>1. Jump to Scenario</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <select 
                value={selectedScenario} 
                onChange={(e) => setSelectedScenario(e.target.value)}
                style={{ width: '100%', background: '#333', color: '#fff', border: '1px solid #555', padding: '4px', borderRadius: '4px' }}
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
                  style={{ width: '60px', background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px', borderRadius: '4px' }}
                />
                <button 
                  onClick={handleJump} 
                  style={{ flex: 1, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  JUMP
                </button>
              </div>
            </div>
          </div>

          {/* Current States */}
          <div style={{ background: '#111', padding: '8px', borderRadius: '4px', lineHeight: '1.4', border: '1px solid #222' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#fff', borderBottom: '1px solid #333', fontSize: '11px', paddingBottom: '2px' }}>2. Active Runner State</h4>
            <div><strong>Scenario:</strong> {currentScenario}.ks</div>
            <div><strong>Pointer:</strong> {pointer} / {scenarioData ? scenarioData.length : 0}</div>
            <div><strong>Speaker:</strong> "{speaker}"</div>
            <div><strong>Layout:</strong> {dialogueMode.toUpperCase()}</div>
            <div><strong>Background:</strong> "{background}"</div>
            <div><strong>Sprites:</strong> {JSON.stringify(sprites)}</div>
          </div>

          {/* Audio Status & Controls */}
          <div style={{ background: '#111', padding: '8px', borderRadius: '4px', lineHeight: '1.4', border: '1px solid #222' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#fff', borderBottom: '1px solid #333', fontSize: '11px', paddingBottom: '2px' }}>2b. Audio Player Status</h4>
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
                  borderRadius: '4px',
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
                  borderRadius: '4px',
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
                style={{ flex: 2, background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px', borderRadius: '4px' }}
              />
              <input 
                placeholder="Val" 
                value={customVarValue} 
                onChange={(e) => setCustomVarValue(e.target.value)}
                style={{ flex: 1, width: '40px', background: '#333', color: '#fff', border: '1px solid #555', padding: '2px 5px', borderRadius: '4px' }}
              />
              <button onClick={handleSetVar} style={{ background: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>SET</button>
            </div>
            <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px', border: '1px solid #222' }}>
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
            <div style={{ maxHeight: '110px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid #222' }}>
              {scenarioData && scenarioData.slice(Math.max(0, pointer - 4), pointer + 4).map((inst, idx) => {
                const absoluteIdx = Math.max(0, pointer - 4) + idx;
                const isCurrent = absoluteIdx === pointer;
                return (
                  <div key={idx} style={{ color: isCurrent ? '#fff' : '#777', background: isCurrent ? '#333' : 'transparent', padding: '2px 0', fontFamily: 'monospace' }}>
                    {isCurrent ? '➔' : ' '} [{absoluteIdx}] {inst.type.toUpperCase()}: {inst.type === 'command' ? inst.name : (inst.type === 'text' ? inst.text_jp.slice(0, 15) : '')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search box & Sync button */}
          <div style={{ marginBottom: '10px', flexShrink: 0, display: 'flex', gap: '5px' }}>
            <input 
              type="text" 
              placeholder="Search dialogues, speakers, pointers..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: '#222', 
                color: '#fff', 
                border: '1px solid #444', 
                borderRadius: '4px', 
                padding: '6px 8px', 
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'sans-serif'
              }}
            />
            <button 
              onClick={() => {
                setSearchQuery(''); // Clear search so the active card is always visible
                setTimeout(() => {
                  activeCardRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }, 50);
              }}
              style={{
                background: '#444',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                padding: '0 8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              title="Sync to current line"
            >
              🎯 Sync
            </button>
          </div>

          {/* Dialog list container */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {filteredDialogues.length > 0 ? (
              filteredDialogues.map((d) => {
                const isCurrent = d.ptr === pointer;
                return (
                  <div 
                    key={d.ptr}
                    ref={isCurrent ? activeCardRef : null}
                    style={{
                      background: isCurrent ? 'rgba(255, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid #ff4444' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      position: 'relative',
                      transition: 'background 0.2s, border 0.2s'
                    }}
                  >
                    {/* Header: Pointer, Speaker, Voice player, BGM info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '10px', color: '#888' }}>
                      <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                        #{d.ptr} {d.speaker ? <span style={{ color: '#ffb3ba', marginLeft: '5px' }}>[{d.speaker}]</span> : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {d.bgm && (
                          <span 
                            title={`BGM Track: ${d.bgm}`} 
                            style={{ 
                              background: 'rgba(68, 187, 255, 0.15)', 
                              color: '#44bbff', 
                              padding: '1px 4px', 
                              borderRadius: '3px', 
                              fontSize: '9px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            🎵 {d.bgm}
                          </span>
                        )}
                        {d.voice && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); playVoice(d.voice); }}
                            style={{ 
                              background: 'rgba(68, 255, 68, 0.15)', 
                              border: 'none', 
                              borderRadius: '3px',
                              color: '#44ff44', 
                              cursor: 'pointer', 
                              padding: '2px 4px',
                              fontSize: '9px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`Play voice clip: ${d.voice}`}
                          >
                            🔊 Voice
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Text blocks (JP and EN if available) */}
                    <div 
                      onClick={() => loadScenario(currentScenario, null, d.ptr)}
                      style={{ 
                        color: '#fff', 
                        cursor: 'pointer', 
                        fontSize: '11.5px',
                        lineHeight: '1.4',
                        marginBottom: d.text_en ? '4px' : '0'
                      }}
                      title="Jump game to this line"
                    >
                      {d.text_jp}
                    </div>
                    {d.text_en && (
                      <div 
                        onClick={() => loadScenario(currentScenario, null, d.ptr)}
                        style={{ 
                          color: '#aaa', 
                          cursor: 'pointer', 
                          fontSize: '10.5px',
                          lineHeight: '1.4',
                          fontStyle: 'italic'
                        }}
                        title="Jump game to this line"
                      >
                        {d.text_en}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
                No dialogues found matching search query.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
