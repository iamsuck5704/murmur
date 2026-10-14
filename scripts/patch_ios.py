from pathlib import Path
p = Path('ios/App/App/AppDelegate.swift')
if not p.exists():
    raise SystemExit('Missing iOS AppDelegate.swift; run npx cap add ios first')
s = p.read_text(encoding='utf-8')
if 'murmurObserveCapture' not in s:
    marker = 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {'
    if marker not in s:
        raise SystemExit('Unexpected AppDelegate template; inspect and apply manually')
    s = s.replace(marker, marker + '\n        murmurObserveCapture()\n        murmurObserveLifecycle()', 1)
    pos = s.index('    func application(')
    code = '''    // A state machine, not one event per notification: suppress duplicate callbacks.
    private func murmurObserveLifecycle() {
        NotificationCenter.default.addObserver(self, selector: #selector(murmurWillResignActive), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(murmurDidBecomeActive), name: UIApplication.didBecomeActiveNotification, object: nil)
    }
    @objc private func murmurWillResignActive() { murmurEmit("background") }
    @objc private func murmurDidBecomeActive() { murmurEmit("foreground") }
    private var murmurCaptureActive = false
    private var murmurCaptureInitialized = false
    private func murmurObserveCapture() {
        NotificationCenter.default.addObserver(self, selector: #selector(murmurScreenshot), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(murmurCaptureChanged), name: UIScreen.capturedDidChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(murmurCaptureChanged), name: UIApplication.didBecomeActiveNotification, object: nil)
        // Initial state may predate the app launch. Defer until Capacitor's WebView is ready.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.murmurCaptureChanged() }
    }
    @objc private func murmurScreenshot() { MurmurAwayPlugin.markCapture(); murmurEmit("screenshot") }
    @objc private func murmurCaptureChanged() {
        let captured = UIScreen.main.isCaptured
        if !murmurCaptureInitialized {
            murmurCaptureInitialized = true
            murmurCaptureActive = captured
            if captured { murmurEmit("recording-start") }
            return
        }
        guard captured != murmurCaptureActive else { return }
        murmurCaptureActive = captured
        if !captured { MurmurAwayPlugin.markCapture() }
        murmurEmit(captured ? "recording-start" : "recording-stop")
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

# Capacitor 7 iOS: keep custom plugin in AppDelegate.swift, already included
# in the generated Xcode target, so GitHub Actions does not need an xcodeproj edit.
# A storyboard-specific bridge subclass registers it after Capacitor loads.
app_delegate = Path('ios/App/App/AppDelegate.swift')
s = app_delegate.read_text(encoding='utf-8')
if 'murmurNativeSensorsV178' not in s:
    s = s.replace('import Capacitor', 'import Capacitor\nimport CoreMotion', 1)
    s += '''
// murmurNativeSensorsV178: no persistence, no remote transport, foreground only.
@objc(MurmurSensorsPlugin)
public class MurmurSensorsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MurmurSensorsPlugin"
    public let jsName = "MurmurSensors"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    private let manager = CMMotionManager()
    private var motionActive = false
    private var backgroundObserver: NSObjectProtocol?

    public override func load() {
        backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main
        ) { [weak self] _ in self?.stopMotion() }
    }
    deinit {
        if let observer = backgroundObserver { NotificationCenter.default.removeObserver(observer) }
        stopMotion()
    }
    private func stopMotion() {
        manager.stopAccelerometerUpdates()
        manager.stopGyroUpdates()
        motionActive = false
    }
    @objc func capabilities(_ call: CAPPluginCall) {
        call.resolve(["accelerometer": manager.isAccelerometerAvailable,
                      "gyroscope": manager.isGyroAvailable,
                      "light": false, "platform": "ios"])
    }
    @objc func start(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? ""
        guard kind == "motion" || kind == "light" else { call.reject("Unsupported sensor"); return }
        guard kind == "motion" else { call.reject("Ambient light API unavailable on iOS"); return }
        guard manager.isAccelerometerAvailable || manager.isGyroAvailable else { call.reject("No motion sensors"); return }
        if !motionActive {
            if manager.isAccelerometerAvailable {
                manager.accelerometerUpdateInterval = 0.1
                manager.startAccelerometerUpdates()
            }
            if manager.isGyroAvailable {
                manager.gyroUpdateInterval = 0.1
                manager.startGyroUpdates()
            }
            motionActive = true
        }
        call.resolve(["active": true, "kind": kind])
    }
    @objc func read(_ call: CAPPluginCall) {
        let a = manager.accelerometerData
        let g = manager.gyroData
        let now = ProcessInfo.processInfo.systemUptime
        // Core Motion acceleration uses G, convert to m/s^2 for Android parity.
        let gravity = 9.80665
        call.resolve([
            "motionActive": motionActive, "lightActive": false,
            "accelerometer": manager.isAccelerometerAvailable,
            "gyroscope": manager.isGyroAvailable, "light": false,
            "ax": (a?.acceleration.x ?? 0) * gravity,
            "ay": (a?.acceleration.y ?? 0) * gravity,
            "az": (a?.acceleration.z ?? 0) * gravity,
            "gx": g?.rotationRate.x ?? 0,
            "gy": g?.rotationRate.y ?? 0,
            "gz": g?.rotationRate.z ?? 0,
            "lux": 0,
            "accelFresh": motionActive && a != nil && (now - (a?.timestamp ?? 0)) < 1.5,
            "gyroFresh": motionActive && g != nil && (now - (g?.timestamp ?? 0)) < 1.5,
            "lightFresh": false
        ])
    }
    @objc func stop(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "all"
        guard kind == "all" || kind == "motion" || kind == "light" else { call.reject("Unsupported sensor"); return }
        if kind != "light" { stopMotion() }
        call.resolve(["active": false])
    }
}

