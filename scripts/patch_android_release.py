#!/usr/bin/env python3
"""Patch Capacitor Groovy Gradle release signing. No release builds signed with debug key."""
from pathlib import Path
import re
p=Path('android/app/build.gradle')
if not p.exists(): raise SystemExit('Missing android/app/build.gradle; run npx cap add android first')
s=p.read_text(encoding='utf-8')
if 'murmurReleaseSigning' in s:
    print('Android release signing already configured')
    raise SystemExit(0)
if 'android {' not in s or 'buildTypes {' not in s or 'release {' not in s:
    raise SystemExit('Unexpected Gradle layout; refusing to patch')
# Locate the release closure using balanced braces to avoid changing the debug block.
release=re.search(r'\brelease\s*\{',s[s.index('buildTypes {'):])
if not release: raise SystemExit('No release block')
start=s.index('buildTypes {')+release.end()
depth=1;end=None
for i in range(start,len(s)):
    if s[i]=='{':depth+=1
    elif s[i]=='}':
        depth-=1
        if depth==0:end=i;break
if end is None:raise SystemExit('Unbalanced Gradle release block')
block=s[start:end]
# Capacitor templates often include signingConfig signingConfigs.debug in release.
# This must be removed, or the release bundle may silently use the debug certificate.
block,n=re.subn(r'^\s*signingConfig\s+signingConfigs\.debug\s*$', '', block, flags=re.M)
if re.search(r'\bsigningConfig\b',block):
    raise SystemExit('Unexpected existing release signingConfig: manual review required')
block='''
            // murmurReleaseSigning: sign release only when all four variables are present.
            if (["MURMUR_KEYSTORE_PATH", "MURMUR_KEYSTORE_PASSWORD", "MURMUR_KEY_ALIAS", "MURMUR_KEY_PASSWORD"].every { System.getenv(it) }) {
                signingConfig signingConfigs.murmurRelease
            }
'''+block
s=s[:start]+block+s[end:]
signing='''
    signingConfigs {
        murmurRelease {
            def ks = System.getenv("MURMUR_KEYSTORE_PATH")
            def pw = System.getenv("MURMUR_KEYSTORE_PASSWORD")
            def aliasName = System.getenv("MURMUR_KEY_ALIAS")
            def keyPw = System.getenv("MURMUR_KEY_PASSWORD")
            if (ks && pw && aliasName && keyPw) {
                storeFile file(ks)
                storePassword pw
                keyAlias aliasName
                keyPassword keyPw
            }
        }
    }
'''
s=s.replace('    buildTypes {',signing+'    buildTypes {',1)
p.write_text(s,encoding='utf-8')
print(f'Android release signing configured; removed {n} debug signing reference(s) from release')
