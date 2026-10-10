package app.murmur.story;

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
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) {
            registerScreenCaptureCallback(getMainExecutor(), murmurScreenshot);
        }
    }

    @Override public void onStop() {
        if (Build.VERSION.SDK_INT >= 34 && murmurScreenshot != null) {
            unregisterScreenCaptureCallback(murmurScreenshot);
        }
        super.onStop();
    }
}
