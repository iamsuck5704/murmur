#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const meta=get('www/meta-horror.js'),perp=get('www/perpetrator.js');
const legal=['terms','privacy','disclaimer'].map(x=>get(`legal/${x}.html`)).join('\n');
// No scripted scare trigger/time should appear in preconsent text, settings or legal copy.
for(const [name,text] of [['meta',meta],['legal',legal]]){
 for(const bad of ['04/17 日記','E5 定位劇情','E5 排序完成後','通關後第三天','通關第三天','原始備份被省略的拒絕']){
  assert.ok(!text.includes(bad),`${name} contains spoiler: ${bad}`);
 }
}
assert.match(meta,/<details class="murmur-permission-details">/);
assert.match(meta,/prefs\.capture=false;prefs\.motion=false;prefs\.light=false;prefs\.weather=false/);
assert.match(meta,/prefs\.weather=!!prefs\.weather&&result\.location/);
assert.doesNotMatch(perp,/<div class="bp-demo">完整原稿與互動演出已匯入/);
assert.doesNotMatch(perp,/<h2>原始備份被省略的拒絕<\/h2>/);
assert.match(perp,/<h2>版本差異核對<\/h2>/);
assert.match(perp,/兩份資料記錄的內容不同，請自行比對/);
assert.match(perp,/這個目錄目前沒有可讀取的統計資料/);
assert.match(perp,/沒有可讀取的音訊內容/);
assert.match(perp,/目前沒有可還原的紀錄/);
for(const source of ['www/index.html','legal/privacy.html']){
 assert.ok(!get(source).includes('E5 定位演出只在完成最後排序後詢問'),`${source}: spoiler in privacy copy`);
}
console.log('PASS: player-facing settings, permission copy, legal copy, chapter hint, placeholders and opt-in are spoiler-safe');
