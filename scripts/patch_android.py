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
    'android.app.Activity', 'android.os.Build', 'android.os.Bundle', 'android.view.WindowManager',
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
            MurmurAwayPlugin.markCapture(this);
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

# Upgrade legacy generated recording handler without duplicating methods.
if 'murmurRecordingListener' in s and 'murmurRecordingRegistered' in s and 'murmurRecordingListener.accept(initialState)' not in s:
    s=s.replace('''                if (state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
                    runOnUiThread(() -> {
                        if (getBridge() != null && getBridge().getWebView() != null)
                            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'recording'}}));", null);
                    });
                }''','''                final String kind = state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE ? "recording-start" : "recording-stop";
                if ("recording-stop".equals(kind)) MurmurAwayPlugin.markCapture(this);
                runOnUiThread(() -> {
                    if (getBridge() != null && getBridge().getWebView() != null)
                        getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'" + kind + "'}}));", null);
                });''')
    s=s.replace('''            wm.addScreenRecordingCallback(getMainExecutor(), murmurRecordingListener);
            murmurRecordingRegistered = true;''','''            int initialState = wm.addScreenRecordingCallback(getMainExecutor(), murmurRecordingListener);
            murmurRecordingRegistered = true;
            murmurRecordingListener.accept(initialState);''')

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
                final String kind = state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE ? "recording-start" : "recording-stop";
                if ("recording-stop".equals(kind)) MurmurAwayPlugin.markCapture(this);
                runOnUiThread(() -> {
                    if (getBridge() != null && getBridge().getWebView() != null)
                        getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'" + kind + "'}}));", null);
                });
            };
            int initialState = wm.addScreenRecordingCallback(getMainExecutor(), murmurRecordingListener);
            murmurRecordingRegistered = true;
            murmurRecordingListener.accept(initialState);
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

# Send a native background hint while the WebView is still responsive.
if 'murmurBackground' not in s:
    background_code = '''
    @Override public void onPause() { // murmurBackground
        if (getBridge() != null && getBridge().getWebView() != null)
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'background'}}));", null);
        super.onPause();
    }
'''
    if re.search(r'\bvoid\s+onPause\s*\(', s):
        raise SystemExit('Existing onPause without Murmur hook; manual review needed')
    s = s[:s.rfind('}')] + background_code + s[s.rfind('}'):]
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
# Register a small native permission bridge. The WebView camera/geolocation APIs
# remain in Capacitor's own BridgeWebChromeClient; do not replace it.
if 'murmurPermissionBridgeOnCreate' not in s:
    found = re.search(r'\b(?:public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+(\w+)\s*\)\s*\{', s)
    if found:
        arg = found.group(1)
        remainder = s[found.end():]
        super_call = re.search(r'\bsuper\.onCreate\s*\(\s*' + re.escape(arg) + r'\s*\)\s*;', remainder)
        if not super_call or super_call.start()>1200:
            raise SystemExit('onCreate exists but expected super.onCreate() missing')
        pos=found.end()+super_call.start()
        s=s[:pos]+'/* murmurPermissionBridgeOnCreate */ registerPlugin(MurmurPermissionsPlugin.class);\n        '+s[pos:]
    else:
        s=s[:s.rfind('}')]+'''
    @Override public void onCreate(Bundle savedInstanceState) { // murmurPermissionBridgeOnCreate
        registerPlugin(MurmurPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
    }
'''+s[s.rfind('}'):]
# After Capacitor has created its bridge, install a subclass of its own
# WebChromeClient. This preserves JS dialogs/file pickers while ensuring
# already-granted Android permissions are passed through to WebView.
if 'murmurWebChromeBridge' not in s:
    m = re.search(r'\b(?:public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+(\w+)\s*\)\s*\{', s)
    if not m: raise SystemExit('Expected onCreate after permission plugin registration')
    tail=s[m.end():]
    super_call=re.search(r'\bsuper\.onCreate\s*\(\s*'+re.escape(m.group(1))+r'\s*\)\s*;',tail)
    if not super_call or super_call.start()>1500: raise SystemExit('Missing super.onCreate in onCreate')
    pos=m.end()+super_call.end()
    s=s[:pos]+'''
        /* murmurWebChromeBridge */
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebChromeClient(new MurmurWebChromeClient(getBridge()));
        }
'''+s[pos:]
# Register native sensors before BridgeActivity.onCreate; never start until user opts in.
if 'murmurSensorBridgeOnCreate' not in s:
    m=re.search(r'\b(?:public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+(\w+)\s*\)\s*\{',s)
    if not m: raise SystemExit('Missing onCreate for sensors')
    tail=s[m.end():]
    super_call=re.search(r'\bsuper\.onCreate\s*\(\s*'+re.escape(m.group(1))+r'\s*\)\s*;',tail)
    if not super_call or super_call.start()>2000: raise SystemExit('Missing super.onCreate for sensors')
    pos=m.end()+super_call.start()
    s=s[:pos]+'/* murmurSensorBridgeOnCreate */ registerPlugin(MurmurSensorsPlugin.class);\n        '+s[pos:]
