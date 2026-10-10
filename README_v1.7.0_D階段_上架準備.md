# Murmur v1.7.0｜D 階段上架準備（第一輪）

這是 **可建置與送審準備包，不是已通過 App Store / Google Play 的正式版本**。以 v1.6.6 為基礎，保留 P1/P2/P3、E1～E5、Meta Horror、既有存檔與分支授權碼。

## 本輪實際修改

1. `scripts/patch_android_release.py`：對 Capacitor 產生的 `android/app/build.gradle` 加入**環境變數式**簽署設定；沒有金鑰時產生未簽署 AAB，有完整金鑰時簽署。不得將 `.jks`、密碼提交到 GitHub。
2. `.github/workflows/android-build.yml`：自動測試、建置 APK / AAB，選擇性讀取 GitHub Secrets 簽署 AAB，使用 `jarsigner -verify` 檢查後才上傳 Artifact。
3. `.github/workflows/ios-build.yml`：增加公開網站分流與商店連結測試；保留模擬器無簽章編譯及可選擇的簽署 IPA 流程。**此環境沒有 macOS / Xcode，尚未實際驗證 IPA**。
4. `www/store-links.js`：新增官方商店網址設定；尚未上架時維持「尚未上架」，有真實網址後才顯示下載連結，且限定 Apple / Google 官方商店網域。
5. `scripts/build-web.cjs`：把商店網址設定同步複製至 Cloudflare 公開網站，不複製第三周目原生檔案。
6. `scripts/release-check.cjs`：檢查應用程式 ID、平台隔離、隱私文件聯絡資料、法律草案與 lockfile 等上架阻擋事項。**預期目前會回報 blocker，直到你提供真實的開發者資料。**
7. `scripts/test-release.cjs`：驗證商店連結預設行為及網頁隔離。
8. `.gitignore`：避免將金鑰、建置輸出與環境檔誤傳 GitHub。若原生目錄原本已由 Git 追蹤，`.gitignore` 不會自動解除追蹤，須自行檢查。

## Windows 更新與驗證

備份 `D:\murmur`，解壓「直接覆蓋更新包」至該資料夾。

```powershell
cd D:\murmur
npm install
npm run build:web
npm run test:release
npm run test:platform
npm run build:native
node scripts/release-check.cjs
npx cap sync android
python scripts/patch_android.py
python scripts/patch_android_release.py
npx cap open android
```

第一次建立原生專案，先執行 `npx cap add android`。`release-check.cjs` 現階段回報法律文件未填是**正常且必要的阻擋**，不要為了綠燈把欄位刪除或填假資料。

### GitHub Actions Android 正式簽署

在 GitHub Repository → Settings → Secrets and variables → Actions 設定：

- **Repository variable**：`ENABLE_ANDROID_SIGNED=true`（沒有金鑰時保持未設定）
- **Repository secrets**：`MURMUR_KEYSTORE_BASE64`（上傳金鑰 `.jks` 的 base64）、`MURMUR_KEYSTORE_PASSWORD`、`MURMUR_KEY_ALIAS`、`MURMUR_KEY_PASSWORD`

Windows 可用 PowerShell 產生 base64 字串（不要貼到聊天室）：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\secure\murmur-upload.jks'))
```

這四個值只能放在 GitHub Secrets。**不要上傳 `.jks`、不要把 base64 放在程式碼裡**。Google Play 啟用 Play App Signing 後，這通常是上傳金鑰，不是 Google 管理的應用程式簽章金鑰。首次發布前務必保管好金鑰與備份。

預設 GitHub Actions 產出 Debug APK 與未簽署 AAB，供建置檢查；設定完整簽章後，才會輸出經驗證的已簽署 AAB。這不是 Play Console 審核通過的保證。

### GitHub Actions iOS

使用既有 `ios-build.yml`。預設只跑無簽署模擬器建置；`ENABLE_IOS_SIGNED=true` 並提供 `BUILD_CERTIFICATE_BASE64`、`P12_PASSWORD`、`BUILD_PROVISION_PROFILE_BASE64`、`KEYCHAIN_PASSWORD`、`APPLE_TEAM_ID` 才會嘗試簽署 IPA。實際 Team ID、Provisioning Profile 與 Bundle ID 必須匹配。正式 TestFlight 還需要 App Store Connect 設定與上傳程序。

### 商店連結

正式商店頁建立後修改 `www/store-links.js`：

```js
window.MURMUR_STORES = Object.freeze({
  android: 'https://play.google.com/store/apps/details?id=app.murmur.story',
  ios: null // 上架後填入實際 apps.apple.com URL
});
```

然後 `npm run build:web`、提交到 GitHub。**範例 Android URL 只有在 Google Play 真的存在該 listing 時才應啟用**。App 的連結同樣從 `www/store-links.js` 讀取，更新 App 需要重新打包。

## 尚未完成，不能宣稱已可上架

- **法律資料**：`legal/privacy.html`、`legal/terms.html`、`legal/disclaimer.html` 及 `www/index.html` 的內嵌條款仍有【待填】。須提供真實開發者名稱、聯絡信箱、必要營業資訊與生效日期；確認敘述與實際網路請求、裝置權限一致。
- **npm lockfile**：此離線環境無法連線 npm registry，因此沒有憑空製作 lockfile。你在 Windows 執行 `npm install` 後，應將生成的 `package-lock.json` 一併提交，後續 CI 才能固定依賴版本。
- **實機驗證**：Android Gradle、Android 14/15 截圖錄影、WebView 相機麥克風定位、iOS Xcode、TestFlight 都未在本環境執行。
- **商店資產**：真實截圖、圖示、商店帳號、內容分級、資料安全表單及審核用帳號／說明需要在 Console 補齊。
- **內容安全**：動作互動不可鼓勵手機撞擊人體或硬物；拒絕任何選用權限仍應能完成遊戲。

## 本輪檢查

執行 `npm run build:web`、`npm run test:release`、`npm run test:platform`、`node scripts/test-transfer.cjs`、`node scripts/test-journey.cjs`、`node scripts/test-forensics.cjs`、`node scripts/test-meta-horror.cjs`、`python scripts/test-native-patches.py`。Android / iOS 原生建置與商店審核須後續驗證。
