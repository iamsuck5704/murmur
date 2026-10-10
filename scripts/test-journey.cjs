#!/usr/bin/env node
// Regression checks for web/native split and the two-playthrough gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const archive = fs.readFileSync(path.join(root,'www/perpetrator.js'),'utf8');
const web = fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
assert.match(index, /const APP = !!\(window\.Capacitor && typeof window\.Capacitor\.isNativePlatform/);
assert.match(index, /\$\('#mE'\)\.hidden = !\(APP && S\.cleared2\)/);
assert.match(index, /if \(!APP \|\| !S\.cleared2\) return/);
assert.match(archive, /const canEnter = \(\) => \(isNativeApp\(\) && mainIsCleared\(\)\) \|\| PREVIEW/);
assert.match(archive, /return !!\(s && s\.cleared2\)/);
assert.doesNotMatch(web, /<script src="perpetrator\.js"/);
assert.doesNotMatch(web, /<script src="meta-horror\.js"/);
assert(!fs.existsSync(path.join(root,'dist/web/perpetrator.js')));
assert(!fs.existsSync(path.join(root,'dist/web/meta-horror.js')));
assert.match(web, /makeCode\(flag\)/);
assert.match(index, /S\.cleared2 && r\.flag < 2/);
console.log('PASS: native gate, two-playthrough prerequisite, web asset exclusion, import safeguards');
