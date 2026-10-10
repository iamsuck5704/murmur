from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path('/mnt/data/Murmur_App_CMD_v0.6')
js=(root/'www/perpetrator.js').read_text(encoding='utf-8')
css=(root/'www/perpetrator.css').read_text(encoding='utf-8')
(root/'docs').mkdir(exist_ok=True)
errs=[]

def makepage(browser,w,h,seed=None):
    page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True)
    page.on('pageerror',lambda ex:errs.append(str(ex)))
    page.set_content('<html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="mE">ENTRY</button><div id="menu"></div></body></html>')
    page.evaluate('''seed => {
      window.MURMUR_APP_PREVIEW=true;
      window.__mockStore={...seed};
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>window.__mockStore[k]??null,
        setItem:(k,v)=>{window.__mockStore[k]=String(v)},
        removeItem:k=>delete window.__mockStore[k]
      }});
    }''',seed or {})
    page.add_style_tag(content=css)
    page.add_script_tag(content=js)
    page.locator('#backupRoot .bp-title').wait_for()
    return page

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    seed={'murmur_app_backup_preview_v5':json.dumps({'unlocked':1,'completed':[0],'visited':{},'scares':True,'stream':False,'puzzles':{'finalSort':False}})}
    page=makepage(browser,390,844,seed)
    page.locator('[data-app="diary"]').click()
    n=page.locator('.bp-entry').count()
    # E1 has 29 diaries, E2 is now available
    assert n>30, n
    page.locator('[data-item="30"]').click()
    assert page.locator('.bp-file-nav').count()==1
    old=page.locator('.bp-document h2').inner_text()
    font=page.locator('.bp-docbody').evaluate('e=>getComputedStyle(e).fontFamily')
    assert 'monospace' in font, font
    assert page.locator('[data-action="prev-item"]').is_enabled()
    assert page.locator('[data-action="next-item"]').is_enabled()
    assert page.locator('[data-action="next-item"]').evaluate('e=>e.getBoundingClientRect().height')>=64
    page.screenshot(path=str(root/'docs/terminal-reader-390.png'),full_page=True)
    page.locator('[data-action="next-item"]').click()
    assert page.locator('.bp-document h2').inner_text()!=old
    page.locator('[data-action="prev-item"]').click()
    assert page.locator('.bp-document h2').inner_text()==old
    page.locator('[data-action="app"]').click()
    page.locator('[data-item="0"]').click()
    assert page.locator('[data-action="prev-item"]').is_disabled()
    page.locator('[data-action="app"]').click()
    page.locator(f'[data-item="{n-1}"]').click()
    assert page.locator('[data-action="next-item"]').is_disabled()
    saved=page.evaluate('window.__mockStore')
    status=page.evaluate('window.MurmurBackupPreview.getStatus()')
    assert '0' in status['visited'] or '1' in status['visited']
    page.close()

    for w,h in [(280,650),(320,720),(360,780),(390,844),(480,800),(844,390),(1024,768)]:
        page=makepage(browser,w,h,seed)
        page.locator('[data-app="diary"]').click()
        page.locator('[data-item="30"]').click()
        report=page.evaluate('''()=>({
          viewport:document.documentElement.clientWidth,
          rootScroll:document.getElementById('backupRoot').scrollWidth,
          rootClient:document.getElementById('backupRoot').clientWidth,
          contentScroll:document.querySelector('.bp-shell').scrollWidth,
          nav:[...document.querySelectorAll('.bp-file-nav button')].map(b=>({width:Math.round(b.getBoundingClientRect().width),height:Math.round(b.getBoundingClientRect().height)})),
          docTextFont:getComputedStyle(document.querySelector('.bp-docbody')).fontFamily,
          hasRemoteAssets:[...document.querySelectorAll('link[href],script[src]')].some(el=>/https?:/.test(el.getAttribute('href')||el.getAttribute('src')||''))
        })''')
        print(w,h,report)
        assert report['rootScroll']<=report['rootClient']+1, ('horizontal root overflow',w,report)
        assert report['contentScroll']<=report['rootClient']+1, ('horizontal shell overflow',w,report)
        assert all(b['height']>=64 for b in report['nav']), (w,report)
        assert all(b['width']>=44 for b in report['nav']), (w,report)
        assert not report['hasRemoteAssets']
        if w==320: page.screenshot(path=str(root/'docs/terminal-reader-320.png'),full_page=True)
        page.close()
    assert not errs,errs
    print('PASS: prev/next, bounds, persistent record list, platform monospace, no external assets, 280-1024 RWD, no JS exceptions')
    browser.close()
