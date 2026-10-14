# Murmur v1.8.5 公開網頁 QA 搜尋解鎖

## 使用方式

公開站原有「調查」搜尋欄直接輸入 `MURMUR-QA-123012301230`，按搜尋。成功後，本瀏覽器的 P1/P2 進度將標記為第二周目完成，立即開啟加害者篇。其他瀏覽器及其他玩家的存檔不受影響。錯誤代碼不修改存檔。

## 部署

將本 ZIP 內的檔案覆蓋到專案根目錄，提交到 GitHub。Cloudflare Pages 沿用原本的 `npm run build:web`、輸出目錄 `dist/web`。無須 `MURMUR_TESTER_CODE`，也不需 `npm run build:tester`。若 Cloudflare Pages 使用 GitHub 連動，自動建置完成後才會生效。

## 注意

- QA 碼固定、刻意允許公開；不是帳號或安全認證。
- 加害者篇 JavaScript 與 CSS 現在會隨正式網頁公開，任何人都能取得原始碼，僅靠前端驗證無法保密劇情。
- Android/iOS 仍使用 `build:native` 的獨立內容，沒有加入 QA 搜尋捷徑。
- 網頁版保留原本劇情，App 版保留原有敏感內容改寫。
- 已通過 `build:web`、`test:platform`、`test:release`、`build:native`、`test:native-content`；未進行真實瀏覽器點擊及 Cloudflare 線上驗收。
