#!/usr/bin/env python3
"""Regression test for version patch on isolated mock native templates."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'release/version.json').read_text())
assert version['versionName']==json.loads((root/'package.json').read_text())['version']
with tempfile.TemporaryDirectory() as temp:
    work=Path(temp)
    (work/'scripts').mkdir()
    (work/'release').mkdir()
    (work/'android/app').mkdir(parents=True)
    (work/'ios/App/App.xcodeproj').mkdir(parents=True)
    (work/'scripts/set-native-version.py').write_bytes((root/'scripts/set-native-version.py').read_bytes())
    (work/'release/version.json').write_bytes((root/'release/version.json').read_bytes())
    (work/'package.json').write_bytes((root/'package.json').read_bytes())
    gradle=work/'android/app/build.gradle'
    pbx=work/'ios/App/App.xcodeproj/project.pbxproj'
    gradle.write_text('android { defaultConfig {\n        versionCode 1\n        versionName "1.0"\n} }\n')
    pbx.write_text('MARKETING_VERSION = 1.0;\nCURRENT_PROJECT_VERSION = 1;\nMARKETING_VERSION = 1.0;\nCURRENT_PROJECT_VERSION = 1;\n')
    for target in ['android','ios','android','ios']:
        subprocess.run([sys.executable,str(work/'scripts/set-native-version.py'),target],cwd=work,check=True,capture_output=True)
    assert f'versionCode {version["buildNumber"]}' in gradle.read_text()
    assert f'versionName "{version["versionName"]}"' in gradle.read_text()
    assert pbx.read_text().count(f'MARKETING_VERSION = {version["versionName"]};')==2
    assert pbx.read_text().count(f'CURRENT_PROJECT_VERSION = {version["buildNumber"]};')==2
print('PASS: native Android/iOS versions match package, repeated patches are idempotent')
