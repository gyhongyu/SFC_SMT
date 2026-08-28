# 📘 08_SFC_SMT 現代化流程評審與 HQ 協同工作台交付手冊

> 📌 **本模組定位**：專門用於與總部 (HQ) SFC 部門進行 SMT 產線全流程節點規格、校驗關卡、防呆異常與追溯鍵定義的**現代化 GitHub Pages 協同工作台**。
> 支援「本地離線優先 ➔ 結構化意見收集 (Pending_AI) ➔ 一鍵雲端化 (Google Sheets) ➔ AI 代理自動迭代」閉環。

---

## 📂 模組標準四件套目錄架構

```
08_SFC_SMT/
├── index.html                  # 現代化單頁 SPA 協同工作台 (純原生 CSS+SVG，零 CDN 依賴)
├── SFC_SMT_Backend.gs          # Google Apps Script 雲端資料庫網關 (支援批次同步與意見閉環)
├── 08_SFC_SMT_HANDOFF.md       # 本交付手冊
├── PRD.md                      # 翔威 Sajet MES Delphi 7 客戶端底層架構需求文檔
├── data/
│   ├── sfc_nodes_master.json   # 16 個核心流程節點標準定義主資料庫
│   └── sfc_review_comments.json# HQ 審查意見結構化台帳 (含 Pending_AI 狀態)
└── _history/                   # 歷史草稿與演進存檔
```

---

## 🚀 快速上手與操作指南

### 1. 本地直接開會使用 (無需聯網 / 零 GAS 調用)
- 雙擊開啟 `08_SFC_SMT/index.html`。
- 點擊左側流程圖上的任意節點（如「飛達確認」、「錫膏管制」）。
- 在右側抽屜中：
  - 可直接點擊 **「+ 新增」** 或 **「× 刪除」** 修改校驗關卡、防呆異常、輸入參數、輸出數據、追溯鍵。
  - 切換至 **「HQ 審查意見」** 分頁，或點擊頂部 **「➕ 新增 HQ 審查意見」**，登記開會決議與修改意見。
- 所有變更即時持久化於瀏覽器 `localStorage`。
- 開會結束後，點擊頂部 **「📥 匯出資料庫 JSON」** 即可一鍵下載最新審查結果檔案。

### 2. 未來一鍵轉入 Google Sheets 雲端資料庫
1. 在目標 Google Sheet 中開啟「擴充功能 ➔ Apps Script」。
2. 複製 `SFC_SMT_Backend.gs` 貼入並點擊「部署為網路應用程式 (Web App)」，存取權限設為「任何人 (Anyone)」。
3. 透過 `action: "batchSyncNodes"` 將 `sfc_nodes_master.json` 上傳，即刻完成線上 SSOT 資料庫建置。

### 3. AI 代理人自動修改閉環 (Pending_AI Consumption)
當與 HQ 開會登記了多條審查意見後，您只需對 AI 代理人下達指令：
> *「請讀取 08_SFC_SMT 的審查意見中所有 `Pending_AI` 的項目，自動修改對應節點與代碼，並將狀態標記為 Implemented。」*

AI 將自動解析結構化欄位並批量完成代碼迭代。

---

## 🛡️ 架構決策與歷史活頁
- 詳細架構決策請參閱：[`docs/adr/ADR-002-sfc-offline-first-hybrid.md`](../docs/adr/ADR-002-sfc-offline-first-hybrid.md)。
- 專案全局任務鏈請參閱：[`docs/STATE.md`](../docs/STATE.md)。
