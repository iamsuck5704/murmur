from pathlib import Path
import json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
js=(R/'www/perpetrator.js').read_text('utf-8')
css=(R/'www/perpetrator.css').read_text('utf-8')
KEY='murmur_app_backup_preview_v5'

def setup(browser,width=390,height=844,seed=None):
    page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=1)
    problems=[];page.on('pageerror',lambda e:problems.append(str(e)))
    page.set_content('<html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="mE">test</button><div id="menu"></div></body></html>')
    page.evaluate('''(seed)=>{window.MURMUR_APP_PREVIEW=true;window.__mockStore={...seed};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__mockStore[k]??null,setItem:(k,v)=>window.__mockStore[k]=String(v),removeItem:k=>delete window.__mockStore[k]}})}''',seed or {})
    page.add_style_tag(content=css);page.add_script_tag(content=js)
    page.locator('#backupRoot .bp-title').wait_for()
    return page,problems

def open_record(page,app,needle):
    page.locator('[data-action="back"]').click() if page.locator('.bp-entry').count() else None
    if not page.locator('[data-app="'+app+'"]').count():
        page.locator('[data-action="home"]').click() if page.locator('[data-action="home"]').count() else None
    page.locator('[data-app="'+app+'"]').click()
    entries=page.locator('.bp-entry')
    candidates=[]
    for i in range(entries.count()):
        if needle in entries.nth(i).inner_text():candidates.append(i)
    assert candidates,(app,needle,entries.count())
    entries.nth(candidates[0]).click()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for width in [280,320,390,768]:
        page,errors=setup(browser,width=width,height=844)
        overflow=page.evaluate('''()=>({width:document.documentElement.scrollWidth,visible:window.innerWidth})''')
        assert overflow['width'] <= overflow['visible']+2,(width,overflow)
        rows=page.locator('.bp-dir-row').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)')
        assert min(rows)>=74,(width,rows)
        if width==390:
            page.screenshot(path=str(R/'docs/v06-cmd-home-390.png'),full_page=True)
        assert not errors,errors
        page.close()
    seed={KEY:json.dumps({'unlocked':6,'completed':list(range(6)),'visited':{},'scares':True,'stream':False,'puzzles':{'finalSort':False}},ensure_ascii=False)}
    page,errs=setup(browser,seed=seed)
    open_record(page,'diary','2021-02-18')
    assert page.locator('.bp-stage-empty-page').count()==1
    assert '這一頁其他地方是空白的' not in page.locator('.bp-docbody').inner_text()
    page.screenshot(path=str(R/'docs/v06-empty-page.png'),full_page=True)
    page.locator('[data-action="home"]').click() if page.locator('[data-action="home"]').count() else page.locator('[data-action="back"]').click()
    open_record(page,'diary','2021-04-15')
    deltxt=page.locator('.bp-docbody del').all_inner_texts()
    assert '你是我的。' in deltxt,deltxt
    assert '這一行被劃掉' not in page.locator('.bp-docbody').inner_text()
    page.screenshot(path=str(R/'docs/v06-crossout.png'),full_page=True)
    page.locator('[data-action="back"]').click()
    page.locator('[data-action="back"]').click()
    open_record(page,'diary','2021-04-23 20:41')
    assert '妳' in page.locator('.bp-docbody del').inner_text()
    page.locator('[data-action="back"]').click()
    page.locator('[data-action="back"]').click()
    open_record(page,'diary','2021-04-09')
    assert page.locator('.bp-repeat-line').count()==14
    page.locator('[data-action="back"]').click()
    page.locator('[data-action="back"]').click()
    open_record(page,'diary','2021-03-09')
    assert page.locator('.bp-stage-date-only').count()==1
    page.locator('[data-action="back"]').click()
    page.locator('[data-action="back"]').click()
    open_record(page,'diary','最後一篇')
    assert page.locator('.bp-sort-row').count()==4
    page.locator('[data-action="check-sort"]').click()
    assert '順序不對' in page.locator('.bp-note').last.inner_text()
    # sorting puzzle eventually solved by code, not fake initial ready.
    initial=page.evaluate("window.MurmurBackupPreview.getStatus().puzzles.finalSort")
    assert not initial
    page.screenshot(path=str(R/'docs/v06-file-navigation.png'),full_page=True)
    assert not errs,errs
    browser.close()
    print('PASS v0.6: multiple widths, terminal nav, real stage directions, end puzzle, no JS errors')
