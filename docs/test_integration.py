"""In-memory main game integration smoke test (no app SDK required)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'www/index.html').read_text(encoding='utf-8').replace('<script src="perpetrator.js"></script>','')
html=html.replace('</head>', '''<script>
 window.Capacitor={};window.__store={};
 Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>window.__store[k]??null,
 setItem:(k,v)=>{window.__store[k]=String(v)},
 removeItem:k=>{delete window.__store[k]}
 }});
</script></head>''')
css=(ROOT/'www/perpetrator.css').read_text(encoding='utf-8')
js=(ROOT/'www/perpetrator.js').read_text(encoding='utf-8')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page.set_default_timeout(5000)
 errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=css);page.add_script_tag(content=js)
 assert page.evaluate('MurmurBackupPreview.open()') is False
 page.locator('#cwGo').evaluate('(el)=>el.click()')
 page.locator('#jumpEnd').evaluate('(el)=>el.click()')
 page.locator('#menuBtn').click()
 assert page.locator('#mE').is_visible()
 page.locator('#mE').click()
 assert page.locator('#backupRoot .bp-title').is_visible()
 page.locator('#backupRoot [data-action="back"]').click()
 page.locator('#menuBtn').click()
 page.locator('#mCode').click()
 page.locator('#openNativeArchive').click()
 assert page.locator('#backupRoot .bp-title').is_visible()
 assert page.locator('#sheet').is_hidden()
 assert not errors,errors
 print('PASS: imported/cleared gate, native menu link, APPCODE link, legacy overlay fix, no JS errors')
 browser.close()