if 'murmurAwayBridgeOnCreate' not in s:
    m=re.search(r'\b(?:public|protected)\s+void\s+onCreate\s*\(\s*Bundle\s+(\w+)\s*\)\s*\{',s)
    if not m: raise SystemExit('Missing onCreate for away plugin')
    tail=s[m.end():]
    super_call=re.search(r'\bsuper\.onCreate\s*\(\s*'+re.escape(m.group(1))+r'\s*\)\s*;',tail)
    if not super_call: raise SystemExit('Missing super.onCreate for away plugin')
    pos=m.end()+super_call.start()
    s=s[:pos]+'/* murmurAwayBridgeOnCreate */ registerPlugin(MurmurAwayPlugin.class);\n        '+s[pos:]
# Run native scheduling BEFORE WebView JS may be suspended.
if 'MurmurAwayPlugin.onBackground(this)' not in s:
    s=s.replace('    @Override public void onPause() { // murmurBackground', '    @Override public void onPause() { // murmurBackground\n        MurmurAwayPlugin.onBackground(this);')
if 'MurmurAwayPlugin.onForeground(this)' not in s:
    s=s.replace('    @Override public void onResume() { // murmurForeground\n        super.onResume();', '    @Override public void onResume() { // murmurForeground\n        super.onResume();\n        MurmurAwayPlugin.onForeground(this);')
activity.write_text(s, encoding='utf-8')

chrome=activity.with_name('MurmurWebChromeClient.java')
chrome.write_text('''package app.murmur.story;

import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

/** Delegates everything except already-granted local WebView media/location. */
public class MurmurWebChromeClient extends BridgeWebChromeClient {
    private final Bridge murmurBridge;
    public MurmurWebChromeClient(Bridge bridge) {
        super(bridge);
        this.murmurBridge = bridge;
    }
    private boolean granted(String permission) {
        return ContextCompat.checkSelfPermission(murmurBridge.getContext(), permission) == PackageManager.PERMISSION_GRANTED;
    }
    private boolean local(Uri origin) {
        return origin != null && "https".equalsIgnoreCase(origin.getScheme())
            && "localhost".equalsIgnoreCase(origin.getHost());
    }
    @Override public void onPermissionRequest(final PermissionRequest request) {
        if (!local(request.getOrigin())) { request.deny(); return; }
        boolean video=false, audio=false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) video=true;
            else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) audio=true;
            else { request.deny(); return; }
        }
        if ((!video || granted(Manifest.permission.CAMERA)) &&
            (!audio || granted(Manifest.permission.RECORD_AUDIO))) {
            // WebView grant is distinct from Android's runtime permission grant.
            murmurBridge.getActivity().runOnUiThread(() -> request.grant(request.getResources()));
        } else {
            super.onPermissionRequest(request);
        }
    }
    @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        Uri uri;
        try { uri = Uri.parse(origin); } catch (Exception ex) { callback.invoke(origin, false, false); return; }
        if (!local(uri)) { callback.invoke(origin, false, false); return; }
        if (granted(Manifest.permission.ACCESS_COARSE_LOCATION) || granted(Manifest.permission.ACCESS_FINE_LOCATION)) {
            callback.invoke(origin, true, false);
        } else {
            super.onGeolocationPermissionsShowPrompt(origin, callback);
        }
    }
}
''', encoding='utf-8')


