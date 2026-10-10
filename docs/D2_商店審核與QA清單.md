# Murmur D2 / D5 上架前驗收清單

## 資料、隱私與權限
- [ ] 填寫真實開發者名稱、聯絡方式、生效日期，公開可直接開啟的 privacy / terms / disclaimer URL
- [ ] 逐項核對 Android Manifest / iOS Info.plist 與遊戲內權限用途，無用權限刪除
- [ ] 拒絕相機、麥克風、定位、通知、動作權限後仍可通關
- [ ] 權限撤回、切背景、實況模式會停止所有對應感測與劇情反應
- [ ] Nominatim / Open-Meteo 網路封包、傳送座標精度與隱私揭露一致；確認第三方服務使用條款、速率限制
- [ ] 截圖/錄影事件不讀取擷取內容；Android API 34/35 與 iOS 分別測試
- [ ] Google Play Data safety / Apple App Privacy 按實際 SDK、資料傳送與存放填寫

## 劇情與安全
- [ ] P1 → P2 → 授權碼 → App P3 → E1～E5 → 結局全流程實機通關
- [ ] 重新安裝、清除存檔、舊版升級、錯誤授權碼、斷網、重啟、旋轉、低記憶體測試
- [ ] 所有驚嚇效果可關閉、尊重 Reduce Motion，沒有不可預期高頻閃光
- [ ] 手機撞頭/牆等互動改為安全替代動作或畫面操作，不強迫實體撞擊
- [ ] 心理暴力、死亡、自傷、性暴力等實際出現內容列入分級問卷與警示
- [ ] 不將劇情台詞偽裝成真實系統警報或聲稱 App 正在監控玩家

## 建置與發布
- [ ] `package-lock.json` 已提交，GitHub Actions Android / iOS 工作流程成功
- [ ] Android debug APK 實機啟動、正式簽署 AAB 可驗證、Play Console 接受
- [ ] iOS 模擬器編譯、真機簽章、TestFlight 測試、App Store Connect 接受
- [ ] Bundle ID / App ID / versionCode / CFBundleVersion / App 圖示 / 啟動畫面核對
- [ ] Google Play / App Store 商店頁面截圖與敘述為真，沒有宣稱未驗證的功能
- [ ] `www/store-links.js` 只有在商店頁實際可訪問時才填網址
- [ ] Cloudflare 僅含 P1/P2，不洩漏 P3 原生檔案或隱藏劇情

**此清單的方框不代表通過；需在相應設備和 Console 逐項記錄測試結果。**
