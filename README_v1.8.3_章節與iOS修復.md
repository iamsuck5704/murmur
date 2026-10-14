# Murmur v1.8.3 章節與 iOS 原生修復

## 修正
- E1（索引 0）起截圖可觸發低頻反應；E3（索引 2）起錄影可觸發一次反應。保留原有玩家同意、前景、閱讀頁及低頻限制。
- iOS 原生截圖回呼保留；錄影狀態改成 start/stop，對重複狀態去重，並在 App 啟動、回到前景時確認當前錄影狀態。即使先開始錄影再進 E3，也可在 App 收到狀態後觸發。
- iOS 無公開環境光 API，啟用整套裝置效果時不再把環境光設成開啟；既有 iOS 設定亦會關閉，手動勾選會被拒絕。Android 環境光不受影響。
- 更新 Meta Horror 版本、修正 E5 行政區格式的測試斷言，新增 E1/E3 事件測試。

## 安裝
直接覆蓋包解壓至 D:\\murmur，保留既有資料及存檔。Android：

```powershell
npm run build:native
npx cap sync android
python scripts/patch_android.py
npx cap open android
```

iOS（GitHub Actions）：推送更新的 `scripts/patch_ios.py` 等檔案；現有 `scripts/ios-ci-prepare.sh` 會在生成 iOS 工程後自動執行補丁。不要只執行 `npx cap sync ios` 而漏掉 `python3 scripts/patch_ios.py`。

## 測試狀態與限制
本機通過 JavaScript 語法、Web 建置、原生準備檢查、平台隔離、感測器、Meta Horror 測試。iOS Swift 透過模擬 Capacitor AppDelegate 模板確認補丁插入與字串插值，未在 macOS Xcode / iPhone 實機編譯或驗證。

Android 14 仍沒有 Android 15 的錄影狀態回呼。iOS `UIScreen.isCaptured` 可反映錄影／螢幕鏡像等擷取狀態，不保證能區分各種類型。系統事件可能在 WebView 尚未就緒時遺失，仍應以實機測試為準。拒絕選用功能不影響通關。