plugin=activity.with_name('MurmurPermissionsPlugin.java')
plugin.write_text('''package app.murmur.story;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginMethod;

// This plugin only requests/checks OS runtime grants after explicit user action.
// No images, audio, or location data are accessed or returned by this plugin.
@CapacitorPlugin(name = "MurmurPermissions", permissions = {
    @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }),
    @Permission(alias = "location", strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION })
})
public class MurmurPermissionsPlugin extends Plugin {
    private boolean has(String permission) {
        return ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED;
    }
    private boolean granted(String kind) {
        switch (kind) {
            case "camera": return has(Manifest.permission.CAMERA);
            case "microphone": return has(Manifest.permission.RECORD_AUDIO);
            // Approximate location is sufficient; never force precise location.
            case "location": return has(Manifest.permission.ACCESS_COARSE_LOCATION) || has(Manifest.permission.ACCESS_FINE_LOCATION);
            default: return false;
        }
    }
    private void reply(PluginCall call, String kind) {
        JSObject result = new JSObject();
        result.put("granted", granted(kind));
        result.put("kind", kind);
        call.resolve(result);
    }
    @PluginMethod
    public void check(PluginCall call) {
        String kind = call.getString("kind");
        if (!"camera".equals(kind) && !"microphone".equals(kind) && !"location".equals(kind)) {
            call.reject("Unsupported permission type"); return;
        }
        reply(call, kind);
    }
    @PluginMethod
    public void request(PluginCall call) {
        String kind = call.getString("kind");
        if (!"camera".equals(kind) && !"microphone".equals(kind) && !"location".equals(kind)) {
            call.reject("Unsupported permission type"); return;
        }
        if (granted(kind)) { reply(call, kind); return; }
        requestPermissionForAlias(kind, call, "permissionResult");
    }
    @PermissionCallback
    private void permissionResult(PluginCall call) {
        String kind = call.getString("kind");
        reply(call, kind);
    }
}
''', encoding='utf-8')



