# Murmur v1.0｜E4 三份資料交叉核對

## 本次新增
- E4「準備」正式加入三段證據核對：04/22 限動觀看次數、04/20 搜尋紀錄、PLAN-7F3 草稿中的模仿與合理化。
- 三份指定檔案必須實際開啟，才能啟用核對題；不再只靠開啟資料夾打卡。
- 答錯顯示核對失敗，答對逐步前進；全部三題完成才可結束 E4。
- 若舊版本已經完成 E4，保留原有通關進度，不會要求重做。
- 修復 v0.9 章節頁 HTML 開頭缺少引號的問題。
- 原有第一、第二周目、加害者篇故事、04/09 重複與漸紅、CRT、逐字打字、E3、E5、搜尋污染及既有 Meta 事件保留。

## 安裝（Windows）
1. 備份 D:\murmur。
2. 把「直接覆蓋 ZIP」解壓縮到 D:\murmur，覆蓋 www 與 docs 下的同名檔案。
3. 在 D:\murmur 開啟 PowerShell，執行 `npx cap sync android`。
4. Android Studio 開啟 D:\murmur\android，按 Run。
5. 不要執行 `npx cap add android`，不要刪除 android 原生目錄。

## 限制
- 這是 HTML/JS 的 E4 更新，不是新增原生感測器。
- Android / iOS 原生編譯與實機權限行為需要在使用者設備和 GitHub Actions 上驗證。
- E4 的核對答案僅根據備份文本，不代表 A 的真實心理或行為已被證實。
