# Murmur v1.1 更新與安裝說明

### 新功能
- E1：需閱讀日記 11/12 01:47、11/19、〈備忘錄 · 她〉，完成三道原文核對與推論判斷。
- E2：需閱讀回覆紀錄、上線紀錄、未寄出的訊息，完成三道對照題。
- 三題正確後才可解鎖下一章。已通關玩家保留通關進度。
- Android 加入前景恢復 lifecycle 通知，與遊戲內離開時間結合（離開至少 90 秒後在 E4 後期觸發）；不新增權限、不會監視其他 App。
- 保留原本截圖偵測、iOS 錄影偵測及經授權音量感測設計；Android 螢幕錄影等尚未實作，不冒充支援。

### 直接覆蓋（Windows）
1. 先備份 `D:\murmur`。
2. 把直接覆蓋 ZIP 解壓到 `D:\murmur`，確認覆蓋 `www` 和 `scripts`。
3. 於 `D:\murmur` 執行：`npx cap sync android`。
4. 執行：`python scripts/patch_android.py`（如未安裝 Python，改 `py scripts/patch_android.py`）。
5. Android Studio 開啟 `D:\murmur\android`，重新編譯並 Run。
**不要執行 npx cap add android，也不要刪除 android 資料夾。**

### 注意
- Native onResume callback 未在使用者實機驗證；先以 Android Studio Debug 測試。
- E1、E2 判定核對的內容以故事中的備份為準，不代表角色推論必然正確。
