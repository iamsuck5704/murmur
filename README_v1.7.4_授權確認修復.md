# Murmur v1.7.4｜加害者篇裝置權限入場修正

## 原因

v1.7.3 的「確認並繼續」按鈕不會直接要求系統權限。只有先勾選獨立選項才會進入請求流程，沒有勾選會停用裝置效果。

## 修正

- 入口改為「確認並啟用裝置效果」與「僅接受條款，不啟用裝置效果」兩個明確選項。
- 選擇啟用時逐項嘗試相機、麥克風、定位、通知授權。
- 完成後留在視窗顯示每項權限結果，提供重試與進入遊戲按鈕。
- 更新入場確認版本鍵，舊玩家更新後可重新看到此說明，不重置遊戲進度。
- 仍保留三份可點開的法律文件、個別 OS 拒絕與無權限通關。

## Android 限制與驗證

系統授權已存在時不一定會再次彈窗。先前永久拒絕的權限，可能需到 Android 設定 → 應用程式 → Murmur → 權限手動啟用。若顯示未啟用，至 [SET] → META / DEVICE EFFECTS 執行 [CHECK] 裝置能力及各 [TEST]，回報診斷結果以排查 Android WebView 原生橋接。

本包未修改 Android MainActivity 的 WebChromeClient 權限代理，故不能保證修好原本相機、麥克風、定位測試失敗的底層原因。

## 安裝

備份 D:\murmur，覆蓋更新包後：

```powershell
cd D:\murmur
npm run test:permissions
npx cap sync android
python scripts/patch_android.py
npx cap open android
```

在 Android Studio 重新建置並安裝，確保不是舊 APK。
