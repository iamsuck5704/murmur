# Murmur v1.7.1｜D 階段第二輪：個人開發者發布流程

延續 v1.7.0，不重置任何遊戲進度、不改 E1～E5 劇情。

### 本輪修正

1. `release/developer.json` 明確標記 `individual` 個人開發者，避免公司／組織版流程混用。
2. `release/individual-profile.example.json` 提供本機填寫模板，個人資料填入 `individual-profile.local.json`（已忽略 Git 追蹤）。`npm run profile:individual` 可以同步填寫三份法律文件與 App 內嵌條款；**產生的 HTML 是公開內容，發布前務必檢查個資揭露**。
3. `scripts/sync-legal.cjs` 自動以 `legal/*.html` 作為唯一版本，同步 `www/index.html` 的三份法律文件，解決舊版 App 內隱私政策仍停在 v0.8 的問題。
4. `scripts/patch_android_release.py` 修復 Capacitor 預設 release 使用 `signingConfigs.debug` 的潛在風險。若未提供完整簽署環境變數，release 不會再沿用 debug 金鑰。新增回歸測試，驗證修補兩次仍一致。
5. GitHub Actions 將未簽署 AAB 明確標示 `UNSIGNED-AAB-NOT-FOR-PLAY`；有啟用簽署才輸出 `SIGNED-AAB`，避免誤上傳。
6. `docs/D_個人開發者_發布操作與風險.md` 列出個人帳號資訊揭露、Android/iOS 送審及 Murmur 特殊審核事項。

### Windows 更新

將「直接覆蓋更新包」解壓到 `D:\murmur`（先備份），在 PowerShell 執行：

```powershell
cd D:\murmur
npm install
npm run build:web
npm run test:release
npm run test:individual
npm run build:native
npm run check:release
```

上架檢查仍會因真實開發者聯絡資料尚未填寫而顯示 4 個 blocker，**不要使用假資料讓檢查通過**。依 `docs/D_個人開發者_發布操作與風險.md` 逐項處理。

### 本輪未完成

- 未取得任何真實個人開發者姓名、聯絡信箱或商店帳號資料，因此不會捏造或代填。
- 尚未執行 Android Gradle、iOS Xcode、實機測試或商店送審。
- `package-lock.json` 需在可連線 npm registry 的電腦產生並提交。
