# KAG Bytecode & Scenario Format

The game scenarios are pre-parsed from original KiriKiri Adventure Game (KAG) `.ks` script files into structured JSON files located under `public/scenarios/<scenario_name>.json`.

---

## 📜 Instruction Types

Each scenario JSON contains an array of `instructions`. Each instruction matches one of the following schemas:

### 1. `text` (Dialogue Line)
Represents a line of narration or dialogue spoken by a character.
```json
{
  "type": "text",
  "text_jp": "「初めまして、浅井京介君。」",
  "text_en": "“Nice to meet you, Kyousuke Azai.”"
}
```

### 2. `command` (Engine Command)
Executes an engine directive (e.g. background change, sprite change, sound playback, jump, call).
```json
{
  "type": "command",
  "name": "bg",
  "args": {
    "storage": "bg_02a",
    "time": 800
  }
}
```

Common commands:
- **`bg`**: Change background image (`storage`).
- **`chr` / `cl` / `cl_a`**: Change character sprite at position (`c`, `l`, `r`) or clear sprites.
- **`nm` / `name`**: Set current speaker name (`t` / `txt`) and associated voice clip (`s`).
- **`playbgm` / `bgm` / `fadeinbgm`**: Start playing BGM track (`storage`).
- **`stbgm` / `stopbgm` / `fadeoutbgm`**: Stop BGM playback.
- **`playse` / `se`**: Play sound effect (`storage`).
- **`jump`**: Jump to a scenario (`storage`) or target label (`target`).
- **`call` / `return`**: Subroutine call and return via call-stack.
- **`exlink` / `showexlink`**: Define branching choices and display choice selection overlay.
- **`quake` / `flash`**: Screen shake and camera flash visual effects.
- **`avg` / `novel`**: Switch dialogue display mode.

### 3. `eval` (Expression Evaluation)
Executes an inline JavaScript/KAG expression mutating `f`, `sf`, or `tf` variables.
```json
{
  "type": "eval",
  "exp": "f.flag_tubaki = f.flag_tubaki + 1"
}
```

### 4. `page_break` & `clear_text`
Clears dialogue box contents and resets speaker name/voice for monologues.
```json
{
  "type": "page_break"
}
```

### 5. `line_feed`
Appends a `<br />` line break in the active dialogue box.

### 6. `label`
Defines a jump target marker within the scenario.
```json
{
  "type": "label",
  "name": "*scene_start"
}
```

### 7. `wait_click`
Pauses script execution until the user clicks or presses Advance/Enter.
