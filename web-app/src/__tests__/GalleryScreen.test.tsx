import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GalleryScreen from '../components/GalleryScreen';

describe('GalleryScreen Locked CG Scene Reading Actions', () => {
  it('displays a Read Context button on locked CG cards and jumps to preceding dialogue', () => {
    const onJumpToStoryMock = vi.fn();
    const onBackMock = vi.fn();
    const resolveAssetMock = vi.fn((name) => `/mock/${name}.jpg`);

    render(
      <GalleryScreen
        sf={{}} // All CGs locked
        resolveAsset={resolveAssetMock}
        onBack={onBackMock}
        language="JP"
        onJumpToStory={onJumpToStoryMock}
      />
    );

    // Find the locked card for Haru 01
    const readContextButtons = screen.getAllByRole('button', { name: /溯源阅读|Read Scene|前往剧情/i });
    expect(readContextButtons.length).toBeGreaterThanOrEqual(1);

    // Click the first read context button (Haru 01)
    fireEvent.click(readContextButtons[0]);

    expect(onJumpToStoryMock).toHaveBeenCalledTimes(1);
    const [scen, ptr] = onJumpToStoryMock.mock.calls[0];
    expect(scen).toBe('g01');
    // Pointer should be ~10 instructions earlier than 2081 (i.e. <= 2073 and >= 2000)
    expect(ptr).toBeLessThanOrEqual(2073);
    expect(ptr).toBeGreaterThanOrEqual(2000);
  });

  it('allows jumping to story lead-in from unlocked CG items', () => {
    const onJumpToStoryMock = vi.fn();
    const onBackMock = vi.fn();
    const resolveAssetMock = vi.fn((name) => `/mock/${name}.jpg`);

    render(
      <GalleryScreen
        sf={{ ev_haru_01: 1 }} // Haru 01 unlocked
        resolveAsset={resolveAssetMock}
        onBack={onBackMock}
        language="JP"
        onJumpToStory={onJumpToStoryMock}
      />
    );

    // Click the story jump button on the unlocked Haru 01 card
    const storyJumpBtn = screen.getByTitle(/跳转到该CG前导剧情 \[g01\]/);
    expect(storyJumpBtn).toBeDefined();

    fireEvent.click(storyJumpBtn);

    expect(onJumpToStoryMock).toHaveBeenCalledWith('g01', 2071);
  });

  it('switches between CG gallery and special scenes mode smoothly', () => {
    const onPlaySceneMock = vi.fn();
    const resolveAssetMock = vi.fn((name) => `/mock/${name}.jpg`);

    render(
      <GalleryScreen
        sf={{}}
        resolveAsset={resolveAssetMock}
        onBack={vi.fn()}
        language="JP"
        onPlayScene={onPlaySceneMock}
      />
    );

    const scenesTabBtn = screen.getByText(/🎬 场景回顾/);
    fireEvent.click(scenesTabBtn);

    expect(screen.getByText(/全部场景/)).toBeDefined();
    expect(screen.getByText(/初夜 · 誓言之夜/)).toBeDefined();
  });

  it('correctly resolves and provides Read Scene button for haru-16 (whose scene starts at variant e in g49)', () => {
    const onJumpToStoryMock = vi.fn();
    const resolveAssetMock = vi.fn((name) => `/mock/${name}.jpg`);

    render(
      <GalleryScreen
        sf={{}} // All locked
        resolveAsset={resolveAssetMock}
        onBack={vi.fn()}
        language="JP"
        onJumpToStory={onJumpToStoryMock}
      />
    );

    // Switch category to Haru
    const haruTabBtn = screen.getByText(/宇佐美 春/);
    fireEvent.click(haruTabBtn);

    // Switch to page 2 (where haru-16 is located: items 13-24)
    const page2Btn = screen.getByText('2');
    fireEvent.click(page2Btn);

    // Find the read buttons for g49 CGs (including haru-16)
    const g49ReadBtns = screen.getAllByTitle(/跳转到该CG的前导剧情 \[g49\]/);
    expect(g49ReadBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(g49ReadBtns[0]);

    expect(onJumpToStoryMock).toHaveBeenCalledTimes(1);
    const [scen, ptr] = onJumpToStoryMock.mock.calls[0];
    expect(scen).toBe('g49');
    expect(ptr).toBe(3636); // 3646 - 10
  });

  it('correctly provides Read Scene buttons for CGs 126-133 (Kanon special costumes in gk03)', () => {
    const onJumpToStoryMock = vi.fn();
    const resolveAssetMock = vi.fn((name) => `/mock/${name}.jpg`);

    render(
      <GalleryScreen
        sf={{}} // All locked
        resolveAsset={resolveAssetMock}
        onBack={vi.fn()}
        language="JP"
        onJumpToStory={onJumpToStoryMock}
      />
    );

    // Switch category to Kanon
    const kanonTabBtn = screen.getByText(/美轮 花音/);
    fireEvent.click(kanonTabBtn);

    // Switch to page 3 (where items 126-133 / standee CGs are located)
    const page3Btn = screen.getByText('3');
    fireEvent.click(page3Btn);

    // Verify Read Scene buttons for gk03 exist on this page
    const gk03ReadBtns = screen.getAllByTitle(/跳转到该CG的前导剧情 \[gk03\]/);
    expect(gk03ReadBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(gk03ReadBtns[0]);

    expect(onJumpToStoryMock).toHaveBeenCalledTimes(1);
    const [scen, ptr] = onJumpToStoryMock.mock.calls[0];
    expect(scen).toBe('gk03');
    expect(ptr).toBe(648); // 658 - 10
  });
});
