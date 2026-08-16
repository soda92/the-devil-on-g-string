# Sprite Layering & Composite Face Overlay

To conserve memory and bandwidth, visual novels store character base bodies and facial expression overlays as separate image layers.

---

## 🧩 Position Metadata (`sprite_positions.json`)

The engine reads `sprite_positions.json` to composite facial overlays on top of base bodies:

```json
{
  "st_har_01_a": {
    "base": "st_har_01",
    "base_h": 1120,
    "base_w": 630,
    "left_pct": 36.2,
    "top_pct": 12.5,
    "width_pct": 27.6
  }
}
```

---

## 🎨 Rendering Logic (`GameplayScreen.tsx`)

Inside the `<Sprite />` subcomponent:
1. Resolves `base` body image URL via `resolveAsset(positionInfo.base, 'fgimage')`.
2. Resolves overlay face image URL via `resolveAsset(spriteName, 'fgimage')`.
3. Positions the overlay with CSS percentage coordinates (`left_pct`, `top_pct`, `width_pct`) relative to the base body container.
4. Scales character sprite height to standard 580px viewport height proportionally.
