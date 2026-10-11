#!/usr/bin/env bash
# Prepare a clean Capacitor iOS project on a macOS GitHub Actions runner.
set -euo pipefail
cd "$(dirname "$0")/.."

for cmd in node npx python3 xcodebuild xcrun pod; do
  command -v "$cmd" >/dev/null || { echo "ERROR: $cmd not found"; exit 2; }
done

echo "== Xcode =="
xcodebuild -version
xcrun simctl list devices available

echo "== Generate Capacitor iOS project =="
if [[ ! -d ios/App/App.xcodeproj ]]; then
  npx --no-install cap add ios
fi
npx --no-install cap sync ios
python3 scripts/patch_ios.py
python3 scripts/set-native-version.py ios

[[ -f ios/App/App.xcworkspace/contents.xcworkspacedata ]] || {
  echo 'ERROR: CocoaPods workspace missing after cap sync ios'; exit 3;
}
[[ -f ios/App/Podfile.lock ]] || {
  echo 'ERROR: Podfile.lock missing after cap sync ios'; exit 3;
}

# Catch malformed Info.plist and project files before the expensive Xcode build.
plutil -lint ios/App/App/Info.plist
plutil -lint ios/App/App.xcodeproj/project.pbxproj

echo 'PASS: iOS project prepared, CocoaPods workspace present, plist syntax valid'
