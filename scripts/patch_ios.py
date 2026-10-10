from pathlib import Path
p = Path('ios/App/App/AppDelegate.swift')
if not p.exists():
    raise SystemExit('Missing iOS AppDelegate.swift; run npx cap add ios first')
s = p.read_text(encoding='utf-8')
if 'murmurObserveCapture' not in s:
    marker = 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {'
    if marker not in s:
        raise SystemExit('Unexpected AppDelegate template; inspect and apply manually')
    s = s.replace(marker, marker + '\n        murmurObserveCapture()', 1)
    pos = s.index('    func application(')
    code = '''    private func murmurObserveCapture() {
        NotificationCenter.default.addObserver(self, selector: #selector(murmurScreenshot), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(murmurCaptureChanged), name: UIScreen.capturedDidChangeNotification, object: nil)
    }
    @objc private func murmurScreenshot() { murmurEmit("screenshot") }
    @objc private func murmurCaptureChanged() {
        if UIScreen.main.isCaptured { murmurEmit("recording") }
    }
    private func murmurEmit(_ kind: String) {
        DispatchQueue.main.async { [weak self] in
            guard let bridgeVC = self?.window?.rootViewController as? CAPBridgeViewController else { return }
            bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('murmur:native',{detail:{type:'\\(kind)'}}));", completionHandler: nil)
        }
    }

'''
    s = s[:pos] + code + s[pos:]
    p.write_text(s, encoding='utf-8')
info = Path('ios/App/App/Info.plist')
if not info.exists():
    raise SystemExit('Missing Info.plist')
s = info.read_text(encoding='utf-8')
if 'NSMicrophoneUsageDescription' not in s:
    s = s.replace('</dict>', '''<key>NSMicrophoneUsageDescription</key>
<string>只有在你主動啟用環境聲量演出後，Murmur 才會在指定劇情頁面即時分析聲音強度；不錄音、不辨識語音、不上傳。</string>
</dict>''', 1)
    info.write_text(s, encoding='utf-8')
print('iOS patch applied')

# Optional effects request permissions only when the player chooses to use them.
info = Path('ios/App/App/Info.plist')
if info.exists():
    t=info.read_text(encoding='utf-8')
    descriptions={
        'NSCameraUsageDescription':'只有玩家主動啟用鏡子演出才使用前鏡頭，即時顯示、不錄影、不儲存。',
        'NSLocationWhenInUseUsageDescription':'玩家主動同意後，Murmur 使用一次大略位置呈現行政區或查詢即時天氣；會向第三方服務送出約略座標。',
        'NSMotionUsageDescription':'玩家主動啟用動作演出時，Murmur 僅在前景判斷自然手部晃動。'
    }
    for key,description in descriptions.items():
        if '<key>'+key+'</key>' not in t:
            t=t.replace('</dict>','<key>'+key+'</key>\n<string>'+description+'</string>\n</dict>',1)
    info.write_text(t,encoding='utf-8')

# Murmur v1.4: Capacitor LocalNotifications handles iOS UNUserNotificationCenter
# authorization from an explicit JS tap. Never request on launch.
# App icon switching needs a preinstalled CFBundleAlternateIcons entry plus assets
# and is intentionally disabled until those resources are supplied.
