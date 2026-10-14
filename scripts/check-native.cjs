#!/usr/bin/env node
require('./sync-legal.cjs');
// Capacitor points to a generated App-only edition; www/ remains canonical and unchanged.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
if(cfg.webDir!=='dist/native')throw Error('Capacitor webDir must be dist/native');
const html=fs.readFileSync(path.join(root,'dist','native','index.html'),'utf8');
if(!html.includes("window.Capacitor.isNativePlatform()"))throw Error('Native platform detection missing');
for(const name of ['perpetrator.js','perpetrator.css','meta-horror.js','meta-horror.css']){
  if(!fs.existsSync(path.join(root,'dist','native',name)))throw Error(`Missing native asset ${name}`);
  if(!html.includes(name))throw Error(`Native HTML missing reference ${name}`);
}
console.log('Native P1/P2/P3 ready. Run npx cap sync android / ios after npm run build:native.');
