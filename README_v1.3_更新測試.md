# Murmur v1.3 整合補丁（在 Windows 安裝）

1. **先備份** `D:\\murmur`，再把此更新包解壓到 `D:\\murmur`。保留現有 `android/` 目錄。
2. 開啟 PowerShell：

```powershell
cd D:\\murmur
npm install
npx cap sync android
python scripts/patch_android.py
```

3. Android Studio 重新開啟 `D:\\murmur\\android`，Gradle Sync，Build / Run。

**新增：** Android 15+ 錄影狀態系統回呼；選用本機通知插件、通關第三天 21:12／21:31／21:50 通知、35 分鐘未回到 App 的待機通知；關閉通知則取消排程。

**限制：** Android 14 及更舊版本無官方等效錄影偵測；本版本不會虛構偵測成功。第三天通知需要玩家先啟用效果、授權通知，並且在完成加害者篇尾聲後才排程。Android 節電策略可能造成延遲；沒有要求精確鬧鐘權限。

**尚未完成：** 替換 App 圖示的 Android/iOS 原生資源與切換控制，以及 iOS 通知與錄影等實機測試。保留圖示設定開關但沒有虛構切換成功。

**請測試：** 關閉所有效果仍能通關；打開通知權限後再通關；Android 15+ 錄屏時前景訊息；離開超過 35 分鐘的本機通知（有節電限制）。
