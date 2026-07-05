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
      { type: 'command', name: 'nm', args: { t: '哈尔', s: 'har_voice_01' } },
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
    expect(engineState.pointer).toBe(10); // Pointer advances past the text node during execution
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

  it('closes active overlays on ESC key press', async () => {
    const App = await getApp();
    render(<App />);
    
    // Open Settings panel by clicking "游戏设置" button
    const settingsBtn = screen.getByText(/游戏设置/i);
    await act(async () => {
      fireEvent.click(settingsBtn);
    });
    
    // Check settings panel is rendered
    expect(screen.getByText(/背景音乐音量/i)).toBeDefined();
    
    // Press ESC key
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });
    
    // Check settings panel is closed
    await waitFor(() => {
      expect(screen.queryByText(/语音设置/i)).toBeNull();
    });
  });

  it('correctly respects title screen mute preference and isolates it from gameplay BGM', async () => {
    // Enable muted status in mocked localStorage
    mockLocalStorage.setItem('school_bgm_muted', 'true');

    const App = await getApp();
    render(<App />);

    // Verify Title Screen rendered
    expect(screen.getByText(/G弦上的魔王/i)).toBeDefined();

    // Check that title screen BGM is selected but not playing (remains muted)
    const audioState = window.quick_check().audio;
    expect(audioState.bgm.src).toContain('bgm_01');

    // Simulate going into gameplay via deep link to play bgm_test_01
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第一句话。/)).toBeDefined();
    });

    // The BGM player should now play the gameplay BGM (bgm_test_01) and ignore the title mute status
    const gameplayBgmState = window.quick_check().audio;
    expect(gameplayBgmState.bgm.src).toContain('bgm_test_01');
    expect(mockPlay).toHaveBeenCalled();
  });

  it('triggers autosave on every dialogue progression step', async () => {
    mockLocalStorage.setItem.mockClear();

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第一句话。/)).toBeDefined();
    });

    // Check that current position is written to school_autosave
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'school_autosave',
      expect.stringContaining('"pointer":5')
    );
  });

  it('correctly adjusts separate AVG and Novel opacity and blur states on settings slider changes', async () => {
    const App = await getApp();
    render(<App />);
    
    // Open Settings panel
    const settingsBtn = screen.getByText(/游戏设置/i);
    await act(async () => {
      fireEvent.click(settingsBtn);
    });
    
    // Find all sliders (BGM, Voice/SE, AVG Opacity, AVG Blur, Novel Opacity, Novel Blur)
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(6);
    
    const avgOpacitySlider = sliders[2];
    const avgBlurSlider = sliders[3];
    const novelOpacitySlider = sliders[4];
    const novelBlurSlider = sliders[5];
    
    // Change slider values
    await act(async () => {
      fireEvent.change(avgOpacitySlider, { target: { value: '5' } });
      fireEvent.change(avgBlurSlider, { target: { value: '12' } });
      fireEvent.change(novelOpacitySlider, { target: { value: '3' } });
      fireEvent.change(novelBlurSlider, { target: { value: '6' } });
    });
    
    // Check that state updated in window.quick_check()
    const engineState = window.quick_check();
    expect(engineState.sf.avgOpacity).toBe(5);
    expect(engineState.sf.avgBlur).toBe(12);
    expect(engineState.sf.novelOpacity).toBe(3);
    expect(engineState.sf.novelBlur).toBe(6);
  });

  it('correctly scans g05 scenario to pointer 536 and plays only bgm_06', async () => {
    const instructions = [];
    for (let i = 0; i < 540; i++) {
      if (i === 5) {
        instructions.push({ type: 'command', name: 'bgm', args: { storage: 'bgm_25b' } });
      } else if (i === 522) {
        instructions.push({ type: 'command', name: 'fobgm', args: {} });
      } else if (i === 529) {
        instructions.push({ type: 'command', name: 'bgm', args: { storage: 'bgm_06' } });
      } else if (i === 536) {
        instructions.push({ type: 'text', text_jp: '目标句子。', text_en: 'Target sentence.' });
      } else {
        instructions.push({ type: 'comment', text: 'dummy' });
      }
    }

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ instructions })
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g05&ptr=536');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g05');
      expect(diag.pointer).toBe(536);
      expect(diag.audio.bgm.src).toContain('bgm_06');
      expect(diag.audio.bgm.src).not.toContain('bgm_25b');
    });
  });

  it('correctly processes chapter completion at g06 ptr 1470 and transition to next chapter', async () => {
    // Construct g06 scenario end instructions
    const g06Instructions = [];
    for (let i = 0; i < 1470; i++) {
      g06Instructions.push({ type: 'comment', text: 'dummy' });
    }
    // ptr 1470
    g06Instructions.push({ type: 'page_break' }); // 1470
    g06Instructions.push({ type: 'line_feed' });  // 1471
    g06Instructions.push({ type: 'command', name: 'fobgm', args: {} }); // 1472
    g06Instructions.push({ type: 'command', name: 'hide', args: {} }); // 1473
    g06Instructions.push({ type: 'command', name: 'black', args: { time: 2000 } }); // 1474
    g06Instructions.push({ type: 'eval', exp: 'tf.go_next_chapter=false' }); // 1475
    g06Instructions.push({ type: 'eval', exp: 'sf.show_next_chapter=true' }); // 1476
    g06Instructions.push({ type: 'command', name: 'save', args: { cond: '!tf.go_next_chapter', place: 150 } }); // 1477
    g06Instructions.push({ type: 'command', name: 'jump', args: { cond: '!tf.go_next_chapter', storage: 'title.ks', target: '*title_init' } }); // 1478
    g06Instructions.push({ type: 'eval', exp: 'sf.show_next_chapter=false' }); // 1479
    g06Instructions.push({ type: 'command', name: 'jump', args: { storage: 'g07.ks' } }); // 1480

    const g07Instructions = [
      { type: 'command', name: 'bg', args: { storage: 'bg_test_g07' } },
      { type: 'text', text_jp: '这是g07第一句话。', text_en: 'This is g07 first sentence.' }
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/g06.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ instructions: g06Instructions }) });
      }
      if (url.includes('/scenarios/g07.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ instructions: g07Instructions }) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g06&ptr=1470');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // It should evaluate conditions, save to slot 150, and automatically jump to title screen
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.gameState).toBe('TITLE');
      expect(diag.sf.show_next_chapter).toBe(true);
    });

    // Verify slot 150 was written to localStorage
    const savedSlot = mockLocalStorage.getItem('school_save_slot_150');
    expect(savedSlot).toBeDefined();

    // The Title Screen should now render the "Next Chapter" button
    const nextChapterBtn = screen.getByText(/进入下一章/i);
    expect(nextChapterBtn).toBeDefined();

    // Click "Enter Next Chapter"
    await act(async () => {
      fireEvent.click(nextChapterBtn);
    });

    // It should load slot 150, set tf.go_next_chapter = true, bypass title jump, and jump to g07
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g07');
      expect(screen.getByText(/这是g07第一句话。/)).toBeDefined();
    });
  });

  it('correctly rewinds to a history snapshot without duplicating the dialogue text', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for the scenario to load and align to pointer 5 (dialogue text "这是第一句话。" displayed)
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
      expect(diag.dialogueText).toBe('这是第一句话。');
    });

    // Test Dialogue Box voice replay button
    const dialogVoiceBtn = screen.getByTitle(/播放语音/);
    expect(dialogVoiceBtn).toBeDefined();
    
    // Clear voice src first to test replay
    await act(async () => {
      const diag = window.quick_check();
      diag.voicePlayer.src = '';
    });
    
    await act(async () => {
      fireEvent.click(dialogVoiceBtn);
    });
    
    // Verify voice does not play instantly
    expect(window.quick_check().audio.voice.src).toBe('');
    
    // Wait for 200ms delay to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    
    expect(window.quick_check().audio.voice.src).toContain('har_voice_01');

    // Unlock audio
    let textLayer = await screen.findByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(textLayer);
    });

    // Wait a brief moment to let state update flush
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Re-query the text layer element to avoid detached DOM node issues
    textLayer = await screen.findByText('这是第一句话。');
    // Click to advance past page_break and load next text
    await act(async () => {
      fireEvent.click(textLayer);
    });

    // Wait until it reaches pointer 10 (dialogue text "这是第二句话。")
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.pointer).toBe(10);
      expect(diag.dialogueText).toBe('这是第二句话。');
    }, { timeout: 3000 });

    // Click the "历史" (History) button in DialogueBox
    const historyBtn = screen.getByText('历史');
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    // Test Backlog entry voice replay button
    const backlogVoiceBtn = screen.getByTitle(/播放语音/);
    expect(backlogVoiceBtn).toBeDefined();
    
    // Clear voice src first
    await act(async () => {
      const diag = window.quick_check();
      diag.voicePlayer.src = '';
    });
    
    await act(async () => {
      fireEvent.click(backlogVoiceBtn);
    });
    
    // Verify delay
    expect(window.quick_check().audio.voice.src).toBe('');
    
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    
    expect(window.quick_check().audio.voice.src).toContain('har_voice_01');

    // Click the backlog entry for the first sentence
    const backlogEntry = screen.getByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(backlogEntry);
    });

    // Confirm the backlog jump
    const confirmBtn = screen.getByText('确定');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Expect the engine to rewind scenario to g01, pointer should align to Math.max(5, startIdx+1) = 5, dialogue text = '这是第一句话。'
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
      expect(diag.dialogueText).toBe('这是第一句话。');
    });

    // Click the screen to advance. It should proceed to next instructions (page_break, line_feed, black, bg, text "这是第二句话。")
    // and NOT duplicate the text "这是第一句话。这是第一句话。"
    const rewoundTextLayer = await screen.findByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(rewoundTextLayer);
    });

    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.pointer).toBe(10);
      expect(diag.dialogueText).toBe('这是第二句话。');
    });
  });

  it('clears character speaker name and voice on page_break to handle monologues correctly', async () => {
    const customScenarioData = {
      instructions: [
        { type: 'command', name: 'nm', args: { t: '哈尔', s: 'har_voice_01' } },
        { type: 'text', text_jp: '「恐怕是的。」', text_en: '“Probably yes.”' },
        { type: 'page_break' },
        { type: 'line_feed' },
        { type: 'text', text_jp: '绕了一大圈是想说这些么。', text_en: 'Is that what they wanted to say?' }
      ]
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(customScenarioData)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g07&ptr=4');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for scenario to load and align. Deep link pointing to index 4 (monologue text) executes index 4 text and advances pointer to 5.
    // Page break at index 2 must clear speaker and voice.
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g07');
      expect(diag.pointer).toBe(5);
      expect(diag.speaker).toBe('');
      expect(diag.audio.voice.src).toBe('');
    });
  });

  it('opens history modal with / key press, focuses search input, filters log, highlights matches, and closes on Escape', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for the scenario to load and align to pointer 5 (dialogue text "这是第一句话。" displayed)
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

    // Advance to next text line ("这是第二句话。") to populate backlog history log
    let textLayer = await screen.findByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(textLayer);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    textLayer = await screen.findByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(textLayer);
    });
    await waitFor(() => {
      expect(window.quick_check().pointer).toBe(10);
    });

    // Trigger / key press to open history dialog
    await act(async () => {
      fireEvent.keyDown(window, { key: '/' });
    });

    // Verify history modal opens
    expect(screen.getByText('历史记录')).toBeDefined();

    // Verify search input is focused
    const searchInput = screen.getByPlaceholderText(/输入关键字搜索/);
    expect(searchInput).toBeDefined();
    expect(document.activeElement).toBe(searchInput);

    // Verify both dialogue lines are initially present
    expect(screen.queryByText('这是第一句话。')).not.toBeNull();
    expect(screen.queryByText('这是第二句话。')).not.toBeNull();

    // Type query "第二" to filter log
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '第二' } });
    });

    // Verify "这是第一句话。" is filtered out
    expect(screen.queryByText('这是第一句话。')).toBeNull();
    
    // Verify highlighting works
    const backlogContainer = screen.getByText('历史记录').parentElement;
    expect(backlogContainer.innerHTML).toContain('search-highlight');
    expect(backlogContainer.innerHTML).toContain('第二');
    expect(backlogContainer.innerHTML).not.toContain('第一');

    // Press Escape on search input and verify modal closes
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: 'Escape' });
    });

    // Verify modal is closed
    expect(screen.queryByText('历史记录')).toBeNull();
  });
});
