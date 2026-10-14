# Murmur v1.7.9 | Android 插件註冊修復

## 已確認的問題

實機顯示 `unable to find plugin: MurmurPermissions` 與 `MurmurSensors`。
使用者本機 `MainActivity.java` 沒有任何 `registerPlugin`，Java 插件類別也不存在。
**修補腳本沒有在本機生效**，但尚不能單靠這些輸出確定 Python 命令本身為何沒有執行。

## 本次修正

- `scripts/patch_android.py` 在執行結束時強制驗證 MainActivity 的兩個註冊、三個原生 Java 檔案，失敗就非零退出，成功印出 PASS。
- 新增 `scripts/修復Android插件.ps1`，優先用 `py -3` 啟動 Python，檢查退出碼和產生的檔案，避免靜默失敗。
- 保留原先完整的原生權限、WebView、感測器補丁和劇情防劇透設定。

## 覆蓋後在 Windows PowerShell 執行

```powershell
cd D:\murmur
npx cap sync android
powershell -ExecutionPolicy Bypass -File .\scripts\修復Android插件.ps1
Get-ChildItem android\app\src\main\java -Recurse -Filter *.java | Select-String 'registerPlugin|class MurmurPermissionsPlugin|class MurmurSensorsPlugin'
```

必須出現 `PASS` 和兩個 `registerPlugin`，否則**先不要建置**。成功後 Android Studio → Build → Rebuild Project，重新安裝 APK。

注意：若你的 `MainActivity` 先前已手動加入兩行 `registerPlugin`，腳本會保留它們，但仍會建立插件檔案。

**尚未在實機或完整 Gradle 環境驗證。** 系統權限先前已同意時，Android 不一定再次跳出視窗。請以權限狀態與實際讀數判斷。
