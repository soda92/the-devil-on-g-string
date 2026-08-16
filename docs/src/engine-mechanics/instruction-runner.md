# Instruction Runner Loop

The core execution loop in `useKagRunner.ts` processes scenario bytecode instructions step-by-step.

---

## 🏃 The Execution Loop Algorithm

When `gameState === 'PLAYING'` and `isWaiting === false`, the runner evaluates instructions starting at `pointer`:

```typescript
while (p < scenarioData.length && !shouldBlock) {
  const inst = scenarioData[p];
  
  // 1. Check Condition Flag
  if (inst.args?.cond && !evaluateExpression(inst.args.cond, newF, newSf, newTf)) {
    p++;
    continue;
  }

  // 2. Process Command / Text / Evaluation
  switch (inst.type) {
    case 'text':
      // Update dialogue text and typewriter
      // Set shouldBlock = true to halt and wait for user click
      break;

    case 'command':
      // Handle bg, chr, playbgm, jump, call, etc.
      break;

    case 'eval':
      // Execute statement mutating newF / newSf / newTf
      break;

    case 'page_break':
      // Clear textbox, reset speaker and voice
      break;
  }

  p++;
}
```

---

## 🛑 Halting Conditions (`shouldBlock`)

The runner continues executing consecutive commands synchronously in a single tick until it hits a **halting condition**:

1. **`text` line**: Displays dialogue and waits for user click (`isWaiting = true`).
2. **`wait_click` command**: Pauses until user click.
3. **`showexlink` / `select` command**: Displays choice options modal and halts until the user makes a choice.
4. **`jump` / `call` to another scenario**: Triggers asynchronous fetch of the new scenario file.
5. **Special Chapter Handoffs**: Saving to Slot 150 and redirecting to the title screen.
