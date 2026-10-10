# Murmur v1.6｜單一專案，依執行平台分周目

## 只有一份原始碼
`www/` 是唯一遊戲原始碼。第一、第二周目在 Web 和 App 都可遊玩。
第三周目 7f3 加害者篇只有 Android/iOS 原生 App 可以進入。
**不需要維護兩份專案或手動改 APP 變數。**

## 直接上傳 Cloudflare Pages
在專案根目錄執行 `npm run build:web`，輸出到 `dist/web/`。
Cloudflare Pages 直接上傳 `dist/web` 資料夾（或本包附帶的 Cloudflare ZIP）。
Git 連接部署：Build command = `npm run build:web`，Build output directory = `dist/web`。
`dist/web` 會自動排除 `perpetrator.js`、`meta-horror.js`、相關 CSS 和預覽頁，避免將完整第三周目原始檔公開部署。
**不要把根目錄的 `www/` 直接部署到 Cloudflare**，它包含原生第三周目程式碼。

## Android
1. 把更新包覆蓋到既有的 `D:\\murmur`，保留原生 `android/`。
2. `npm install`
3. `npm run build:native`
4. `npx cap sync android`
5. Android Studio 開啟 `D:\\murmur\\android`，按 Run。

## iOS
`npm install` → `npm run build:native` → `npx cap sync ios`。
iOS 建置仍需 macOS／GitHub Actions。

## 平台判斷
統一使用 Capacitor `isNativePlatform()`。
一般瀏覽器（即使網址加上 `#app`）不會開啟第三周目。
App 內通關或輸入網頁通關授權碼後，才依既有條件開啟第三周目。
原本進度 localStorage key 不變，不主動重置玩家存檔。

## 注意
網頁版的第一、第二周目仍使用本機瀏覽器存檔，需透過分支授權碼轉移到 App，非雲端自動同步。
網站不能以僅隱藏按鈕作為「保密」手段，所以公開產物不含第三周目主要檔案；但共同的 `index.html` 仍包含早期內嵌的少量第三周目線索。若要求完全零劇透，需要進一步將那些共用舊資料抽離。
這是程式與靜態產物檢查，不等於已完成 Android/iOS 實機測試。
