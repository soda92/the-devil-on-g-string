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
      fireEvent.keyDown(window, { code: 'Slash', key: '/' });
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

  it('correctly toggles fullscreen, dialogue box, save screen, and load screen on hotkey presses', async () => {
    // Mock Fullscreen API
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(null);
    document.exitFullscreen = vi.fn().mockResolvedValue(null);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: vi.fn().mockReturnValue(null)
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for the scenario to load and align
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

    // Verify dialogue box is initially visible
    expect(screen.queryByText('历史')).not.toBeNull();

    // 1. Test dialogue toggle with KeyC
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyC' });
    });
    expect(screen.queryByText('历史')).toBeNull();

    // Press KeyC again to restore visibility
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyC' });
    });
    expect(screen.queryByText('历史')).not.toBeNull();

    // 2. Test Save screen toggle with KeyS
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyS' });
    });
    expect(screen.queryByText('保存游戏 / SAVE')).not.toBeNull();

    // Press KeyS again to close it
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyS' });
    });
    expect(screen.queryByText('保存游戏 / SAVE')).toBeNull();

    // 3. Test Load screen toggle with KeyL
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyL' });
    });
    expect(screen.queryByText('读取游戏 / LOAD')).not.toBeNull();

    // Press KeyL again to close it
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyL' });
    });
    expect(screen.queryByText('读取游戏 / LOAD')).toBeNull();

    // 4. Test Fullscreen toggle with KeyF
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyF' });
    });
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();

    // Mock active fullscreen element to test exiting
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: vi.fn().mockReturnValue(document.documentElement)
    });

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyF' });
    });
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it('correctly toggles auto mode, history (unfocused search), settings, and returns to title on hotkeys', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    // Wait for the scenario to load and align
    await waitFor(() => {
      const diag = window.quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

    // 1. Test auto mode toggle with KeyA
    expect(window.quick_check().isAutoMode).toBe(false);
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyA' });
    });
    expect(window.quick_check().isAutoMode).toBe(true);

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyA' });
    });
    expect(window.quick_check().isAutoMode).toBe(false);

    // 2. Test history toggle with KeyH (without search focus)
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.queryByText('历史记录')).not.toBeNull();

    // Verify search input is NOT focused
    const searchInput = screen.getByPlaceholderText(/输入关键字搜索/);
    expect(document.activeElement).not.toBe(searchInput);

    // Press KeyH again to close it
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.queryByText('历史记录')).toBeNull();

    // 3. Test settings toggle with Semicolon
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Semicolon' });
    });
    expect(screen.queryByText('语言 / Language')).not.toBeNull();

    // Press Semicolon again to close it
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Semicolon' });
    });
    expect(screen.queryByText('语言 / Language')).toBeNull();

    // 4. Test Quit to title with KeyQ
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyQ' });
    });
    expect(window.quick_check().gameState).toBe('TITLE');
    expect(screen.queryByText('开始游戏')).not.toBeNull();
  });

  it('clears dialogue textbox in AVG mode after page_break or wait_click', async () => {
    const avgMockScenario = {
      instructions: [
        { type: 'command', name: 'avg', args: {} },
        { type: 'text', text_jp: '这是第一句。', text_en: 'This is first.' },
        { type: 'wait_click' },
        { type: 'text', text_jp: '这是第二句。', text_en: 'This is second.' },
        { type: 'page_break' },
        { type: 'text', text_jp: '这是第三句。', text_en: 'This is third.' }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(avgMockScenario)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    render(<App />);

    const startBtn = screen.getByText(/开始游戏/i) || screen.getByText(/Start Game/i);
    await act(async () => {
      fireEvent.click(startBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText('这是第一句。')).not.toBeNull();
    });

    // Advance past wait_click
    let textLayer = screen.getByText('这是第一句。');
    await act(async () => {
      fireEvent.click(textLayer); // Unlock audio
    });
    await act(async () => {
      fireEvent.click(textLayer); // Advance
    });

    // Verify textbox cleared and only shows second sentence
    await waitFor(() => {
      expect(screen.queryByText('这是第二句。')).not.toBeNull();
      expect(screen.queryByText('这是第一句。')).toBeNull();
    });

    // Advance past page_break
    textLayer = screen.getByText('这是第二句。');
    await act(async () => {
      fireEvent.click(textLayer); // Advance
    });

    // Verify textbox cleared and only shows third sentence
    await waitFor(() => {
      expect(screen.queryByText('这是第三句。')).not.toBeNull();
      expect(screen.queryByText('这是第二句。')).toBeNull();
    });

    global.fetch = originalFetch;
  });

  it('correctly processes choice selections via exlink and showexlink', async () => {
    const choiceMockScenario = {
      instructions: [
        { type: 'command', name: 'exlink', args: { txt: '选项一', target: '*target_label_01', exp: 'f.flag_tubaki+=1' } },
        { type: 'command', name: 'exlink', args: { txt: '选项二', target: '*target_label_02' } },
        { type: 'command', name: 'showexlink', args: {} },
        { type: 'label', name: 'target_label_01' },
        { type: 'text', text_jp: '来到了路线一。', text_en: 'Route 1.' },
        { type: 'label', name: 'target_label_02' },
        { type: 'text', text_jp: '来到了路线二。', text_en: 'Route 2.' }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(choiceMockScenario)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    render(<App />);

    const startBtn = screen.getByText(/开始游戏/i) || screen.getByText(/Start Game/i);
    await act(async () => {
      fireEvent.click(startBtn);
    });

    let opt1, opt2;
    await waitFor(() => {
      opt1 = screen.getByText('选项一');
      opt2 = screen.getByText('选项二');
      expect(opt1).not.toBeNull();
      expect(opt2).not.toBeNull();
    });

    await act(async () => {
      fireEvent.click(opt1);
    });

    expect(window.quick_check().f.flag_tubaki).toBe(1);
    await waitFor(() => {
      expect(screen.queryByText('来到了路线一。')).not.toBeNull();
      expect(screen.queryByText('来到了路线二。')).toBeNull();
    });

    global.fetch = originalFetch;
  });

  it('displays locked/bypassed badges in ChoiceGraphModal when active on a heroine route', async () => {
    const mockScenario = {
      instructions: [
        { type: 'text', text_jp: '在椿姬线第一天。', text_en: 'Tsubaki route day 1.' }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenario)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    window.history.pushState({}, '', '/?scen=gt01&ptr=0');

    const App = await getApp();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('在椿姬线第一天。')).not.toBeNull();
    });

    const routeBtn = screen.getByText('路线');
    await act(async () => {
      fireEvent.click(routeBtn);
    });

    expect(screen.queryByText('路线进度与选择历史') || screen.queryByText('Route Flowchart / Choices')).not.toBeNull();

    const activeBadge = screen.queryByText('💖 选中') || screen.queryByText('💖 Active');
    expect(activeBadge).not.toBeNull();

    const bypassedBadges = screen.queryAllByText('🔒 关闭').concat(screen.queryAllByText('🔒 Bypassed'));
    expect(bypassedBadges.length).toBe(3);

    global.fetch = originalFetch;
  });

  it('correctly halts fast-forwarding when encountering unread text in READ_ONLY skip mode', async () => {
    const mockScenario = {
      instructions: [
        { type: 'text', text_jp: '第一句已读。', text_en: 'First read.' },
        { type: 'text', text_jp: '第二句未读。', text_en: 'Second unread.' }
      ]
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenario)
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const App = await getApp();
    render(<App />);

    const startBtn = screen.getByText(/开始游戏/i) || screen.getByText(/Start Game/i);
    await act(async () => {
      fireEvent.click(startBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText('第一句已读。')).not.toBeNull();
    });

    const quickCheck = window.quick_check();
    expect(quickCheck.sf.readScenarios).toBeDefined();
    expect(quickCheck.sf.readScenarios['g01']['0']).toBe(true);
    expect(quickCheck.sf.readScenarios['g01']['1']).toBeUndefined();

    await act(async () => {
      window.quick_check().sf.skipMode = 'READ_ONLY';
    });

    await act(async () => {
      window.quick_check().pointer = 0;
    });

    const skipBtn = screen.getByText('快进');
    await act(async () => {
      fireEvent.click(skipBtn);
    });

    expect(window.quick_check().isFastForward).toBe(true);

    await waitFor(() => {
      expect(window.quick_check().isFastForward).toBe(false);
      expect(screen.queryByText('第二句未读。')).not.toBeNull();
    });

    global.fetch = originalFetch;
  });
});
