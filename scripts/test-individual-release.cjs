#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),child=require('node:child_process');
const root=path.resolve(__dirname,'..');
const profile=JSON.parse(fs.readFileSync(path.join(root,'release/developer.json'),'utf8'));
assert.equal(profile.developerType,'individual');
assert.equal(profile.appId,JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8')).appId);
const index=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
for(const kind of ['terms','privacy','disclaimer']){
  const legal=fs.readFileSync(path.join(root,`legal/${kind}.html`),'utf8');
  const content=legal.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i)?.[1]?.trim();
  assert(content,kind);
  const section=index.match(new RegExp(`<section data-sec="${kind}"(?: hidden)?>([\\s\\S]*?)<\\/section>`))?.[1]?.trim();
  assert.equal(section,content,`Outdated embedded ${kind} legal text`);
}
// Test Gradle patch against the Capacitor template that signs release with debug by default.
const py=child.spawnSync(process.platform==='win32'?'python':'python3',['scripts/test-android-release-signing.py'],{cwd:root,encoding:'utf8'});
assert.equal(py.status,0,py.stderr||py.stdout);
console.log('PASS: individual developer config, canonical legal modal, Android release signing regression');
