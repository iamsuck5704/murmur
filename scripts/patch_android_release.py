#!/usr/bin/env python3
"""Optional env-only Android release signing, applied to generated Groovy build.gradle."""
from pathlib import Path
p=Path('android/app/build.gradle')
if not p.exists(): raise SystemExit('Missing android/app/build.gradle; run npx cap add android first')
s=p.read_text(encoding='utf-8')
if 'murmurReleaseSigning' in s:
    print('Android release signing already configured')
    raise SystemExit(0)
if 'android {' not in s or 'buildTypes {' not in s or 'release {' not in s:
    raise SystemExit('Unexpected Gradle layout; refusing to patch')
signing='''
    // murmurReleaseSigning: environment-only, no secrets committed.
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
s=s.replace('        release {','''        release {
            if (["MURMUR_KEYSTORE_PATH", "MURMUR_KEYSTORE_PASSWORD", "MURMUR_KEY_ALIAS", "MURMUR_KEY_PASSWORD"].every { System.getenv(it) }) {
                signingConfig signingConfigs.murmurRelease
            }''',1)
p.write_text(s,encoding='utf-8')
print('Android release signing hook configured (requires CI secrets)')
