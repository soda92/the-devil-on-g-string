import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Setup global localStorage mock
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
global.localStorage = mockLocalStorage;
if (typeof window !== 'undefined') {
  window.localStorage = mockLocalStorage;
}

// Setup Mock Audio element globally before App.jsx loads
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockAudioClass = vi.fn().mockImplementation(function() {
  return {
    play: mockPlay,
    pause: mockPause,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: '',
    loop: false,
    volume: 1,
    paused: true,
    ended: false
  };
});
global.Audio = mockAudioClass;
if (typeof window !== 'undefined') {
  window.Audio = mockAudioClass;
}

// Dynamically import App to ensure global/window mocks are assigned before instantiation
let App;
const getApp = async () => {
  if (!App) {
    const mod = await import('../App');
    App = mod.default;
  }
  return App;
};

describe('G-String Visual Novel Engine Unit Tests', () => {
  const mockScenarioData = {
    instructions: [
      { type: 'command', name: 'bg', args: { storage: 'bg_test_01' } },
      { type: 'command', name: 'playbgm', args: { storage: 'bgm_test_01' } },
      { type: 'command', name: 'chr', args: { c: 'char_center_01' } },
      { type: 'text', text_jp: '这是第一句话。', text_en: 'This is the first sentence.' },
      { type: 'page_break' },
      { type: 'line_feed' },
      { type: 'command', name: 'black', args: {} },
      { type: 'command', name: 'bg', args: { storage: 'bg_test_02' } },
      { type: 'text', text_jp: '这是第二句话。', text_en: 'This is the second sentence.' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset browser URL query params
    const url = new URL('http://localhost:38942/');
    window.history.replaceState({}, '', url.pathname);
    
    // Mock global fetch resolver
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenarioData)
        });
      }
      if (url.includes('/api/')) {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
      return Promise.reject(new Error(`Unknown fetch target: ${url}`));
    });
  });

  it('renders Title Screen by default on mount', async () => {
    const App = await getApp();
    render(<App />);
    expect(screen.getByText(/G弦上的魔王/i) || screen.getByText(/Start Game/i) || screen.getByText(/开始游戏/i)).toBeDefined();
  });

  it('correctly processes deep links, runs pre-scanner, aligns index, and halts text progression', async () => {
    const App = await getApp();
    // Simulate deep link to pointer 8 (bg storage=bg_test_02).
    // The backward text aligner should snap startIdx to 8 (text: "这是第二句话。").
    // The pre-scanner should reconstruct the black transition, clearing char_center_01.
    const url = new URL('http://localhost:38942/?scen=g01&ptr=8');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for the scenario fetch to resolve and the gameplay screen to mount
    await waitFor(() => {
      // The game should render dialogue text "这是第二句话。"
      expect(screen.getByText(/这是第二句话。/)).toBeDefined();
    });

    // Check exposed state via window.quick_check() helper
    expect(window.quick_check).toBeDefined();
    const engineState = window.quick_check();

    expect(engineState.scenario).toBe('g01');
    expect(engineState.pointer).toBe(9); // Pointer advances past the text node during execution
    expect(engineState.background).toBe('bg_test_02');
    
    // Sprites center layer should be null because of the @black command at pointer 6
    expect(engineState.sprites[2]).toBeNull();
    expect(engineState.isWaiting).toBe(true); // Pauses on text node
  });

  it('ignores carriage returns at the start of dialogue boxes to prevent offset/overflow spacing', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3'); // Pointing to first text sentence
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第一句话。/)).toBeDefined();
    });

    // Click/advance page to trigger page_break (4) and line_feed (5)
    const textLayer = screen.getByText(/这是第一句话。/);
    await act(async () => {
      fireEvent.click(textLayer); // First click unlocks autoplay audio
    });
    await act(async () => {
      fireEvent.click(textLayer); // Second click advances the pointer
    });

    await waitFor(() => {
      expect(screen.getByText(/这是第二句话。/)).toBeDefined();
    });

    const engineState = window.quick_check();
    // The dialogue text must NOT contain a leading "<br />" even though line_feed (5) executed
    expect(engineState.dialogueText).toBe('这是第二句话。');
    expect(engineState.dialogueText).not.toContain('<br />这是第二句话。');
  });
});
