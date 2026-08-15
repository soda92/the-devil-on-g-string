import fileMap from '../file_map.json';
import { Language } from '../types/kag';

const typedFileMap: Record<string, string> = fileMap as Record<string, string>;

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
