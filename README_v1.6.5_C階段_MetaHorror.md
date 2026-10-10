# Murmur v1.6.5｜C 階段 Meta Horror 整合（第一輪）

## 已修改

1. **E5 行政區揭露時機**：移除打開 `diary_74` 就觸發的位置詢問，改為 `diary_75` 的四句排序按下「確認順序」且核對正確、出現 `[INTEGRITY WARNING]` 之後，透過 `murmur:e5-verified` 觸發。既有已完成排序的存檔可再次按「確認順序」觸發（每次啟動最多一次）。
2. **權限二次確認**：預設關閉，玩家先在 `META / DEVICE EFFECTS` 勾選「E5 行政區演出」並閱讀說明，E5 再詢問一次，才會向 OS 要求定位；拒絕不影響通關。座標僅以四捨五入到 0.01 度的方式送往 OpenStreetMap Nominatim；不儲存在遊戲存檔，但外部服務可能依其政策記錄請求資訊。
3. **截圖／錄影效果獨立開關**：新增 `capture`，預設關閉。原生 `murmur:native` 事件只有在加害者篇 E4/E5、App 前景、玩家開啟該效果、非實況模式時才會顯示劇情訊息。不能讀取截圖內容。
4. **關閉加害者篇清理**：`close()` 現在派發 `murmur:context` 關閉事件，讓鏡頭串流及光感測器立即停止。App 切到背景時停鏡頭、停光感測器、解除動作感測待命。
5. **隱私與權限文件同步**：更新 `legal/privacy.html`、`legal/disclaimer.html` 與 Markdown 版本，明確說明 Nominatim／Open-Meteo 第三方請求與可選截圖錄影偵測；正式上架前仍須填寫開發者聯絡資料。
6. **不修改存檔鍵值**：原本第三周目進度與第一二周目均保留。Cloudflare 網頁版仍只含第一二周目。

## 原生支援狀態

| 功能 | Android | iOS | 實機狀態 |
|---|---|---|---|
| 截圖事件 | 原生補丁 Android 14 / API 34+ | `userDidTakeScreenshotNotification` | 尚未真機驗證 |
| 錄影事件 | 原生補丁 Android 15 / API 35+ | `UIScreen.capturedDidChangeNotification` | 尚未真機驗證 |
| 行政區定位 | WebView Geolocation，需 Android 權限與 WebChromeClient 支援 | WKWebView 定位，需系統授權 | 尚未真機驗證 |
| 光線偵測 | AmbientLightSensor Web API，WebView 可能不提供 | 沒有通用網頁 API | 未保證可用 |
| 環境音量 | Web Audio / getUserMedia，需使用者主動允許 | Web Audio / getUserMedia，需系統授權 | 尚未真機驗證 |
| 通知 | Capacitor LocalNotifications，須原生同步 | Capacitor LocalNotifications，須原生同步 | 尚未真機驗證 |
| App 圖示變更 | 尚未實作 | 尚未實作 | 不提供 |

**重要：** 這版沒有宣稱已在真機驗證以上功能。`scripts/patch_android.py`、`scripts/patch_ios.py` 為既有原生補丁，首次使用須在產生平台資料夾後執行；兩者目前並未在本次環境中以 Xcode／Gradle 建置驗證。尤其 Android WebView 定位／相機／麥克風系統權限可能需要額外原生橋接才能工作，不能把 JS 接入視為已可用。

## 本機更新

解壓覆蓋到 `D:\murmur`，執行 `node --check www/meta-horror.js`、`node --check www/perpetrator.js`、`npm run build:web`、`node scripts/test-meta-horror.cjs`、`npx cap sync android`。若尚未套用既有原生補丁，需另外執行 `python scripts/patch_android.py` 並檢查 Android 原生編譯。

網頁部署仍以 `npm run build:web` 產出 `dist/web`。更新第三周目需重建 App，不會透過 Cloudflare 網頁自動更新已安裝 App。

## 測試結果

- `node scripts/test-meta-horror.cjs`：E5 定位需原生環境、勾選與排序事件；舊日記不觸發；截圖／錄影預設關閉；關閉頁面阻擋事件。**通過**。
- `node scripts/test-forensics.cjs`：E5 排序成功會派發事件，關閉備份會發出關閉事件；E2～E4 回歸。**通過**。
- `node scripts/test-journey.cjs`、`node scripts/test-transfer.cjs`、`node scripts/test-platform.cjs`：跨平台與存檔回歸。**通過**。
- `python scripts/test-native-patches.py`：Android/iOS 原生補丁於模擬檔案中可重複執行，權限不重複。**通過，非編譯**。
- Playwright 瀏覽器整合測試：此環境存取本機網址與檔案被限制（`ERR_BLOCKED_BY_ADMINISTRATOR`），**未通過執行環境，非遊戲程式測試失敗**。
- Android Gradle、iOS Xcode、手機權限／感測器：**未驗證**。

**原生更新提醒：** `npm run build:web` 只輸出前兩周目及法律頁。更新第三周目須重新 `npx cap sync android`／`ios` 並安裝新 App。Cloudflare Git 自動部署不會把第三周目推到已安裝的 App。
