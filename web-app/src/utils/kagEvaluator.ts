import { GameVariables, SystemFlags, ChoiceHistoryItem, HistoryLogItem } from '../types/kag';

export const cleanKagExpression = (exp: string): string => {
  if (!exp) return '';
  return exp
    .replace(/\[(sf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
    .replace(/\[(f\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
    .replace(/\[(tf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1');
};

export const evaluateExpression = (
  exp: string | undefined | null,
  currentF: GameVariables,
  currentSf: SystemFlags,
  currentTf: Record<string, any>
): boolean => {
  if (!exp) return true;
  try {
    const cleaned = cleanKagExpression(exp);
    const func = new Function('f', 'sf', 'tf', `return (${cleaned});`);
    return Boolean(func(currentF, currentSf, currentTf));
  } catch (e) {
    console.error("Expression evaluation failed:", exp, e);
    return false;
  }
};

export const executeStatement = (
  exp: string | undefined | null,
  f: GameVariables,
  sf: SystemFlags,
  tf: Record<string, any>,
  callbacks: {
    setF: React.Dispatch<React.SetStateAction<GameVariables>>;
    setTf: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    updateSf: (updater: (prev: SystemFlags) => SystemFlags) => void;
    setSf: React.Dispatch<React.SetStateAction<SystemFlags>>;
  }
): void => {
  if (!exp) return;
  try {
    const tempF = { ...f };
    const tempSf = { ...sf };
    const tempTf = { ...tf };
    const cleaned = cleanKagExpression(exp);

    const func = new Function('f', 'sf', 'tf', `${cleaned}; return { f, sf, tf };`);
    const result = func(tempF, tempSf, tempTf);

    if (result) {
      if (JSON.stringify(result.f) !== JSON.stringify(f)) {
        callbacks.setF(result.f);
      }
      if (JSON.stringify(result.sf) !== JSON.stringify(sf)) {
        callbacks.updateSf(() => result.sf);
      } else {
        callbacks.setSf(result.sf);
      }
      if (JSON.stringify(result.tf) !== JSON.stringify(tf)) {
        callbacks.setTf(result.tf);
      }
    }
  } catch (e) {
    console.error("Statement execution failed:", exp, e);
  }
};

export const cleanFForSnapshot = (sourceF: GameVariables): GameVariables => {
  if (!sourceF) return {};
  const cleaned: GameVariables = { ...sourceF };
  delete cleaned.choicesHistory;
  return cleaned;
};

export const cleanChoicesHistoryForSave = (history: ChoiceHistoryItem[] | undefined): any[] => {
  if (!Array.isArray(history)) return [];
  return history.map(item => {
    const cleanedItem = { ...item };
    if (cleanedItem.snapshot && cleanedItem.snapshot.f) {
      cleanedItem.snapshot = {
        ...cleanedItem.snapshot,
        f: cleanFForSnapshot(cleanedItem.snapshot.f)
      };
    }
    return cleanedItem;
  });
};

export const cleanHistoryLogForSave = (log: HistoryLogItem[] | undefined): any[] => {
  if (!Array.isArray(log)) return [];
  return log.map(item => {
    const copy = { ...item };
    if (copy.snapshot && copy.snapshot.f) {
      copy.snapshot = {
        ...copy.snapshot,
        f: cleanFForSnapshot(copy.snapshot.f)
      };
    }
    return copy;
  });
};

export const stripHistoryForLocalStorage = (saveData: any): any => {
  if (!saveData) return saveData;
  const copy = { ...saveData };
  if (copy.historyLog && copy.historyLog.length > 50) {
    copy.historyLog = copy.historyLog.slice(-50);
  }
  return copy;
};
