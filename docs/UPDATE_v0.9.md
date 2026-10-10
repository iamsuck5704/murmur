# Murmur v0.9 增量更新

- E3 新增真正的備份差異題：必須閱讀 v1 與 v2 才能選擇被刪除的關鍵拒絕訊息。正確答案為「可是咱不想跟你交往」。原有兩份備份文本完全保留。
- 備份首頁新增搜尋（僅已解鎖內容），搜尋文字只儲存於裝置 localStorage，最多保留 12 筆，並於 E4「搜尋紀錄」尾端以 [LOCAL CACHE] 顯示。
- E4/E5 重讀特定日記時出現輕微額外文字；不改寫原稿。實況模式或關閉驚嚇效果時不顯示。
- 設定頁新增單獨清除搜尋紀錄按鈕。
- 修復 v0.8 的章節跳轉錯誤：閱讀上一筆／下一筆或舊日記後返回章節，不再意外跳回該紀錄的歷史章節。
- 沿用成功編譯的 MainActivity；不覆蓋 Android 原生目錄。修正 scripts/patch_android.py 為先前成功修復的版本。
- 尚未實作／實機驗證的原生 Meta 事件不宣稱已完成。

## Windows 直接覆蓋
將「直接覆蓋補丁 ZIP」解壓到 D:\murmur，允許覆蓋 www/perpetrator.js、www/perpetrator.css、www/preview-standalone.html、scripts/patch_android.py。
接著在 D:\murmur 執行 `npx cap sync android`，再到 Android Studio 執行 Run。
**不要再次執行 npx cap add android；也不需要重新執行 patch_android.py。**

## 隱私
新增搜尋只查遊戲內已解鎖文字；玩家輸入字詞會本機儲存並作為劇情元素展示，設定頁可單獨清除。
