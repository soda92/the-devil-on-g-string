import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import StoryNavigator from '../components/StoryNavigator';

// Mock scrollIntoView in jsdom
if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

describe('StoryNavigator Component', () => {
  const mockScenarioData = {
    instructions: [
      { type: 'label', name: 'page1' },
      { type: 'command', name: 'nm', args: { t: '京介' } },
      { type: 'text', text_jp: '这是第一句台词。', text_en: 'First dialogue line.' },
      { type: 'page_break' },
      { type: 'line_feed' },
      { type: 'label', name: 'page2' },
      { type: 'command', name: 'nm', args: { t: 'ハル', s: 'har_001' } },
      { type: 'text', text_jp: '这是第二句台词。', text_en: 'Second dialogue line.' },
      { type: 'page_break' },
      { type: 'line_feed' },
      { type: 'label', name: 'page3' },
      { type: 'command', name: 'nm', args: { t: '京介' } },
      { type: 'text', text_jp: '这是第三句台词。', text_en: 'Third dialogue line.' },
      { type: 'page_break' }
    ]
  };

  it('renders with initialTab="flipper" displaying slider, steppers, and preview', () => {
    const onSeekPointer = vi.fn();
    const onSelectTopic = vi.fn();
    const onClose = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={8}
        maxPointer={15}
        currentScenario="g44"
        scenarioData={mockScenarioData}
        currentDialogueText="这是第二句台词。"
        speaker="ハル"
        onSeekPointer={onSeekPointer}
        onSelectTopic={onSelectTopic}
        onClose={onClose}
        language="JP"
        isSidebar={true}
      />
    );

    // Verify top tabs exist
    expect(screen.getByText('翻页微调')).toBeDefined();
    expect(screen.getByText('章节目录')).toBeDefined();
    expect(screen.getByText('路线点数')).toBeDefined();

    // Verify pointer status and scenario badge
    expect(screen.getByText('g44.ks')).toBeDefined();
    expect(screen.getByText(/Line 8/)).toBeDefined();

    // Verify dialogue preview
    expect(screen.getByText('【ハル】')).toBeDefined();
    expect(screen.getByText('这是第二句台词。')).toBeDefined();

    // Verify step buttons
    expect(screen.getByText('+1 ▶')).toBeDefined();
    expect(screen.getByText('◀ -1')).toBeDefined();
    expect(screen.getByText('+10')).toBeDefined();
    expect(screen.getByText('-10')).toBeDefined();
  });

  it('steps backwards to previous dialogue line when clicking ◀ -1', () => {
    const onSeekPointer = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={8} // Current line is Text at index 7 ("这是第二句台词。")
        maxPointer={15}
        currentScenario="g44"
        scenarioData={mockScenarioData}
        currentDialogueText="这是第二句台词。"
        speaker="ハル"
        onSeekPointer={onSeekPointer}
        onSelectTopic={vi.fn()}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    const stepPrevBtn = screen.getByText('◀ -1');
    act(() => {
      fireEvent.click(stepPrevBtn);
    });

    // Should step to previous text index 2 ("这是第一句台词。") instead of staying at 7
    expect(onSeekPointer).toHaveBeenCalledWith(2);
  });

  it('steps forward to next dialogue line when clicking +1 ▶', () => {
    const onSeekPointer = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={2} // Current line is Text at index 2 ("这是第一句台词。")
        maxPointer={15}
        currentScenario="g44"
        scenarioData={mockScenarioData}
        currentDialogueText="这是第一句台词。"
        speaker="京介"
        onSeekPointer={onSeekPointer}
        onSelectTopic={vi.fn()}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    const stepNextBtn = screen.getByText('+1 ▶');
    act(() => {
      fireEvent.click(stepNextBtn);
    });

    // Should step forward to next text index 7 ("这是第二句台词。")
    expect(onSeekPointer).toHaveBeenCalledWith(7);
  });

  it('supports bookmarking and returning to bookmark', () => {
    const onSeekPointer = vi.fn();

    const { rerender } = render(
      <StoryNavigator
        initialTab="flipper"
        pointer={2}
        maxPointer={15}
        currentScenario="g44"
        scenarioData={mockScenarioData}
        currentDialogueText="这是第一句台词。"
        speaker="京介"
        onSeekPointer={onSeekPointer}
        onSelectTopic={vi.fn()}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    // Click bookmark button on pointer 2
    const markBtn = screen.getByText(/书签/);
    act(() => {
      fireEvent.click(markBtn);
    });

    // Advance pointer prop to 12
    rerender(
      <StoryNavigator
        initialTab="flipper"
        pointer={12}
        maxPointer={15}
        currentScenario="g44"
        scenarioData={mockScenarioData}
        currentDialogueText="这是第三句台词。"
        speaker="京介"
        onSeekPointer={onSeekPointer}
        onSelectTopic={vi.fn()}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    // Click return to bookmark button
    const returnBtn = screen.getByText(/返回/);
    act(() => {
      fireEvent.click(returnBtn);
    });

    expect(onSeekPointer).toHaveBeenCalledWith(2);
  });

  it('switches between tabs and displays Chapters TOC and Route Flags', () => {
    const onSelectTopic = vi.fn();
    const setF = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={0}
        maxPointer={100}
        currentScenario="g01"
        currentDialogueText=""
        speaker=""
        f={{ flag_haru: 1, flag_tubaki: 0 }}
        setF={setF}
        onSeekPointer={vi.fn()}
        onSelectTopic={onSelectTopic}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    // Switch to TOC tab
    const tocTabBtn = screen.getByText('章节目录');
    act(() => {
      fireEvent.click(tocTabBtn);
    });

    // Check that TOC route categories and chapters are rendered
    expect(screen.getByText('全部章节')).toBeDefined();
    expect(screen.getByText('美轮椿姬篇')).toBeDefined();
    expect(screen.getByText('第一章：魔王降临 (序幕)')).toBeDefined();

    // Verify active scenario badge
    expect(screen.getByText(/📍 当前/)).toBeDefined();

    // Click a scenario card to jump
    const scenCard = screen.getByText('黑道事务与第一宗委托');
    act(() => {
      fireEvent.click(scenCard);
    });
    expect(onSelectTopic).toHaveBeenCalledWith('g02', 0, undefined);

    // Switch to Flags tab
    const flagsTabBtn = screen.getByText('路线点数');
    act(() => {
      fireEvent.click(flagsTabBtn);
    });

    // Verify heroine steppers
    expect(screen.getByText(/🎻 宇佐美哈尔/)).toBeDefined();
    expect(screen.getByText(/🌸 美轮椿姬/)).toBeDefined();
    expect(screen.getByText(/⛸️ 美波花音/)).toBeDefined();
    expect(screen.getByText(/🦢 白鸟水羽/)).toBeDefined();

    // Click Haru increment button
    const plusButtons = screen.getAllByText('+');
    act(() => {
      fireEvent.click(plusButtons[0]);
    });
    expect(setF).toHaveBeenCalled();

    // Click One-Click Preset: True End 模式
    const trueEndPresetBtn = screen.getByText(/True End 模式/);
    act(() => {
      fireEvent.click(trueEndPresetBtn);
    });
    expect(setF).toHaveBeenCalled();
  });

  it('triggers onClose when clicking close button', () => {
    const onClose = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={0}
        maxPointer={100}
        currentScenario="g01"
        currentDialogueText=""
        speaker=""
        onSeekPointer={vi.fn()}
        onSelectTopic={vi.fn()}
        onClose={onClose}
        language="JP"
        isSidebar={true}
      />
    );

    const closeBtn = screen.getByTitle('Close Navigator');
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('handles novel/story mode sequential lines when stepping backwards and forwards', () => {
    const novelScenarioData = {
      instructions: [
        { type: 'command', name: 'novel', args: {} },
        { type: 'text', text_jp: '十月刚刚过去了一半。', text_en: 'Mid October.' }, // 1
        { type: 'line_feed' }, // 2
        { type: 'text', text_jp: '那天却吹着凛冽的偏北风。', text_en: 'Cold north wind.' }, // 3
        { type: 'line_feed' }, // 4
        { type: 'text', text_jp: '街道随着落日渐渐失去色彩。', text_en: 'Streets lost color.' }, // 5
        { type: 'page_break' }, // 6
        { type: 'text', text_jp: '新的一页开始。', text_en: 'New page begins.' } // 7
      ]
    };

    const onSeekPointer = vi.fn();

    render(
      <StoryNavigator
        initialTab="flipper"
        pointer={5} // At line 5 ("街道随着落日渐渐失去色彩。")
        maxPointer={8}
        currentScenario="g01"
        scenarioData={novelScenarioData}
        currentDialogueText="十月刚刚过去了一半。<br />那天却吹着凛冽的偏北风。<br />街道随着落日渐渐失去色彩。"
        speaker=""
        onSeekPointer={onSeekPointer}
        onSelectTopic={vi.fn()}
        onClose={vi.fn()}
        language="JP"
        isSidebar={true}
      />
    );

    // Step -1 should jump back to line 3
    const stepPrevBtn = screen.getByText('◀ -1');
    act(() => {
      fireEvent.click(stepPrevBtn);
    });
    expect(onSeekPointer).toHaveBeenCalledWith(3);
  });
});
