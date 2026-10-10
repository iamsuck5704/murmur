# Murmur v1.6.3｜A 階段：跨平台流程與授權碼驗證

## 本輪修改

1. **第三周目真正要求第二周目完成**：App 選單「原始資料」僅在 `S.cleared2 === true` 時出現。第三周目備份模組的 `canEnter()` 也使用同樣的條件，不只隱藏按鈕。第一周目授權碼匯入後仍可玩第二周目，不能提前進入第三周目。
2. **網頁與 App 維持同一原始專案**：原生 App 仍使用 `www/`，網頁仍透過 `node scripts/build-web.cjs` 產生 `dist/web/`。網頁建置新增剔除共用 HTML 中舊版 E-ROOT 等第三周目文件內容，且不會公開 `perpetrator.js`、`meta-horror.js` 和其樣式。
3. **匯入保護**：已完成第二周目的 App 不會接受較早的第一周目授權碼來覆蓋進度。原本 `localStorage` 存檔鍵 `murmur_p01_v7` 與 `murmur_app_backup_preview_v5` 均不變。
4. **新增自動檢查**：`node scripts/test-journey.cjs` 驗證平台門檻和建置產物；`node scripts/test-transfer.cjs` 以 VM 執行真實授權碼產生、解析、第一／第二周目匯入函式，確認可保存結果。

## 建置和測試

在 Windows PowerShell：

```powershell
cd D:\murmur
node scripts/build-web.cjs
node scripts/check-native.cjs
node scripts/test-platform.cjs
node scripts/test-journey.cjs
node scripts/test-transfer.cjs
```

Cloudflare Pages 設定不變：`npm run build:web`、輸出目錄 `dist/web`、Root 留空。

原生 App 仍用 `npx cap sync android`／`npx cap sync ios`。**本輪未修改 `package.json` 或 `package-lock.json`，避免 Cloudflare `npm ci` 再次出現版本鎖定衝突。**

## 已驗證與尚待驗證

已通過：Node JS 語法檢查、兩種 HTML 的 inline script 語法檢查、Web/Native 靜態分離測試、授權碼生成／校驗／匯入 VM 測試、ZIP 完整性檢查。

**未通過實際瀏覽器端到端測試**：本執行環境 Chromium 導覽 `http://127.0.0.1`、`file://`、`data:` 均回報 `ERR_BLOCKED_BY_ADMINISTRATOR`。附帶 `scripts/test_journey_browser.py` 作為開發者本機測試腳本，但它在此環境無法跑完，因此不應宣稱已完成手機或瀏覽器實際點擊驗收。

還未逐題完成第一、第二周目的完整人工通關，也未在真實 Android/iOS 裝置驗證授權碼。建議本機測試：網頁第一周目通關拿到 `-1XX` → App 匯入後只能開第二周目 → 網頁第二周目通關拿到 `-2XX` → App 匯入後第三周目解鎖 → 重啟 App 存檔不消失。

**注意**：網頁共用原始碼仍有少量與加害者篇有關的線索或關鍵字（例如第一、第二周目既有的 ARG 伏筆）；完整第三周目資料和舊版 E 系列文件內容已從 Cloudflare 產物排除。這是內容分流，不是反逆向安全機制。
