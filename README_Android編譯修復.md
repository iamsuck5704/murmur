# Murmur Android 編譯修復 (v1.7.10 hotfix)

修復 `MainActivity` 已有 `murmurScreenshot` 欄位、但沒有 `murmurRegisterScreenshot()` / `murmurUnregisterScreenshot()` 方法時，舊版 `patch_android.py` 因錯誤的欄位判斷而跳過方法建立，導致 Java `cannot find symbol`。

本版以方法是否存在判斷。若 MainActivity 已在 onStart/onStop 直接管理截圖回呼，產生無操作相容方法，避免同一個回呼重複註冊；否則產生完整註冊/解除方法。錄影回呼也改成以方法是否存在判斷。保留權限、感測器插件註冊。

## Windows PowerShell

1. 將 ZIP 內 `scripts/patch_android.py` 覆蓋至 `D:\murmur\scripts\patch_android.py`。
2. 執行：

```powershell
cd D:\murmur
python scripts/patch_android.py
Select-String -Path android\app\src\main\java\app\murmur\story\MainActivity.java -Pattern 'void murmurRegisterScreenshot|void murmurUnregisterScreenshot|registerPlugin'
```

3. 在 Android Studio 執行 Build > Rebuild Project，重新 Run 安裝。

注意：如果你的 MainActivity 是先前已被舊腳本部分修補，這次重新執行會補上缺失的方法。沒有在本環境編譯你的 Windows Android 專案，因此若有新的 Gradle 錯誤，請提供完整第一個錯誤。
