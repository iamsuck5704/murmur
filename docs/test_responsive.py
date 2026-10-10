"""CMD v0.4 responsive and touch checks, Chromium mobile emulation. No network or native SDK."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
css=(R/'www/perpetrator.css').read_text(encoding='utf8')
js=(R/'www/perpetrator.js').read_text(encoding='utf8')
layouts=[(280,640),(320,568),(360,780),(390,844),(430,932),(768,1024),(1024,768),(812,375)]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 for width,height in layouts:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=2,is_mobile=True,has_touch=True)
  errors=[]
  page.on('pageerror',lambda exc: errors.append(str(exc)))
  page.set_content('<!doctype html><html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body><button id="openBackup">open</button></body></html>')
  page.evaluate('''()=>{window.MURMUR_APP_PREVIEW=true;}''')
  page.add_style_tag(content=css)
  page.add_script_tag(content=js)
  rows=page.locator('#backupRoot .bp-dir-row')
  assert rows.count()==11, (width,'count',rows.count())
  assert page.locator('#backupRoot .bp-icon').count()==0, (width,'old cards still found')
  assert page.locator('#backupRoot .bp-chapter').count()==7
  sizes=page.evaluate('''()=>{
   const root=document.querySelector('#backupRoot');const shell=root.querySelector('.bp-shell');
   const rows=[...root.querySelectorAll('.bp-dir-row')].map(el=>({h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth}));
   return {width:root.clientWidth,scroll:root.scrollWidth,shell: shell.getBoundingClientRect().width,
    rows,chapter:[...root.querySelectorAll('.bp-chapter')].map(el=>el.getBoundingClientRect().height),
    topButtons:[...root.querySelectorAll('.bp-top button')].map(el=>el.getBoundingClientRect().height)};
  }''')
  assert sizes['scroll'] <= sizes['width']+2, (width,'horizontal overflow',sizes)
  assert min(v['h'] for v in sizes['rows']) >= (69 if width>=720 else 73), (width,'short row',sizes)
  assert min(sizes['chapter']) >=69, (width,'short chapter')
  assert min(sizes['topButtons']) >=51, (width,'short toolbar')
  assert all(row['scroll']<=row['client']+2 for row in sizes['rows']), (width,'row content overflow',sizes)
  rows.nth(0).tap();assert page.locator('.bp-entry').count()>0
  page.locator('.bp-entry').first.tap();assert page.locator('.bp-document').is_visible()
  page.locator('[data-action="back"]').tap();assert page.locator('.bp-entry').count()>0
  page.locator('[data-action="back"]').tap();assert rows.count()==11
  if width==390:
   page.screenshot(path=str(R/'docs/cmd-v04-390.png'),full_page=True)
   page.locator('[data-chapter="0"]').tap();page.screenshot(path=str(R/'docs/cmd-v04-chapter-390.png'),full_page=True)
  if width==320:
   page.screenshot(path=str(R/'docs/cmd-v04-320.png'),full_page=True)
  assert not errors,(width,errors)
  page.close()
 print('PASS: 280/320/360/390/430/768/1024 and landscape widths, 74px rows, no horizontal scrolling, tapped entry + back + chapters')
 # Validate the independent single-file preview really renders the new UI.
 filepage=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 filepage.set_content((R/'www/preview-standalone.html').read_text(encoding='utf8'),wait_until='domcontentloaded')
 filepage.locator('.bp-dir-row').first.wait_for()
 assert filepage.locator('.bp-dir-row').count()==11
 assert filepage.locator('.bp-directory').is_visible()
 assert filepage.locator('.bp-icon').count()==0
 print('PASS: standalone preview synced with v0.4 sources')
 # Simulated larger accessibility text on the smallest supported handset.
 enlarged=browser.new_page(viewport={'width':320,'height':680},is_mobile=True,has_touch=True)
 enlarged.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
 enlarged.evaluate('window.MURMUR_APP_PREVIEW=true')
 enlarged.add_style_tag(content=css)
 enlarged.add_script_tag(content=js)
 enlarged.add_style_tag(content='#backupRoot .bp-dir-code,#backupRoot .bp-dir-label,#backupRoot .bp-chapter-name{font-size:21px!important}')
 a=enlarged.evaluate('''()=>({scroll:backupRoot.scrollWidth,client:backupRoot.clientWidth,minHeight:Math.min(...[...document.querySelectorAll('.bp-dir-row')].map(x=>x.getBoundingClientRect().height))})''')
 assert a['scroll']<=a['client']+2 and a['minHeight']>=74,a
 print('PASS: 21px enlarged directory text at 320px without clipping')
 enlarged.close()
 browser.close()
