# Murmur v1.6.6｜C 階段第二輪：原生權限驗證與修復

## 已完成的程式修改

1. 修復 `scripts/patch_android.py` 在 Capacitor 預設 `MainActivity.java` 不含 `import android.os.Bundle;` 時，舊版錄影補丁漏掉 `WindowManager`、`Consumer` 等 import 的問題。現在明確檢查 Java imports，保留現有 MainActivity 程式，不整檔覆蓋，重複執行不重複加入程式片段。
2. 改善 Android 截圖（API 34+）與錄影（API 35+）監聽器的前景註冊、背景解除及失敗清理。**這不代表已在真機證實所有型號支援**。
3. `META / DEVICE EFFECTS` 新增 `[CHECK] 裝置能力`、`[TEST] 相機`、`[TEST] 麥克風`、`[TEST] 定位`。只在原生 App、玩家已開啟加害者篇且前景時可測試。三項權限測試必須由玩家按下按鈕，再經過確認；不會上傳或保存音訊、照片、座標。相機及麥克風串流在 `finally` 中立即停止。
4. 截圖／錄影的劇情反應再加上 `ctx.view==='entry'` 限制，避免首頁觸發。離開章節或背景時解除動作感測事件監聽器。
5. 修正劇情通知的兩個問題：通關後的自動排程**只檢查**已取得的通知權限，不再自動彈出 OS 授權請求；切回前景時使用序列編號取消仍在進行的離開通知排程，減少延遲排程的競態。關閉全部效果會清除通關通知排程標記，日後可重新啟用。
6. Android／iOS GitHub Actions 新增 JavaScript 回歸測試與原生補丁 fixture 測試，編譯前先檢查。

## 目前不能宣稱完成的部分

- Android/iOS 的相機、麥克風、定位仍可能需要額外的 WebView 原生授權處理；此版提供實際測試入口與錯誤資訊，**不會把 API 存在誤認成 OS 已授權**。
- Android 截圖與錄影偵測受 OS 版本、廠牌及實際前景狀態限制。iOS 仍須在 Xcode／真機測試。
- 現行 Android/iOS 原生系統事件監聽器在 App 前景時註冊，**不論玩家是否勾選劇情反應**；JS 僅在玩家勾選、進入指定場景後顯示反應。這不是原生層的完整權限前置控制。後續若要做到「未同意時原生層完全不監聽」，需要額外實作原生與 JS 的啟停通訊。
- 光感測、環境聲量持續判斷與替代圖示並未在此版新增實機支援；目前僅提供麥克風取得權限的單次診斷。
- **未在此環境執行 Android Gradle、Xcode、真機測試或商店審核**。

## 本機更新與測試（Windows PowerShell）

解壓「直接覆蓋更新包」到 `D:\murmur`（先備份）。

```powershell
cd D:\murmur
node scripts/test-meta-horror.cjs
python scripts/test-native-patches.py
npm run build:web
npx cap sync android
python scripts/patch_android.py
```

然後在 Android Studio 重新 Build 並安裝。若是首次建立 Android 原生專案，先執行 `npx cap add android`。iOS 在 macOS 端 `npx cap sync ios` 後執行 `python3 scripts/patch_ios.py`，再用 Xcode／GitHub Actions 建置。

### ROG Phone 6 建議實測

1. 開啟第三周目 → `META / DEVICE EFFECTS` → `[CHECK] 裝置能力`，拍下診斷文字。
2. 分別按 `[TEST] 相機`、`[TEST] 麥克風`、`[TEST] 定位`，依提示允許權限；確認成功或記下錯誤代碼。測試不會上傳位置或錄音。
3. 啟用「截圖／錄影劇情反應」，到 E4/E5 章節實際截圖、開始螢幕錄影，確認劇情訊息是否出現。Android 版本低於 API 34／35 時，對應功能可能不支援。
4. 關閉 App、切到背景、撤銷裝置效果，確認相機與麥克風沒有持續使用的系統指示。
5. E5 完成最後排序後，才開啟定位演出；拒絕授權仍能繼續遊戲。

## 自動測試結果

- `node scripts/test-platform.cjs`：通過。
- `node scripts/test-transfer.cjs`：通過。
- `node scripts/test-journey.cjs`：通過。
- `node scripts/test-forensics.cjs`：通過。
- `node scripts/test-meta-horror.cjs`：通過，新增明確操作後才測試相機／麥克風與停止串流的斷言。
- `python scripts/test-native-patches.py`：通過，補丁重複執行及 Java API 形狀的 stub 編譯。**這不是 Android SDK 編譯**。
- `npm run build:web`、`npm run build:native`：通過。

## 下一輪

根據 ROG Phone 6 診斷結果，補上確實需要的 Android WebView 相機／麥克風／定位授權橋接；之後再做 iOS 真機與環境聲量場景整合，最後才進入 D 階段上架。
