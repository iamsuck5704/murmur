# Murmur v1.7.10 → v1.8.5 累積直接覆蓋包

本 ZIP 是以 v1.7.10（已套用 v1.7.9 Android 插件與 v1.7.10 編譯修復）為基準，合併 v1.8.0、1.8.1、1.8.2、1.8.3、1.8.4（含背景通知穩定性、法律聯絡資訊）及最新 v1.8.5 的原生通知、法律文件獨立網址、App 專用內容調整。

## 使用方法
1. 先備份 D:\murmur 專案。**不要清除手機 App 資料或卸載 App**，以免影響存檔。
2. 解壓縮本 ZIP 至 D:\murmur，保留資料夾階層並覆蓋同名檔案。
3. 在 PowerShell 執行：

```powershell
cd D:\murmur
npm install
npm run build:web
npm run build:native
npm run test:native-content
npm run check:release
```

4. Android 原生建置時，在 Capacitor sync 後執行 `python scripts/patch_android.py`；iOS 在 CI 的 `npx cap sync ios` 後執行 `python3 scripts/patch_ios.py`（既有工作流程已有相關設定，請檢查 CI 輸出）。
5. Cloudflare Pages 使用 `dist/web`，Android/iOS 使用 `dist/native`。兩者**不可混用**。不要把 `dist/native` 部署為公開網頁版。

## 已驗證
- `npm run build:web`：通過
- `npm run build:native`：通過
- `npm run test:native-content`：通過（網頁版原劇情保留、App 專用修改）
- `npm run check:release`：0 blocker、6 warning
- ZIP 檔案內容與最新來源逐檔一致，覆蓋 v1.7.10 基準後可重現最新版本

## 尚未驗證 / 已知問題
- `python scripts/test-native-patches.py` **失敗**：Java stub 測試缺少 MurmurAwayPlugin 符號與 onPause 基底方法，尚未判定真實 Android 編譯是否也失敗。
- Android Gradle、iOS Xcode、實機截圖/錄影背景通知與完整遊戲通關尚未驗證。
- `package-lock.json` 仍未提供，需在網路正常環境產生並提交。
- 發行檢查的 6 個警告包含法律文件草案、法定身分揭露及缺少 lockfile。商店分級與審核仍需如實申報。

## 內容摘要
- 1.8.0：裝置效果授權、直播提醒
- 1.8.1：擷取事件與通知
- 1.8.2：國際行政區定位
- 1.8.3：章節與 iOS 修復
- 1.8.4：法律文件、聯絡資料、背景通知備援
- 1.8.5：原生背景通知、法律文件獨立網址、App 版限定劇情調整

注意：這是差異覆蓋包，不是可獨立執行的完整專案。版本號為 1.8.5。若基準版本不同，建議先核對檔案。
