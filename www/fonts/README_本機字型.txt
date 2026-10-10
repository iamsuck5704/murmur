此資料夾放置 App 端使用的本機字型（非 Google Fonts CDN）。
完整原始碼交付包不附二進位字型檔。建置時需自行取得並放入：
- NotoSansTC-subset.woff2（需含正式劇本字元）
- IBMPlexMono-Regular.woff2
- IBMPlexMono-Bold.woff2

請確保來源與授權條款允許 App 內嵌，必要時附上授權文件。
缺檔時 UI 會 fallback 到系統字型，不會觸發遠端字型請求。
