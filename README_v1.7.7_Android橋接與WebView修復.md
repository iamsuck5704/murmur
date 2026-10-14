# Murmur v1.7.7：Android 原生橋接與 WebView 授權修復

## 針對 v1.7.6 實機診斷

使用者在 ROG Phone 6 已看到麥克風、通知的 Android 系統授權視窗，但「裝置能力」顯示 `native bridge unavailable`，相機／麥克風 `NotAllowedError`，定位 code 1。

這代表「Android 系統權限」、「Capacitor Java 插件呼叫」、「Android WebView 的媒體與定位權限」必須分開處理；不能只改遊戲確認視窗。

## 修正

1. `www/meta-horror.js`：除了 `window.Capacitor.Plugins.MurmurPermissions`，新增 `window.Capacitor.nativePromise('MurmurPermissions', method, {kind})` 路徑。這是 Capacitor 7 對已註冊原生 Java 插件可用的呼叫方式，避免沒有 JS 代理就被誤判為「原生橋接不存在」。顯示實際呼叫方式和錯誤。
2. `scripts/patch_android.py`：在 Capacitor Bridge 建立後，掛載繼承 `BridgeWebChromeClient` 的 `MurmurWebChromeClient`。僅對 `https://localhost`，且 Android 系統已授權的相機／麥克風／定位請求提供 WebView 回覆。未知媒體資源拒絕授權，其他權限要求沿用 Capacitor 原有處理。
3. 保留 `MurmurPermissionsPlugin`、麥克風與通知的授權流程、原本劇情、玩家同意與防劇透設計。補齊 `MODIFY_AUDIO_SETTINGS` 宣告。
4. 更新 v1.7.7 與 build 177；增加原生橋接的 JavaScript 模擬測試，以及 Android Java 模擬編譯與重複套用檢查。

## Windows 更新與重新安裝（重要）

備份 `D:\murmur` 後，將「直接覆蓋更新包」解壓縮到 `D:\murmur` 根目錄（保留相對路徑），再於 PowerShell 執行：

```powershell
cd D:\murmur
npm install
npm run test:permissions
python scripts/test-native-patches.py
npx cap sync android
python scripts/patch_android.py
python scripts/patch_android_release.py
python scripts/set-native-version.py android
npx cap open android
```

**一定要在 Android Studio 重新建置、安裝新的 APK**。只更新 WebView 的網頁檔案不會增加 `MurmurWebChromeClient` 或 Java 原生插件。若先前已執行過 v1.7.6 原生補丁，v1.7.7 可重複套用。

## ROG Phone 6 實機驗收

- 第三周目入場按「確認並啟用裝置效果」，應依裝置當前授權狀態出現系統提示。已授權的項目不會再跳視窗。
- 到 `[SET] → 權限管理與裝置檢查 → [CHECK] 裝置能力`，確認 `Native call API: nativePromise` 或 `proxy`，以及相機／麥克風／定位各自的 Android OS 狀態。
- 分別按 `[TEST] 相機`、`[TEST] 麥克風`、`[TEST] 定位`。預期 OS 已授權後 WebView 可使用；若仍失敗，請保留具體錯誤字串及 Android Studio Logcat（篩選 `chromium`、`Capacitor`、`MurmurPermissions`）。
- 在手機設定確認相機、麥克風、位置總開關及 Murmur 的 App 權限；若出現懸浮窗，暫時關閉再測。

## 測試範圍與限制

已執行 Java 模擬編譯（使用 stub，不是 Android SDK Gradle 編譯）、補丁重複套用、權限／原生橋接模擬、劇情／防劇透／發行回歸測試。**尚未在真實 Android Studio／ROG Phone 6 上完成建置與實機驗證，不保證每個 Android WebView 版本都已修復。** iOS 權限橋接不是本次變更範圍。
