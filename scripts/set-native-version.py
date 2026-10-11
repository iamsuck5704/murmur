#!/usr/bin/env python3
"""Set version consistently in generated Capacitor Android/iOS native projects.

Run after `npx cap add`/`npx cap sync`. Does not create a native project.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
release = json.loads((root / 'release/version.json').read_text(encoding='utf-8'))
pkg = json.loads((root / 'package.json').read_text(encoding='utf-8'))
version = release['versionName']
number = release['buildNumber']
if version != pkg['version'] or not re.fullmatch(r'\d+\.\d+\.\d+', version):
    raise SystemExit('release/version.json versionName must match package.json semver')
if not isinstance(number, int) or number <= 0:
    raise SystemExit('buildNumber must be a positive integer; increment it for each store upload')
if len(sys.argv) != 2 or sys.argv[1] not in ('android', 'ios'):
    raise SystemExit('Usage: python scripts/set-native-version.py android|ios')
platform = sys.argv[1]
if platform == 'android':
    file = root / 'android/app/build.gradle'
    if not file.exists():
        raise SystemExit('Android project missing: run npx cap add android')
    source = file.read_text(encoding='utf-8')
    source, codes = re.subn(r'(?m)^(\s*versionCode\s+)\d+(\s*)$', lambda m: f'{m[1]}{number}{m[2]}', source)
    source, names = re.subn(r'(?m)^(\s*versionName\s+)["\'][^"\']+["\'](\s*)$', lambda m: f'{m[1]}"{version}"{m[2]}', source)
    if codes != 1 or names != 1:
        raise SystemExit(f'Unexpected Gradle version format: versionCode={codes}, versionName={names}; manual review needed')
else:
    file = root / 'ios/App/App.xcodeproj/project.pbxproj'
    if not file.exists():
        raise SystemExit('iOS project missing: run npx cap add ios')
    source = file.read_text(encoding='utf-8')
    source, names = re.subn(r'(?m)^(\s*MARKETING_VERSION\s*=\s*)[^;]+;', lambda m: f'{m[1]}{version};', source)
    source, codes = re.subn(r'(?m)^(\s*CURRENT_PROJECT_VERSION\s*=\s*)[^;]+;', lambda m: f'{m[1]}{number};', source)
    if codes < 1 or names < 1:
        raise SystemExit(f'Unexpected Xcode project version format: build={codes}, marketing={names}; manual review needed')
file.write_text(source, encoding='utf-8')
print(f'{platform} version set to {version} ({number})')
