from pathlib import Path
import re

p = Path('android/app/src/main/java/app/murmur/story/MainActivity.java')
if not p.exists():
    raise SystemExit('Missing MainActivity.java; run npx cap add android first')
s = p.read_text(encoding='utf-8')
if 'murmurScreenshot' not in s:
    s = '''package app.murmur.story;

import android.os.Build;
import android.os.Bundle;
import android.app.Activity;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private Activity.ScreenCaptureCallback murmurScreenshot;
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 34) {
            murmurScreenshot = () -> runOnUiThread(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'screenshot'}}));", null);
                }
            });
        }
    }
    @Override public void onStart() {
        super.onStart();
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) registerScreenCaptureCallback(getMainExecutor(), murmurScreenshot);
    }
    @Override public void onStop() {
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) unregisterScreenCaptureCallback(murmurScreenshot);
        super.onStop();
    }
}
'''

# Repair files created by older versions of this script, too.
s = re.sub(r'\bprotected(\s+void\s+onStart\s*\()', r'public\1', s)
s = re.sub(r'\bprotected(\s+void\s+onStop\s*\()', r'public\1', s)
p.write_text(s, encoding='utf-8')

manifest = Path('android/app/src/main/AndroidManifest.xml')
if not manifest.exists():
    raise SystemExit('Missing AndroidManifest.xml')
s = manifest.read_text(encoding='utf-8')
if 'android.permission.RECORD_AUDIO' not in s:
    s = s.replace('<application', '''<uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.DETECT_SCREEN_CAPTURE" />
    <application''', 1)
    manifest.write_text(s, encoding='utf-8')
print('Murmur Android patch applied (onStart/onStop are public)')
