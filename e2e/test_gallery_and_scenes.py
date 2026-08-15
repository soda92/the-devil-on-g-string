import json
import os
import subprocess
import time
from playwright.sync_api import sync_playwright

def test_gallery_overflow_and_rendering():
    # Load all gallery items to seed unlocked CGs
    gallery_items_path = os.path.join(os.path.dirname(__file__), "../web-app/src/gallery_items.json")
    with open(gallery_items_path, "r", encoding="utf-8") as f:
        gallery_items = json.load(f)

    # Build unlocked SF flags for demo collector user
    demo_sf = {
        "game_clear": 1,
        "kanon_clear": 1,
        "mizuha_clear": 1,
        "tubaki_clear": 1,
        "first": 0,
        "vol": 8,
        "sevol": 8,
        "readScenarios": {
            "gth1": True, "gth2": True, "gthb": True,
            "gkh1": True, "gkh2": True, "gkhb": True,
            "gmh1": True, "gmh2": True,
            "ghh1": True, "ghh2": True
        }
    }

    # Unlock all CG variants
    for item in gallery_items:
        for variant in item.get("variants", []):
            demo_sf[variant] = 1

    demo_username = f"collector_{int(time.time())}"

    # Start Vite dev server
    vite_proc = subprocess.Popen(
        ["pnpm", "dev", "--port", "5173"],
        cwd=os.path.join(os.path.dirname(__file__), "../web-app"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        time.sleep(2)  # Allow Vite dev server to start

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 800})

            # Seed localStorage via init_script BEFORE any page loads
            init_script = f"""
                localStorage.setItem('school_username', '{demo_username}');
                localStorage.setItem('school_sf', JSON.stringify({json.dumps(demo_sf)}));
            """
            context.add_init_script(init_script)

            page = context.new_page()
            page.goto(f"http://localhost:5173/?user={demo_username}")
            page.wait_for_selector(".title-screen-layer", timeout=10000)

            # If any takeover modal appears, click takeover
            takeover_btn = page.locator("button:has-text('强制接管')")
            if takeover_btn.is_visible(timeout=500):
                takeover_btn.click()

            # Click CG 鉴赏 button on Title Screen
            cg_btn = page.locator("button:has-text('CG 鉴赏')")
            assert cg_btn.is_visible(), "CG 鉴赏 button should be visible on Title Screen"
            cg_btn.click()

            # Wait for Gallery Screen
            page.wait_for_selector(".gallery-layer", timeout=5000)

            # 1. Dimension & Overflow Evaluation
            overflow_info = page.evaluate("""() => {
                const layer = document.querySelector('.gallery-layer');
                const grid = document.querySelector('.gallery-grid-container');
                const screen = document.querySelector('.game-screen');
                return {
                    layerWidth: layer.offsetWidth,
                    layerScrollWidth: layer.scrollWidth,
                    layerClientWidth: layer.clientWidth,
                    screenWidth: screen.offsetWidth,
                    gridWidth: grid.offsetWidth,
                    gridScrollWidth: grid.scrollWidth,
                    gridClientWidth: grid.clientWidth,
                    hasLayerOverflow: layer.scrollWidth > layer.clientWidth,
                    hasGridOverflow: grid.scrollWidth > grid.clientWidth
                };
            }""")

            print("\n==========================================")
            print("       GALLERY DIMENSION REPORT          ")
            print("==========================================")
            print(f"Game Screen Host Width : {overflow_info['screenWidth']}px")
            print(f"Gallery Layer Width    : {overflow_info['layerWidth']}px (Client: {overflow_info['layerClientWidth']}px, Scroll: {overflow_info['layerScrollWidth']}px)")
            print(f"Grid Container Width   : {overflow_info['gridWidth']}px (Client: {overflow_info['gridClientWidth']}px, Scroll: {overflow_info['gridScrollWidth']}px)")
            print(f"Layer X-Overflow       : {overflow_info['hasLayerOverflow']}")
            print(f"Grid X-Overflow        : {overflow_info['hasGridOverflow']}")
            print("==========================================\n")

            assert not overflow_info["hasLayerOverflow"], f"Gallery layer has horizontal overflow ({overflow_info['layerScrollWidth']}px > {overflow_info['layerClientWidth']}px)"
            assert not overflow_info["hasGridOverflow"], f"Gallery grid has horizontal overflow ({overflow_info['gridScrollWidth']}px > {overflow_info['gridClientWidth']}px)"
            assert overflow_info["layerWidth"] <= overflow_info["screenWidth"], "Gallery layer should fit within game screen"

            # 2. Test Character Category Filtering
            haru_pill = page.locator("button:has-text('宇佐美 春')")
            assert haru_pill.is_visible()
            haru_pill.click()
            time.sleep(0.5)

            # Take screenshot of CG Gallery
            os.makedirs(os.path.join(os.path.dirname(__file__), "../docs/screenshots"), exist_ok=True)
            page.screenshot(path=os.path.join(os.path.dirname(__file__), "../docs/screenshots/gallery_cg_view.png"))

            # 3. Test Scene Replay Tab
            scenes_tab_btn = page.locator("button:has-text('场景回顾')")
            assert scenes_tab_btn.is_visible()
            scenes_tab_btn.click()
            time.sleep(0.5)

            # Verify Scene Cards are rendered
            scene_cards = page.locator(".gallery-layer .glass-panel")
            assert scene_cards.count() > 0, "Scene Replay cards should be rendered"

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "../docs/screenshots/gallery_scenes_view.png"))

            # Click on 'Back to Title'
            back_btn = page.locator("button:has-text('返回主菜单')")
            assert back_btn.is_visible()
            back_btn.click()

            page.wait_for_selector(".title-screen-layer", timeout=5000)
            print("✔ Playwright E2E verification successfully passed! Zero horizontal overflow detected.")

            browser.close()
    finally:
        vite_proc.terminate()

if __name__ == "__main__":
    test_gallery_overflow_and_rendering()
