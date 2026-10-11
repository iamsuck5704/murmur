#!/usr/bin/env python3
"""Idempotent Capacitor Android lifecycle + optional capture detection patch.

Run after `npx cap add android` and `npx cap sync android`.
This does NOT claim WebView camera/microphone/geolocation runtime grants.
"""
from pathlib import Path
import re

activity = Path('android/app/src/main/java/app/murmur/story/MainActivity.java')
manifest = Path('android/app/src/main/AndroidManifest.xml')
if not activity.exists() or not manifest.exists():
    raise SystemExit('Missing Android native files. Run npx cap add android first.')
s = activity.read_text(encoding='utf-8')
if not re.search(r'\bclass\s+MainActivity\s+extends\s+BridgeActivity\b', s):
    raise SystemExit('Unexpected MainActivity: refusing to modify unknown superclass')
if s.rfind('}') < 0:
    raise SystemExit('Invalid MainActivity')

imports = [
    'android.app.Activity', 'android.os.Build', 'android.view.WindowManager',
    'java.util.function.Consumer',
]
for imp in imports:
    if not re.search(r'^\s*import\s+' + re.escape(imp) + r'\s*;', s, re.M):
        package = re.search(r'^\s*package\s+[\w.]+\s*;', s, re.M)
        if not package:
            raise SystemExit('Missing Java package declaration')
        s = s[:package.end()] + '\nimport ' + imp + ';' + s[package.end():]

# The original patch had a fragile `import android.os.Bundle;` string replacement.
# Ensure both recording imports exist even when that import is absent.
if 'murmurScreenshot' not in s:
    code = '''
    private Activity.ScreenCaptureCallback murmurScreenshot;
    private boolean murmurCaptureRegistered = false;
    private void murmurRegisterScreenshot() {
        if (Build.VERSION.SDK_INT < 34 || murmurCaptureRegistered) return;
        if (murmurScreenshot == null) murmurScreenshot = () -> runOnUiThread(() -> {
            if (getBridge() != null && getBridge().getWebView() != null)
                getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'screenshot'}}));", null);
        });
        try {
            registerScreenCaptureCallback(getMainExecutor(), murmurScreenshot);
            murmurCaptureRegistered = true;
        } catch (Exception ignored) { murmurCaptureRegistered = false; }
    }
    private void murmurUnregisterScreenshot() {
        if (Build.VERSION.SDK_INT < 34 || !murmurCaptureRegistered) return;
        try { unregisterScreenCaptureCallback(murmurScreenshot); } catch (Exception ignored) {}
        murmurCaptureRegistered = false;
    }
'''
    s = s[:s.rfind('}')] + code + s[s.rfind('}'):]

if 'murmurRecordingListener' not in s:
    code = '''
    private Consumer<Integer> murmurRecordingListener;
    private boolean murmurRecordingRegistered = false;
    private void murmurRegisterRecording() {
        if (Build.VERSION.SDK_INT < 35 || murmurRecordingRegistered) return;
        try {
            WindowManager wm = getSystemService(WindowManager.class);
            if (wm == null) return;
            murmurRecordingListener = state -> {
                if (state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
                    runOnUiThread(() -> {
                        if (getBridge() != null && getBridge().getWebView() != null)
                            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'recording'}}));", null);
                    });
                }
            };
            wm.addScreenRecordingCallback(getMainExecutor(), murmurRecordingListener);
            murmurRecordingRegistered = true;
        } catch (Exception ignored) { murmurRecordingListener = null; }
    }
    private void murmurUnregisterRecording() {
        if (Build.VERSION.SDK_INT < 35 || !murmurRecordingRegistered) return;
        try {
            WindowManager wm = getSystemService(WindowManager.class);
            if (wm != null) wm.removeScreenRecordingCallback(murmurRecordingListener);
        } catch (Exception ignored) {}
        murmurRecordingRegistered = false;
        murmurRecordingListener = null;
    }
'''
    s = s[:s.rfind('}')] + code + s[s.rfind('}'):]

def lifecycle(source, method, call, before_super=False):
    # Preserve existing overrides, inserting only into their existing super call.
    marker = f'murmur{method.capitalize()}Hook'
    if marker in source:
        return source
    regex = re.compile(r'\b(?:public|protected)\s+void\s+' + method + r'\s*\(\s*\)\s*\{')
    found = regex.search(source)
    hook = f'/* {marker} */ {call}'
    if found:
        # Restrict to the method body before the next method/class closure.
        remainder = source[found.end():]
        super_call = re.search(r'\bsuper\.' + method + r'\s*\(\s*\)\s*;', remainder)
        if not super_call or super_call.start() > 1000:
            raise SystemExit(f'{method} exists but super.{method}() not found nearby; manual review needed')
        a = found.end() + super_call.start()
        b = found.end() + super_call.end()
        if before_super:
            return source[:a] + hook + '\n        ' + source[a:]
        return source[:b] + ' ' + hook + source[b:]
    body = f'{hook} super.{method}();' if before_super else f'super.{method}(); {hook}'
    addition = f'\n    @Override public void {method}() {{ {body} }}\n'
    return source[:source.rfind('}')] + addition + source[source.rfind('}'):]

s = lifecycle(s, 'onStart', 'murmurRegisterScreenshot(); murmurRegisterRecording();')
s = lifecycle(s, 'onStop', 'murmurUnregisterScreenshot(); murmurUnregisterRecording();', True)
# Foreground event is informational; JS must independently check player opt-in.
if 'murmurForeground' not in s:
    if re.search(r'\bvoid\s+onResume\s*\(', s):
        raise SystemExit('Existing onResume without Murmur hook; manual review needed')
    code = '''
    @Override public void onResume() { // murmurForeground
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null)
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'foreground'}}));", null);
    }
'''
    s = s[:s.rfind('}')] + code + s[s.rfind('}'):]
# Older patch may use protected onStart/onStop; public is compatible with Activity.
s = re.sub(r'\bprotected(\s+void\s+on(?:Start|Stop)\s*\()', r'public\1', s)
activity.write_text(s, encoding='utf-8')

m = manifest.read_text(encoding='utf-8')
if '<application' not in m:
    raise SystemExit('Unexpected AndroidManifest: missing application')
permissions = [
    'android.permission.RECORD_AUDIO', 'android.permission.CAMERA',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.DETECT_SCREEN_CAPTURE',
    'android.permission.DETECT_SCREEN_RECORDING',
]
for perm in permissions:
    if not re.search(r'<uses-permission\b[^>]*\bandroid:name\s*=\s*[\'\"]' + re.escape(perm) + r'[\'\"]', m):
        m = m.replace('<application', f'<uses-permission android:name="{perm}" />\n    <application', 1)
manifest.write_text(m, encoding='utf-8')
print('Murmur Android patch applied: capture/recording lifecycle + manifest permissions (not a runtime grant)')
