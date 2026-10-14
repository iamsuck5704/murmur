#!/usr/bin/env node
// Single source: www/; public build: dist/web/. Never publish www/ directly.
require('./sync-legal.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'www');
const out = path.join(root, 'dist', 'web');
const index = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const nativeAssets = [
  '<link rel="stylesheet" href="perpetrator.css">',
  '<link rel="stylesheet" href="meta-horror.css">',
  '<script src="meta-horror.js"></script>',
  '<script src="perpetrator.js"></script>'
];
for (const tag of nativeAssets) {
  if (!index.includes(tag)) throw new Error(`Missing expected native-only asset tag: ${tag}`);
}
if (!index.includes("window.Capacitor.isNativePlatform()")) {
  throw new Error('Native platform gate is missing from shared index.html');
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let html = index;
// The public website keeps P1/P2 for ordinary visitors. An explicit QA search
// unlocks the P3 archive in this browser only. The code is intentionally public.
const qaCode = 'MURMUR-QA-123012301230';
const qaHash = crypto.createHash('sha256').update(qaCode).digest('hex');
const bootstrap = `<script>window.MURMUR_TESTER_WEB=true;window.MURMUR_APP_PREVIEW=true;window.MURMUR_TESTER_AUTO_OPEN=false;window.MurmurTesterGate=(()=>{let unlocked=false;const expected='${qaHash}';return Object.freeze({isUnlocked:()=>unlocked,verify:async code=>{if(!/^MURMUR-QA-[A-Z0-9]{12,40}$/.test(code)||!globalThis.crypto?.subtle)return false;const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');unlocked=actual===expected;return unlocked;}})})();</script>`;
// The game executes in an inline script before perpetrator.js is loaded.
// Initialize the QA gate before the inline game reads MURMUR_TESTER_WEB.
const mainScriptMarker = '<script>\n(() => {';
if (!html.includes(mainScriptMarker)) throw new Error('Main game bootstrap marker missing');
html = html.replace(mainScriptMarker, bootstrap + '\n' + mainScriptMarker);
for (const name of ['perpetrator.js','perpetrator.css','meta-horror.js','meta-horror.css']) {
  fs.copyFileSync(path.join(src,name),path.join(out,name));
}
// Strip obsolete inline third-playthrough archive from the public artifact.
// The native app keeps this legacy block for old-save compatibility.
const startMarker = '    /* BEGIN_NATIVE_LEGACY_ARCHIVE: excluded from public web build */';
const endMarker = '    /* END_NATIVE_LEGACY_ARCHIVE */';
const first = html.indexOf(startMarker), last = html.indexOf(endMarker);
if (first < 0 || last < first || html.indexOf(startMarker, first + 1) >= 0) {
  throw new Error('Missing or duplicate native-only inline archive markers');
}
html = html.slice(0, first) + '    /* App-only archive excluded from public build */\n' + html.slice(last + endMarker.length);
fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');
fs.copyFileSync(path.join(src, 'store-links.js'), path.join(out, 'store-links.js'));
const legalDir = path.join(root, 'legal');
fs.mkdirSync(path.join(out, 'legal'), { recursive: true });
for (const name of ['privacy.html', 'terms.html', 'disclaimer.html']) {
  fs.copyFileSync(path.join(legalDir, name), path.join(out, 'legal', name));
  // Clean, independent public URL for each legal document.
  const slug = name.slice(0, -5);
  const routeDir = path.join(out, slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.copyFileSync(path.join(legalDir, name), path.join(routeDir, 'index.html'));
}
fs.writeFileSync(path.join(out, '_headers'),
  '/index.html\n  Cache-Control: no-cache\n\n/*\n  X-Content-Type-Options: nosniff\n', 'utf8');
// Do not ship stand-alone developer previews or the old inline archive.
for (const file of fs.readdirSync(out)) {
  if (/^preview/i.test(file)) throw new Error(`Developer preview leaked to public web: ${file}`);
}
if (/BEGIN_NATIVE_LEGACY_ARCHIVE/.test(html)) throw new Error('Legacy inline archive leaked');
console.log('Web P1/P2 + explicit QA-code P3 ready:', out);
console.log('Cloudflare Pages: build command = npm run build:web; output directory = dist/web');
