# Murmur v1.8.1 擷取事件與通知

- E1 截圖第一次有低頻反應（90 秒冷卻，最多三次）；E3 錄影狀態反應；E4–E5 保留較深的台詞。
- Android 15+：錄影 callback 在註冊時同步初始狀態，因此錄影在進 App 前已開始也能在 E3 反應。每個錄影 session 最多反應一次，直到錄影結束才重設。
- Android 14：無系統原生錄影狀態 API，不能保證偵測錄影；不會偽裝支援。
- 截圖視為事件結束；錄影以錄影結束回呼為準。事件後三分鐘內切到背景，排程一則 30 秒後的本機通知；返回 App 則取消。每次離開至多一則。需先授權通知與擷取事件，且在劇情 App 內。
- 保留原本的離開通知排程邏輯，新增通知使用獨立 ID 731205；可在 [OFF] 一併取消。
- 請先 `npm run build:native && npx cap sync android && python scripts/patch_android.py`，再在 Android Studio 重新編譯。
- iOS 的螢幕錄影狀態回呼是否可用，仍須以 iOS 原生實機驗證；此版主要修正 Android。
