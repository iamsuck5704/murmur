#!/usr/bin/env bash
# Launch-only Android smoke test. Does not request sensitive permissions or play through the game.
set -euo pipefail
APP_ID="${MURMUR_APP_ID:-app.murmur.story}"
APK="${1:-android/app/build/outputs/apk/debug/app-debug.apk}"
REPORT="${MURMUR_SMOKE_REPORT:-build-reports/android-smoke.txt}"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1
printf 'Murmur Android smoke: %s\n' "$APP_ID"
command -v adb >/dev/null || { echo 'FAIL: adb is not installed'; exit 2; }
[[ -f "$APK" ]] || { echo "FAIL: APK missing: $APK"; exit 2; }
adb wait-for-device
adb install -r "$APK"
adb shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
adb logcat -c >/dev/null 2>&1 || true
START=$(adb shell am start -W -n "$APP_ID/.MainActivity" 2>&1)
printf '%s\n' "$START"
if grep -Eiq '(Error:|Exception|does not exist|unable to resolve)' <<< "$START"; then
  echo 'FAIL: Activity launch rejected'; exit 1
fi
for i in $(seq 1 20); do
  if adb shell pidof "$APP_ID" 2>/dev/null | grep -Eq '[0-9]'; then
    echo 'PASS: app process is running after launch'; exit 0
  fi
  sleep 1
done
echo 'FAIL: app process not running after 20 seconds'
echo 'Inspect Android Studio Logcat locally. Do not publish logs containing private data.'
exit 1
