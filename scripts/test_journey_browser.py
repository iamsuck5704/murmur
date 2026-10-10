"""Playwright smoke test: web P1/P2 code -> native import -> P3 gate -> reload.
Run with: python scripts/test_journey_browser.py
Requires Playwright + Chromium (testing only, not app runtime).
"""
import json, subprocess, time, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
ports=[8763,8764]
servers=[]
try:
    for port,folder in zip(ports,[root/'dist/web',root/'www']):
        servers.append(subprocess.Popen([sys.executable,'-m','http.server',str(port),'--bind','127.0.0.1','--directory',str(folder)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL))
    time.sleep(.7)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        failures=[]
        def page_for(port,native=False):
            context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
            if native:context.add_init_script("window.Capacitor={isNativePlatform:()=>true,Plugins:{}};")
            page=context.new_page()
            page.on('pageerror',lambda e: failures.append(str(e)))
            page.goto(f'http://127.0.0.1:{port}/index.html',wait_until='load')
            return context,page
        def start(page):
            page.locator('#cwNext').click(timeout=5000)
            page.locator('#cwGo').click(timeout=5000)
            page.wait_for_function("localStorage.getItem('murmur_p01_v7') && JSON.parse(localStorage.getItem('murmur_p01_v7')).flags.cw",timeout=10000)
        def set_progress(page,flag):
            page.evaluate('''(flag) => {const key='murmur_p01_v7';const s=JSON.parse(localStorage.getItem(key));s.cleared=true;s.phase='ended';s.p9={at:Date.now(),m:'m',e:'e',t:'t',ok:true};s.cleared2=flag===2;localStorage.setItem(key,JSON.stringify(s));}''',flag)
            page.reload(wait_until='load')
        def menu(page,button):
            page.locator('#menuBtn').click(timeout=6000)
            page.locator('#'+button).click(timeout=6000)
        # Web P1 and P2: code only; third playthrough cannot open.
        wc,web=page_for(8763)
        start(web)
        set_progress(web,1)
        assert web.locator('#mE').is_hidden(), 'Web must hide P3'
        menu(web,'mCode')
        code1=web.locator('#codeTxt').inner_text().strip()
        assert code1.startswith('MRM-') and '-1' in code1
        assert web.locator('#openNativeArchive').count()==0
        set_progress(web,2)
        menu(web,'mCode')
        code2=web.locator('#codeTxt').inner_text().strip()
        assert code2.startswith('MRM-') and '-2' in code2
        assert web.locator('#mE').is_hidden(), 'P3 must remain hidden on Web after P2'
        assert web.locator('#backupRoot').count()==0, 'Web build should omit P3 module'
        print('PASS web: P1 and P2 branch codes, no P3 module')
        # Native first-run: P3 is not unlocked even after P1 import.
        nc,app=page_for(8764,native=True)
        start(app)
        assert app.locator('#mImport').is_hidden(), 'Menu closed; import item should be hidden in menu'
        menu(app,'mImport')
        app.locator('#codeIn').fill(code1)
        app.locator('form[data-code] button').click()
        app.wait_for_function("JSON.parse(localStorage.getItem('murmur_p01_v7')).imported === true",timeout=5000)
        app.locator('#sheetClose').click()
        app.locator('#menuBtn').click()
        assert app.locator('#mE').is_hidden(), 'P3 must be locked after P1 import'
        assert app.locator('#mNG').is_visible(), 'P2 must be available after P1 import'
        print('PASS native: P1 code imports, P2 available, P3 locked')
        # Upgrade same app to P2 import.
        app.locator('#mImport').click()
        app.locator('#codeIn').fill(code2)
        app.locator('form[data-code] button').click()
        app.wait_for_function("JSON.parse(localStorage.getItem('murmur_p01_v7')).cleared2 === true",timeout=5000)
        app.locator('#sheetClose').click()
        app.locator('#menuBtn').click()
        assert app.locator('#mE').is_visible(), 'P3 must unlock after P2 import'
        app.locator('#mE').click()
        assert app.locator('#backupRoot').is_visible(), 'P3 archive should open on native'
        assert app.locator('#backupRoot').inner_text().find('BACKUP')!=-1
        print('PASS native: P2 code imports and opens P3')
        app.reload(wait_until='load')
        app.locator('#menuBtn').click()
        assert app.locator('#mE').is_visible(), 'P3 unlock must persist across reload'
        app.locator('#mE').click()
        assert app.locator('#backupRoot').is_visible()
        print('PASS native: saved state survives reload')
        # Browser without native Capacitor must not unlock P3 even with a forged localStorage flag.
        plainc,plain=page_for(8764,native=False)
        start(plain)
        set_progress(plain,2)
        plain.locator('#menuBtn').click()
        assert plain.locator('#mE').is_hidden()
        assert plain.evaluate("window.MurmurBackupPreview.open()") is False
        assert plain.locator('#backupRoot').is_hidden()
        print('PASS browser: full native bundle still blocks P3 without native platform')
        assert not failures, 'Browser JS errors: '+str(failures)
        print('PASS: no uncaught JavaScript errors')
        for c in [wc,nc,plainc]:c.close()
        browser.close()
finally:
    for p in servers:p.terminate()
