# Murmur 法律文件獨立網址

Cloudflare Pages 正式部署 `dist/web` 後，每份文件有自己的網址：

- 隱私政策：https://murmur1.pages.dev/privacy/
- 使用條款：https://murmur1.pages.dev/terms/
- 免責聲明與內容警示：https://murmur1.pages.dev/disclaimer/

舊網址 `/legal/privacy.html`、`/legal/terms.html`、`/legal/disclaimer.html` 仍保留相容。遊戲內原有法律視窗保持不變，新增「獨立網址 ↗」可開啟目前選擇的文件。

使用方式：覆蓋專案後執行 `npm run build:web`，把 `dist/web` 部署到 Cloudflare Pages。僅覆蓋本機程式碼不會讓公開網址立即上線。

注意：網址以上述既有 Cloudflare 網域為前提。若未來更換正式網域，請同步調整 `www/index.html` 中的 `legalUrls` 與連結。
