#!/usr/bin/env node
// The three legal/*.html files are canonical. Mirror them into the in-game legal modal.
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'www/index.html');
let html=fs.readFileSync(file,'utf8');
for(const kind of ['terms','privacy','disclaimer']) {
  const source=fs.readFileSync(path.join(root,`legal/${kind}.html`),'utf8');
  const match=source.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i);
  if(!match || /<script\b/i.test(match[1])) throw new Error(`Invalid legal/${kind}.html main`);
  const re=new RegExp(`(<section data-sec="${kind}"(?: hidden)?>(?:\\s*))([\\s\\S]*?)(\\s*<\\/section>)`);
  const found=html.match(re);
  if(!found || html.match(new RegExp(`<section data-sec="${kind}"`,'g')).length!==1)
    throw new Error(`Missing/duplicate legal section ${kind}`);
  html=html.replace(re,(_,start,_old,end)=>start+match[1].trim()+end);
}
fs.writeFileSync(file,html,'utf8');
console.log('Legal documents synced into in-game modal from legal/*.html');
