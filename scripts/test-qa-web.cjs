#!/usr/bin/env node
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(path.resolve(__dirname,'../dist/web/index.html'),'utf8');
const qaPos=html.indexOf('window.MURMUR_TESTER_WEB=true');
const mainPos=html.indexOf('<script>\n(() => {');
const p3Pos=html.indexOf('<script src="perpetrator.js"></script>');
assert(qaPos>=0 && mainPos>qaPos && p3Pos>mainPos,'QA initialization must run before the main inline game');
const start=html.lastIndexOf('<script>',qaPos)+8;
const end=html.indexOf('</script>',qaPos);
const js=html.slice(start,end);
const sandbox={window:{},globalThis:null,crypto:webcrypto,TextEncoder,Uint8Array};
sandbox.globalThis=sandbox;
vm.runInNewContext(js,sandbox);
assert.equal(sandbox.window.MURMUR_TESTER_WEB,true);
assert.equal(sandbox.window.MURMUR_APP_PREVIEW,true);
(async()=>{
  assert.equal(await sandbox.window.MurmurTesterGate.verify('MURMUR-QA-123012301230'),true);
  assert.equal(sandbox.window.MurmurTesterGate.isUnlocked(),true);
  assert.equal(await sandbox.window.MurmurTesterGate.verify('MURMUR-QA-999999999999'),false);
  assert.equal(sandbox.window.MurmurTesterGate.isUnlocked(),false);
  console.log('PASS: public QA bootstrap order, correct/incorrect codes, and P3 preview flag');
})().catch(e=>{console.error(e);process.exitCode=1;});
