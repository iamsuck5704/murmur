# v1.2 覆蓋與測試

先備份 D:\murmur。將覆蓋 ZIP 內容解壓至 D:\murmur；不要刪除 android 資料夾。於專案根目錄執行 `npx cap sync android`，再執行 `python scripts/patch_android.py`，重開 Android Studio 專案 `D:\murmur\android` 並 Rebuild。

**特別注意**：此版新增 `www/meta-horror.js` 與 `www/meta-horror.css`，不是新增外部依賴。部分瀏覽器 WebView 不支援相機、環境光、通知等功能，需依裝置權限與原生 bridge 測試。Android Studio 能編譯不代表所有 Meta 元素都已通過驗收。
