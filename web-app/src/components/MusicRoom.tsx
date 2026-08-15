import React, { useState } from 'react';
import { SystemFlags } from '../types/kag';

interface BgmTrack {
  id: string;
  name: string;
  desc: string;
  composer: string;
}

const BGM_TRACKS: BgmTrack[] = [
  { id: "bgm_01", name: "G弦上的咏叹调 - 主题曲", desc: "巴赫 《G弦上的咏叹调》 (Air on the G String)", composer: "J.S. Bach" },
  { id: "bgm_02", name: "魔鬼的颤音", desc: "塔蒂尼 《魔鬼的颤音奏鸣曲》 (The Devil's Trill)", composer: "G. Tartini" },
  { id: "bgm_03", name: "D大调交响曲", desc: "巴赫 《D大调前奏曲》 (Sinfonia in D major)", composer: "J.S. Bach" },
  { id: "bgm_04", name: "哥德堡变奏曲", desc: "巴赫 《哥德堡变奏曲》 (Goldberg Variations)", composer: "J.S. Bach" },
  { id: "bgm_05", name: "第一小提琴奏鸣曲", desc: "巴赫 《g小调第一无伴奏小提琴奏鸣曲》", composer: "J.S. Bach" },
  { id: "bgm_06", name: "圣母颂", desc: "巴赫/古诺 《圣母颂》 (Ave Maria)", composer: "Bach / Gounod" },
  { id: "bgm_08", name: "勃兰登堡协奏曲", desc: "巴赫 《勃兰登堡第三协奏曲》", composer: "J.S. Bach" },
  { id: "bgm_10", name: "小赋格曲", desc: "巴赫 《g小调小赋格》 (Little Fugue)", composer: "J.S. Bach" },
  { id: "bgm_11", name: "大提琴无伴奏组曲", desc: "巴赫 《G大调第一无伴奏大提琴组曲》", composer: "J.S. Bach" },
  { id: "bgm_12", name: "恰空舞曲", desc: "巴赫 《d小调无伴奏小提琴恰空》 (Chaconne)", composer: "J.S. Bach" },
  { id: "bgm_13", name: "托卡塔与赋格", desc: "巴赫 《d小调托卡塔与赋格》 (Toccata & Fugue)", composer: "J.S. Bach" },
  { id: "bgm_14", name: "第三帕蒂塔", desc: "巴赫 《E大调第三无伴奏小提琴组曲》", composer: "J.S. Bach" },
  { id: "bgm_17", name: "帕萨卡里亚与赋格", desc: "巴赫 《c小调帕萨卡里亚与赋格》", composer: "J.S. Bach" },
  { id: "bgm_18", name: "命运交响曲", desc: "贝多芬 《第五交响曲“命运”》 (Symphony No. 5)", composer: "L. van Beethoven" },
  { id: "bgm_20", name: "月光奏鸣曲", desc: "贝多芬 《升c小调第十四钢琴奏鸣曲“月光”》", composer: "L. van Beethoven" },
  { id: "bgm_21", name: "欢乐颂", desc: "贝多芬 《第九交响曲“合唱”》 (Ode to Joy)", composer: "L. van Beethoven" },
  { id: "bgm_22", name: "悲怆奏鸣曲", desc: "贝多芬 《c小调第八钢琴奏鸣曲“悲怆”》", composer: "L. van Beethoven" },
  { id: "bgm_23", name: "热情奏鸣曲", desc: "贝多芬 《f小调第二十三钢琴奏鸣曲“热情”》", composer: "L. van Beethoven" },
  { id: "bgm_24", name: "埃格蒙特序曲", desc: "贝多芬 《埃格蒙特序曲》 (Egmont Overture)", composer: "L. van Beethoven" },
  { id: "bgm_26", name: "克鲁采奏鸣曲", desc: "贝多芬 《A大调第九小提琴奏鸣曲“克鲁采”》", composer: "L. van Beethoven" },
  { id: "bgm_28", name: "魔王", desc: "舒伯特 《魔王》 (Erlkönig)", composer: "F. Schubert" },
  { id: "bgm_29", name: "未完成交响曲", desc: "舒伯特 《b小调第八交响曲“未完成”》", composer: "F. Schubert" },
  { id: "bgm_30", name: "死神与少女", desc: "舒伯特 《d小调第十四弦乐四重奏“死神与少女”》", composer: "F. Schubert" },
  { id: "bgm_34", name: "图画展览会", desc: "穆索尔斯基 《图画展览会》 (Pictures at an Exhibition)", composer: "M. Mussorgsky" },
  { id: "bgm_35", name: "荒山之夜", desc: "穆索尔斯基 《荒山之夜》 (Night on Bald Mountain)", composer: "M. Mussorgsky" },
  { id: "bgm_36", name: "鞑靼人舞曲", desc: "鲍罗丁 《波罗维茨舞曲》 (Polovtsian Dances)", composer: "A. Borodin" },
  { id: "bgm_end", name: "G弦上的咏叹调 - 管弦乐版", desc: "巴赫 《G弦上的咏叹调》 (管弦乐完整版)", composer: "J.S. Bach" }
];

export interface MusicRoomProps {
  playBgm: (storage: string) => void;
  stopBgm: () => void;
  currentBgmName?: string;
  onBack: () => void;
  sf: SystemFlags;
  setSf: (updater: (prev: SystemFlags) => SystemFlags) => void;
}

