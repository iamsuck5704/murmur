# Murmur Meta Horror v1.2 驗收清單

此版完成 UI 分類、預設關閉、獨立授權入口及 WebView 可支援的事件；**並未宣稱 16 項原生功能全部通過實機測試**。

| # | 事件 | 現況 |
|---|---|
| 1 | 雙敲震動 | 保留 v1.1 Web 振動；iOS 原生 Haptics 待橋接 |
| 2 | 閱讀次數 | 已實作 |
| 3 | 搜尋污染 | 已實作 |
| 4 | 現實時間 | 已實作 |
| 5 | 重讀變化 | 已有重讀文句；個別全文版本差異仍待編排 |
| 6 | 通關換圖示 | 控制介面已加入；iOS/Android 原生替代圖示待資源與測試 |
| 7 | 第三天通知 | 權限入口；原生排程待完成 |
| 8 | 離開時通知 | 已有回到前景劇情；背景推播待完成 |
| 9 | 前鏡頭鏡子 | HTML getUserMedia 前景預覽；原生權限、實機待測 |
| 10 | 截圖／錄影 | 既有 iOS 及 Android14+ 截圖橋接；Android 錄影僅支援系統可回報的事件，並非通用偵測 |
| 11 | 現實下雨 | 新增 Open-Meteo 查詢，需明確同意定位及第三方資料處理 |
| 12 | 環境光 | AmbientLightSensor 支援時可用；iOS 不適用；不使用偷拍來估光 |
| 13 | 動作感測 | DeviceMotion 需主動 ARM；閾值與手機型號需測 |
| 14 | 撞牆場景 | 僅使用安全手部動作回饋，沒有撞擊提示 |
| 15 | 行政區 | 大略座標截斷送 Nominatim 逆地理編碼；服務使用前需確認其使用政策與配額 |
| 16 | 持續聲音 | v1.1 前景 10 秒 RMS 偵測保留 |

**上架阻擋項**：iOS camera/motion/location/notification 功能的 Info.plist、簽署、原生驗收；Android camera/geo/notifications/recording compatibility；法律文件與第三方資料傳輸揭露；裝置中止後相機/光線的釋放測試。

隱私：地理座標會被送至 Open-Meteo/Nominatim（僅玩家確認時），所以不能再宣稱全部資料一律留在裝置。需將這部分加入正式隱私政策與 Data safety／App Privacy 回答。
