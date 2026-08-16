# CG Gallery & Scene Replay Mode

The engine includes a dedicated **Gallery & Memories Hub** ([`GalleryScreen.tsx`](file:///home/soda/Downloads/G%E5%BC%A6%E4%B8%8A%E7%9A%84%E9%AD%94%E7%8E%8B/web-app/src/components/GalleryScreen.tsx)) with two complementary modes:

---

## 🎨 1. CG Gallery (`CG 鉴赏`)

- **Character & Story Categories**: Filter illustrations by character (🎻 宇佐美春, 🌸 宇佐美椿姬, ❄️ 美轮花音, 🍁 白鸟水羽, 🎭 魔王, 🏙️ 剧情事件).
- **Live Unlock Progression**: Real-time unlock ratio indicators for every character tab.
- **Multi-Variant Slideshow**: Fullscreen viewer supporting keyboard navigation (`Arrow Right`, `Arrow Left`, `Space`, `Enter`, `Esc`) to cycle through expressions, lighting, and cut-in variations.
- **📖 Jump to Dialogue from CG**: Pre-indexed mapping (`cg_scenario_map.json`, 308 mapped variants) enabling one-click deep jumps from any CG directly to the exact story dialogue moment with full state reconstruction via the engine's Pre-Scanner.
- **Privacy Shield**: Adult / H-scene illustrations are automatically blurred by default (`filter: blur(10px) brightness(0.6)`) and feature interactive click-to-reveal.

---

## 🎬 2. Special Scene Replay (`场景回顾`)

- **Categorized Story Replay**: Browse and jump into all 10 intimate story scenes across the 4 heroines:
  - 🌸 **宇佐美 椿姬**: `gth1` (初夜 · 誓言之夜), `gth2` (恋人们的温存), `gthb` (坏结局特别篇)
  - ❄️ **美轮 花音**: `gkh1` (冰场后的秘密), `gkh2` (相互依偎的温度), `gkhb` (坏结局特别篇)
  - 🍁 **白鸟 水羽**: `gmh1` (属于两人的房间), `gmh2` (心意相通之夜)
  - 🎻 **宇佐美 春**: `ghh1` (真实的情感与温度), `ghh2` (决战前夕的约定)
- **Direct Playback Routing**: Clicking `▶️ 回顾场景 / Replay Scene` sets `isSceneReplayMode = true` and launches full voiced interactive gameplay.
- **Replay Navigation**:
  - Displays a floating `🎬 场景回顾中 · [⬅️ 返回鉴赏]` badge in the upper right.
  - Quitting or finishing the scenario automatically routes the user back to the Gallery Screen rather than the main title.
