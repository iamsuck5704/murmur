#!/usr/bin/env node
// Separate tester-only artifact. NEVER deploy dist/tester on the public game domain without Cloudflare Access.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('./sync-legal.cjs');
const root=path.resolve(__dirname,'..'),src=path.join(root,'www'),out=path.join(root,'dist','tester');
const secret=process.env.MURMUR_TESTER_CODE;
if(!secret || !/^MURMUR-QA-[A-Z0-9]{12,40}$/.test(secret)) throw Error('Set MURMUR_TESTER_CODE to a private MURMUR-QA- plus 12-40 uppercase alphanumeric characters');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(src,out,{recursive:true});
const hash=crypto.createHash('sha256').update(secret).digest('hex');
const bootstrap=`<script>window.MURMUR_TESTER_WEB=true;window.MURMUR_APP_PREVIEW=true;window.MURMUR_TESTER_AUTO_OPEN=false;window.MurmurTesterGate=(()=>{let unlocked=false;const expected='${hash}';return Object.freeze({isUnlocked:()=>unlocked,verify:async code=>{if(!/^MURMUR-QA-[A-Z0-9]{12,40}$/.test(code)||!crypto?.subtle)return false;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');unlocked=actual===expected;return unlocked;}})})();</script>`;
const file=path.join(out,'index.html');let html=fs.readFileSync(file,'utf8');
if(!html.includes('<script src="perpetrator.js"></script>'))throw Error('Missing perpetrator script');
html=html.replace('<script src="perpetrator.js"></script>',bootstrap+'\n<script src="perpetrator.js"></script>');fs.writeFileSync(file,html);
for(const name of ['privacy','terms','disclaimer']){const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(path.join(root,'legal',name+'.html'),path.join(dir,'index.html'));}
fs.writeFileSync(path.join(out,'_headers'),'/*\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n');
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log('Tester-only build ready:',out,'(Cloudflare Access still required)');
