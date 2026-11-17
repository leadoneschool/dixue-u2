# 圖片與動畫交付紀錄

清單中 100 項已替換，其中 86 項有 SVG（含 HTML 地震報告的震度底圖），14 項以 HTML 呈現。另替換 4 張實際使用、未列入清單的底圖。原始掃描頁保留在 `pages/` 供講義對照。

## 熱點座標

座標以各 SVG 視框的寬高百分比表示。

| 圖 | 標註 | x | y |
|---|---|---:|---:|
| conv-oc | 海洋地殼 | 18 | 52 |
| conv-oc | 海溝 | 37 | 50 |
| conv-oc | 隱沒的板塊 | 45 | 71 |
| conv-oc | 火山 | 52 | 20 |
| conv-oc | 安地斯山脈 | 74 | 17 |
| conv-oc | 大陸地殼 | 76 | 56 |
| conv-oc | 軟流圈 | 23 | 81 |
| fold-main | 背斜 | 30.3 | 32.4 |
| fold-main | 向斜 | 46.4 | 55.7 |
| fold-main | 作用力 | 90.4 | 58.4 |
| fold-main | 岩層連續未斷裂 | 62 | 56 |
| tw-3d | 花東縱谷 | 46 | 39 |
| tw-3d | 中央山脈 | 37 | 35 |
| tw-3d | 歐亞板塊 | 24 | 51 |
| tw-3d | 菲律賓海板塊 | 68 | 59 |
| tw-3d | 琉球海溝 | 70 | 41 |
| tw-3d | 呂宋火山島弧 | 46 | 52 |

地震報告的經緯度、深度、規模及各地震度按鈕，分別定位於對應資料儲存格的 (93%, 50%)。震度分布按鈕在地圖區塊的 (78%, 38%)。因此表格換行或手機改成上下排列時，按鈕仍跟隨同一欄位。清單外的地球構造與地震名詞互動圖，其熱點座標在 `js/app.js` 的 `EARTH_HOT` 和 `QUAKE_HOT`。

## 地圖與實景資料

- 世界地圖海岸線使用 [Natural Earth 1:110m Land](https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/)。地震與火山疊圖採固定時間窗的觀測資料。地震為 USGS ComCat 2000–2019 年規模 6 以上，火山為 NOAA NCEI 1900–2019 年重大噴發地點，兩層採相同地圖投影。[USGS 查詢介面](https://earthquake.usgs.gov/fdsnws/event/1/) · [NOAA NCEI 火山資料](https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/volcanoes)
- 地方震度色帶及 GPS 位移箭頭以講義圖的可辨識輪廓、位置和方位重建。GPS 採代表性站點，無逐站原始座標與速度資料，位置及箭頭長度為圖讀近似。地方震度的邊界也採圖讀近似。
- 原實景素材以原創示意圖重建。玉山題原圖為高度比較圖，保留三次測量的年份及標示數值。漫畫角色重畫，保留原場景、對白含義及題目所需的標號。

## 驗收紀錄

從本機直接開啟 index.html，在 Chromium、Firefox 和 WebKit 分別以 390 px 與 1320 px 逐頁測試。每組均可載入 50 頁、96 題和 90 個 SVG，並啟用 32 個熱點。另在 Chromium 與 WebKit 使用觸控模擬測試熱點及選項圖放大，並驗證動畫暫停、重播、速度控制與換頁取消回呼。實機 iOS Safari 仍待確認。
