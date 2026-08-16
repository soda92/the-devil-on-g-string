# Expression Evaluation & Sandboxing

KAG scripts embed TJS / JavaScript expressions inside `cond="..."` command arguments and `[eval exp="..."]` tags.

---

## 🧼 Syntax Normalization (`cleanKagExpression`)

Original KAG scripts often surround variable names with square brackets (e.g. `[f.flag_haru]` or `[sf.unlocked]`). The `cleanKagExpression` helper in `src/utils/kagEvaluator.ts` removes bracket wrappers and normalizes operator aliases:

```typescript
export const cleanKagExpression = (exp: string): string => {
  if (!exp) return '';
  return exp
    .replace(/\[(sf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
    .replace(/\[(f\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1')
    .replace(/\[(tf\.[a-zA-Z0-9_\u4e00-\u9fff\uff00-\uffff]+)\]/g, '$1');
};
```

---

## 🔒 Safe Evaluation Sandboxing

Expressions are evaluated in scoped functions that only receive `{ f, sf, tf }`, preventing unintended access to DOM or global window APIs:

```typescript
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
```
