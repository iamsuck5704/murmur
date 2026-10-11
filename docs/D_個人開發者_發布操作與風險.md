# Murmur v1.7.1｜個人開發者上架操作手冊

> 本專案以「個人開發者」帳號準備 Google Play / Apple App Store。此檔案是工作清單，**不代表平台審核通過**。

## 1. 個人帳號與對外揭露

- [ ] Apple Developer Program：以個人身分註冊或確認帳號已啟用。App Store 上的開發者名稱可能是帳號持有者的**法定姓名**，不能假設可以用 Murmur 當作公開賣家名稱。
- [ ] Google Play Console：確認帳號類型為 Personal，完成要求的身分、裝置與聯絡資料驗證。不同帳號建立日期／地區可能有不同測試門檻，**以 Play Console 實際顯示為準**。
- [ ] 確認哪些姓名、信箱、電話、地址會在各商店頁公開，評估個人隱私。不要為了隱藏個資填寫不實地址或假名。
- [ ] 建立專門的支援與隱私聯絡信箱。若所在地法律或商店政策要求揭露地址等資訊，應以真實且合規的方式處理。

## 2. 本機填入法律聯絡資料

1. 複製 `release/individual-profile.example.json` → `release/individual-profile.local.json`。
2. 填入 `legalName`（個人法定姓名）、`supportEmail`、`privacyEmail`、`publicLegalContact`（經確認依法應揭露的公開聯絡資訊）、`effectiveDate`（實際生效日期）。
3. 在專案根目錄執行 `npm run profile:individual`，自動更新 `legal/*.html` 與 `www/index.html` 的內嵌條款。
4. **仔細檢查三份公開文件與 App 內條款**，再決定是否提交至公開 GitHub。`release/individual-profile.local.json` 已被 `.gitignore` 排除，但生成的 HTML 是公開內容。
5. `npm run build:web`、`npm run test:individual`、`npm run check:release`。請注意即使檢查變綠，也不代表法律審核或實機測試完成。

請勿把身分證字號、護照、住址證明、Apple 憑證、Google Play 簽署金鑰、密碼、GitHub Secrets 傳到聊天室或提交 GitHub。可直接在本機及官方 Console 填寫。

## 3. Android 發布

- [ ] 本機安裝 Node、JDK 21、Android Studio、Android SDK，並執行 `npm install` 產生 `package-lock.json`。
- [ ] `npm run build:web && npm run test:release && npm run test:individual && npm run build:native`。
- [ ] `npx cap add android`（第一次）、`npx cap sync android`、`python scripts/patch_android.py`、`python scripts/patch_android_release.py`。
- [ ] Android Studio 真正建置與實機測試，確認拒絕權限仍可通關。
- [ ] 使用 GitHub Actions 的四個簽署 Secrets 與 `ENABLE_ANDROID_SIGNED=true` 產生簽署 AAB；**未簽署 AAB 不可直接上傳正式發布**。
- [ ] Google Play Console：App 內容、Data safety、隱私政策、內容分級、商店素材、測試軌道、國家地區與發行設定。
- [ ] 新個人帳號若 Console 要求封閉測試與測試者門檻，依畫面要求完成後再申請正式版存取。

## 4. iOS 發布

- [ ] 確認 Apple Developer Program 個人帳號、App Store Connect App Record、Bundle ID `app.murmur.story`。
- [ ] GitHub Actions macOS 模擬器建置通過，建立匹配的發行憑證與 Provisioning Profile。
- [ ] 使用官方 TestFlight 實際安裝與測試；正式上傳需另行配置 App Store Connect API 或使用 Transporter/Xcode。現有工作流程僅產出 IPA Artifact，不會自動上傳。
- [ ] App Privacy、Age Rating、隱私政策、支援網址、螢幕截圖、審核說明與敏感權限用途逐項核對。

## 5. Murmur 特殊審核事項

- [ ] 網頁只提供 P1/P2，原生 App 才有 P3；商店審核員需可進入 P3，提供明確測試說明或測試授權碼（不可在公開宣傳暴露劇情）。
- [ ] Meta Horror 的鏡頭、麥克風、位置、通知、截圖錄影反應均有清楚選用開關，拒絕仍可通關。
- [ ] 測試相機、麥克風、定位是否會在退出／背景時釋放；Android、iOS 分開記錄實機結果。
- [ ] 安全動作不能鼓勵玩家以手機撞頭、身體、牆面或物品。
- [ ] 在正式 App Store / Play 頁面確實可開啟之前，`www/store-links.js` 保持 `null`，不要填猜測的 URL。

## 6. 實際驗收狀態

截至 v1.7.1：Java 模擬編譯、Node 測試、網頁分流與法律內容同步可在本環境執行；**Android Gradle、iOS Xcode、TestFlight、Play Console、商店分級與實機權限驗證仍未完成**。不應將本專案描述為已獲審核批准。