export default function MusicRoom({ playBgm, stopBgm, currentBgmName, onBack, sf, setSf }: MusicRoomProps) {
  const [playingId, setPlayingId] = useState<string>(currentBgmName || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(!!currentBgmName);
  const [volume, setVolume] = useState<number>(sf.vol || 8);

  const handlePlayTrack = (trackId: string) => {
    setPlayingId(trackId);
    setIsPlaying(true);
    playBgm(trackId);
  };

  const handleTogglePlay = () => {
    if (!playingId) {
      // Play first track by default
      handlePlayTrack(BGM_TRACKS[0].id);
      return;
    }
    if (isPlaying) {
      stopBgm();
      setIsPlaying(false);
    } else {
      playBgm(playingId);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    const currentIdx = BGM_TRACKS.findIndex(t => t.id === playingId);
    if (currentIdx !== -1) {
      const nextIdx = (currentIdx + 1) % BGM_TRACKS.length;
      handlePlayTrack(BGM_TRACKS[nextIdx].id);
    } else {
      handlePlayTrack(BGM_TRACKS[0].id);
    }
  };

  const handlePrev = () => {
    const currentIdx = BGM_TRACKS.findIndex(t => t.id === playingId);
    if (currentIdx !== -1) {
      const prevIdx = (currentIdx - 1 + BGM_TRACKS.length) % BGM_TRACKS.length;
      handlePlayTrack(BGM_TRACKS[prevIdx].id);
    } else {
      handlePlayTrack(BGM_TRACKS[0].id);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    setSf(prev => ({ ...prev, vol: newVol }));
  };

  const activeTrack = BGM_TRACKS.find(t => t.id === playingId);

  return (
    <div className="music-room-layer glass-panel">
      <style>{`
        .music-room-layer {
          width: 90%;
          max-width: 800px;
          height: 80vh;
          padding: 25px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }
        .music-layout {
          display: flex;
          flex: 1;
          gap: 25px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .music-list-pane {
          flex: 1.2;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 10px;
        }
        .music-player-pane {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
        }
        .music-track-item {
          display: flex;
          flex-direction: column;
          padding: 10px 15px;
          margin-bottom: 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .music-track-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(139, 92, 246, 0.2);
        }
        .music-track-item.active {
          background: rgba(139, 92, 246, 0.15);
          border-color: var(--color-primary);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.2);
        }
        .music-track-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .music-track-title {
          font-weight: bold;
          color: var(--color-text-bright);
          font-size: 13px;
        }
        .music-track-composer {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .music-track-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          text-align: left;
        }
        .disc-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: #111;
          border: 6px solid #222;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 25px;
        }
        .disc-grooves {
          position: absolute;
          width: 90%;
          height: 90%;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.05);
        }
        .disc-label {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid #111;
        }
        .disc-label-center {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #111;
        }
        @keyframes rotate-disc {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .disc-wrapper.spinning {
          animation: rotate-disc 5s linear infinite;
        }
        .player-controls {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .player-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          background: var(--color-glass-light);
          color: var(--color-text-bright);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .player-btn:hover {
          background: var(--color-glass-medium);
          border-color: var(--color-primary);
          transform: scale(1.05);
        }
        .player-btn.play-btn {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .player-btn.play-btn:hover {
          background: #7c3aed;
        }
        .volume-control {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 80%;
          margin-top: 10px;
        }
        .volume-slider {
          flex: 1;
          accent-color: var(--color-primary);
          cursor: pointer;
        }
        .player-info-title {
          font-size: 14px;
          font-weight: bold;
          color: var(--color-text-bright);
          margin-bottom: 5px;
        }
        .player-info-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin-bottom: 15px;
        }
      `}</style>

      <h2 className="screen-title">音乐鉴赏 - CLASSICAL MUSIC ROOM</h2>

      <div className="music-layout">
        {/* BGM List Pane */}
        <div className="music-list-pane">
          {BGM_TRACKS.map((track) => (
            <div 
              key={track.id}
              className={`music-track-item ${playingId === track.id ? 'active' : ''}`}
              onClick={() => handlePlayTrack(track.id)}
            >
              <div className="music-track-header">
                <span className="music-track-title">{track.name}</span>
                <span className="music-track-composer">{track.composer}</span>
              </div>
              <span className="music-track-desc">{track.desc}</span>
            </div>
          ))}
        </div>

        {/* BGM Playing Player Pane */}
        <div className="music-player-pane">
          <div className={`disc-wrapper ${isPlaying ? 'spinning' : ''}`}>
            <div className="disc-grooves" />
            <div className="disc-label">
              <div className="disc-label-center" />
            </div>
          </div>

          <div style={{ width: '100%' }}>
            {activeTrack ? (
              <>
                <div className="player-info-title">{activeTrack.name}</div>
                <div className="player-info-desc">{activeTrack.desc}</div>
              </>
            ) : (
              <>
                <div className="player-info-title">未在播放</div>
                <div className="player-info-desc">请从左侧选择曲目播放</div>
              </>
            )}
          </div>

          <div className="player-controls">
            <button className="player-btn" onClick={handlePrev}>⏮</button>
            <button className="player-btn play-btn" onClick={handleTogglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="player-btn" onClick={handleNext}>⏭</button>
          </div>

          <div className="volume-control">
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>🔈</span>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider" 
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', width: '15px' }}>{volume}</span>
          </div>
        </div>
      </div>

      <button className="back-btn glass-panel" onClick={onBack}>返回主菜单</button>
    </div>
  );
}
