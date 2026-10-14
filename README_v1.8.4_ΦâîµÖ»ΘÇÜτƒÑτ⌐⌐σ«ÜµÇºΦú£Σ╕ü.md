# Murmur v1.8.4 背景通知穩定性補丁

此補丁不修改版本號或玩家存檔，適用於已安裝 v1.8.4 累積更新的原始專案。

## 修正
- 使用 Page Visibility、pagehide/pageshow、原生 Android onPause/onResume、iOS AppDelegate 生命週期事件（如原生補丁套用成功）及可用時的 Capacitor App 事件做備援。
- 避免同時收到多個背景事件重複排程；處理玩家返回前通知尚在非同步排程中的競態。
- 只在加害者篇、玩家啟用截圖與通知效果、OS 已授權、非直播模式且驚嚇效果啟用時排程。
- 截圖後 180 秒內切到背景，約 30 秒後本機通知；玩家回來時嘗試取消。

## 重要限制
- Android/iOS 背景 WebView 可能在非同步通知排程前遭暫停。此補丁提高事件偵測機率，無法保證所有手機通知送達。
- Android 原生 onPause 使用 evaluateJavascript，在 WebView 已暫停時可能來不及執行。iOS 的 willResignActive 也可能在控制中心等非真正離開時觸發，返回時會取消。
- 需要重新產生原生專案、套用 scripts/patch_android.py 與 scripts/patch_ios.py、重新編譯並實機驗收。僅更新網站不會更新原生生命週期橋接。
- 尚未於 Android/iOS 真機驗證；目前僅完成 JS 語法、Python 語法及 Web 發行測試。

## 建議測試
1. 截圖後立即按 Home，停留背景 40 秒。
2. 截圖後 2 分 50 秒切換 App，停留背景 40 秒。
3. 截圖後切背景 5 秒就回來，確認取消。
4. 截圖後切背景，再快速回前景與背景，確認不重複通知。
5. 關閉通知權限、開啟直播模式、停用驚嚇效果，確認均不排程。
6. Android 各家省電模式、iOS 真機 TestFlight、錄影結束後離開。
