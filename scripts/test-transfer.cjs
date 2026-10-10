#!/usr/bin/env node
// Execute the actual transfer-code functions from www/index.html in a Node VM.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const start=src.indexOf('  function codeChk(x)');
const end=src.indexOf('  /* ----- 第二周目 ----- */',start);
assert(start>0&&end>start);
const funcs=src.slice(start,end);
let persisted='',messages=[];
const s={p9:{at:Date.now()-1234000},unlocked:{},pz:{},flags:{}};
const env={S:s,Date,TS:(t)=>Math.floor(t/1000),PZ:['p5','p6','p7','p8','p9'],
 SIM_M:['first','second'],SIM_T:['first','second'],
 skipThroughP4:()=>{s.phase='p4_done';},
 pz:(k)=>s.pz[k]||(s.pz[k]={}),
 solvePZ:(k)=>{s.pz[k]||(s.pz[k]={});s.pz[k].solved=Date.now();},
 solveStage:(arr,k)=>{s.pz[k]||(s.pz[k]={});s.pz[k].solved=Date.now();},
 NG:['s1','s2','s3'],save:()=>{persisted=JSON.stringify(s);},updateHeader:()=>{},renderSugs:()=>{},push:(who,msg)=>messages.push([who,msg])};
vm.createContext(env);
vm.runInContext(funcs+'\nthis.makeCode=makeCode;this.parseCode=parseCode;this.applyImport=applyImport;',env);
const one=env.makeCode(1),two=env.makeCode(2);
assert.match(one,/^MRM-[0-9A-Z]+-1[0-9A-Z]{2}$/);
assert.match(two,/^MRM-[0-9A-Z]+-2[0-9A-Z]{2}$/);
assert.equal(env.parseCode(one).flag,1);
assert.equal(env.parseCode(two).flag,2);
assert.equal(env.parseCode(two.replace(/.$/,'X'))===null,true);
assert.equal(env.parseCode('MRM-FAKE-2ZZ'),null);
env.applyImport(1,env.parseCode(one).ts);
assert.equal(s.imported,true);assert.equal(s.cleared,true);assert.notEqual(s.cleared2,true);
assert.equal(s.phase,'ended');assert(s.pz.p9.solved);assert(persisted.includes('"imported":true'));
env.applyImport(2,env.parseCode(two).ts);
assert.equal(s.cleared2,true);assert.equal(s.ng.on,true);
assert(messages.length===2);
assert.equal(JSON.parse(persisted).cleared2,true);
console.log('PASS: actual code generation, checksum validation, P1/P2 import, save snapshot');
