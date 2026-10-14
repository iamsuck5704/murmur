package app.murmur.story;
import java.util.function.Consumer;
import android.view.WindowManager;

import android.os.Build;
import android.os.Bundle;
import android.app.Activity;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private Activity.ScreenCaptureCallback murmurScreenshot;

    @Override protected void onCreate(Bundle savedInstanceState) {
        /* murmurPermissionBridgeOnCreate */ registerPlugin(MurmurPermissionsPlugin.class);
        /* murmurSensorBridgeOnCreate */ registerPlugin(MurmurSensorsPlugin.class);
        super.onCreate(savedInstanceState);
        /* murmurWebChromeBridge */
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebChromeClient(new MurmurWebChromeClient(getBridge()));
        }

        if (Build.VERSION.SDK_INT >= 34) {
            murmurScreenshot = () -> runOnUiThread(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'screenshot'}}));", null);
                }
            });
        }
    }

    @Override public void onStart() {
        super.onStart(); /* murmurOnstartHook */ murmurRegisterScreenshot(); murmurRegisterRecording();
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) {
            registerScreenCaptureCallback(getMainExecutor(), murmurScreenshot);
        }
    }

    @Override public void onStop() {
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) {
            unregisterScreenCaptureCallback(murmurScreenshot);
        }
        /* murmurOnstopHook */ murmurUnregisterScreenshot(); murmurUnregisterRecording();
        super.onStop();
    }

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

    @Override public void onResume() { // murmurForeground
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null)
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'foreground'}}));", null);
    }

    private void murmurRegisterScreenshot() { /* existing onStart already registers capture */ }
    private void murmurUnregisterScreenshot() { /* existing onStop already unregisters capture */ }
}
