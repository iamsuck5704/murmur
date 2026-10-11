#!/usr/bin/env python3
from pathlib import Path
import tempfile,subprocess,sys
script=Path(__file__).with_name('patch_android_release.py')
with tempfile.TemporaryDirectory() as d:
    base=Path(d);target=base/'android/app/build.gradle';target.parent.mkdir(parents=True)
    target.write_text('''android {
    signingConfigs { debug { } }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            minifyEnabled false
            signingConfig signingConfigs.debug
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
''')
    for _ in range(2):
        result=subprocess.run([sys.executable,str(script)],cwd=base,capture_output=True,text=True)
        assert result.returncode==0,(result.stdout,result.stderr)
    s=target.read_text()
    assert s.count('murmurReleaseSigning')==1
    assert s.count('signingConfig signingConfigs.debug')==1,'Debug signing must be retained ONLY for debug build'
    assert s.count('signingConfig signingConfigs.murmurRelease')==1
    assert s.count('signingConfigs {')==2
print('PASS: Gradle release never inherits debug signing, patch idempotent')
