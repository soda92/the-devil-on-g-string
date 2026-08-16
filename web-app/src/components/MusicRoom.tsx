import React, { useState, useEffect } from 'react';
import { SystemFlags } from '../types/kag';

interface BgmTrack {
  id: string;
  name: string;
  desc: string;
  composer: string;
  scenes?: Array<{ scen: string; title: string; ptr?: number }>;
}

const BGM_TRACKS: BgmTrack[] = [
  { 
    id: "bgm_01", 
    name: "G弦上的咏叹调 - 主题曲", 
    desc: "巴赫 《G弦上的咏叹调》 (Air on the G String)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g01', title: '序章：雪之物语' },
      { scen: 'g55', title: '终章：融雪的春天' }
    ]
  },
  { 
    id: "bgm_02", 
    name: "魔鬼的颤音", 
    desc: "塔蒂尼 《魔鬼的颤音奏鸣曲》 (The Devil's Trill)", 
    composer: "G. Tartini",
    scenes: [
      { scen: 'g01', title: '魔王的暗影' },
      { scen: 'g08', title: '魔王的预告信' },
      { scen: 'g48', title: '魔王的宣战通告' }
    ]
  },
  { 
    id: "bgm_03", 
    name: "D大调交响曲", 
    desc: "巴赫 《D大调前奏曲》 (Sinfonia in D major)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g01', title: '校园日常' },
      { scen: 'g04', title: '春与京介' }
    ]
  },
  { 
    id: "bgm_04", 
    name: "哥德堡变奏曲", 
    desc: "巴赫 《哥德堡变奏曲》 (Goldberg Variations)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g02', title: '智力对决' },
      { scen: 'g17', title: '推理与破局' }
    ]
  },
  { 
    id: "bgm_05", 
    name: "第一小提琴奏鸣曲", 
    desc: "巴赫 《g小调第一无伴奏小提琴奏鸣曲》", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g03', title: '静谧之音' },
      { scen: 'g14', title: '黄昏的沉思' }
    ]
  },
  { 
    id: "bgm_06", 
    name: "圣母颂", 
    desc: "巴赫/古诺 《圣母颂》 (Ave Maria)", 
    composer: "Bach / Gounod",
    scenes: [
      { scen: 'g01', title: '圣洁与祈祷' },
      { scen: 'g05', title: '纯真誓言' }
    ]
  },
  { 
    id: "bgm_08", 
    name: "勃兰登堡协奏曲", 
    desc: "巴赫 《勃兰登堡第三协奏曲》", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g05', title: '欢快跃动' },
      { scen: 'g26', title: '校园漫步' }
    ]
  },
  { 
    id: "bgm_10", 
    name: "小赋格曲", 
    desc: "巴赫 《g小调小赋格》 (Little Fugue)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g01', title: '轻松旋律' },
      { scen: 'g07', title: '诙谐时刻' }
    ]
  },
  { 
    id: "bgm_11", 
    name: "大提琴无伴奏组曲", 
    desc: "巴赫 《G大调第一无伴奏大提琴组曲》", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g17', title: '大提琴独白' },
      { scen: 'g27', title: '幽邃心绪' }
    ]
  },
  { 
    id: "bgm_12", 
    name: "恰空舞曲", 
    desc: "巴赫 《d小调无伴奏小提琴恰空》 (Chaconne)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g46', title: '暗夜追寻' },
      { scen: 'g47', title: '破晓誓言' }
    ]
  },
  { 
    id: "bgm_13", 
    name: "托卡塔与赋格", 
    desc: "巴赫 《d小调托卡塔与赋格》 (Toccata & Fugue)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g01', title: '威严开幕' },
      { scen: 'g35', title: '命运风暴' },
      { scen: 'g50', title: '宿命对峙' }
    ]
  },
  { 
    id: "bgm_14", 
    name: "第三帕蒂塔", 
    desc: "巴赫 《E大调第三无伴奏小提琴组曲》", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'gk10', title: '花音终曲' },
      { scen: 'gt09', title: '椿姬终曲' }
    ]
  },
  { 
    id: "bgm_17", 
    name: "帕萨卡里亚与赋格", 
    desc: "巴赫 《c小调帕萨卡里亚与赋格》", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g43', title: '终章博弈' },
      { scen: 'g54', title: '雪夜抉择' }
    ]
  },
  { 
    id: "bgm_18", 
    name: "命运交响曲", 
    desc: "贝多芬 《第五交响曲“命运”》 (Symphony No. 5)", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g15', title: '命运敲门' },
      { scen: 'g25', title: '真相冲击' },
      { scen: 'g44', title: '血缘信件' }
    ]
  },
  { 
    id: "bgm_20", 
    name: "月光奏鸣曲", 
    desc: "贝多芬 《升c小调第十四钢琴奏鸣曲“月光”》", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g13', title: '月下倾诉' },
      { scen: 'g42', title: '深夜微光' },
      { scen: 'g52', title: '黎明之前' }
    ]
  },
  { 
    id: "bgm_21", 
    name: "欢乐颂", 
    desc: "贝多芬 《第九交响曲“合唱”》 (Ode to Joy)", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g45', title: '温暖之歌' },
      { scen: 'g51', title: '勇气的胜利' }
    ]
  },
  { 
    id: "bgm_22", 
    name: "悲怆奏鸣曲", 
    desc: "贝多芬 《c小调第八钢琴奏鸣曲“悲怆”》", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g06', title: '悲怆呼唤' },
      { scen: 'g35', title: '心碎时刻' }
    ]
  },
  { 
    id: "bgm_23", 
    name: "热情奏鸣曲", 
    desc: "贝多芬 《f小调第二十三钢琴奏鸣曲“热情”》", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g02', title: '热情洋溢' },
      { scen: 'g14', title: '激荡心潮' }
    ]
  },
  { 
    id: "bgm_24", 
    name: "埃格蒙特序曲", 
    desc: "贝多芬 《埃格蒙特序曲》 (Egmont Overture)", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g23', title: '英雄进军' },
      { scen: 'g45', title: '雪地小屋' },
      { scen: 'g55', title: '春日重逢' }
    ]
  },
  { 
    id: "bgm_26", 
    name: "克鲁采奏鸣曲", 
    desc: "贝多芬 《A大调第九小提琴奏鸣曲“克鲁采”》", 
    composer: "L. van Beethoven",
    scenes: [
      { scen: 'g07', title: '激烈交锋' },
      { scen: 'g34', title: '决战时刻' }
    ]
  },
  { 
    id: "bgm_28", 
    name: "魔王", 
    desc: "舒伯特 《魔王》 (Erlkönig)", 
    composer: "F. Schubert",
    scenes: [
      { scen: 'g02', title: '魔王降临' },
      { scen: 'g21', title: '紧急追踪' },
      { scen: 'g33', title: '致命危机' }
    ]
  },
  { 
    id: "bgm_29", 
    name: "未完成交响曲", 
    desc: "舒伯特 《b小调第八交响曲“未完成”》", 
    composer: "F. Schubert",
    scenes: [
      { scen: 'g29', title: '未完宿愿' },
      { scen: 'g49', title: '黑道枪声' }
    ]
  },
  { 
    id: "bgm_30", 
    name: "死神与少女", 
    desc: "舒伯特 《d小调第十四弦乐四重奏“死神与少女”》", 
    composer: "F. Schubert",
    scenes: [
      { scen: 'g06', title: '绝望阴霾' },
      { scen: 'g23', title: '死神低语' },
      { scen: 'g50', title: '复仇之火' }
    ]
  },
  { 
    id: "bgm_34", 
    name: "图画展览会", 
    desc: "穆索尔斯基 《图画展览会》 (Pictures at an Exhibition)", 
    composer: "M. Mussorgsky",
    scenes: [
      { scen: 'g46', title: '回忆回廊' },
      { scen: 'g54', title: '顶罪长夜' }
    ]
  },
  { 
    id: "bgm_35", 
    name: "荒山之夜", 
    desc: "穆索尔斯基 《荒山之夜》 (Night on Bald Mountain)", 
    composer: "M. Mussorgsky",
    scenes: [
      { scen: 'gk10', title: '荒山狂想' }
    ]
  },
  { 
    id: "bgm_36", 
    name: "鞑靼人舞曲", 
    desc: "鲍罗丁 《波罗维茨舞曲》 (Polovtsian Dances)", 
    composer: "A. Borodin",
    scenes: [
      { scen: 'g49', title: '暴徒围攻' }
    ]
  },
  { 
    id: "bgm_end", 
    name: "G弦上的咏叹调 - 管弦乐版", 
    desc: "巴赫 《G弦上的咏叹调》 (管弦乐完整版)", 
    composer: "J.S. Bach",
    scenes: [
      { scen: 'g55', title: '大结局片尾' },
      { scen: 'ghh2', title: '哈尔后日谈' }
    ]
  }
];

