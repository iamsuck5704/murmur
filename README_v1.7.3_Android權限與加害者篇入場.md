# Murmur v1.7.3｜Android 權限修正與加害者篇入場流程

## 本次修改

1. **首次進入加害者篇**，顯示專屬確認視窗。三個文件只顯示標題／開啟按鈕，點開才呈現完整的使用條款、隱私政策、免責聲明與內容警示。確認表示同意文件，但**不代表系統權限已授予**。接受紀錄存在本機 `murmur_perp_terms_v172_permissions`，舊進度不清除。
2. **裝置效果獨立勾選**，預設未勾選。勾選並確認後，依序由 Android/iOS 系統詢問相機、麥克風、定位、通知權限。任何一項拒絕或不支援，不影響通關。取得相機／麥克風授權時短暫啟動串流，隨即停止；定位授權檢查不傳送座標。
3. **Android 原生權限修正**，`scripts/patch_android.py` 新增 `ACCESS_FINE_LOCATION`，與 Capacitor 7 WebView 的定位權限處理一致；保留 `ACCESS_COARSE_LOCATION`，允許玩家選擇約略位置。原生補丁必須在 `npx cap sync android` **之後**執行。Android 的 WebChromeClient 原生授權橋接由 Capacitor 處理，不在此覆寫以免破壞原有功能。
4. **截圖／錄影同意漏洞**，移除加害者篇舊事件處理器中未檢查同意的劇情台詞，改由 Meta 模組依玩家 opt-in、前景、章節條件處理。
5. 修正加害者篇設定頁的過時文案；更新法律文件與遊戲內嵌版本；新增 `npm run test:permissions` 回歸測試。

## Windows / ROG Phone 6 安裝

將本更新包解壓縮至 `D:\murmur`，保留你的個人開發者資料。先備份專案與手機上的遊戲進度。

```powershell
cd D:\murmur
npm install
npm run test:permissions
npx cap sync android
python scripts/patch_android.py
python scripts/patch_android_release.py
python scripts/set-native-version.py android
npx cap open android
```

在 Android Studio 重新 Build 並安裝新 APK。**單純更新網頁／Cloudflare 不會更新手機 App 的原生權限**。如果你曾經拒絕權限，Android 可能不會再次彈出提示。請到「設定 → 應用程式 → Murmur → 權限」，手動允許相機、麥克風、位置與通知，再重新進入 App。

## 第一次測試

1. 用已完成第二周目的存檔進入原生加害者篇。
2. 看見確認視窗，分別點開三份文件並返回。
3. 勾選「同時啟用選用裝置恐怖效果」，按「確認並繼續」。
4. Android 應依序詢問可用的相機、麥克風、定位及通知權限。若系統已授予某項權限，可能不再彈窗；若先前永久拒絕，需在系統設定手動修改。
5. 到 `[SET] → META / DEVICE EFFECTS` 按 `[CHECK] 裝置能力` 與 `[TEST] 相機／麥克風／定位`，確認實際結果。
6. 未勾選裝置效果時，確認條款後不會要求系統權限。可在 `[SET]` 後續逐項啟用。

## 已知限制與未驗證

- 本輪已通過 Java 形狀模擬編譯、JS 程式測試及網頁分流測試，但**未在真實 ROG Phone 6 上編譯／安裝／授權驗收**，也沒有完成 Android Gradle 真實編譯。
- Android 系統會決定是否顯示權限對話框，無法強制讓已授權或永久拒絕的權限再次彈出。不同版本的 Android 可能合併或略過某些提示。
- 光感、截圖、錄影等不是全部都有 Android 執行階段權限視窗；部分 API 需 Android 14／15 或裝置支援。iOS 原生權限仍須另行真機驗證。
- E5 行政區與天氣劇情仍會在資料傳送到第三方前詢問同意。首次權限測試不會傳送座標。
- 目前測試瀏覽器被環境限制無法導覽，因此沒有宣稱視覺／真機測試已通過。
