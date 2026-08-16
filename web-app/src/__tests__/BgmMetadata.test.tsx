import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getBgmInfo, BGM_METADATA_MAP } from '../data/bgmMetadata';
import BgmToast from '../components/BgmToast';

describe('BGM Metadata & Resolution', () => {
  it('correctly resolves bgm_21d as Ode to Joy (Piano Ballad)', () => {
    const info = getBgmInfo('bgm_21d');
    expect(info.id).toBe('bgm_21d');
    expect(info.title).toContain('欢乐颂');
    expect(info.title).toContain('抒情钢琴慢板');
    expect(info.composer).toBe('L. van Beethoven');
  });

  it('correctly resolves bgm_01 as Air on G String Main Theme', () => {
    const info = getBgmInfo('bgm_01.ogg');
    expect(info.id).toBe('bgm_01');
    expect(info.title).toContain('G弦上的咏叹调');
    expect(info.composer).toBe('J.S. Bach');
  });

  it('correctly resolves bgm_28 as Erlkönig by Schubert', () => {
    const info = getBgmInfo('bgm_28');
    expect(info.id).toBe('bgm_28');
    expect(info.title).toContain('魔王');
    expect(info.composer).toBe('F. Schubert');
  });

  it('provides sensible fallback for unknown variations or extra ambient tracks', () => {
    const fallback = getBgmInfo('bgm_999');
    expect(fallback.id).toBe('bgm_999');
    expect(fallback.title).toContain('古典曲目 (bgm_999)');
  });

  it('contains entries for major classical tracks in BGM_METADATA_MAP', () => {
    expect(BGM_METADATA_MAP.bgm_02.title).toContain('魔鬼的颤音');
    expect(BGM_METADATA_MAP.bgm_12.title).toContain('恰空舞曲');
    expect(BGM_METADATA_MAP.bgm_18.title).toContain('命运');
    expect(BGM_METADATA_MAP.bgm_20.title).toContain('月光');
    expect(BGM_METADATA_MAP.bgm_end.title).toContain('管弦乐完整版');
  });
});

describe('BgmToast Component', () => {
  it('renders floating toast with title, composer and seq ID when currentBgm is set', () => {
    render(<BgmToast currentBgm="bgm_21d" disabled={false} language="JP" />);

    expect(screen.getByText(/提前到来的春天/)).toBeDefined();
    expect(screen.getByText(/L. van Beethoven/)).toBeDefined();
    expect(screen.getByText('bgm_21d')).toBeDefined();
  });

  it('does not render when disabled is true', () => {
    render(<BgmToast currentBgm="bgm_21d" disabled={true} language="JP" />);

    expect(screen.queryByText('bgm_21d')).toBeNull();
  });

  it('does not render when currentBgm is empty or null', () => {
    render(<BgmToast currentBgm="" disabled={false} language="JP" />);

    expect(screen.queryByText('🎵')).toBeNull();
  });

  it('auto fades out after timeout', () => {
    vi.useFakeTimers();

    const { container } = render(<BgmToast currentBgm="bgm_01" disabled={false} language="JP" />);
    expect(container.querySelector('.bgm-toast-pill')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(container.querySelector('.bgm-toast-pill')).toBeNull();

    vi.useRealTimers();
  });
});
