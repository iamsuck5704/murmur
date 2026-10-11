#!/usr/bin/env node
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const cap=JSON.parse(read('capacitor.config.json'));
assert.equal(cap.appId,'app.murmur.story');
const v=JSON.parse(read('release/version.json'));
assert.equal(v.versionName,JSON.parse(read('package.json')).version);
assert.ok(Number.isInteger(v.buildNumber) && v.buildNumber>0);
for(const p of ['scripts/android-smoke.sh','scripts/ios-simulator-smoke.sh','scripts/ios-ci-prepare.sh','.github/workflows/android-smoke.yml','.github/workflows/ios-smoke.yml']) assert.ok(fs.existsSync(p),`Missing ${p}`);
assert.match(read('scripts/android-smoke.sh'),/adb shell am start -W/);
assert.match(read('scripts/android-smoke.sh'),/adb shell pidof/);
assert.match(read('scripts/ios-simulator-smoke.sh'),/xcrun simctl install/);
assert.match(read('scripts/ios-simulator-smoke.sh'),/xcrun simctl launch/);
assert.match(read('scripts/ios-simulator-smoke.sh'),/\/bin\/ps/);
assert.match(read('scripts/ios-ci-prepare.sh'),/npx --no-install cap sync ios/);
assert.match(read('.github/workflows/ios-build.yml'),/ios-ci-prepare\.sh/);
assert.match(read('.github/workflows/ios-build.yml'),/ios-simulator-smoke\.sh/);
assert.match(read('.github/workflows/ios-build.yml'),/if: always\(\)/);
assert.match(read('.github/workflows/ios-smoke.yml'),/ios-ci-prepare\.sh/);
for(const p of ['.github/workflows/android-smoke.yml','.github/workflows/ios-smoke.yml']) {
  const y=read(p);
  assert.match(y,/workflow_dispatch/);
  assert.match(y,/test:smoke-config/);
  assert.match(y,/smoke\.sh/);
  assert.doesNotMatch(y,/MURMUR_KEYSTORE_PASSWORD|BUILD_CERTIFICATE_BASE64/);
}
console.log('PASS: simulator smoke scripts, workflow wiring and native app ID');
