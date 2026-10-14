#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('www/index.html'),native=read('dist/native/index.html'),web=read('dist/web/index.html');
assert(src.includes('性侵'),'Public source must preserve original storyline');
assert(web.includes('性侵'),'Public build must preserve original storyline');
assert(!/性侵|性侵犯|性暴力|強制性交|強姦|強暴|猥褻|性虐待/i.test(native),'Native storyline must omit sexual-assault references');
assert(native.includes('和平路命案'),'Native storyline still needs intact narrative');
assert(native.includes('跟蹤騷擾'),'Native content warning must reflect remaining themes');
for(const f of ['perpetrator.js','meta-horror.js','perpetrator.css','meta-horror.css'])assert(fs.existsSync(path.join(root,'dist/native',f)),`Missing App asset: ${f}`);
assert.equal(read('dist/native/perpetrator.js'),read('www/perpetrator.js'),'Third-playthrough mechanics unchanged');
console.log('PASS: original web preserved; App-only story edits present; native assets intact');
