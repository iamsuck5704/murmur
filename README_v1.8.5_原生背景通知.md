# Murmur v1.8.5 原生背景通知

Android 與 iOS 在 App 進入背景時，由原生生命週期判斷截圖／錄影結束後三分鐘內的有效事件，排程 30 秒本機通知；返回前景則取消。JS 僅同步玩家同意、章節與擷取事件。

## 安裝

先覆蓋本補丁，再執行 `npm install`、`npx cap sync android`、`python scripts/patch_android.py`；iOS 執行 `npx cap sync ios`、`python scripts/patch_ios.py`，再建置。請依原本 CI 腳本的步驟順序操作，勿重複手動套用已執行的修補。

## 限制與驗收

Android 14+ 截圖偵測、Android 15+ 螢幕錄影偵測依系統 API；更舊 Android 不保證可收到事件。iOS 受系統截圖通知時機及錄影狀態 API 限制。Android 省電／Doze 可能延後非精確鬧鐘；系統通知權限、勿擾、強制停止 App 也會影響結果。iOS 非同步查詢通知授權與背景時間有限，仍需實機驗證。

本版沒有繞過使用者授權，也不會讀取截圖或錄影檔案。Web 預覽仍保留原 JS 排程備援。此版尚未完成實機編譯測試，請勿直接宣稱雙平台完全可靠。
