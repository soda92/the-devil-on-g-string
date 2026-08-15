export const formatRubyTags = (rawText: string): string => {
  if (!rawText) return '';
  // Transform @ruby2 text="kanji" ruby="furigana" into HTML <ruby> tags
  return rawText.replace(/@ruby2\s+text="([^"]+)"\s+ruby="([^"]+)"/g, '<ruby>$1<rt>$2</rt></ruby>');
};

export const stripRubyTags = (rawText: string): string => {
  if (!rawText) return '';
  return rawText.replace(/@ruby2\s+text="([^"]+)"\s+ruby="([^"]+)"/g, '$1');
};

export const appendDialogueText = (
  prevText: string,
  newText: string,
  mode: 'avg' | 'novel'
): string => {
  if (!prevText) return newText;
  if (mode === 'novel') {
    const separator = (prevText.endsWith('<br />') || prevText.endsWith('<br/>')) ? '' : '<br />';
    return prevText + separator + newText;
  }
  return prevText + newText;
};
