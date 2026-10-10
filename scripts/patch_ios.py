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
