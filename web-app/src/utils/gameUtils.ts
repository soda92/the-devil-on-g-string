import fileMap from '../file_map.json';
import scenarioBgMap from '../scenario_bg_map.json';
import { Language } from '../types/kag';

const typedFileMap: Record<string, string> = fileMap as Record<string, string>;
const typedScenarioBgMap: Record<string, string> = scenarioBgMap as Record<string, string>;

// --- Asset Resolution Helper ---
export const resolveAsset = (filename?: string | null, defaultFolder = ''): string => {
  if (!filename) return '';
  const cleanName = filename.split('.')[0]; // strip extension
  
  let mapped = typedFileMap[cleanName];
  if (!mapped) {
    mapped = typedFileMap['st_' + cleanName];
  }
  if (mapped) return mapped;
  
  if (defaultFolder) {
    if (filename.includes('.')) return `/${defaultFolder}/${filename}`;
    const ext = defaultFolder === 'bgm' ? '.ogg' : (defaultFolder === 'sound' ? '.wav' : '.png');
    return `/${defaultFolder}/${filename}${ext}`;
  }
  return filename;
};

// --- Scene Thumbnail Resolution Helper (skips pure black to first meaningful visual) ---
export const getSceneThumbnailAsset = (bg?: string | null, scenario?: string | null): string => {
  if (bg && bg !== 'black' && bg !== 'white') {
    return resolveAsset(bg, 'bgimage');
  }
  if (scenario && typedScenarioBgMap[scenario]) {
    return resolveAsset(typedScenarioBgMap[scenario], 'bgimage');
  }
  if (bg) {
    return resolveAsset(bg, 'bgimage');
  }
  return '';
};

// --- Character Name translation resolution ---
export const resolveCharacterName = (
  name?: string | null,
  lang?: Language | string,
  nameMap: Record<string, string> = {}
): string => {
  if (!name) return '';
  if (lang === 'EN') {
    const trimmed = name.trim();
    if (nameMap && nameMap[trimmed]) {
      return nameMap[trimmed];
    }
  }
  return name;
};

// --- Text Tokenization for Typewriter (char-by-char for JP, word-by-word for EN) ---
export const tokenizeText = (text: string, lang?: Language | string): string[] => {
  const tokens: string[] = [];
  let index = 0;
  const length = text.length;

  while (index < length) {
    // Treat HTML tags as a single token to render instantly
    if (text[index] === '<') {
      const closeIdx = text.indexOf('>', index);
      if (closeIdx !== -1) {
        tokens.push(text.substring(index, closeIdx + 1));
        index = closeIdx + 1;
        continue;
      }
    }

    if (lang === 'EN') {
      let wordBuffer = '';
      
      // Group space separator inside the word token
      while (index < length && text[index] === ' ' && text[index] !== '<') {
        wordBuffer += text[index];
        index++;
      }
      
      // Capture word characters
      while (index < length && text[index] !== ' ' && text[index] !== '<') {
        wordBuffer += text[index];
        index++;
      }
      
      if (wordBuffer) {
        tokens.push(wordBuffer);
      }
    } else {
      // Japanese / char-by-char
      tokens.push(text[index]);
      index++;
    }
  }

  return tokens;
};

// --- Sensitive / H-Scene Asset Detector ---
export const isSensitiveAsset = (assetName?: string | null, scenarioName?: string | null): boolean => {
  if (!assetName && !scenarioName) return false;
  const a = (assetName || '').toLowerCase();
  const s = (scenarioName || '').toLowerCase();
  const fallbackBg = scenarioName && typedScenarioBgMap[scenarioName] ? typedScenarioBgMap[scenarioName].toLowerCase() : '';

  // 1. Explicit H-scene image identifiers
  if (
    a.includes('_h_') ||
    a.includes('_h0') ||
    a.includes('_h1') ||
    a.includes('_h2') ||
    a.startsWith('h_') ||
    a.endsWith('_h') ||
    a.includes('ev_haru_h') ||
    a.includes('ev_kanon_h') ||
    a.includes('ev_tubaki_h') ||
    a.includes('ev_mizuha_h') ||
    fallbackBg.includes('_h_') ||
    fallbackBg.includes('ev_haru_h') ||
    fallbackBg.includes('ev_kanon_h') ||
    fallbackBg.includes('ev_tubaki_h') ||
    fallbackBg.includes('ev_mizuha_h')
  ) {
    return true;
  }

  // 2. Scenario specific H-scenes (including Bad End versions gthb, gkhb)
  if (
    s.includes('_h') ||
    s.endsWith('h') ||
    s.includes('h1') ||
    s.includes('h2') ||
    s.includes('hb') ||
    s.startsWith('gt08') ||
    s.startsWith('gk07') ||
    s.startsWith('gm08')
  ) {
    return true;
  }

  return false;
};
