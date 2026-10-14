# Murmur v1.8.5 QA 搜尋無反應修復

## 問題
上一版把 QA 初始化腳本放在 `perpetrator.js` 前，但遊戲主程式是更早執行的 HTML 行內 `<script>`。因此 `TESTER_WEB` 讀到 `false`，輸入授權碼不會進入 QA 流程。

## 修復
將 QA 初始化移到遊戲主程式之前。新增 `scripts/test-qa-web.cjs` 驗證腳本順序、正確碼及錯誤碼。

## Windows CMD
先備份專案，解壓覆蓋到 `D:\murmur`，執行：

```cmd
cd /d D:\murmur
npm run build:web
node scripts/test-qa-web.cjs
git add scripts/build-web.cjs scripts/test-qa-web.cjs
git commit -m "Fix public QA search initialization order"
git push
```

Cloudflare Pages 建置命令：`npm run build:web`，輸出目錄：`dist/web`。
部署成功後重新整理正式網頁，進入「調查」搜尋欄，輸入 `MURMUR-QA-123012301230` 並搜尋。

若線上仍無反應，確認 Cloudflare Pages 最新部署的 Git commit 與建置輸出，並在無痕視窗重試。
