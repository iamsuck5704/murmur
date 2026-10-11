# Murmur v1.7.2｜D1/D5 雙平台啟動驗收

本輪在 v1.7.1 基礎上新增 **Android Emulator** 與 **iOS Simulator** 的建置、安裝、啟動測試流程，並保留原有 P1/P2/P3、鑑識題與存檔邏輯。

## 新增檔案

- `.github/workflows/android-smoke.yml`：main 相關檔案變更時自動執行；也可手動執行。產生 Android debug APK 並在 API 35 模擬器安裝、啟動、確認進程存在。
- `.github/workflows/ios-smoke.yml`：手動啟動；使用 macOS runner 編譯 iOS 模擬器 App、安裝並嘗試啟動。若 runner 缺乏可用 iPhone 模擬器會明確失敗。
- `scripts/android-smoke.sh`、`scripts/ios-simulator-smoke.sh`：啟動測試腳本。
- `scripts/test-smoke-config.cjs`：檢查上述工作流程是否與專案一致。

## Windows 操作

```powershell
cd D:\murmur
npm install
npm run build:web
npm run test:release
npm run test:individual
npm run test:smoke-config
npm run build:native
```

將修改推送到 GitHub 後，前往 **Actions → Android - emulator startup smoke → Run workflow**。成功後查看 `Murmur-Android-emulator-smoke-report`。iOS 可選擇 **Actions → iOS - simulator startup smoke → Run workflow**。

## ROG Phone 6 真機手動驗收（不能由模擬器取代）

1. Android Studio 安裝 Debug APK；確認 App 首次啟動正常、沒有白畫面。
2. 完成第一與第二周目，測試授權碼在 App 匯入、重新啟動與離線存檔。
3. 進入第三周目，E1～E5 逐章通關，測試排序錯誤、重新開啟、返回和重玩。
4. `META / DEVICE EFFECTS` 中分別測試允許／拒絕相機、麥克風、位置、通知。拒絕後也應能通關。
5. 進行截圖與螢幕錄影測試，確認裝置 API 支援時才有事件，關閉效果、背景或離開章節後不繼續演出。
6. 檢查大字體、單手操作、直橫向切換、斷網與重新安裝後進度（重新安裝通常會刪除本機存檔，需確認匯入方案）。

## 測試範圍限制

- **CI smoke test** 僅驗證「可編譯、可安裝、可啟動」，不代表全劇情、權限橋接、上架政策或真機感測器驗收通過。
- Android 模擬器無法代表 ROG Phone 6 的硬體或廠商行為；iOS Simulator 無法代表 TestFlight 或真機。
- 本版未建立任何正式簽署憑證，沒有提交 Apple 或 Google 商店。
- 法律文件中的個人資料待使用者在本機填寫；不可提交簽署金鑰、身分證件或密碼。

## 原生版本同步

新增 `release/version.json`，版本 `1.7.2`、建置號 `172`。GitHub Actions 生成 Android／iOS 專案後會自動將版本寫入 Gradle 與 Xcode 專案。**每次上傳新版本到商店前都必須增加 buildNumber**；不能以此設定推斷先前商店版本號。

```powershell
python scripts/test-native-version.py
```
