# Murmur v1.8.4 文件與發行一致性修正

- `legal/*.html` 為正式文件唯一來源；執行 `npm run sync:legal` 同步 App 內嵌條款。
- 已對齊 v1.8.0 入場選用整組啟用、v1.8.1 擷取後離開通知、v1.8.2 國際行政區退回規則，以及本機搜尋紀錄用途。
- 保留開發者姓名、客服／隱私信箱、所在地、生效日期等佔位符；**不可直接送審**，請填入真實資料並經法律審閱。
- `release/version.json` 與 `package.json` 統一為 1.8.4；buildNumber 184，發布時仍須確認大於既有商店 build。
- 已標註 v1.4 權限文件為歷史文件。
- `package-lock.json` 必須由 npm 產生，不得手工捏造。
- 送審前：驗證 iOS/Android 實機權限與通知、定位網路請求、Apple App Privacy、Google Play Data Safety、內容分級、公開隱私政策 URL、商店支援網址及簽章。

## Windows 更新
解壓覆蓋到 D:\murmur；`npm ci`、`npm run build:web`、`npm run build:native`、`npm run check:release`；Android 額外 `npx cap sync android`、`python scripts/patch_android.py`。
