#!/usr/bin/env node
// Release readiness gate: fail on known blockers, without pretending to perform a store review.
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pkg=JSON.parse(read('package.json'));
const cap=JSON.parse(read('capacitor.config.json'));
const issues=[], warnings=[];
const dev=JSON.parse(read('release/developer.json'));
if(dev.developerType!=='individual')issues.push('Expected personal developer account configuration');
const version=JSON.parse(read('release/version.json'));
if(version.versionName!==pkg.version || !Number.isInteger(version.buildNumber) || version.buildNumber<1)issues.push('Native version config invalid or inconsistent');
if(dev.appId!==cap.appId)issues.push('Developer profile appId mismatch');
if(!/^[a-z][\w]*(\.[a-z][\w]*){2,}$/.test(cap.appId))issues.push('Invalid native appId');
if(cap.appId!=='app.murmur.story')issues.push('App ID differs from current Android/iOS signing setup');
if(cap.webDir!=='www')issues.push('Native webDir must remain www');
if(!fs.existsSync(path.join(root,'package-lock.json')))warnings.push('Missing package-lock.json: generate using npm install and commit; CI is not reproducible yet');
else { try { const lock=JSON.parse(read('package-lock.json')); if(lock.packages?.['']?.version!==pkg.version)warnings.push('package-lock version differs from package.json'); } catch(e){issues.push('Invalid package-lock.json');} }
for(const f of ['legal/privacy.html','legal/terms.html','legal/disclaimer.html']){
 const s=read(f);
 if(/【[^】]*(待填|開發者|信箱|上架日期|聯絡|客服)[^】]*】/.test(s))issues.push(`${f}: unresolved developer/contact placeholders`);
 if(/草案/.test(s))warnings.push(`${f}: still describes a draft`);
 const kind=path.basename(f,'.html');
 const body=s.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i)?.[1]?.trim();
 const modal=read('www/index.html').match(new RegExp(`<section data-sec="${kind}"(?: hidden)?>([\\s\\S]*?)<\\/section>`))?.[1]?.trim();
 if(body!==modal)issues.push(`${f}: embedded in-game legal text is out of sync (run npm run sync:legal)`);
}
if(/【(?:開發者|客服|隱私|聯絡|上架日期|依法應揭露)[^】]*】/.test(read('www/index.html')))issues.push('www/index.html: embedded legal pages still contain placeholders');
for(const f of ['www/perpetrator.js','www/meta-horror.js','www/index.html','www/store-links.js']) if(!fs.existsSync(path.join(root,f)))issues.push(`Missing ${f}`);
const store=read('www/store-links.js');
if(/android:\s*['"]http:|ios:\s*['"]http:/.test(store))issues.push('Insecure store link');
if(!fs.existsSync(path.join(root,'dist/web/index.html')))issues.push('Run npm run build:web before preflight');
else { const html=read('dist/web/index.html'); if(/<script src="perpetrator\.js"|<script src="meta-horror\.js"/.test(html))issues.push('Native code leaked to public web'); }
if(!fs.existsSync(path.join(root,'dist/web/store-links.js')))issues.push('Public store-links.js missing; rebuild web');
if(/撞(額頭|牆)|拿手機撞/.test(read('www/index.html')) || /拿手機撞(額頭|牆)/.test(read('www/perpetrator.js')))warnings.push('Review physical action descriptions for safety');
console.log(`Murmur ${pkg.version} release preflight`);
for(const x of issues) console.error('BLOCKER:',x);
for(const x of warnings) console.warn('WARNING:',x);
console.log(`Result: ${issues.length} blocker(s), ${warnings.length} warning(s).`);
process.exitCode=issues.length?1:0;
