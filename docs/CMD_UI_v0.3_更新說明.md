# Murmur CMD 風格介面 v0.3（2026-10-10）

本次依使用者選擇的方案一，**直接修改 v0.2 虛擬手機，不另建分支遊戲**。沿用 v0.2 原有資料模型、進度 localStorage 鍵、章節邏輯和匯入後的加害者篇入口。

## 改動

- `www/perpetrator.css`：終端機皮膚、方角檔案列表、目錄式兩欄觸控按鈕、唯讀命令提示列、鎖定及完成狀態、深綠與黑色低干擾主題；小螢幕和減少動態效果模式支援。
- `www/perpetrator.js`：虛構 `C:\7F3\...>` 路徑、檔案目錄標籤、章節狀態文字及提示，並未改動解鎖、資料閱讀或保存的程式邏輯。
- `www/preview.html` 與 `www/preview-standalone.html`：改成 v0.3 CMD 外觀；後者內嵌同一份 CSS/JS，可獨立開檔。
- `www/index.html`：原第一、第二周目內容不變，沿用對 `perpetrator.css` 和 `perpetrator.js` 的引用。
- 所有標示為終端機的畫面均清楚標明 Murmur 虛構備份，沒有真實作業系統操作，也不會讀取裝置檔案。

## 不變

- 11 個虛擬 App、E1～E5＋童年插章＋尾聲、唯讀資料、進度、索引碼匯入入口、第一周目即解鎖加害者篇。
- v0.5 正式劇本文字**未匯入且沒有修改**，僅提供佔位測試內容。
- 沒有接入原生裝置權限、感測器、通知、定位或外部 API。
- 本包仍是 Capacitor 專案原始碼，沒有 Android APK／iOS IPA，沒有內附二進位字型檔；建置前需依授權自行補齊 Noto Sans TC 與 IBM Plex Mono。

## 驗證

在 Chromium/Playwright 手機尺寸 (390 × 844) 執行 `python docs/test_preview.py`、`python docs/test_integration.py`；涵蓋 7 章通關、11 個 App、進度保存、設定、重置，以及第一周目入口攔截。另附 `docs/cmd-home.png`、`docs/cmd-chapter.png`、`docs/cmd-entry.png` 供外觀確認。所有驗證均為瀏覽器測試，**不代表已通過原生實機測試**。
