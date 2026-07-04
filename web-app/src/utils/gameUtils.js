import fileMap from '../file_map.json';

// --- Asset Resolution Helper ---
export const resolveAsset = (filename, defaultFolder = '') => {
  if (!filename) return '';
  const cleanName = filename.split('.')[0]; // strip extension
  const mapped = fileMap[cleanName];
  if (mapped) return mapped;
  
  if (defaultFolder) {
    if (filename.includes('.')) return `/${defaultFolder}/${filename}`;
    const ext = defaultFolder === 'bgm' ? '.ogg' : (defaultFolder === 'sound' ? '.wav' : '.png');
    return `/${defaultFolder}/${filename}${ext}`;
  }
  return filename;
};

// --- Character Name Parody translation map ---
const CHARACTER_NAME_MAP = {
  "野草": "Takano",
  "wildflowers": "Takano",
  "芽花沢": "Sawachika",
  "Mehanazawa": "Sawachika",
  "mehanazawa": "Sawachika",
  "周王": "Suo",
  "King of Zhou": "Suo",
  "天麻": "Tenma",
  "夜雲": "Yakumo",
  "night clouds": "Yakumo",
  "Yugumo": "Yakumo",
  "yugumo": "Yakumo",
  "張間": "Harima",
  "華井": "Hanai",
  "いいんちょ": "Class Rep",
  "Iincho": "Class Rep",
  "須加乃": "Sagano",
  "Sukano": "Sagano",
  "今鶏": "Imadori",
  "chicken now": "Imadori",
  "姉ヶ咲": "Taeko",
  "妹ヶ咲": "Imegasaki"
};

export const resolveCharacterName = (name, lang) => {
  if (!name) return '';
  if (lang === 'EN') {
    const trimmed = name.trim();
    if (CHARACTER_NAME_MAP[trimmed]) {
      return CHARACTER_NAME_MAP[trimmed];
    }
  }
  return name;
};

// --- Text Tokenization for Typewriter (char-by-char for JP, word-by-word for EN) ---
export const tokenizeText = (text, lang) => {
  const tokens = [];
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
