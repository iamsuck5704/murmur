# Murmur v0.6 最新版

請先閱讀 `CMD_UI_v0.6_更新說明.md`。

# v0.4：手機友善的真正 CMD 目錄版

請先看 `docs/CMD_UI_v0.4_更新說明.md`，以下歷史資訊仍適用。

---

# 最新版補充：CMD 風格 v0.3

這份 ZIP 的主要改動為把 v0.2 加害者虛擬手機改為 CMD 視覺介面，主線、章節、存檔和解鎖條件均保留。請先看 `docs/CMD_UI_v0.3_更新說明.md`，再參考以下 v0.2 原始說明。

---

# Murmur 原生 App：階段一交付（v0.2 / 2026-10-10）

這次是**原生 App 用的可操作介面原始碼**，不是已經建置好的 APK／IPA。

## 先試介面

- 最省事：開啟 `www/preview-standalone.html`，或使用另外交付的 `Murmur_加害者篇_手機預覽.html`。這是完整自足的網頁檔，手機瀏覽器可打開。
- 這是**佔位文字試玩**，不用破關，也不會請求任何感測器權限。
- 從 E1 進去，點開章節列出的 App、選擇任一佔位紀錄、返回章節，即可解鎖下一章。
- E1 → E2 → E3 → 童年插章 → E4 → E5 → 尾聲。各章完成狀態儲存在預覽來源的本機儲存空間。
- 部分手機瀏覽器直接讀取 `file://` 的本機 HTML 會限制 localStorage。此時介面仍可操作，但重新開檔後進度可能不保留。用本機 HTTP 靜態網站服務來開啟可改善。

## 原生 App 原始碼

- `www/index.html`：原網頁版第一、第二周目（僅補本機樣式引用、將舊加害者入口導向新虛擬手機）。
- `www/perpetrator.js`：新虛擬手機、章節流程、佔位閱讀頁、獨立進度與設定。
- `www/perpetrator.css`：手機排版、無外連字型配置、隱藏視窗修正、減少動態效果。
- `www/preview.html`：在開發伺服器上直接試虛擬手機；不驗證主線破關。
- `www/preview-standalone.html`：單一 HTML 版本的預覽，供手機先試。
- `package.json` / `capacitor.config.json`：Capacitor 7 原生包裝設定。

## 在具備開發工具的電腦上產生原生專案

需要 Node.js、npm、Android Studio（Android），如需 iOS 則需要 macOS / Xcode。

```bash
npm install
npm run android   # 第一次產生 android/ 原生資料夾
npm run ios       # 只限 macOS，第一次產生 ios/ 原生資料夾
npm run sync      # 將 www 資料同步到原生專案
npm run open:android
npm run open:ios
```

`appId` 目前是 `app.murmur.story` 的暫用識別碼，上架前須更換成開發者自己的正式 Bundle ID。

**字型：** CSS 僅引用 `www/fonts/NotoSansTC-subset.woff2`、`www/fonts/IBMPlexMono-Regular.woff2`、`www/fonts/IBMPlexMono-Bold.woff2`，不會向 Google Fonts 發出網路要求。此份**對外原始碼 ZIP 不附帶字型二進位檔**；在正式安裝／建置前請自行將取得授權的字型檔放入 `www/fonts/`，必要時依字型的授權條款附上授權文件。缺檔時會退回系統字型。

## 維持不變的重要規則

- 原生 App 包含完整第一周目、第二周目，外加加害者篇。
- **只要完成第一周目，就能進加害者篇**；不必完成第二周目。
- 輸入網頁版索引碼可直接解鎖加害者篇；原本的 `makeCode`／`parseCode`／`applyImport` 保留。
- 原生加害者入口改接「唯讀手機備份」；舊 E1～E4 文件被路由隱藏，原始文字仍留在源碼中以便之後移除。
- v0.5 原文完全沒匯入，也沒更動。正式內容導入須先獲得實機 UX 確認。

## 尚未做的事

- 真正的 Android/iOS 建置與裝機驗證；目前執行環境無法取得 npm 的 Capacitor 套件，且未配置 Android SDK／Xcode。
- 導入 v0.5 原文、E1～E5 正式解謎、正式提示（HELP）與疑問清單（OPEN_Q）。
- 原生感測器與其替代路徑、授權 UI、真實通知、截圖與位置等 Meta Horror 功能。
- 完整的無障礙、平台政策、效能與商店審核。
- 上架前必須移除原主線保留的 `#debug`、`#debug-app` 與開發捷徑。

## 驗證範圍

`python docs/test_preview.py` 使用 Playwright 與 Chromium 執行手機視窗 DOM 自動測試：11 個小 App、7 個章節、解鎖門檻、閱讀列表、進度還原、設定及重置。這**不是** Android／iOS 實機測試，也尚未重跑交接包原有的全部 jsdom 測試。

更多內容請看 `docs/DECISIONS_與待辦.md`。
