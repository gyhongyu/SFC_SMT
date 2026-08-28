# 📘 08_SFC_SMT 現代化流程評審與 HQ 協同工作台交付手冊 (Handoff)

> 📌 **模組定位**：專門用於與總部 (HQ) SFC 部門進行 SMT 產線全流程節點規格、校驗關卡、防呆異常與追溯鍵定義的**現代化 GitHub Pages 協同工作台**。
> - **線上站點 (CNAME)**: [https://sfc.foxlink.co.in](https://sfc.foxlink.co.in)
> - **獨立遠端倉庫**: [`gyhongyu/SFC_SMT`](https://github.com/gyhongyu/SFC_SMT) (`branch: main`)
> - **主專案主幹倉庫**: [`gyhongyu/WebSheetUI`](https://github.com/gyhongyu/WebSheetUI) (`branch: master`)

---

## 📂 模組標準四件套目錄架構

```
08_SFC_SMT/
├── index.html                  # 現代化單頁 SPA 協同工作台 (純原生 CSS+SVG，零打包編譯)
├── SFC_SMT_Backend.gs          # Google Apps Script 雲端資料庫網關 (支援批次同步與意見閉環)
├── 08_SFC_SMT_HANDOFF.md       # 本交付手冊
├── PRD.md                      # 翔威 Sajet MES Delphi 7 客戶端底層架構需求文檔
├── assets/
│   ├── css/                    # 樣式模組 (main.css, canvas.css, sidebar.css, modal.css)
│   ├── js/                     # 腳本模組 (i18n.js, svg-renderer.js, sidebar-view.js, app.js 等)
│   ├── img/                    # 品牌雙色 Logo (深淺主題切換)
│   └── data/
│       ├── sfc_nodes_master.json    # 16 個核心流程節點標準定義主資料庫
│       └── sfc_review_comments.json # HQ 審查意見結構化台帳 (含 Pending_AI 狀態)
└── _history/                   # 歷史草稿與演進存檔
```

---

## 🌟 已固化核心成果 (Solidified Features v1.0.6)

1. **🌐 100% 純淨雙向多語系切換 (I18N)**：
   - 繁中模式零英文殘留，英文模式零中文殘留。
   - `Reel Lot` 規範映射為 **`卷料批號`**。
   - 包含《車規級術語智慧糾偏矩陣》（自動糾偏 `missing point` ➔ `Non-Conformity (NC)`、`fool proof` ➔ `Poka-Yoke`）。
2. **🔌 四大審查視圖差異化呈現 (4-View Standard)**：
   - **流程視圖**：16 節點 4x4 完美工整網格製造流。
   - **資料流視圖**：點擊節點精準高亮前後關聯之純中文數據膠囊（`來料批次`、`工單派工`、`卷料清單`、`錫厚補償`、`貼片扣料`、`不良代碼`、`維修復測`、`單板序號`），徹底避免擋線。
   - **追溯視圖**：自動淡化非主線節點，高亮 4 級黃金追溯鏈。
   - **稽核視圖**：5 大車規關鍵管制點（53/61飛達, 112錫膏, 110鋼網, 109爐溫, 39包裝）高亮紅色光暈。
3. **📐 第 4 排單向線性拓撲與座標對齊**：
   - `AOI ➔ 維修站 ➔ 分板/測試 ➔ 包裝出貨` 水平齊平對齊 `y: 500`，徹底告別雙線交織與穿透。
4. **📥 / 📤 JSON 本地資料庫匯入/匯出**：
   - 支援跨電腦開會攜帶 `.json` 檔案一鍵匯入與匯出。
5. **✏️ / 🗑️ HQ 審查意見編輯與刪除閉環**：
   - 抽屜支援意見就地修改、刪除、即時保存 LocalStorage。

---

## 🚀 下一個代理人接班任務 (Next Action Items)

1. **實體 32-bit Python FastAPI + SajetConnect.dll 直連 (08-M6)**：
   - 依照 `PRD.md` 規範，建立本機 32-bit Python 橋接服務，呼叫 Sajet 翔威 MES 原生 DLL 進行工單過站與防呆即時比對。
2. **`Pending_AI` 意見自動消化閉環**：
   - 讀取 `sfc_review_comments.json` 中狀態為 `Pending_AI` 的審查意見，自動修改對應節點與代碼，並將狀態標記為 `Implemented`。
3. **DMC 知識治理持續遵守**：
   - 重大修改單向追加至 [`docs/ACTIVE_LOG.md`](file:///e:/Projects/SSSTC%20Audit%20WorkSpace/docs/ACTIVE_LOG.md)，維護 [`docs/STATE.md`](file:///e:/Projects/SSSTC%20Audit%20WorkSpace/docs/STATE.md) ≤200 行紀律。
