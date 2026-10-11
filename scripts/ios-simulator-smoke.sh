#!/usr/bin/env bash
# macOS runner only. Build, install, launch, and verify the process stays alive.
set -euo pipefail
cd "$(dirname "$0")/.."
APP_ID="${MURMUR_APP_ID:-app.murmur.story}"
REPORT="${MURMUR_SMOKE_REPORT:-build-reports/ios-simulator-smoke.txt}"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

command -v xcrun >/dev/null || { echo 'FAIL: Xcode tools missing'; exit 2; }
: "${RUNNER_TEMP:=$(mktemp -d)}"
DEVICE_ID="${MURMUR_SIMULATOR_ID:-}"
if [[ -z "$DEVICE_ID" ]]; then
  DEVICE_ID=$(xcrun simctl list devices available -j | python3 -c '
import json, sys
raw=json.load(sys.stdin)["devices"]
# Prefer already-booted iPhones, then newer iOS runtimes.
items=[]
for runtime, devices in raw.items():
    if "iOS" not in runtime: continue
    for d in devices:
        if "iPhone" not in d.get("name", "") or not d.get("isAvailable", True): continue
        items.append((d.get("state") == "Booted", runtime, d["udid"], d["name"]))
items.sort(reverse=True)
print(items[0][2] if items else "")
')
fi
[[ -n "$DEVICE_ID" ]] || { echo 'FAIL: no available iPhone simulator runtime. Inspect xcrun simctl list devices.'; exit 2; }
echo "Simulator UDID: $DEVICE_ID"

xcrun simctl boot "$DEVICE_ID" 2>/dev/null || {
  # A booted simulator is fine; all other failures are not.
  xcrun simctl list devices booted | grep -Fq "$DEVICE_ID" || { echo 'FAIL: simulator boot failed'; exit 2; }
}
xcrun simctl bootstatus "$DEVICE_ID" -b

DERIVED="$RUNNER_TEMP/murmur-derived"
BUILD_LOG="$RUNNER_TEMP/murmur-ios-build.log"
mkdir -p build-reports
# Preserve the complete log as an artifact, not only the last 65 lines.
if ! xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug \
  -sdk iphonesimulator -destination "platform=iOS Simulator,id=$DEVICE_ID" \
  -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO build > "$BUILD_LOG" 2>&1; then
  tail -n 130 "$BUILD_LOG"
  cp "$BUILD_LOG" build-reports/ios-xcodebuild.log
  echo 'FAIL: xcodebuild simulator compilation'
  exit 1
fi
cp "$BUILD_LOG" build-reports/ios-xcodebuild.log
APP="$DERIVED/Build/Products/Debug-iphonesimulator/App.app"
[[ -d "$APP" ]] || { echo 'FAIL: compiled App.app missing'; exit 1; }
xcrun simctl install "$DEVICE_ID" "$APP"
xcrun simctl terminate "$DEVICE_ID" "$APP_ID" >/dev/null 2>&1 || true
LAUNCH_OUTPUT=$(xcrun simctl launch "$DEVICE_ID" "$APP_ID") || { echo 'FAIL: simctl launch'; exit 1; }
echo "$LAUNCH_OUTPUT"
PID="${LAUNCH_OUTPUT##*: }"
[[ "$PID" =~ ^[0-9]+$ ]] || { echo 'FAIL: cannot parse PID from simctl launch'; exit 1; }
sleep 8
# simctl launch alone does not prove the process remains alive.
if xcrun simctl spawn "$DEVICE_ID" /bin/ps -A -o pid= | tr -d ' ' | grep -Fxq "$PID"; then
  echo "PASS: $APP_ID remained running (PID $PID)"
else
  echo "FAIL: $APP_ID exited within 8 seconds of launch (PID $PID)"
  xcrun simctl spawn "$DEVICE_ID" log show --last 2m --style compact \
    --predicate 'process == "App" OR eventMessage CONTAINS "app.murmur.story"' \
    > build-reports/ios-launch-diagnostics.log 2>&1 || true
  exit 1
fi