// Register locally authored native plugin; no external plugin package required.
class MurmurBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(MurmurSensorsPlugin())
    }
}
'''
    app_delegate.write_text(s,encoding='utf-8')

storyboard=Path('ios/App/App/Base.lproj/Main.storyboard')
if not storyboard.exists():
    raise SystemExit('Missing iOS Main.storyboard. Check generated Capacitor iOS project.')
t=storyboard.read_text(encoding='utf-8')
if 'MurmurBridgeViewController' not in t:
    import re
    # Capacitor's generated storyboard uses CAPBridgeViewController with module Capacitor.
    t,n=re.subn(r'customClass="CAPBridgeViewController"(?:\s+customModule="[^"]+")?(?:\s+customModuleProvider="[^"]+")?',
                'customClass="MurmurBridgeViewController" customModule="App" customModuleProvider="target"',t,count=1)
    if n!=1: raise SystemExit('Unexpected iOS storyboard: cannot locate Capacitor bridge controller')
    storyboard.write_text(t,encoding='utf-8')
print('iOS Core Motion native sensor plugin patched')

# Native local-notification state is held in AppDelegate's plugin and handled by iOS lifecycle.
app_delegate=Path('ios/App/App/AppDelegate.swift')
s=app_delegate.read_text(encoding='utf-8')
if 'murmurNativeAwayV185' not in s:
    s=s.replace('import Capacitor', 'import Capacitor\nimport UserNotifications',1)
    s=s.replace('        murmurObserveLifecycle()\n','        murmurObserveLifecycle()\n        MurmurAwayPlugin.observeLifecycle()\n',1)
    s=s.replace('bridge?.registerPluginInstance(MurmurSensorsPlugin())','bridge?.registerPluginInstance(MurmurSensorsPlugin())\n        bridge?.registerPluginInstance(MurmurAwayPlugin())')
    s += r'''
// murmurNativeAwayV185: local-only, consent-driven, no background WebView required.
@objc(MurmurAwayPlugin)
public class MurmurAwayPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier="MurmurAwayPlugin"
    public let jsName="MurmurAway"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name:"configure",returnType:CAPPluginReturnPromise),
        CAPPluginMethod(name:"capture",returnType:CAPPluginReturnPromise),
        CAPPluginMethod(name:"clear",returnType:CAPPluginReturnPromise)
    ]
    private static let key="murmur_away_native_enabled"
    private static let captureKey="murmur_away_native_capture"
    private static let notificationId="murmur-away-731205"
    private static var observing=false
    @objc func configure(_ call:CAPPluginCall) {
        let enabled=call.getBool("enabled") ?? false
        UserDefaults.standard.set(enabled,forKey:Self.key)
        if !enabled {UserDefaults.standard.removeObject(forKey:Self.captureKey);Self.cancel()}
        call.resolve()
    }
    static func markCapture() {
        if UserDefaults.standard.bool(forKey:key) {
            UserDefaults.standard.set(Date().timeIntervalSince1970,forKey:captureKey)
        }
    }
    @objc func capture(_ call:CAPPluginCall) {
        Self.markCapture()
        call.resolve()
    }
    @objc func clear(_ call:CAPPluginCall) {
        UserDefaults.standard.set(false,forKey:Self.key)
        UserDefaults.standard.removeObject(forKey:Self.captureKey)
        Self.cancel();call.resolve()
    }
    static func cancel() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers:[notificationId])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers:[notificationId])
    }
    static func observeLifecycle() {
        guard !observing else{return}
        observing=true
        NotificationCenter.default.addObserver(forName:UIApplication.didEnterBackgroundNotification,object:nil,queue:.main){_ in Self.background()}
        NotificationCenter.default.addObserver(forName:UIApplication.didBecomeActiveNotification,object:nil,queue:.main){_ in Self.cancel()}
    }
    static func background() {
        guard UserDefaults.standard.bool(forKey:key) else{return}
        let last=UserDefaults.standard.double(forKey:captureKey)
        let age=Date().timeIntervalSince1970-last
        guard last>0 && age>=0 && age<=180 else{return}
        UserDefaults.standard.removeObject(forKey:captureKey)
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else{return}
            let content=UNMutableNotificationContent()
            content.title="Murmur · 劇情通知"
            content.body="你剛剛離開，是想把看到的事情告訴別人嗎？"
            let request=UNNotificationRequest(identifier:notificationId,content:content,trigger:UNTimeIntervalNotificationTrigger(timeInterval:30,repeats:false))
            UNUserNotificationCenter.current().add(request,withCompletionHandler:nil)
        }
    }
}
'''
    app_delegate.write_text(s,encoding='utf-8')
print('iOS native away notification scheduler patched')
