"""
Standalone Playwright Inspection Utility for G-String Visual Novel Engine.
Used for visual inspection, DOM dimension reporting, and debug screenshots.
Run with: uv run python e2e/inspect_gallery.py
"""

import json
import os
import time
from playwright.sync_api import sync_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCREENSHOTS_DIR = os.path.join(ROOT_DIR, "docs/screenshots")

def run_inspection(target_url: str = "http://localhost:5173"):
    gallery_items_path = os.path.join(ROOT_DIR, "web-app/src/gallery_items.json")
    with open(gallery_items_path, "r", encoding="utf-8") as f:
        gallery_items = json.load(f)

    # Seed flags
    demo_sf = {
        "game_clear": 1, "kanon_clear": 1, "mizuha_clear": 1, "tubaki_clear": 1,
        "first": 0, "vol": 8, "sevol": 8,
        "readScenarios": {
            "gth1": True, "gth2": True, "gthb": True,
            "gkh1": True, "gkh2": True, "gkhb": True,
            "gmh1": True, "gmh2": True, "ghh1": True, "ghh2": True
        }
    }
    for item in gallery_items:
        for variant in item.get("variants", []):
            demo_sf[variant] = 1

    demo_username = "inspector_demo"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})

        # Inject user profile
        context.add_init_script(f"""
            localStorage.setItem('school_username', '{demo_username}');
            localStorage.setItem('school_sf', JSON.stringify({json.dumps(demo_sf)}));
        """)

        page = context.new_page()
        page.goto(f"{target_url}/?user={demo_username}")
        page.wait_for_selector(".title-screen-layer", timeout=10000)

        # Open Gallery
        page.locator("button:has-text('CG 鉴赏')").click()
        page.wait_for_selector(".gallery-layer", timeout=5000)

        # Report Dimensions
        metrics = page.evaluate("""() => {
            const screen = document.querySelector('.game-screen');
            const layer = document.querySelector('.gallery-layer');
            const grid = document.querySelector('.gallery-grid-container');
            return {
                screenWidth: screen ? screen.offsetWidth : 0,
                layerWidth: layer ? layer.offsetWidth : 0,
                layerScrollWidth: layer ? layer.scrollWidth : 0,
                layerClientWidth: layer ? layer.clientWidth : 0,
                gridWidth: grid ? grid.offsetWidth : 0,
                gridScrollWidth: grid ? grid.scrollWidth : 0,
                gridClientWidth: grid ? grid.clientWidth : 0,
                layerXOverflow: layer ? layer.scrollWidth > layer.clientWidth : false,
                gridXOverflow: grid ? grid.scrollWidth > grid.clientWidth : false
            };
        }""")

        print("\n==========================================")
        print("       GALLERY LAYOUT REPORT             ")
        print("==========================================")
        print(f"Screen Container Width : {metrics['screenWidth']}px")
        print(f"Gallery Layer Width    : {metrics['layerWidth']}px (Client: {metrics['layerClientWidth']}px, Scroll: {metrics['layerScrollWidth']}px)")
        print(f"Grid Container Width   : {metrics['gridWidth']}px (Client: {metrics['gridClientWidth']}px, Scroll: {metrics['gridScrollWidth']}px)")
        print(f"Horizontal Overflow    : Layer={metrics['layerXOverflow']}, Grid={metrics['gridXOverflow']}")
        print("==========================================\n")

        # Save screenshots
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "inspect_cg_gallery.png"))

        # Switch to Scene Replay & Filter Mizuha
        page.locator("button:has-text('场景回顾')").click()
        time.sleep(0.3)
        page.locator("button:has-text('白鸟水羽')").click()
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "inspect_scenes_mizuha.png"))

        print("✔ Inspection screenshots saved to docs/screenshots/")
        browser.close()

if __name__ == "__main__":
    run_inspection()
