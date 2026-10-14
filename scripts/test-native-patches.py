"""Check native patch idempotence and compile generated Java against API-shaped stubs.

This is not an Android Gradle build or iOS Xcode build.
"""
from pathlib import Path
import tempfile, subprocess, sys, shutil
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
    base=Path(temp)
    java=base/'android/app/src/main/java/app/murmur/story/MainActivity.java'
    manifest=base/'android/app/src/main/AndroidManifest.xml'
    java.parent.mkdir(parents=True)
    # Capacitor template has no android.os.Bundle import. Previous patch broke here.
    java.write_text('package app.murmur.story;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { public int customBehavior(){return 42;} }\n')
    manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.RECORD_AUDIO" /><application /></manifest>')
    ios=base/'ios/App/App';ios.mkdir(parents=True)
    delegate=ios/'AppDelegate.swift'
    delegate.write_text('import UIKit\nimport Capacitor\nclass AppDelegate: UIResponder, UIApplicationDelegate {\n    var window: UIWindow?\n    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n        return true\n    }\n}\n')
    storyboard=ios/'Base.lproj/Main.storyboard';storyboard.parent.mkdir(parents=True);storyboard.write_text('<document><viewController customClass="CAPBridgeViewController" customModule="Capacitor" customModuleProvider="project" /></document>')
    plist=ios/'Info.plist';plist.write_text('<?xml version="1.0"?><plist><dict></dict></plist>')
    for _ in range(2):
        for patch in ['patch_android.py','patch_ios.py']:
            r=subprocess.run([sys.executable,str(root/'scripts'/patch)],cwd=base,capture_output=True,text=True)
            assert r.returncode==0,(patch,r.stderr,r.stdout)
    s=java.read_text()
    assert 'customBehavior(){return 42;}' in s
    assert s.count('murmurRegisterRecording();')==1
    assert s.count('murmurRegisterScreenshot();')==1
    assert s.count('murmurForeground')==1
    assert 'public void onStart()' in s and 'public void onStop()' in s
    assert s.count('registerPlugin(MurmurPermissionsPlugin.class)')==1
    assert s.count('registerPlugin(MurmurSensorsPlugin.class)')==1
    assert 'MurmurBridgeViewController' in storyboard.read_text()
    assert delegate.read_text().count('murmurNativeSensorsV178')==1
    sensors=java.with_name('MurmurSensorsPlugin.java').read_text()
    for term in ['SensorManager','TYPE_ACCELEROMETER','TYPE_GYROSCOPE','TYPE_LIGHT','handleOnPause','handleOnDestroy','@PluginMethod public synchronized void read']:
        assert term in sensors,term
    assert s.count('murmurWebChromeBridge')==1
    chrome=java.with_name('MurmurWebChromeClient.java').read_text()
    assert 'onPermissionRequest' in chrome and 'onGeolocationPermissionsShowPrompt' in chrome
    assert 'request.grant(request.getResources())' in chrome
    assert 'localhost' in chrome
    plugin=java.with_name('MurmurPermissionsPlugin.java').read_text()
    assert 'requestPermissionForAlias(kind, call, "permissionResult")' in plugin
    assert 'ACCESS_COARSE_LOCATION' in plugin and 'ACCESS_FINE_LOCATION' in plugin
    assert 'getCurrentPosition' not in plugin and 'getUserMedia' not in plugin
    for imp in ['android.app.Activity','android.os.Build','android.view.WindowManager','java.util.function.Consumer']:
        assert s.count('import '+imp+';')==1,imp
    x=manifest.read_text()
    for perm in ['DETECT_SCREEN_CAPTURE','DETECT_SCREEN_RECORDING','RECORD_AUDIO','MODIFY_AUDIO_SETTINGS','CAMERA','ACCESS_COARSE_LOCATION','ACCESS_FINE_LOCATION']:
        assert x.count('android.permission.'+perm)==1,(perm,x)
    s=delegate.read_text()
    if shutil.which('swiftc'):
        r=subprocess.run(['swiftc','-frontend','-parse',str(delegate)],capture_output=True,text=True)
        assert r.returncode==0,('Swift syntax parsing failed',r.stderr)
    assert s.count('murmurObserveCapture()')==2
    for key in ['NSMicrophoneUsageDescription','NSCameraUsageDescription','NSLocationWhenInUseUsageDescription','NSMotionUsageDescription']:
        assert plist.read_text().count('<key>'+key+'</key>')==1
    # Compile generated MainActivity with Android-like minimal stubs to catch missing imports
    # and invalid Java syntax. This does not validate the actual Android SDK signatures.
    if shutil.which('javac'):
        src=base/'stubs'
        files={
            'android/Manifest.java':'''package android; public class Manifest {public static class permission {public static final String CAMERA="camera",RECORD_AUDIO="audio",ACCESS_COARSE_LOCATION="coarse",ACCESS_FINE_LOCATION="fine";}}''',
            'android/content/pm/PackageManager.java':'''package android.content.pm; public class PackageManager {public static final int PERMISSION_GRANTED=0;}''',
            'androidx/core/content/ContextCompat.java':'''package androidx.core.content; public class ContextCompat {public static int checkSelfPermission(Object c,String p){return 0;}}''',
            'com/getcapacitor/JSObject.java':'''package com.getcapacitor; public class JSObject {public void put(String k,Object v){}}''',
            'com/getcapacitor/Plugin.java':'''package com.getcapacitor; public class Plugin {public android.content.Context getContext(){return null;} public void requestPermissionForAlias(String k,PluginCall c,String cb){} protected void handleOnPause(){} protected void handleOnDestroy(){} }''',
            'com/getcapacitor/PluginCall.java':'''package com.getcapacitor; public class PluginCall {public String getString(String k){return null;}public String getString(String k,String d){return d;} public void reject(String s){} public void resolve(JSObject j){}}''',
            'com/getcapacitor/PluginMethod.java':'''package com.getcapacitor; public @interface PluginMethod {}''',
            'com/getcapacitor/PermissionState.java':'''package com.getcapacitor; public enum PermissionState {GRANTED,DENIED}''',
            'com/getcapacitor/annotation/CapacitorPlugin.java':'''package com.getcapacitor.annotation; public @interface CapacitorPlugin {String name(); Permission[] permissions() default {};}''',
            'com/getcapacitor/annotation/Permission.java':'''package com.getcapacitor.annotation; public @interface Permission {String alias(); String[] strings();}''',
            'com/getcapacitor/annotation/PermissionCallback.java':'''package com.getcapacitor.annotation; public @interface PermissionCallback {}''',
            'android/content/Context.java':'''package android.content; public class Context {public static final String SENSOR_SERVICE="sensor"; public Object getSystemService(String s){return null;} }''',
            'android/hardware/Sensor.java':'''package android.hardware; public class Sensor {public static final int TYPE_ACCELEROMETER=1,TYPE_GYROSCOPE=4,TYPE_LIGHT=5;public int getType(){return 1;}}''',
            'android/hardware/SensorEvent.java':'''package android.hardware; public class SensorEvent {public Sensor sensor;public float[] values;}''',
            'android/hardware/SensorEventListener.java':'''package android.hardware; public interface SensorEventListener {void onSensorChanged(SensorEvent e);void onAccuracyChanged(Sensor s,int a);}''',
            'android/hardware/SensorManager.java':'''package android.hardware; public class SensorManager {public static final int SENSOR_DELAY_GAME=1,SENSOR_DELAY_NORMAL=3;public Sensor getDefaultSensor(int t){return null;}public boolean registerListener(SensorEventListener l,Sensor s,int delay){return true;}public void unregisterListener(SensorEventListener l,Sensor s){} }''',
            'android/os/SystemClock.java':'''package android.os; public class SystemClock {public static long elapsedRealtime(){return 0;}}''',
            'android/app/Activity.java':'''package android.app;
import java.util.concurrent.Executor;
public class Activity {
 public interface ScreenCaptureCallback { void onScreenCaptured(); }
 public void onStart(){} public void onStop(){} public void onResume(){} public void onCreate(android.os.Bundle b){}
 public void runOnUiThread(Runnable r){r.run();}
 public Executor getMainExecutor(){return Runnable::run;}
 public void registerScreenCaptureCallback(Executor e,ScreenCaptureCallback c){}
 public void unregisterScreenCaptureCallback(ScreenCaptureCallback c){}
 public <T> T getSystemService(Class<T> c){return null;}
}''',
            'android/os/Bundle.java':'''package android.os; public class Bundle {}''',
            'android/os/Build.java':'''package android.os; public class Build { public static class VERSION {public static int SDK_INT=35;} }''',
            'android/view/WindowManager.java':'''package android.view;
import java.util.concurrent.Executor; import java.util.function.Consumer;
public class WindowManager {public static final int SCREEN_RECORDING_STATE_VISIBLE=1;
 public int addScreenRecordingCallback(Executor e,Consumer<Integer> c){return 0;}
 public void removeScreenRecordingCallback(Consumer<Integer> c){}
}''',
            'com/getcapacitor/BridgeActivity.java':'''package com.getcapacitor;
public class BridgeActivity extends android.app.Activity {public Bridge getBridge(){return null;} public void registerPlugin(Class<?> c){} }''',
            'com/getcapacitor/Bridge.java':'''package com.getcapacitor;
public class Bridge {public android.webkit.WebView getWebView(){return null;} public Object getContext(){return null;} public android.app.Activity getActivity(){return null;} }''',
            'com/getcapacitor/BridgeWebChromeClient.java':'''package com.getcapacitor;
public class BridgeWebChromeClient {public BridgeWebChromeClient(Bridge b){} public void onPermissionRequest(android.webkit.PermissionRequest r){} public void onGeolocationPermissionsShowPrompt(String s,android.webkit.GeolocationPermissions.Callback c){} }''',
            'android/net/Uri.java':'''package android.net; public class Uri {public static Uri parse(String s){return null;} public String getScheme(){return "https";} public String getHost(){return "localhost";} }''',
            'android/webkit/GeolocationPermissions.java':'''package android.webkit; public class GeolocationPermissions {public interface Callback {void invoke(String origin,boolean allow,boolean retain);}}''',
            'android/webkit/PermissionRequest.java':'''package android.webkit; public class PermissionRequest {public static final String RESOURCE_VIDEO_CAPTURE="video",RESOURCE_AUDIO_CAPTURE="audio"; public android.net.Uri getOrigin(){return null;} public String[] getResources(){return new String[0];} public void deny(){} public void grant(String[] s){} }''',
            'android/webkit/WebView.java':'''package android.webkit;
public class WebView {public void evaluateJavascript(String script,Object callback){} public void setWebChromeClient(Object c){} }''',
        }
        for name,body in files.items():
            target=src/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(body)
        r=subprocess.run(['javac','-d',str(base/'classes'),str(java),str(java.with_name('MurmurPermissionsPlugin.java')),str(java.with_name('MurmurWebChromeClient.java')),str(java.with_name('MurmurSensorsPlugin.java'))]+[str(src/name) for name in files],capture_output=True,text=True)
        assert r.returncode==0,('Java stub compilation failed',r.stderr)
print('PASS: native patches idempotent, preserve custom code, import checks and Java stub compile (NOT Gradle/Xcode)')
