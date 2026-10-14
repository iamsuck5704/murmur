# Murmur v1.8.5 App 版內容調整

- 網頁版：`www/` 和 `dist/web/` 原劇情保留，不改動原有文本。
- Android / iOS：由 `npm run build:native` 生成 `dist/native/`，僅 App 版移除性侵、強制性交等敘事，將新聞、司法紀錄、論壇及內容警示改成以跟蹤、殺人等原有劇情為主。
- `capacitor.config.json` 的 `webDir` 改成 `dist/native`，避免將未調整的 `www/` 打進 App。
- `npm run test:native-content` 會檢查兩版內容分離與原生資源完整性。
- GitHub Actions Android / iOS 建置流程已在 Capacitor 同步前建立 App 版。

## 本機操作

```powershell
cd D:\murmur
npm run build:web
npm run build:native
npm run test:native-content
npx cap sync android
python scripts/patch_android.py
```

iOS 在 macOS / GitHub Actions 的 `cap sync ios` 前同樣需先執行 `npm run build:native`。

## 注意

這不是自動通過審核的保證。商店內容分級、暴力與心理恐怖警示仍須據實填寫。此補丁只調整 App 發行內容，不會變更已安裝玩家的存檔。舊版已安裝 App 須重新建置並更新才會看到新內容。
