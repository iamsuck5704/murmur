# Murmur v1.8.2：國際行政區定位

- E5 定位演出使用 Nominatim 反向地理編碼的 `address.country_code` 決定優先欄位。
- 臺灣優先「縣市＋區」；日本支援東京都特別區；其他國家優先「城市＋當地區域」。
- 無區域資料時退回城市、州或國家；不將門牌、街道、郵遞區號顯示為行政區，也不虛構地名。
- 保留每次劇情的額外確認、座標小數點後兩位傳給 Nominatim、無儲存座標、拒絕不影響通關。
- `www/preview-standalone.html` 的預覽效果同步改善一般國際地址欄位選取。
- Nominatim 的地名和翻譯品質因國家、地區及地圖資料而異，不能保證每處都有「區」級資料。

## 更新
將覆蓋包內的 `www/`、`package.json`、`release/` 覆蓋到 `D:\murmur`，然後執行：

```powershell
npm run build:native
npx cap sync android
python scripts/patch_android.py
npx cap open android
```

在 Android Studio 重新建置。iOS 使用原有 GitHub Actions 建置流程。
