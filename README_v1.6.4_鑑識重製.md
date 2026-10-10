# Murmur v1.6.4｜B 階段：第三周目鑑識重製

## 實作
- E1：保留 3 份證據收錄，不再重複出現舊的三題選擇題。
- E2：3 份證據核對後，新增 01-14 → 02-05 → 02-08 時間線重建，使用上下移動按鈕，手機可操作。
- E3：直接顯示 v2/v1 逐行對照，點擊 v1 中 21:31 的明確拒絕句；提醒 v2 省略不只一句。
- E4：以三份原始紀錄填寫觀看次數、搜尋地點、草稿原句；不再出現舊三題選擇題。證據本身不等於 A 的意圖。
- E5：原有四句排序完成後出現 [INTEGRITY WARNING]，提醒只有單方日記，不偽造新證據。
- 保留全部原始正文、CMD 介面、Meta Horror 與檔案開啟動畫。
- 保留原 localStorage key；已完成章節不要求重解。新進度新增 e2TimelineOrder、e2Timeline、e4Correlation。

## 注意
第三周目仍限 Capacitor Android/iOS App。Cloudflare Pages 僅輸出第一、第二周目。部署網頁不會更新 App 的第三周目內容，需 `npx cap sync android` / `npx cap sync ios` 後重建安裝。

## 測試
`node --check www/perpetrator.js`；`npm run build:web`；`node scripts/test-platform.cjs`；`node scripts/test-journey.cjs`；`node scripts/test-transfer.cjs`；`node scripts/test-forensics.cjs`。

此處僅代表程式與模擬測試，原生真機尚未驗收。
