#!/usr/bin/env node
// Intentionally local-only; outputs legal docs that may become public on deployment.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const local=path.join(root,'release/individual-profile.local.json');
if(!fs.existsSync(local)){
  console.error('Missing release/individual-profile.local.json; copy individual-profile.example.json and fill it locally.');
  process.exit(1);
}
const p=JSON.parse(fs.readFileSync(local,'utf8'));
const valid=s=>typeof s==='string'&&s.trim().length>0&&!/[<>]/.test(s);
if(p.developerType!=='individual'||!valid(p.legalName)||!valid(p.supportEmail)||!valid(p.privacyEmail)||!valid(p.publicLegalContact)||!/^\d{4}-\d{2}-\d{2}$/.test(p.effectiveDate||'')||!/^\S+@\S+\.\S+$/.test(p.supportEmail)||!/^\S+@\S+\.\S+$/.test(p.privacyEmail)){
  console.error('Profile invalid. Require individual, legalName, supportEmail, privacyEmail, publicLegalContact, effectiveDate (YYYY-MM-DD).');
  process.exit(1);
}
const map={
  '【開發者／公司完整名稱】':p.legalName,
  '【開發者名稱】':p.legalName,
  '【客服與隱私聯絡信箱】':p.supportEmail,
  '【客服／隱私信箱】':p.supportEmail,
  '【客服信箱】':p.supportEmail,
  '【聯絡信箱】':p.supportEmail,
  '【隱私聯絡信箱】':p.privacyEmail,
  '【隱私信箱】':p.privacyEmail,
  '【依法應揭露之地址或聯絡方式】':p.publicLegalContact,
  '【依法應揭露之營業資訊】':p.publicLegalContact,
  '【其他依法應揭露的商業資訊】':p.publicLegalContact,
  '【其他依法應揭露資訊】':p.publicLegalContact,
  '【上架日期待填】':p.effectiveDate
};
for(const kind of ['terms','privacy','disclaimer']){
  const f=path.join(root,`legal/${kind}.html`);
  let html=fs.readFileSync(path.join(root,`legal/templates/${kind}.html`),'utf8');
  for(const [key,value] of Object.entries(map)) html=html.split(key).join(value.replace(/&/g,'&amp;').replace(/"/g,'&quot;'));
  if(/【[^】]*(?:開發者|信箱|聯絡|客服|待填|揭露)[^】]*】/.test(html)) throw new Error(`Unresolved placeholder in ${kind}`);
  fs.writeFileSync(f,html,'utf8');
}
require('./sync-legal.cjs');
console.log('Developer contact inserted. IMPORTANT: inspect all public legal docs before commit/deploy; no legal or store approval is implied.');