# A low-frequency, opt-in sensor bridge. Values never leave the device or persist.
sensors=activity.with_name('MurmurSensorsPlugin.java')
sensors.write_text('''package app.murmur.story;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Foreground-only accelerometer, gyroscope and optional ambient light. */
@CapacitorPlugin(name = "MurmurSensors")
public class MurmurSensorsPlugin extends Plugin implements SensorEventListener {
    private SensorManager manager;
    private boolean motionActive = false;
    private boolean lightActive = false;
    private boolean accelPresent = false;
    private boolean gyroPresent = false;
    private boolean lightPresent = false;
    private float ax, ay, az, gx, gy, gz, lux;
    private long accelAt, gyroAt, lightAt;

    private SensorManager sensors() {
        if (manager == null) manager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        return manager;
    }
    private boolean has(int type) { return sensors() != null && sensors().getDefaultSensor(type) != null; }
    @PluginMethod public void capabilities(PluginCall call) {
        JSObject r = new JSObject();
        r.put("accelerometer", has(Sensor.TYPE_ACCELEROMETER));
        r.put("gyroscope", has(Sensor.TYPE_GYROSCOPE));
        r.put("light", has(Sensor.TYPE_LIGHT));
        r.put("platform", "android");
        call.resolve(r);
    }
    @PluginMethod public synchronized void start(PluginCall call) {
        String kind = call.getString("kind", "");
        if (!"motion".equals(kind) && !"light".equals(kind)) { call.reject("Unsupported sensor"); return; }
        SensorManager sm = sensors();
        if (sm == null) { call.reject("SensorManager unavailable"); return; }
        if ("motion".equals(kind)) {
            if (!motionActive) {
                Sensor a=sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
                Sensor g=sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
                accelPresent=a!=null && sm.registerListener(this,a,SensorManager.SENSOR_DELAY_GAME);
                gyroPresent=g!=null && sm.registerListener(this,g,SensorManager.SENSOR_DELAY_GAME);
                motionActive=accelPresent||gyroPresent;
            }
            if (!motionActive) { call.reject("No motion sensors"); return; }
        } else {
            if (!lightActive) {
                Sensor l=sm.getDefaultSensor(Sensor.TYPE_LIGHT);
                lightPresent=l!=null && sm.registerListener(this,l,SensorManager.SENSOR_DELAY_NORMAL);
                lightActive=lightPresent;
            }
            if (!lightActive) { call.reject("Ambient light sensor unavailable"); return; }
        }
        JSObject r=new JSObject();r.put("active",true);r.put("kind",kind);call.resolve(r);
    }
    @PluginMethod public synchronized void read(PluginCall call) {
        JSObject r=new JSObject();
        r.put("motionActive",motionActive);r.put("lightActive",lightActive);
        r.put("accelerometer",accelPresent);r.put("gyroscope",gyroPresent);r.put("light",lightPresent);
        r.put("ax",ax);r.put("ay",ay);r.put("az",az);
        r.put("gx",gx);r.put("gy",gy);r.put("gz",gz);r.put("lux",lux);
        long now=SystemClock.elapsedRealtime();
        r.put("accelFresh",accelAt>0 && now-accelAt<1500);
        r.put("gyroFresh",gyroAt>0 && now-gyroAt<1500);
        r.put("lightFresh",lightAt>0 && now-lightAt<3000);
        call.resolve(r);
    }
    @PluginMethod public synchronized void stop(PluginCall call) {
        String kind=call.getString("kind", "all");
        if (!"motion".equals(kind) && !"light".equals(kind) && !"all".equals(kind)) {call.reject("Unsupported sensor");return;}
        stopKind(kind);
        JSObject r=new JSObject();r.put("active",false);call.resolve(r);
    }
    private synchronized void stopKind(String kind) {
        SensorManager sm=sensors();
        if (sm!=null) {
            if ("motion".equals(kind)||"all".equals(kind)) {
                Sensor a=sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
                Sensor g=sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
                if (a!=null)sm.unregisterListener(this,a);
                if (g!=null)sm.unregisterListener(this,g);
                motionActive=false;accelPresent=false;gyroPresent=false;accelAt=0;gyroAt=0;
            }
            if ("light".equals(kind)||"all".equals(kind)) {
                Sensor l=sm.getDefaultSensor(Sensor.TYPE_LIGHT);
                if (l!=null)sm.unregisterListener(this,l);
                lightActive=false;lightPresent=false;lightAt=0;
            }
        }
    }
    @Override public synchronized void onSensorChanged(SensorEvent event) {
        if (event==null||event.sensor==null||event.values==null)return;
        int type=event.sensor.getType();long now=SystemClock.elapsedRealtime();
        if (type==Sensor.TYPE_ACCELEROMETER && motionActive && event.values.length>=3) {
            ax=event.values[0];ay=event.values[1];az=event.values[2];accelAt=now;
        } else if (type==Sensor.TYPE_GYROSCOPE && motionActive && event.values.length>=3) {
            gx=event.values[0];gy=event.values[1];gz=event.values[2];gyroAt=now;
        } else if (type==Sensor.TYPE_LIGHT && lightActive && event.values.length>=1) {
            lux=event.values[0];lightAt=now;
        }
    }
    @Override public void onAccuracyChanged(Sensor sensor,int accuracy) {}
    @Override protected void handleOnPause() {stopKind("all");super.handleOnPause();}
    @Override protected void handleOnDestroy() {stopKind("all");super.handleOnDestroy();}
}
''',encoding='utf-8')

m = manifest.read_text(encoding='utf-8')
if '<application' not in m:
    raise SystemExit('Unexpected AndroidManifest: missing application')
permissions = [
    'android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.CAMERA',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.DETECT_SCREEN_CAPTURE',
    'android.permission.DETECT_SCREEN_RECORDING',
]
for perm in permissions:
    if not re.search(r'<uses-permission\b[^>]*\bandroid:name\s*=\s*[\'\"]' + re.escape(perm) + r'[\'\"]', m):
        m = m.replace('<application', f'<uses-permission android:name="{perm}" />\n    <application', 1)
manifest.write_text(m, encoding='utf-8')
print('Murmur Android patch applied: local WebView media/location grants + native permissions + manifest')

# Fail loudly if registration or generated files are missing.
verify = activity.read_text(encoding='utf-8')
for registration in ('registerPlugin(MurmurPermissionsPlugin.class)', 'registerPlugin(MurmurSensorsPlugin.class)'):
    if verify.count(registration) != 1:
        raise SystemExit('ANDROID PATCH FAILED: missing or duplicated ' + registration)
for generated in ('MurmurPermissionsPlugin.java', 'MurmurSensorsPlugin.java', 'MurmurWebChromeClient.java'):
    target = activity.with_name(generated)
    if not target.is_file() or target.stat().st_size < 100:
        raise SystemExit('ANDROID PATCH FAILED: missing ' + str(target))
