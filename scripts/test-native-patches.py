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
    delegate.write_text('import UIKit\nimport Capacitor\nclass AppDelegate: UIResponder, UIApplicationDelegate {\n    var window: UIWindow?\n    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { return true }\n}\n')
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
    for imp in ['android.app.Activity','android.os.Build','android.view.WindowManager','java.util.function.Consumer']:
        assert s.count('import '+imp+';')==1,imp
    x=manifest.read_text()
    for perm in ['DETECT_SCREEN_CAPTURE','DETECT_SCREEN_RECORDING','RECORD_AUDIO','CAMERA','ACCESS_COARSE_LOCATION']:
        assert x.count('android.permission.'+perm)==1,(perm,x)
    s=delegate.read_text()
    assert s.count('murmurObserveCapture()')==2
    for key in ['NSMicrophoneUsageDescription','NSCameraUsageDescription','NSLocationWhenInUseUsageDescription','NSMotionUsageDescription']:
        assert plist.read_text().count('<key>'+key+'</key>')==1
    # Compile generated MainActivity with Android-like minimal stubs to catch missing imports
    # and invalid Java syntax. This does not validate the actual Android SDK signatures.
    if shutil.which('javac'):
        src=base/'stubs'
        files={
            'android/app/Activity.java':'''package android.app;
import java.util.concurrent.Executor;
public class Activity {
 public interface ScreenCaptureCallback { void onScreenCaptured(); }
 public void onStart(){} public void onStop(){} public void onResume(){}
 public void runOnUiThread(Runnable r){r.run();}
 public Executor getMainExecutor(){return Runnable::run;}
 public void registerScreenCaptureCallback(Executor e,ScreenCaptureCallback c){}
 public void unregisterScreenCaptureCallback(ScreenCaptureCallback c){}
 public <T> T getSystemService(Class<T> c){return null;}
}''',
            'android/os/Build.java':'''package android.os; public class Build { public static class VERSION {public static int SDK_INT=35;} }''',
            'android/view/WindowManager.java':'''package android.view;
import java.util.concurrent.Executor; import java.util.function.Consumer;
public class WindowManager {public static final int SCREEN_RECORDING_STATE_VISIBLE=1;
 public void addScreenRecordingCallback(Executor e,Consumer<Integer> c){}
 public void removeScreenRecordingCallback(Consumer<Integer> c){}
}''',
            'com/getcapacitor/BridgeActivity.java':'''package com.getcapacitor;
public class BridgeActivity extends android.app.Activity {public Bridge getBridge(){return null;} }''',
            'com/getcapacitor/Bridge.java':'''package com.getcapacitor;
public class Bridge {public android.webkit.WebView getWebView(){return null;} }''',
            'android/webkit/WebView.java':'''package android.webkit;
public class WebView {public void evaluateJavascript(String script,Object callback){} }''',
        }
        for name,body in files.items():
            target=src/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(body)
        r=subprocess.run(['javac','-d',str(base/'classes'),str(java)]+[str(src/name) for name in files],capture_output=True,text=True)
        assert r.returncode==0,('Java stub compilation failed',r.stderr)
print('PASS: native patches idempotent, preserve custom code, import checks and Java stub compile (NOT Gradle/Xcode)')
