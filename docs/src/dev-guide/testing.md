# Unit & Integration Testing

The project uses **Vitest** and **React Testing Library** for automated testing.

---

## 🧪 Running Tests

```bash
# Run unit tests once
pnpm test

# Run tests in watch mode
pnpm vitest
```

---

## 📋 Test Coverage (`src/__tests__/App.test.tsx`)

The test suite contains 18 comprehensive tests verifying:
- **Title Screen & Audio Mute Preference**: Verifies title screen mute isolation from gameplay BGM.
- **Deep-Link State Reconstruction**: Verifies pointer snapping and backward state recovery.
- **Leading Line Feed Stripping**: Confirms `<br />` tags are not prepended to fresh dialogue boxes.
- **Backlog Snapshot Rewind**: Confirms text is not duplicated upon rewinding.
- **Chapter Transition & Slot 150**: Tests automated transition from Chapter 1 (`g06`) to Chapter 2 (`g07`).
- **Keyboard Shortcuts**: Tests full hotkey matrix (`KeyC`, `KeyS`, `KeyL`, `KeyF`, `KeyA`, `KeyH`, `Semicolon`, `KeyQ`).
- **Choice Branches & Flowchart**: Tests `exlink` and `showexlink` variable mutations.
- **Skip Mode Halting**: Tests stopping fast-forward upon encountering unread sentences in `READ_ONLY` mode.
