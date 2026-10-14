# Murmur v1.7.8｜Android / iOS 原生感測器

## 本版修改

- Android：`scripts/patch_android.py` 在 Capacitor MainActivity 註冊 `MurmurSensorsPlugin`，透過 `SensorManager` 取得加速度計、陀螺儀、環境光感測器的硬體可用性與即時讀數。
- iOS：`scripts/patch_ios.py` 在現有 AppDelegate.swift 內加入 `CAPBridgedPlugin`、`CoreMotion` 感測器，並修改生成的 `Main.storyboard` 指向自訂 `CAPBridgeViewController` 以註冊插件。CoreMotion 支援加速度與角速度；iOS 沒有公開的環境光感測 API，因此如實回報不支援。
- 前端：`www/meta-horror.js` 優先使用原生插件；只在玩家主動啟用「動作感測」並按 `[ARM]` 後讀取動作，環境亮度只在已選擇且符合劇情條件時讀取。停止監聽、切到背景、離開第三周目或關閉功能會解除訂閱。
- 設定頁：[OPEN] 權限管理與裝置檢查 → `[TEST] 感測器`。檢查硬體支援並可由玩家主動進行短暫實際讀數測試；不暴露恐怖劇情觸發條件。
- 感測器數值不會保存或上傳。Android/iOS 加速度統一使用 m/s²、陀螺儀使用 rad/s；環境光使用 lux。
- 原有相機、麥克風、定位、通知及防劇透流程保留，**本次不宣稱這些先前仍失敗的功能已修復**。

## Android（Windows PowerShell）

覆蓋更新包到 D:\\murmur 後：

```powershell
cd D:\murmur
npm install
npm run test:sensors
python scripts/test-native-patches.py
npx cap sync android
python scripts/patch_android.py
python scripts/patch_android_release.py
python scripts/set-native-version.py android
npx cap open android
```

**必須重新建置並安裝 APK**，不能只更新網頁檔案。進入加害者篇後展開 `[SET] → 權限管理與裝置檢查`，點 `[TEST] 感測器`。檢查硬體與讀數結果；測試過程可自然輕微轉動手機，切勿撞擊身體或手機。

## iOS（GitHub Actions / macOS）

既有 `.github/workflows/ios-build.yml` 使用 `scripts/ios-ci-prepare.sh`，會在 `cap sync ios` 後執行 `patch_ios.py`。`Main.storyboard` 必須由 Capacitor 樣板產生並成功改寫。建置時需要 Xcode / CoreMotion；Linux 環境只做 Swift 語法解析及程式碼檢查，**尚未執行真實 Xcode 編譯或 iPhone 實測**。

## 測試與限制

- `npm run test:sensors`：測試主動同意後才啟動、讀取、關閉、離開場景後停止，以及 Web 版隔離。
- `python scripts/test-native-patches.py`：Android Java API 形狀模擬編譯、iOS Swift 語法解析與原生補丁重複套用。
- 不保證所有 Android 機型具有環境光感測器，亦不保證所有 iOS 裝置都回傳 CoreMotion 數值。
- 加速度與陀螺儀不一定會彈出 Android 系統權限視窗，因為通常不需要危險權限。
