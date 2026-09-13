import json
from pathlib import Path
from playwright.sync_api import sync_playwright
checks={}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1024,'height':600})
    page.goto('http://127.0.0.1:4173',wait_until='networkidle')
    page.locator('[data-station="rope-yard"]').click();page.locator('#begin-lesson').click();page.wait_for_timeout(300)
    checks['lesson entry focuses return control']=page.evaluate('document.activeElement.id')=='return-camp'
    page.locator('#next-step').click()
    checks['next step preserves control focus']=page.evaluate('document.activeElement.id')=='next-step'
    checks['short viewport can reach overflow']=page.locator('#lesson-dialog').evaluate('el=>el.scrollHeight<=el.clientHeight || ["auto","scroll"].includes(getComputedStyle(el).overflowY)')
    page.locator('#return-camp').click()
    page.locator('[data-station="shelter"]').click();page.locator('#begin-lesson').click()
    page.wait_for_timeout(300)
    checks['shelter lesson entry focuses return control']=page.evaluate('document.activeElement.id')=='return-camp'
    page.locator('#next-step').click()
    checks['shelter next step preserves control focus']=page.evaluate('document.activeElement.id')=='next-step'
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
    checks['open shelter lesson shrinks without horizontal overflow']=page.locator('#lesson-dialog').evaluate('el=>el.scrollWidth<=el.clientWidth+1')
    page.set_viewport_size({'width':1024,'height':600})
    page.locator('#instruction [data-step="5"]').click();page.locator('#next-step').click()
    page.locator('[data-answer="round-turn"]').click()
    checks['shelter completion alone leaves rope yard unfinished']=page.evaluate('pioneerlab.getState().progress.completed')==['round-turn-two-half-hitches']
    checks['shelter success focuses its heading']=page.locator('#instruction h2').evaluate('el=>el===document.activeElement')
    page.locator('#finish-lesson').click();page.wait_for_function('!pioneerlab.getState().world.paused')
    checks['shelter marker alone leaves rope pennant down']=page.evaluate('pioneerlab.getState().world.shelterCompleted && !pioneerlab.getState().world.completed')
    page.locator('#journal-tab').click()
    page.locator('[data-journal="shelter"] button').focus();page.keyboard.press('Enter')
    checks['journal station replacement retains modal focus']=page.locator('#detail-dialog').evaluate('el=>el.contains(document.activeElement)')
    page.keyboard.press('Escape');page.wait_for_timeout(100)
    checks['journal replacement preserves original opener']=page.evaluate('document.activeElement.id')=='journal-tab'
    page.set_viewport_size({'width':390,'height':844})
    page.locator('[data-station="shelter"]').click();page.locator('#begin-lesson').click()
    page.locator('.step-dots [data-step="5"]').click();page.locator('#next-step').click()
    page.locator('#instruction [data-step="5"]').click()
    checks['mobile quiz review retains visible focus']=page.evaluate('document.activeElement.id === "next-step"')
    page.locator('#next-step').click();page.locator('[data-answer="round-turn"]').click()
    page.locator('#instruction [data-step="0"]').click()
    checks['mobile completed review retains visible focus']=page.evaluate('document.activeElement.id === "next-step"')
    browser.close()
print(json.dumps(checks,indent=2))
(Path(__file__).resolve().parents[1]/'artifacts'/'edge-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert all(checks.values())
