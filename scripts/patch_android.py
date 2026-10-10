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
# Lifecycle callback: return-to-app narrative event after time away. Avoid overwriting others.
if 'murmurForeground' not in s:
    insert = """
    @Override public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'foreground'}}));", null);
        }
    }
    """
    index = s.rfind('}')
    if index<0: raise SystemExit('Invalid MainActivity.java')
    s = s[:index]+insert.replace('onResume()', 'onResume() /* murmurForeground */', 1)+s[index:]
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

# v1.2 optional camera/approximate location permissions. Runtime consent is handled by WebView.
manifest = Path('android/app/src/main/AndroidManifest.xml')
if manifest.exists():
    data=manifest.read_text(encoding='utf-8')
    before='<application'
    for permission in ['android.permission.CAMERA','android.permission.ACCESS_COARSE_LOCATION']:
        if permission not in data:
            data=data.replace(before, '<uses-permission android:name="'+permission+'" />\n    '+before, 1)
    manifest.write_text(data,encoding='utf-8')

# v1.3: screen recording callback is available only on API 35+ and only while app is visible.
from pathlib import Path
p=Path('android/app/src/main/java/app/murmur/story/MainActivity.java')
s=p.read_text(encoding='utf-8')
if 'murmurRecordingListener' not in s:
    s=s.replace('import android.os.Bundle;', 'import android.os.Bundle;import android.view.WindowManager;import java.util.function.Consumer;')
    s=s.replace('public class MainActivity extends BridgeActivity {', '''public class MainActivity extends BridgeActivity {
    private Consumer<Integer> murmurRecordingListener;
    private boolean murmurRecordingRegistered = false;
    private void murmurRegisterRecording() {
        if (Build.VERSION.SDK_INT < 35 || murmurRecordingRegistered) return;
        try {
            WindowManager wm = getSystemService(WindowManager.class);
            murmurRecordingListener = state -> {
                if (state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
                    runOnUiThread(() -> {
                        if (getBridge()!=null && getBridge().getWebView()!=null) {
                            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'recording'}}));",null);
                        }
                    });
                }
            };
            wm.addScreenRecordingCallback(getMainExecutor(),murmurRecordingListener);
            murmurRecordingRegistered = true;
        } catch (Exception ignored) { murmurRecordingListener = null; }
    }
    private void murmurUnregisterRecording() {
        if (Build.VERSION.SDK_INT < 35 || !murmurRecordingRegistered) return;
        try { getSystemService(WindowManager.class).removeScreenRecordingCallback(murmurRecordingListener); }
        catch (Exception ignored) {}
        murmurRecordingRegistered=false;
    }
''',1)
    s=s.replace('super.onStart();', 'super.onStart();        murmurRegisterRecording();',1)
    s=s.replace('super.onStop();', 'murmurUnregisterRecording();        super.onStop();',1)
    p.write_text(s,encoding='utf-8')
manifest=Path('android/app/src/main/AndroidManifest.xml')
s=manifest.read_text(encoding='utf-8')
if 'android.permission.DETECT_SCREEN_RECORDING' not in s:
    s=s.replace('<application','<uses-permission android:name="android.permission.DETECT_SCREEN_RECORDING" />    <application',1)
    manifest.write_text(s,encoding='utf-8')
