import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Setup globalThis localStorage mock
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: any) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
(globalThis as any).localStorage = mockLocalStorage;
if (typeof window !== 'undefined') {
  (window as any).localStorage = mockLocalStorage;
}

// Setup Mock Audio element globally before App.tsx loads
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
(globalThis as any).Audio = mockAudioClass;
if (typeof window !== 'undefined') {
  (window as any).Audio = mockAudioClass;
}

// Dynamically import App to ensure globalThis/window mocks are assigned before instantiation
let App: React.ComponentType<any>;
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
    
    // Mock globalThis fetch resolver
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenarioData)
        } as Response);
      }
      if (url.includes('/api/')) {
        return Promise.resolve({
          ok: false,
          status: 404
        } as Response);
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
    const url = new URL('http://localhost:38942/?scen=g01&ptr=8');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第二句话。/)).toBeDefined();
    });

    expect((window as any).quick_check).toBeDefined();
    const engineState = (window as any).quick_check();

    expect(engineState.scenario).toBe('g01');
    expect(engineState.pointer).toBe(10);
    expect(engineState.background).toBe('bg_test_02');
    expect(engineState.sprites[2]).toBeNull();
    expect(engineState.isWaiting).toBe(true);
  });

  it('ignores carriage returns at the start of dialogue boxes to prevent offset/overflow spacing', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第一句话。/)).toBeDefined();
    });

    const textLayer = screen.getByText(/这是第一句话。/);
    await act(async () => {
      fireEvent.click(textLayer);
    });
    await act(async () => {
      fireEvent.click(textLayer);
    });

    await waitFor(() => {
      expect(screen.getByText(/这是第二句话。/)).toBeDefined();
    });

    const engineState = (window as any).quick_check();
    expect(engineState.dialogueText).toBe('这是第二句话。');
    expect(engineState.dialogueText).not.toContain('<br />这是第二句话。');
  });

  it('closes active overlays on ESC key press', async () => {
    const App = await getApp();
    render(<App />);
    
    const settingsBtn = screen.getByText(/游戏设置/i);
    await act(async () => {
      fireEvent.click(settingsBtn);
    });
    
    expect(screen.getByText(/背景音乐音量/i)).toBeDefined();
    
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/语音设置/i)).toBeNull();
    });
  });

  it('correctly respects title screen mute preference and isolates it from gameplay BGM', async () => {
    mockLocalStorage.setItem('school_bgm_muted', 'true');

    const App = await getApp();
    render(<App />);

    expect(screen.getByText(/G弦上的魔王/i)).toBeDefined();

    const audioState = (window as any).quick_check().audio;
    expect(audioState.bgm.src).toContain('bgm_01');

    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/这是第一句话。/)).toBeDefined();
    });

    const gameplayBgmState = (window as any).quick_check().audio;
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

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'school_autosave',
      expect.stringContaining('"pointer":5')
    );
  });

  it('correctly adjusts separate AVG and Novel opacity and blur states on settings slider changes', async () => {
    const App = await getApp();
    render(<App />);
    
    const settingsBtn = screen.getByText(/游戏设置/i);
    await act(async () => {
      fireEvent.click(settingsBtn);
    });
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(6);
    
    const avgOpacitySlider = sliders[2];
    const avgBlurSlider = sliders[3];
    const novelOpacitySlider = sliders[4];
    const novelBlurSlider = sliders[5];
    
    await act(async () => {
      fireEvent.change(avgOpacitySlider, { target: { value: '5' } });
      fireEvent.change(avgBlurSlider, { target: { value: '12' } });
      fireEvent.change(novelOpacitySlider, { target: { value: '3' } });
      fireEvent.change(novelBlurSlider, { target: { value: '6' } });
    });
    
    const engineState = (window as any).quick_check();
    expect(engineState.sf.avgOpacity).toBe(5);
    expect(engineState.sf.avgBlur).toBe(12);
    expect(engineState.sf.novelOpacity).toBe(3);
    expect(engineState.sf.novelBlur).toBe(6);
  });

  it('correctly scans g05 scenario to pointer 536 and plays only bgm_06', async () => {
    const instructions: any[] = [];
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

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ instructions })
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g05&ptr=536');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g05');
      expect(diag.pointer).toBe(536);
      expect(diag.audio.bgm.src).toContain('bgm_06');
      expect(diag.audio.bgm.src).not.toContain('bgm_25b');
    });
  });

  it('correctly processes chapter completion at g06 ptr 1470 and transition to next chapter', async () => {
    const g06Instructions: any[] = [];
    for (let i = 0; i < 1470; i++) {
      g06Instructions.push({ type: 'comment', text: 'dummy' });
    }
    g06Instructions.push({ type: 'page_break' });
    g06Instructions.push({ type: 'line_feed' });
    g06Instructions.push({ type: 'command', name: 'fobgm', args: {} });
    g06Instructions.push({ type: 'command', name: 'hide', args: {} });
    g06Instructions.push({ type: 'command', name: 'black', args: { time: 2000 } });
    g06Instructions.push({ type: 'eval', exp: 'tf.go_next_chapter=false' });
    g06Instructions.push({ type: 'eval', exp: 'sf.show_next_chapter=true' });
    g06Instructions.push({ type: 'command', name: 'save', args: { cond: '!tf.go_next_chapter', place: 150 } });
    g06Instructions.push({ type: 'command', name: 'jump', args: { cond: '!tf.go_next_chapter', storage: 'title.ks', target: '*title_init' } });
    g06Instructions.push({ type: 'eval', exp: 'sf.show_next_chapter=false' });
    g06Instructions.push({ type: 'command', name: 'jump', args: { storage: 'g07.ks' } });

    const g07Instructions = [
      { type: 'command', name: 'bg', args: { storage: 'bg_test_g07' } },
      { type: 'text', text_jp: '这是g07第一句话。', text_en: 'This is g07 first sentence.' }
    ];

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/g06.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ instructions: g06Instructions }) } as Response);
      }
      if (url.includes('/scenarios/g07.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ instructions: g07Instructions }) } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g06&ptr=1470');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.gameState).toBe('TITLE');
      expect(diag.sf.show_next_chapter).toBe(true);
    });

    const savedSlot = mockLocalStorage.getItem('school_save_slot_150');
    expect(savedSlot).toBeDefined();

    const nextChapterBtn = screen.getByText(/进入下一章/i);
    expect(nextChapterBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(nextChapterBtn);
    });

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g07');
      expect(screen.getByText(/这是g07第一句话。/)).toBeDefined();
    });
  });

  it('correctly rewinds to a history snapshot without duplicating the dialogue text', async () => {
    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
      expect(diag.dialogueText).toBe('这是第一句话。');
    });

    const dialogVoiceBtn = screen.getByTitle(/播放语音/);
    expect(dialogVoiceBtn).toBeDefined();
    
    await act(async () => {
      const diag = (window as any).quick_check();
      diag.voicePlayer.src = '';
    });
    
    await act(async () => {
      fireEvent.click(dialogVoiceBtn);
    });
    
    expect((window as any).quick_check().audio.voice.src).toBe('');
    
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    
    expect((window as any).quick_check().audio.voice.src).toContain('har_voice_01');

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
      const diag = (window as any).quick_check();
      expect(diag.pointer).toBe(10);
      expect(diag.dialogueText).toBe('这是第二句话。');
    }, { timeout: 3000 });

    const historyBtn = screen.getByText('历史');
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    const backlogVoiceBtn = screen.getByTitle(/播放语音/);
    expect(backlogVoiceBtn).toBeDefined();
    
    await act(async () => {
      const diag = (window as any).quick_check();
      diag.voicePlayer.src = '';
    });
    
    await act(async () => {
      fireEvent.click(backlogVoiceBtn);
    });
    
    expect((window as any).quick_check().audio.voice.src).toBe('');
    
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    
    expect((window as any).quick_check().audio.voice.src).toContain('har_voice_01');

    const backlogEntry = screen.getByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(backlogEntry);
    });

    const confirmBtn = screen.getByText('确定');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
      expect(diag.dialogueText).toBe('这是第一句话。');
    });

    const rewoundTextLayer = await screen.findByText('这是第一句话。');
    await act(async () => {
      fireEvent.click(rewoundTextLayer);
    });

    await waitFor(() => {
      const diag = (window as any).quick_check();
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

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(customScenarioData)
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g07&ptr=4');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = (window as any).quick_check();
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

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

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
      expect((window as any).quick_check().pointer).toBe(10);
    });

    await act(async () => {
      fireEvent.keyDown(window, { code: 'Slash', key: '/' });
    });

    expect(screen.getByText('历史记录')).toBeDefined();

    const searchInput = screen.getByPlaceholderText(/输入关键字搜索/);
    expect(searchInput).toBeDefined();
    expect(document.activeElement).toBe(searchInput);

    expect(screen.queryByText('这是第一句话。')).not.toBeNull();
    expect(screen.queryByText('这是第二句话。')).not.toBeNull();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '第二' } });
    });

    expect(screen.queryByText('这是第一句话。')).toBeNull();
    
    const backlogContainer = screen.getByText('历史记录').parentElement!;
    expect(backlogContainer.innerHTML).toContain('search-highlight');
    expect(backlogContainer.innerHTML).toContain('第二');
    expect(backlogContainer.innerHTML).not.toContain('第一');

    await act(async () => {
      fireEvent.keyDown(searchInput, { key: 'Escape' });
    });

    expect(screen.queryByText('历史记录')).toBeNull();
  });

  it('correctly toggles fullscreen, dialogue box, save screen, and load screen on hotkey presses', async () => {
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(null as any);
    document.exitFullscreen = vi.fn().mockResolvedValue(null as any);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: vi.fn().mockReturnValue(null)
    });

    const App = await getApp();
    const url = new URL('http://localhost:38942/?scen=g01&ptr=3');
    window.history.replaceState({}, '', url.pathname + url.search);

    render(<App />);

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

    expect(screen.queryByText('历史')).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyC' });
    });
    expect(screen.queryByText('历史')).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyC' });
    });
    expect(screen.queryByText('历史')).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyS' });
    });
    expect(screen.queryByText(/档案记录管理/)).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyS' });
    });
    expect(screen.queryByText(/档案记录管理/)).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyL' });
    });
    expect(screen.queryByText(/档案记录管理/)).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyL' });
    });
    expect(screen.queryByText(/档案记录管理/)).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyF' });
    });
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();

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

    await waitFor(() => {
      const diag = (window as any).quick_check();
      expect(diag.scenario).toBe('g01');
      expect(diag.pointer).toBe(5);
    });

    expect((window as any).quick_check().isAutoMode).toBe(false);
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyA' });
    });
    expect((window as any).quick_check().isAutoMode).toBe(true);

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyA' });
    });
    expect((window as any).quick_check().isAutoMode).toBe(false);

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.queryByText('历史记录')).not.toBeNull();

    const searchInput = screen.getByPlaceholderText(/输入关键字搜索/);
    expect(document.activeElement).not.toBe(searchInput);

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.queryByText('历史记录')).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'Semicolon' });
    });
    expect(screen.queryByText('语言 / Language')).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'Semicolon' });
    });
    expect(screen.queryByText('语言 / Language')).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyQ' });
    });
    expect((window as any).quick_check().gameState).toBe('TITLE');
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

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(avgMockScenario)
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
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

    let textLayer = screen.getByText('这是第一句。');
    await act(async () => {
      fireEvent.click(textLayer);
    });
    await act(async () => {
      fireEvent.click(textLayer);
    });

    await waitFor(() => {
      expect(screen.queryByText('这是第二句。')).not.toBeNull();
      expect(screen.queryByText('这是第一句。')).toBeNull();
    });

    textLayer = screen.getByText('这是第二句。');
    await act(async () => {
      fireEvent.click(textLayer);
    });

    await waitFor(() => {
      expect(screen.queryByText('这是第三句。')).not.toBeNull();
      expect(screen.queryByText('这是第二句。')).toBeNull();
    });

    globalThis.fetch = originalFetch;
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

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(choiceMockScenario)
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    const App = await getApp();
    render(<App />);

    const startBtn = screen.getByText(/开始游戏/i) || screen.getByText(/Start Game/i);
    await act(async () => {
      fireEvent.click(startBtn);
    });

    let opt1: HTMLElement, opt2: HTMLElement;
    await waitFor(() => {
      opt1 = screen.getByText('选项一');
      opt2 = screen.getByText('选项二');
      expect(opt1).not.toBeNull();
      expect(opt2).not.toBeNull();
    });

    await act(async () => {
      fireEvent.click(opt1);
    });

    expect((window as any).quick_check().f.flag_tubaki).toBe(1);
    await waitFor(() => {
      expect(screen.queryByText('来到了路线一。')).not.toBeNull();
      expect(screen.queryByText('来到了路线二。')).toBeNull();
    });

    globalThis.fetch = originalFetch;
  });

  it('displays locked/bypassed badges in ChoiceGraphModal when active on a heroine route', async () => {
    const mockScenario = {
      instructions: [
        { type: 'text', text_jp: '在椿姬线第一天。', text_en: 'Tsubaki route day 1.' }
      ]
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenario)
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
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

    globalThis.fetch = originalFetch;
  });

  it('correctly halts fast-forwarding when encountering unread text in READ_ONLY skip mode', async () => {
    const mockScenario = {
      instructions: [
        { type: 'text', text_jp: '第一句已读。', text_en: 'First read.' },
        { type: 'text', text_jp: '第二句未读。', text_en: 'Second unread.' }
      ]
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/scenarios/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenario)
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
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

    const quickCheck = (window as any).quick_check();
    expect(quickCheck.sf.readScenarios).toBeDefined();
    expect(quickCheck.sf.readScenarios['g01']['0']).toBe(true);
    expect(quickCheck.sf.readScenarios['g01']['1']).toBeUndefined();

    await act(async () => {
      (window as any).quick_check().sf.skipMode = 'READ_ONLY';
    });

    await act(async () => {
      (window as any).quick_check().pointer = 0;
    });

    const skipBtn = screen.getByText('快进');
    await act(async () => {
      fireEvent.click(skipBtn);
    });

    expect((window as any).quick_check().isFastForward).toBe(true);

    await waitFor(() => {
      expect((window as any).quick_check().isFastForward).toBe(false);
      expect(screen.queryByText('第二句未读。')).not.toBeNull();
    });

    globalThis.fetch = originalFetch;
  });
});
