"""Headless DOM/mobile-viewport checks without network navigation (sandbox-safe)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'www/perpetrator.js').read_text(encoding='utf-8')
CSS=(ROOT/'www/perpetrator.css').read_text(encoding='utf-8')
errors=[]
def start(browser, storage=None):
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    page.on('pageerror',lambda ex:errors.append(str(ex)))
    page.set_content('<html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>APP PREVIEW</main><button id="mE">TEST</button><div id="menu"></div></body></html>')
    page.evaluate('''(seed)=>{
        window.MURMUR_APP_PREVIEW=true;
        window.__mockStore={...seed};
        Object.defineProperty(window,'localStorage',{configurable:true,value:{
          getItem:k=>window.__mockStore[k]??null,
          setItem:(k,v)=>{window.__mockStore[k]=String(v)},
          removeItem:k=>{delete window.__mockStore[k]}
        }});
    }''',storage or {})
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=SCRIPT)
    page.locator('#backupRoot .bp-title').wait_for()
    return page
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=start(browser)
    assert page.locator('.bp-dir-row').count()==11
    assert page.locator('.bp-chapter').count()==7
    assert page.locator('.bp-chapter').nth(1).is_disabled()
    tasks_for_chapters = [ ['statistics','diary'],['drafts','deleted'],['messages','diary'],['blog'],['stories','calendar'],['diary','messages'],[] ]
    for chapter,tasks in enumerate(tasks_for_chapters):
        page.locator(f'[data-chapter="{chapter}"]').click()
        if tasks: assert page.locator('[data-action="complete"]').is_disabled(),chapter
        for task in tasks:
            page.locator(f'[data-task="{task}"]').click()
            page.locator('[data-item="0"]').click()
            page.locator('[data-action="chapter"]').click()
        assert page.locator('[data-action="complete"]').is_enabled(),chapter
        page.locator('[data-action="complete"]').click()
    status=page.evaluate('window.MurmurBackupPreview.getStatus()')
    assert len(status['completed'])==7,status
    page.screenshot(path=str(ROOT/'docs/preview-mobile.png'),full_page=True)
    page.locator('[data-action="settings"]').click()
    page.locator('[data-toggle="stream"]').check()
    assert page.locator('[data-toggle="stream"]').is_checked()
    saved=page.evaluate('window.__mockStore')
    page.close()
    page=start(browser,saved)
    assert page.locator('[data-chapter="6"]').is_enabled()
    page.locator('[data-action="settings"]').click()
    assert page.locator('[data-toggle="stream"]').is_checked()
    page.on('dialog',lambda d:d.accept())
    page.locator('[data-action="reset"]').click()
    assert page.locator('[data-chapter="1"]').is_disabled()
    assert not errors,errors
    print('PASS: all seven chapters, per-app document view, progression gates, persistence, preferences, reset, no JS errors')
    browser.close()