print('PASS: Android native plugins registered and generated:', activity.parent.resolve(), flush=True)

away=activity.with_name('MurmurAwayPlugin.java')
away.write_text(r'''package app.murmur.story;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.SystemClock;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="MurmurAway")
public class MurmurAwayPlugin extends Plugin {
    private static final String PREF="murmur_away_native";
    private static final String CHANNEL="murmur_story_away";
    private static final int ID=731205;
    private static final long WINDOW=180000L;
    private static final long DELAY=30000L;
    private static android.content.SharedPreferences state(Context c) {return c.getSharedPreferences(PREF,Context.MODE_PRIVATE);}
    private static PendingIntent intent(Context c) {
        Intent i=new Intent(c, MurmurAwayReceiver.class);
        i.setAction("app.murmur.story.AWAY_NOTIFICATION");
        return PendingIntent.getBroadcast(c,ID,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private static void cancel(Context c) {
        AlarmManager a=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        if(a!=null)a.cancel(intent(c));
        NotificationManager n=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if(n!=null)n.cancel(ID);
    }
    @PluginMethod public void configure(PluginCall call) {
        boolean enabled=call.getBoolean("enabled",false);
        state(getContext()).edit().putBoolean("enabled",enabled).apply();
        if(!enabled){state(getContext()).edit().remove("capture").apply();cancel(getContext());}
        call.resolve();
    }
    public static void markCapture(Context c) {
        if(state(c).getBoolean("enabled",false)) state(c).edit().putLong("capture",SystemClock.elapsedRealtime()).apply();
    }
    @PluginMethod public void capture(PluginCall call) {
        if(state(getContext()).getBoolean("enabled",false))
            state(getContext()).edit().putLong("capture",SystemClock.elapsedRealtime()).apply();
        call.resolve();
    }
    @PluginMethod public void clear(PluginCall call) {
        state(getContext()).edit().putBoolean("enabled",false).remove("capture").apply();
        cancel(getContext());call.resolve();
    }
    public static void onForeground(Context c) {cancel(c);}
    public static void onBackground(Context c) {
        android.content.SharedPreferences p=state(c);
        if(!p.getBoolean("enabled",false))return;
        long last=p.getLong("capture",0L),now=SystemClock.elapsedRealtime();
        if(last<=0||now<last||now-last>WINDOW)return;
        // One notification per capture; suppress repeated lifecycle callbacks.
        p.edit().remove("capture").apply();
        if(Build.VERSION.SDK_INT>=33 && ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        AlarmManager a=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        if(a==null)return;
        PendingIntent pi=intent(c);
        // Inexact alarms are allowed without SCHEDULE_EXACT_ALARM; delivery can be delayed by Doze.
        a.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,now+DELAY,pi);
    }
    public static class MurmurAwayReceiver extends android.content.BroadcastReceiver {
        @Override public void onReceive(Context c,Intent i) {
            if(!state(c).getBoolean("enabled",false))return;
            if(Build.VERSION.SDK_INT>=33 && ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
            NotificationManager n=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
            if(n==null)return;
            if(Build.VERSION.SDK_INT>=26)n.createNotificationChannel(new NotificationChannel(CHANNEL,"Murmur 劇情通知",NotificationManager.IMPORTANCE_DEFAULT));
            Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
            PendingIntent open=launch==null?null:PendingIntent.getActivity(c,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            NotificationCompat.Builder b=new NotificationCompat.Builder(c,CHANNEL)
                .setSmallIcon(c.getApplicationInfo().icon)
                .setContentTitle("Murmur · 劇情通知")
                .setContentText("你剛剛離開，是想把看到的事情告訴別人嗎？")
                .setAutoCancel(true);
            if(open!=null)b.setContentIntent(open);
            n.notify(ID,b.build());
        }
    }
}
''',encoding='utf-8')
manifest_text=manifest.read_text(encoding='utf-8')
if 'MurmurAwayPlugin$MurmurAwayReceiver' not in manifest_text:
    manifest_text=manifest_text.replace('</application>', '<receiver android:name=".MurmurAwayPlugin$MurmurAwayReceiver" android:exported="false" />\n    </application>')
    manifest.write_text(manifest_text,encoding='utf-8')
print('Android native away notification scheduler patched')
