#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'www','index.html'),'utf8');
const gate="!!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())";
assert(src.includes(gate),'App gate must use native platform API');
assert(!src.includes("|| /app/.test(location.hash)"),'Hash must not unlock App');
const get=(cap)=>!!(cap&&typeof cap.isNativePlatform==='function'&&cap.isNativePlatform());
assert.equal(get(undefined),false);
assert.equal(get({}),false);
assert.equal(get({isNativePlatform:()=>false}),false);
assert.equal(get({isNativePlatform:()=>true}),true);
const web=path.join(root,'dist','web');
assert(fs.existsSync(path.join(web,'index.html')),'Build web first');
for(const f of ['perpetrator.js','perpetrator.css','meta-horror.js','meta-horror.css','preview.html','preview-standalone.html']){
  assert(!fs.existsSync(path.join(web,f)),`Web includes native file: ${f}`);
}
const webHTML=fs.readFileSync(path.join(web,'index.html'),'utf8');
assert(!/perpetrator\.js|meta-horror\.js/.test(webHTML));
assert(webHTML.includes('makeCode(flag)'),'Branch code must remain');
console.log('Platform gating + web/native separation checks passed.');
