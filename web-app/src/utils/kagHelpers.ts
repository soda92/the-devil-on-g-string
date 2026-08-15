import translationImprovements from './translation_improvements.json';
import { KagInstruction, GameVariables } from '../types/kag';

// --- Translation Improvements Overlay ---
export const applyTranslationImprovements = (instructions: KagInstruction[] | undefined): KagInstruction[] | undefined => {
  if (!instructions) return instructions;
  const typedImprovements = translationImprovements as Record<string, string>;
  return instructions.map(inst => {
    if (inst.type === 'text') {
      const patched = { ...inst };
      if (inst.text_jp && typedImprovements[inst.text_jp]) {
        patched.text_jp = typedImprovements[inst.text_jp];
      }
      if (inst.text_en && typedImprovements[inst.text_en]) {
        patched.text_en = typedImprovements[inst.text_en];
      }
      return patched;
    }
    return inst;
  });
};

// --- Miniface Face Icon Helper Functions ---
export const getStNameHead = (name: string | undefined): string => {
  if (!name) return '';
  const trimmed = name.trim();
  switch (trimmed) {
    case 'ハル':
    case '春':
    case '宇佐美':
      return 'haru';
    case '椿姫':
    case '椿姬':
    case '白鸟':
      return 'tuba';
    case '花音':
      return 'kano';
    case '水羽':
      return 'mizu';
    case 'ユキ':
    case '由岐':
    case '雪':
      return 'yuki';
    case '栄一':
    case '荣一':
      return 'eiic';
    case '浅井権三':
    case '浅井权三':
      return 'gonz';
    case '広明':
    case '广明':
      return 'hiro';
    case '郁子':
      return 'ikuk';
    case '恭平':
    case 'まおう':
    case '魔王':
      return 'maou';
    default:
      return '';
  }
};

export const getFaceIcon = (speakerName: string | undefined, currentF: GameVariables): string | null => {
  if (!speakerName) return null;
  const head = getStNameHead(speakerName);
  if (!head) return null;

  const faceRecord = currentF?.faceRecord || {};
  const activeSprite = faceRecord[head];
  if (!activeSprite) return null;

  let faceName = activeSprite;
  if (faceName.endsWith('_b')) {
    faceName = faceName.slice(0, -2) + '_f';
  } else if (faceName.endsWith('_s')) {
    faceName = faceName.slice(0, -2) + '_f';
  } else if (!faceName.endsWith('_f')) {
    faceName = faceName + '_f';
  }

  return faceName;
};

// --- Programmatic Scenario Backtracking for Deep Links ---
export const getPrecedingScenario = (name: string | null | undefined): string | null => {
  if (!name) return null;
  if (name === 'gt01') return 'g23';
  if (name === 'gk01') return 'g34';
  if (name === 'gm01') return 'g42';

  const match = name.match(/^([a-zA-Z]+)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    if (num > 1) {
      const prevNum = String(num - 1).padStart(2, '0');
      return `${prefix}${prevNum}`;
    }
  }
  return null;
};

export const backtrackScenarioState = async (
  scenName: string | null | undefined, 
  depth = 0
): Promise<{ bg: string; bgm: string }> => {
  const state = { bg: 'white', bgm: '' };
  if (depth >= 3 || !scenName) return state;
  const prevScen = getPrecedingScenario(scenName);
  if (!prevScen) return state;

  try {
    const response = await fetch(`/scenarios/${prevScen}.json`);
    if (!response.ok) return state;
    const prevData = await response.json();

    let foundBg = false;
    let foundBgm = false;

    for (let i = prevData.instructions.length - 1; i >= 0; i--) {
      const inst = prevData.instructions[i];
      if (inst.type === 'command') {
        if (!foundBg && (inst.name === 'bg' || inst.name === 'back' || inst.name === 'image')) {
          if (inst.name === 'image' && inst.args?.storage && inst.args?.layer === 'base') {
            state.bg = inst.args.storage;
            foundBg = true;
          } else if (inst.name !== 'image' && inst.args?.storage) {
            state.bg = inst.args.storage;
            foundBg = true;
          }
        } else if (!foundBg && inst.name === 'black') {
          state.bg = 'black';
          foundBg = true;
        } else if (!foundBgm && inst.name === 'bgm') {
          if (inst.args?.storage) {
            state.bgm = inst.args.storage;
            foundBgm = true;
          }
        } else if (!foundBgm && (inst.name === 'fobgm' || inst.name === 'stopbgm')) {
          state.bgm = '';
          foundBgm = true;
        }
      }
      if (foundBg && foundBgm) break;
    }

    if (!foundBg || !foundBgm) {
      const deeperState = await backtrackScenarioState(prevScen, depth + 1);
      if (!foundBg) state.bg = deeperState.bg;
      if (!foundBgm) state.bgm = deeperState.bgm;
    }

    return state;
  } catch (e) {
    console.warn("Backtrack failed for", prevScen, e);
    return state;
  }
};
