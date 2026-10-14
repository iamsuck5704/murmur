# Murmur v1.8.5 三周目提示修復

## 改動
- 第一、第二周目：點選提示後維持提示清單原本捲動位置，不再每次重置到頂端。保留第三階段完整解法的二次確認。
- 加害者篇：CMD 頂端 `[SET]` 旁新增 `[HINT]`，7 個章節各有三階段提示，最後一階段是具體解法。
- 提示內容涵蓋 E1 鑑識、E2 時間排序、E3 備份比對、童年插章、E4 交叉核對、E5 排序及尾聲。
- 加害者篇提示階段記錄在既有本機進度，不自動解謎、不改動第一／第二周目存檔。
- 網頁及 Android/iOS 使用同一組提示介面；Web 原版故事與 App 專用文字分離保持不變。

## CMD 套用
將 ZIP 中的檔案覆蓋到 `D:\murmur`，然後：

```cmd
cd /d D:\murmur
npm run build:web
npm run build:native
node scripts/test-forensics.cjs
node scripts/test-native-content.cjs
git add www/index.html www/perpetrator.js www/perpetrator.css
git commit -m "Add chapter hints and fix hint scroll"
git push
```

Cloudflare Pages 繼續使用 `npm run build:web` 與 `dist/web`。Android/iOS 更新需重新打包原生 App。

## 驗證
本次執行 Web、Native 內容建置、鑑識測試、內容分離測試，均通過。未完成手機／瀏覽器手動點擊測試，也未進行 Android Gradle / iOS Xcode 原生編譯驗收。
