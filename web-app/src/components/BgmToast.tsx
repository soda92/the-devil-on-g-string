import { useState, useEffect, useRef } from 'react';
import { getBgmInfo } from '../data/bgmMetadata';
import { Language } from '../types/kag';

export interface BgmToastProps {
  currentBgm?: string | null;
  disabled?: boolean;
  language?: Language | string;
}

export default function BgmToast({ currentBgm, disabled = false, language = 'JP' }: BgmToastProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const timeoutRef = useRef<any>(null);
  const prevBgmRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentBgm || disabled) {
      setVisible(false);
      prevBgmRef.current = currentBgm || null;
      return;
    }

    const clean = currentBgm.replace('.ogg', '').replace('.mp3', '').trim();
    if (clean && clean !== prevBgmRef.current) {
      prevBgmRef.current = clean;
      setActiveTrackId(clean);
      setVisible(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 3800);
    }
  }, [currentBgm, disabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!visible || !activeTrackId || disabled) {
    return null;
  }

  const info = getBgmInfo(activeTrackId);

  return (
    <div className="bgm-toast-container">
      <style>{`
        @keyframes bgm-toast-enter {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .bgm-toast-container {
          position: absolute;
          top: 14px;
          left: 16px;
          z-index: 45;
          pointer-events: none;
          animation: bgm-toast-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bgm-toast-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          background: rgba(15, 10, 25, 0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-left: 3px solid #a855f7;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 14px rgba(168, 85, 247, 0.25);
          color: #fff;
          font-family: inherit;
        }
        .bgm-toast-icon {
          font-size: 15px;
          animation: bgm-note-bounce 1.5s ease-in-out infinite;
        }
        @keyframes bgm-note-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .bgm-toast-content {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .bgm-toast-title {
          font-size: 11.5px;
          font-weight: bold;
          color: #f8fafc;
          letter-spacing: 0.3px;
        }
        .bgm-toast-composer {
          font-size: 10px;
          color: #c084fc;
          font-weight: 500;
        }
        .bgm-toast-badge {
          font-size: 9px;
          background: rgba(168, 85, 247, 0.25);
          color: #e9d5ff;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(168, 85, 247, 0.4);
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      `}</style>
      <div className="bgm-toast-pill">
        <span className="bgm-toast-icon">🎵</span>
        <div className="bgm-toast-content">
          <div className="bgm-toast-title">
            {language === 'JP' ? info.title : info.titleEn}
          </div>
          <div className="bgm-toast-composer">
            {info.composer ? `${info.composer} · ` : ''}{info.originalPiece || info.title}
          </div>
        </div>
        <span className="bgm-toast-badge">
          {info.id}
        </span>
      </div>
    </div>
  );
}
