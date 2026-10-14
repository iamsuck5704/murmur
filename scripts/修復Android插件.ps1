$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$main = 'android/app/src/main/java/app/murmur/story/MainActivity.java'
$manifest = 'android/app/src/main/AndroidManifest.xml'
if (!(Test-Path $main) -or !(Test-Path $manifest)) { throw 'Android project missing. Run npx cap sync android first.' }
$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) { & py -3 scripts/patch_android.py; $exit = $LASTEXITCODE }
else {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (!$python) { throw 'Python 3 not found. Install Python or use py -3.' }
  & python scripts/patch_android.py; $exit = $LASTEXITCODE
}
if ($exit -ne 0) { throw "patch_android.py failed with exit code $exit" }
$content = Get-Content $main -Raw
$need = @('registerPlugin(MurmurPermissionsPlugin.class)', 'registerPlugin(MurmurSensorsPlugin.class)')
foreach ($needle in $need) {
  if (!$content.Contains($needle)) { throw "Missing MainActivity registration: $needle" }
}
foreach ($name in @('MurmurPermissionsPlugin.java', 'MurmurSensorsPlugin.java', 'MurmurWebChromeClient.java')) {
  $file = Join-Path (Split-Path $main) $name
  if (!(Test-Path $file)) { throw "Missing Java plugin file: $file" }
}
Write-Host 'PASS: Both native plugins registered and all Java sources present.' -ForegroundColor Green
Write-Host 'NEXT: Rebuild APK in Android Studio. Do not run npx cap sync after patch without re-running this script.'
