# Bilingual Typewriter & Tokenization

The engine includes a specialized bilingual typewriter effect that adapts dynamically to Japanese and English text structures.

---

## 🔤 Tokenization Strategy (`src/utils/gameUtils.ts`)

Standard string indexing breaks English words into fragmented letters and corrupts inline HTML markup (like `<span class="ruby">`). The `tokenizeText` utility solves this by splitting sentences into semantic tokens:

```typescript
export const tokenizeText = (text: string, lang?: Language | string): string[] => {
  // 1. Treats <tag ...> HTML markup as an atomic single token (renders instantly)
  // 2. For English ('EN'): Groups words with leading spaces as atomic tokens
  // 3. For Japanese ('JP'): Groups character-by-character
};
```

### English Word-by-Word Mode
Instead of typing `T`, `h`, `i`, `s`, it outputs `This`, ` is`, ` the`, ` sentence.` preventing broken half-words on line wraps.

### Japanese Character-by-Character Mode
Types Japanese text glyph-by-glyph at 30ms intervals.

---

## 🏎️ Instant Skip & Fast Completion

- **Screen Click during Typewriter**: If the user clicks while the typewriter is actively typing, the engine immediately completes the sentence to full length.
- **Instant Mode (`sf.typewriterMode === 'OFF'`)**: Typewriter animation is bypassed, displaying text immediately.
- **Fast-Forward (`isFastForward === true`)**: Bypasses the typewriter delay and proceeds at 80ms ticks.
