# Murmur v0.8 | Windows + Android Studio + GitHub Actions for iOS

## 專案內容
- `www/index.html`：**保留原本第一、第二周目**的單頁遊戲、12+3 題與原有存檔邏輯；法律頁已替換為 v0.8 詳細草案。
- `www/perpetrator.js/.css`：加害者篇 v0.5 正文、E1～E5、最後排序題、04/09 擴寫與重複、漸紅、滑到底爆量文字、CRT、打字、聲量演出等。
- `legal/`：隱私政策、使用條款、免責聲明。**填寫開發者與聯絡資料後才能公開上架**。
- `.github/workflows/`：Android debug APK、unsigned release AAB、iOS 模擬器編譯與選用 IPA 簽署。
- `scripts/`：生成 Capacitor 平台後套用的 Android/iOS 原生截圖／錄影偵測修補。

## Windows 本機 Android
1. 安裝 Node.js 22、JDK 21、Android Studio 與 Android SDK。
2. 專案根目錄執行 `npm install`。
3. `npx cap add android`（第一次）及 `npx cap sync android`。
4. `python scripts/patch_android.py`（第一次或重建原生平台後）。
5. `npx cap open android`，在 Android Studio 選 Build APK(s) 或 Generate Signed Bundle/APK。
6. Google Play 正式版 AAB **必須自行簽署**。Actions 的 release AAB 預設未簽署，不可直接上架。

## Windows + GitHub Actions iOS
1. 將**整個專案根目錄**提交到 GitHub（若可產生 package-lock.json 也一併提交），不要只傳 `www`。
2. Actions → `iOS - compile and optional signed IPA` → Run workflow。
3. 預設跑 macOS 模擬器**未簽署編譯驗證**，無須 Apple Developer 憑證。
4. 真正輸出 IPA：設定 Repository variable `ENABLE_IOS_SIGNED=true`，並加入 GitHub Secrets：`BUILD_CERTIFICATE_BASE64`、`P12_PASSWORD`、`BUILD_PROVISION_PROFILE_BASE64`、`KEYCHAIN_PASSWORD`、`APPLE_TEAM_ID`。需要有效 Apple Developer Membership、App ID、Distribution certificate、provisioning profile。
5. `ios-export-options.plist` 目前預設自動簽署，實際憑證與 profile 需一致；若自動簽署無法在 CI 配對，需依 App Store Connect 的實際設定改成 manual export。未經 macOS 實跑，不保證 IPA 可直接產出。
6. iOS 不能在 Windows 上本機使用 Xcode 編譯，GitHub 的 macOS runner 可以。

## 目前真正完成／未完成
已實作（Web）：完整既有兩周目（保留）、加害者篇資料、E5 排序、日記 CRT、逐字輸出、跳過、04/09 擴寫、重複漸紅與滑動湧現、重讀次數、當下時間提示、選用麥克風即時音量判斷、實況模式阻止音量演出。
原生模板：iOS 截圖事件／錄影狀態事件；Android 14+ 截圖事件。**均需在 GitHub 或 Android Studio 實機編譯驗證**。
未完成或待平台驗證：Android 螢幕錄影狀態（無跨版本可靠 API）、相機鏡子、天氣、大略定位、光線、正式通知、App 圖示切換、震動原生 fallback、加害者篇 E1–E4 完整推理判定、所有機型的截圖事件、商店審查與實機測試。不得宣稱 16 項 Meta 都已實作。

## 隱私與安全
- 麥克風預設不啟動，必須在設定開啟且按本次允許，前景 E4／E5 才會啟用；離開即停。
- 不讀取玩家真實地址、相簿、私人聊天，不收集音訊檔。
- 不要求撞擊手機或身體，避免快速紅色閃爍。
- **請填寫法律文件中的所有【待填】、提供公開可存取的隱私政策網址，並完成 Data safety / App Privacy 問卷**。