export interface MusicRoomProps {
  playBgm: (storage: string) => void;
  stopBgm: () => void;
  bgmPlayer?: HTMLAudioElement;
  currentBgmName?: string;
  onBack: () => void;
  sf: SystemFlags;
  setSf: (updater: (prev: SystemFlags) => SystemFlags) => void;
  onJumpToStory?: (scenId: string, ptr?: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function MusicRoom({ playBgm, stopBgm, bgmPlayer, currentBgmName, onBack, sf, setSf, onJumpToStory }: MusicRoomProps) {
  const [playingId, setPlayingId] = useState<string>(currentBgmName || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(!!currentBgmName);
  const [volume, setVolume] = useState<number>(sf.vol || 8);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Sync audio progress and duration from bgmPlayer
  useEffect(() => {
    if (!bgmPlayer) return;

    const handleTimeUpdate = () => {
      setCurrentTime(bgmPlayer.currentTime || 0);
    };

    const handleDurationChange = () => {
      if (bgmPlayer.duration && !isNaN(bgmPlayer.duration)) {
        setDuration(bgmPlayer.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    bgmPlayer.addEventListener('timeupdate', handleTimeUpdate);
    bgmPlayer.addEventListener('durationchange', handleDurationChange);
    bgmPlayer.addEventListener('loadedmetadata', handleDurationChange);
    bgmPlayer.addEventListener('play', handlePlay);
    bgmPlayer.addEventListener('pause', handlePause);

    // Initial check
    if (bgmPlayer.duration && !isNaN(bgmPlayer.duration)) {
      setDuration(bgmPlayer.duration);
    }
    setCurrentTime(bgmPlayer.currentTime || 0);
    setIsPlaying(!bgmPlayer.paused);

    return () => {
      bgmPlayer.removeEventListener('timeupdate', handleTimeUpdate);
      bgmPlayer.removeEventListener('durationchange', handleDurationChange);
      bgmPlayer.removeEventListener('loadedmetadata', handleDurationChange);
      bgmPlayer.removeEventListener('play', handlePlay);
      bgmPlayer.removeEventListener('pause', handlePause);
    };
  }, [bgmPlayer]);

  const handlePlayTrack = (trackId: string) => {
    setPlayingId(trackId);
    setIsPlaying(true);
    playBgm(trackId);
  };

  const handleTogglePlay = () => {
    if (!playingId) {
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

  const handleSeekTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (bgmPlayer) {
      bgmPlayer.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    setSf(prev => ({ ...prev, vol: newVol }));
  };

  const activeTrack = BGM_TRACKS.find(t => t.id === playingId);

  return (
    <div className="music-room-layer">
      <style>{`
        .music-room-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          background: radial-gradient(circle at top right, rgba(30, 20, 50, 0.96), rgba(10, 8, 20, 0.98));
          z-index: 20;
        }
        .music-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }
        .music-layout {
          display: flex;
          flex: 1;
          gap: 16px;
          overflow: hidden;
          min-height: 0;
          margin-bottom: 12px;
        }
        .music-list-pane {
          flex: 1.15;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px;
        }
        .music-player-pane {
          flex: 0.95;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 16px;
          box-sizing: border-box;
          text-align: center;
          min-height: 0;
          overflow-y: auto;
        }
        .music-track-item {
          display: flex;
          flex-direction: column;
          padding: 8px 12px;
          margin-bottom: 6px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.18s ease;
        }
        .music-track-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(139, 92, 246, 0.3);
        }
        .music-track-item.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #a855f7;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
        }
        .music-track-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2px;
        }
        .music-track-title {
          font-weight: bold;
          color: #fff;
          font-size: 12.5px;
        }
        .music-track-composer {
          font-size: 11px;
          color: #a855f7;
          font-weight: 500;
        }
        .music-track-desc {
          font-size: 11px;
          color: #94a3b8;
          text-align: left;
        }
        .disc-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #111;
          border: 5px solid #222;
          box-shadow: 0 4px 20px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        .disc-grooves {
          position: absolute;
          width: 88%;
          height: 88%;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.08);
        }
        .disc-label {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #111;
        }
        .disc-label-center {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #111;
        }
        @keyframes rotate-disc {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .disc-wrapper.spinning {
          animation: rotate-disc 4s linear infinite;
        }
        .player-seek-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }
        .player-seek-slider {
          width: 100%;
          accent-color: #a855f7;
          cursor: pointer;
          height: 4px;
        }
        .player-seek-times {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
        .player-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 10px;
        }
        .player-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .player-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #a855f7;
          transform: scale(1.06);
        }
        .player-btn.play-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border-color: #a855f7;
          font-size: 16px;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
        }
        .player-btn.play-btn:hover {
          background: linear-gradient(135deg, #a855f7, #6d28d9);
        }
        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 85%;
          margin-bottom: 8px;
        }
        .volume-slider {
          flex: 1;
          accent-color: #a855f7;
          cursor: pointer;
          height: 4px;
        }
        .story-scenes-panel {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 6px 8px;
          box-sizing: border-box;
          text-align: left;
        }
        .story-scene-chip {
          display: inline-block;
          padding: 2px 7px;
          margin: 2px 3px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #c4b5fd;
          font-size: 10.5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .story-scene-chip:hover {
          background: #a855f7;
          color: #fff;
          border-color: #c084fc;
        }
      `}</style>

      {/* Header */}
      <div className="music-header">
        <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', letterSpacing: '0.5px' }}>
          🎼 音乐鉴赏 / Classical Music Room
        </h2>
        <button 
          onClick={onBack}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ✕ 返回主菜单
        </button>
      </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(168, 85, 247, 0.3)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {track.id}
                  </span>
                  <span className="music-track-title">{track.name}</span>
                </div>
                <span className="music-track-composer">{track.composer}</span>
              </div>
              <span className="music-track-desc">{track.desc}</span>
            </div>
          ))}
        </div>

        {/* BGM Playing Player Pane */}
        <div className="music-player-pane">
          {/* Vinyl Disc Animation */}
          <div className={`disc-wrapper ${isPlaying ? 'spinning' : ''}`}>
            <div className="disc-grooves" />
            <div className="disc-label">
              <div className="disc-label-center" />
            </div>
          </div>

          {/* Active Track Title & Description */}
          <div style={{ width: '100%', marginBottom: '8px' }}>
            {activeTrack ? (
              <>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>{activeTrack.name}</span>
                  <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.4)', fontFamily: 'monospace' }}>
                    {activeTrack.id}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 600, marginBottom: '2px' }}>
                  {activeTrack.composer}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                  {activeTrack.desc}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>未在播放</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>请从左侧选择曲目播放</div>
              </>
            )}
          </div>

          {/* Audio Seek Timeline Bar */}
          <div className="player-seek-container">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              step="0.2"
              value={currentTime} 
              onChange={handleSeekTime}
              className="player-seek-slider" 
              disabled={!duration}
            />
            <div className="player-seek-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Transport Controls */}
          <div className="player-controls">
            <button className="player-btn" onClick={handlePrev} title="上一曲">⏮</button>
            <button className="player-btn play-btn" onClick={handleTogglePlay} title={isPlaying ? "暂停" : "播放"}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="player-btn" onClick={handleNext} title="下一曲">⏭</button>
          </div>

          {/* Volume Slider */}
          <div className="volume-control">
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>🔈</span>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider" 
            />
            <span style={{ fontSize: '10px', color: '#94a3b8', width: '14px' }}>{volume}</span>
          </div>

          {/* Story Scene Appearances / Seek Locations */}
          {activeTrack?.scenes && activeTrack.scenes.length > 0 && (
            <div className="story-scenes-panel">
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginBottom: '3px' }}>
                📖 剧情出现场景 (点击跳转至该段落):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {activeTrack.scenes.map((sc, sIdx) => (
                  <span 
                    key={sIdx} 
                    className="story-scene-chip"
                    onClick={() => onJumpToStory && onJumpToStory(sc.scen, sc.ptr || 0)}
                    title={`点击立即跳转体验剧情 (${sc.scen}.ks)`}
                  >
                    📍 {sc.title} ({sc.scen})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
