export type DialogueMode = 'avg' | 'novel';
export type GameState = 'TITLE' | 'PLAYING' | 'SETTINGS' | 'GALLERY' | 'MUSIC' | 'FLOWCHART';
export type Language = 'JP' | 'EN';

export interface KagInstruction {
  type: 'command' | 'text' | 'target' | 'eval' | 'select' | 'line_feed' | 'page_break' | string;
  name?: string;
  args?: Record<string, any>;
  text_jp?: string;
  text_en?: string;
  speaker?: string;
  options?: Array<{
    target: string;
    text_jp?: string;
    text_en?: string;
    exp?: string;
    cond?: string;
  }>;
  exp?: string;
}

export interface ChoiceOption {
  text_jp?: string;
  text_en?: string;
  target: string;
  exp?: string;
  cond?: string;
}

export interface SelectedOptionInfo {
  jp?: string;
  en?: string;
  target?: string;
  exp?: string;
}

export interface ChoiceHistoryItem {
  scenario: string;
  pointer: number;
  selectedOption: SelectedOptionInfo;
  options: Array<{
    jp: string;
    en: string;
    target: string;
    exp?: string;
  }>;
  snapshot: any;
}

export interface SpritesState {
  0: string | null;
  1: string | null;
  2: string | null;
  [key: number]: string | null;
}

export interface SystemFlags {
  bgmVol?: number;
  seVol?: number;
  voiceVol?: number;
  autoSpeed?: number;
  textSpeed?: number;
  bgmDisabled?: boolean;
  seDisabled?: boolean;
  voiceDisabled?: boolean;
  textAlpha?: number;
  vAlign?: 'TOP' | 'CENTER' | 'BOTTOM';
  hAlign?: 'LEFT' | 'CENTER' | 'RIGHT';
  immerseMode?: boolean;
  skipMode?: 'READ_ONLY' | 'ALL';
  readScenarios?: Record<string, Record<number, boolean>>;
  show_next_chapter?: boolean;
  game_clear?: number;
  tubaki_clear?: number;
  kanon_clear?: number;
  mizuha_clear?: number;
  disableWheelHistory?: boolean;
  [key: string]: any;
}

export interface GameVariables {
  choicesHistory?: ChoiceHistoryItem[];
  chour?: number;
  flag_tubaki?: number;
  flag_kanon?: number;
  flag_mizuha?: number;
  flag_haru?: number;
  [key: string]: any;
}

export interface CallStackFrame {
  scenario: string;
  pointer: number;
}

export interface HistoryLogItem {
  id: string | number;
  speaker: string;
  speakerJp?: string;
  speakerEn?: string;
  dialogueText: string;
  textJp?: string;
  textEn?: string;
  voice?: string;
  snapshot: any;
}

export interface SaveSlotData {
  slotId?: number | string;
  f: GameVariables;
  choicesHistory?: any[];
  sprites: SpritesState;
  background: string;
  speaker: string;
  currentSpeaker?: { jp: string; en: string };
  currentVoice: string;
  dialogueText: string;
  dialogueMode: DialogueMode;
  language: Language;
  currentScenario: string;
  pointer: number;
  showOptions?: ChoiceOption[] | null;
  historyLog?: any[];
  bgm?: string | null;
  callStack?: CallStackFrame[];
  date: string;
  timestamp: number;
}
