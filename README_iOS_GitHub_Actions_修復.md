# Murmur v1.7.2｜iOS GitHub Actions 修復包

此更新只改 iOS CI、模擬器啟動驗證與對應回歸測試，不改遊戲內容、存檔、Android、Cloudflare 網站或 App 版本號。

## 修改內容

- `.github/workflows/ios-build.yml`：推送 main 後自動執行，先測試網頁分流與劇情，再生成 iOS 專案、編譯、安裝並啟動 iPhone 模擬器；正式 IPA 簽署維持選用，只有設定 `ENABLE_IOS_SIGNED=true` 才啟用。
- `.github/workflows/ios-smoke.yml`：可在 GitHub Actions 手動執行模擬器啟動測試。
- `scripts/ios-ci-prepare.sh`：集中處理 Capacitor add/sync、CocoaPods workspace/lockfile、原生補丁、版本號、plist 檢查，遇到缺失立即報錯。
- `scripts/ios-simulator-smoke.sh`：模擬器啟動後確認 PID 仍存在，不再只把 `simctl launch` 成功視為 App 啟動成功。完整 Xcode build log 保留到 `build-reports/ios-xcodebuild.log`。
- `scripts/test-smoke-config.cjs`：加入 iOS CI 連線與檢查項目。

## Windows 套用方式

1. 備份 `D:\murmur`。
2. 將修復包內的 `.github`、`scripts` 目錄合併覆蓋 `D:\murmur`，不要刪除其他檔案。
3. 在 PowerShell 執行：

```powershell
cd D:\murmur
npm run test:smoke-config
git add .github/workflows/ios-build.yml .github/workflows/ios-smoke.yml scripts/ios-ci-prepare.sh scripts/ios-simulator-smoke.sh scripts/test-smoke-config.cjs
git commit -m "fix: improve iOS GitHub Actions build and simulator smoke"
git push origin main
```

4. 到 https://github.com/iamsuck5704/murmur/actions 查看 **iOS - compile and optional signed IPA**；或手動執行 **iOS - simulator startup smoke**。
5. 如果仍失敗，進入失敗的 workflow run → **Artifacts** → 下載 `Murmur-iOS-build-diagnostics` 或 `Murmur-iOS-simulator-diagnostics`，把錯誤日誌傳給 ChatGPT。

## 簽署注意事項

- 只要想測試模擬器，不需要 Apple Developer 憑證，也不需要開啟 `ENABLE_IOS_SIGNED`。
- 想產出正式 IPA，需在 GitHub repository Settings → Secrets and variables → Actions 設定 `ENABLE_IOS_SIGNED=true`（Variable）以及 `BUILD_CERTIFICATE_BASE64`、`P12_PASSWORD`、`BUILD_PROVISION_PROFILE_BASE64`、`KEYCHAIN_PASSWORD`、`APPLE_TEAM_ID`（Secrets）。
- 憑證與 Provisioning Profile 必須對應同一 Team ID 和 `app.murmur.story` Bundle ID。正式發行仍須通過 Apple 審核。
- 不要把 .p12、Provisioning Profile、密碼直接提交到 GitHub。

## 測試邊界

本地已驗證 GitHub Actions YAML 格式、shell 語法、原有遊戲與平台分流回歸測試。這個 Linux 環境沒有 macOS/Xcode，**無法宣稱已通過 GitHub 的真實 Xcode 編譯或 iOS 模擬器啟動**。若遠端仍失敗，必須以實際 workflow logs 進一步定位。
