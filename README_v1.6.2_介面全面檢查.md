# Murmur v1.6.2｜介面檢查與手機檔案檢視器修正

## 修正
- 調查視窗原先採固定三列 CSS Grid，但動態「索引已更新」「筆記已更新」提示會使內容變成四或五列；搜尋列可能膨脹、文件內容被擠壓。
- 調查視窗改成垂直 Flex 版型：標題、通知、搜尋列維持內容高度，只有文件內容區獨立捲動。
- 全域 `[hidden] { display: none !important; }` 的 v1.6.1 修正保留。
- 修正公開版只要在網址後面加 `#debug`，就能跳過內容警告並顯示直接跳關的測試選單。現在必須另外明確設定 `window.MURMUR_DEV === true` 才能啟用測試模式；一般 Cloudflare Pages 不會設定。

## 測試範圍
- 390px 手機與 1280px 桌面：開場、內容警告、法律文件三頁、開始、選單、提示、搜尋、調查視窗關閉、聊天輸入、第一周目結束後的授權碼。
- 檢查單一或多個通知提示顯示時搜尋列不會被撐高。
- Node.js 語法與 `npm run build:web`、`npm run build:native`、`npm run test:platform`。

## 使用
解壓更新包直接覆蓋 `D:\murmur`，只需將 `www/index.html` 推送 GitHub，請保留你已修好的 `package-lock.json`，Cloudflare Pages 自動部署。
Android 仍可 `npx cap sync android`，iOS 仍可 `npx cap sync ios`。

## 注意
本次主要是瀏覽器 UI 自動測試，並非完整劇情通關測試或 Android/iOS 實機測試。
第三周目依舊只能在 App 進入，Web build 不包含主要加害者篇 JS/CSS。
