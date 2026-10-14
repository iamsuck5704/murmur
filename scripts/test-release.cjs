#!/usr/bin/env node
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const web=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
assert(source.includes('<script src="store-links.js"></script>'));
assert(web.includes('<script src="store-links.js"></script>'));
assert(fs.existsSync(path.join(root,'dist/web/store-links.js')));
assert(source.includes('storeLinksMarkup()'));
assert(web.includes('<script src="perpetrator.js"></script>'));
assert(web.includes('window.MURMUR_TESTER_WEB=true'));
assert(!web.includes('MURMUR-QA-123012301230')); // only the digest is embedded
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'www/store-links.js'),'utf8'),sandbox);
assert.equal(sandbox.window.MURMUR_STORES.android,null);
assert.equal(sandbox.window.MURMUR_STORES.ios,null);
assert(source.includes('u.protocol !== \'https:\''));
assert(source.includes("u.searchParams.get('id') === 'app.murmur.story'"));
console.log('Release store-link fallback and web separation checks passed.');
