# Murmur v1.7.0～v1.7.2（含 iOS GitHub Actions 修復）累積覆蓋包

此包是 **v1.6.6 → 最新 v1.7.2** 的累積更新，只放相對於 v1.6.6 有新增或變動的 44 個專案檔案。
已比對 v1.7.0、v1.7.1、v1.7.2、iOS Actions 修復四個更新包，確認逐一覆蓋後的結果與最新完整專案 ZIP **逐位元組一致**。

## 使用方式
1. 先完整備份 `D:\murmur`。
2. 將此 ZIP 直接解壓縮到 `D:\murmur`，保持目錄結構並允許覆蓋同名檔案。**不要**把檔案全部移到同一層。
3. 在 PowerShell 執行：

```powershell
cd D:\murmur
npm install
npm run test:smoke-config
npm run test:release
npm run build:web
npm run build:native
```

4. 檢查無誤後再 `git add .`、`git commit`、`git push origin main`。
5. GitHub Actions 的 macOS/iOS 真正建置仍須在 GitHub 執行；此包不代表已通過遠端 iOS 編譯。

## 包含
- v1.7.0：發布流程、商店連結、Android 簽署及審核檢查
- v1.7.1：個人開發者設定、法律文件同步、簽署保護
- v1.7.2：Android/iOS 模擬器啟動測試、原生版本同步
- 最新 iOS GitHub Actions 修復：iOS workflow、準備/模擬器測試腳本、診斷日誌

## 注意
- `release/developer.json`、`legal/*.html` 等在更新包內有預設內容。如果你在自己的電腦已經填過真實開發者資訊，**請先備份這些檔案**，避免覆蓋掉個人設定。
- 此 ZIP **不是整份專案**，需要原有 Murmur 專案作為基底。
- 本包包含 `dist/web` 中對應的最新生成檔，但 Cloudflare 仍應依專案設定執行 `npm run build:web`。
- `package-lock.json` 沒有出現在這四輪更新的檔案裡，請於自己的電腦執行 `npm install` 同步鎖定檔，並依需求提交。
