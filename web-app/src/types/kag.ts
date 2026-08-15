export type DialogueMode = 'avg' | 'novel';
export type GameState = 'TITLE' | 'PLAYING' | 'SETTINGS' | 'GALLERY' | 'MUSIC' | 'FLOWCHART';
export type Language = 'JP' | 'EN';

declare global {
  interface Window {
    quick_check?: () => any;
  }
}

export interface KagInstruction {
  type: 'command' | 'text' | 'target' | 'label' | 'comment' | 'eval' | 'select' | 'choice' | 'line_feed' | 'page_break' | 'wait_click' | 'clear_text' | 'link_start' | 'if' | 'endif' | string;
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
  [key: string]: any;
}

export interface ChoiceOption {
  text_jp?: string;
  text_en?: string;
  target: string;
  exp?: string;
  cond?: string;
  [key: string]: any;
}

export interface SelectedOptionInfo {
  jp?: string;
  en?: string;
  target?: string;
  exp?: string;
  [key: string]: any;
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
  [key: string]: any;
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
  vol?: number;
  sevol?: number;
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
  readScenarios?: Record<string, Record<string | number, boolean>>;
  show_next_chapter?: boolean | number;
  game_clear?: number;
  tubaki_clear?: number;
  kanon_clear?: number;
  mizuha_clear?: number;
  disableWheelHistory?: boolean;
  typewriterMode?: 'CHAR' | 'LINE' | string;
  avgOpacity?: number;
  avgBlur?: number;
  novelOpacity?: number;
  novelBlur?: number;
  first?: number;
  [key: string]: any;
}

export interface GameVariables {
  choicesHistory?: ChoiceHistoryItem[];
  chour?: number;
  flag_tubaki?: number;
  flag_kanon?: number;
  flag_mizuha?: number;
  flag_haru?: number;
  faceRecord?: Record<string, string>;
  [key: string]: any;
}

export interface CallStackFrame {
  scenario: string;
  pointer: number;
}

export interface HistoryLogItem {
  id?: string | number;
  speaker: string;
  speakerJp?: string;
  speakerEn?: string;
  speaker_jp?: string;
  speaker_en?: string;
  dialogueText?: string;
  text?: string;
  textJp?: string;
  textEn?: string;
  text_jp?: string;
  text_en?: string;
  voice?: string;
  snapshot: any;
  [key: string]: any;
}

export interface SaveSlotData {
  slotId?: number | string;
  f: GameVariables;
  choicesHistory?: any[];
  sprites: SpritesState | Record<string | number, any>;
  background: string;
  speaker: string;
  currentSpeaker?: { jp: string; en: string };
  currentVoice?: string;
  dialogueText: string;
  dialogueMode: DialogueMode | string;
  language: Language | string;
  currentScenario: string;
  pointer: number;
  showOptions?: any;
  historyLog?: any[];
  bgm?: string | null;
  callStack?: CallStackFrame[];
  date?: string;
  timestamp?: number;
  note?: string;
  pinned?: boolean;
  [key: string]: any;
}
