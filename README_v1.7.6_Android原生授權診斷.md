# Murmur v1.7.6 Android 原生授權診斷與修復

- 新增原生 Capacitor `MurmurPermissionsPlugin`，僅在玩家主動確認或測試時要求 Android 相機、麥克風、約略/精確定位權限。位置只需取得約略權限即視為 Android 系統已允許；插件本身不讀取影像、音訊或位置。
- 保留 Capacitor 7 原本的 `BridgeWebChromeClient`，避免取代其 JS 對話框、WebView 媒體授權與定位流程。
- 分開呈現 Android OS 授權狀態與 WebView API 使用結果；即使 Android 已授權，WebView 仍可能失敗。
- 通知使用既有 Local Notifications 插件；已授權時 Android 不會再次彈窗。其他裝置效果不會因入場同意而自動啟用。
- 保留既有防劇透介面與 E1–E5 劇情。

## Windows 更新

先備份 `D:\murmur`，解壓直接覆蓋包，然後：

```powershell
cd D:\murmur
npm install
python scripts/test-native-patches.py
npm run test:permissions
npx cap sync android
python scripts/patch_android.py
python scripts/patch_android_release.py
python scripts/set-native-version.py android
npx cap open android
```

在 Android Studio **重新編譯並重新安裝** APK。只覆蓋 `www` 或使用舊 APK 不會有原生插件。檢查 `android/app/src/main/java/app/murmur/story/MurmurPermissionsPlugin.java` 確實存在。

如測試仍顯示 OS 已授權但 WebView 失敗，請提供 `[CHECK] 裝置能力` 與各項 `[TEST]` 結果，並檢查手機的系統位置總開關、相機/麥克風隱私開關與是否有其他 App 懸浮視窗。

**限制：** 目前未在 Android SDK / ROG Phone 6 真機編譯驗證。Android 12 以上選擇約略位置時，WebView 能否回傳位置仍取決於裝置位置服務。iOS 未修改。
