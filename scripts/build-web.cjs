#!/usr/bin/env node
// Single source: www/; public build: dist/web/. Never publish www/ directly.
const fs = require('node:fs');
const path = require('node:path');
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
for (const tag of nativeAssets) html = html.replace(tag, '');
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
}
fs.writeFileSync(path.join(out, '_headers'),
  '/index.html\n  Cache-Control: no-cache\n\n/*\n  X-Content-Type-Options: nosniff\n', 'utf8');
for (const file of fs.readdirSync(out)) {
  if (/perpetrator|meta-horror|preview/i.test(file)) {
    throw new Error(`Private native-only asset leaked to web build: ${file}`);
  }
}
if (/perpetrator\.js|meta-horror\.js|perpetrator\.css|BEGIN_NATIVE_LEGACY_ARCHIVE/.test(html)) {
  throw new Error('Native-only references leaked into web HTML');
}
console.log('Web P1/P2 ready:', out);
console.log('Cloudflare Pages: build command = npm run build:web; output directory = dist/web');
