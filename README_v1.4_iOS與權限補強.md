# Murmur v1.4｜iOS + 雙平台權限整合

## Windows 安裝 Android 覆蓋包
將更新包解壓覆蓋 D:\murmur，備份原目錄。執行 `npm install`、`npx cap sync android`、`python scripts/patch_android.py`，然後在 Android Studio 開啟 `D:\murmur\android`。切勿重新執行 `cap add android`。

## Windows 建置 iOS
提交完整原始專案到 GitHub，Actions 會於 macOS 執行 `npm install`、`npx cap add ios`、`npx cap sync ios`、`python3 scripts/patch_ios.py` 並編譯模擬器版本。發行用簽署仍需要 Apple Developer 憑證、描述檔與 GitHub Secrets。Windows 無法直接執行 Xcode。

## 這一輪補強
- iOS 截圖和 `UIScreen` 畫面擷取變化事件補丁保留；事件可能涵蓋錄影與外接顯示，不對玩家虛稱能準確分辨。
- iOS Info.plist 相機／麥克風／定位／動作的用途文字補丁保留。
- iOS 與 Android 通知共用 Capacitor 本機通知插件，授權前會先有遊戲內說明視窗。
- 裝置設定勾選時會顯示具體用途、觸發時機、第三方資料流與拒絕效果；取消勾選不主動喚起系統權限。
- 停用裝置效果會取消排程通知；iOS/Android 的系統權限需至系統設定內撤銷。

## 明確限制
本次沒有在 macOS / Xcode 或實際 iPhone 上編譯。iOS 對於光度、錄影方式精確分類及安裝圖示切換存在限制。尚未提供可實際切換的圖示資產。因此不是聲稱所有 Meta 事件都已原生驗收完成的版本。
