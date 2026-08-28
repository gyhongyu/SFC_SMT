# 🏢 SSSTC 08_SFC_SMT 現代化流程評審與 HQ 協同工作台

> 📌 **本專案為 GitHub Pages 靜態單頁應用 (SPA) + 本地離線優先 (Local JSON DB) + Google Sheets (雲端 SSOT) 現代化工程架構。**
> 專門用於與總部 (HQ) SFC 部門進行 SMT 產線全流程節點規格、校驗關卡、防呆異常與追溯鍵評審，並支援 AI 代理人自動化修改閉環 (`Pending_AI`)。

---

## 📂 標準工程目錄架構

```
08_SFC_SMT/
├── index.html                      # 語意化入口 HTML (零內嵌雜訊，原生 ES Modules)
├── README.md                       # 模組工程規範與說明
├── 08_SFC_SMT_HANDOFF.md           # 交付與維護手冊
├── PRD.md                          # 翔威 Sajet MES Delphi 7 客戶端底層需求
├── SFC_SMT_Backend.gs              # Google Apps Script 雲端資料庫網關
├── assets/
│   ├── img/
│   │   ├── wlogo_foxlink_s.png     # 深色主題專用 Logo (全白)
│   │   └── deepbluelogo_foxlink-m.png # 淺色主題專用 Logo (深藍)
│   ├── css/
│   │   ├── main.css                # 全域變數、CSS Reset、NavBar、Layout 與主題切換
│   │   ├── canvas.css              # SVG 畫布、節點 Box、連線與視圖過濾高亮
│   │   ├── sidebar.css             # 側邊互動抽屜、Tab、標籤群組 (Chips) 與審查意見卡片
│   │   └── modal.css               # 彈窗 (Modal)、Toast 提示與微動畫
│   ├── js/
│   │   ├── app.js                  # 應用主入口 (Initialization & Event Listeners)
│   │   ├── state.js                # 全域狀態管理中心 (Single Source of Truth)
│   │   ├── svg-renderer.js         # SVG 流程圖繪製引擎 (節點/連線/4種視圖切換)
│   │   ├── sidebar-view.js         # 右側抽屜與節點規格增修 DOM 渲染
│   │   ├── comment-manager.js      # HQ 審查意見登記 (Pending_AI) 與匯出
│   │   └── storage-adapter.js      # 本地快取 (LocalStorage) / 本地 JSON 載入配接器
│   └── data/
│       ├── sfc_nodes_master.json   # 16 個核心 SMT 流程節點標準定義
│       └── sfc_review_comments.json# 審查意見台帳範例 (Pending_AI)
└── _history/                       # 歷史草稿與演進存檔
```

---

## 🎨 主題與 Logo 切換規範
- **深色主題 (Dark Theme, 預設)**：採用 `--bg-main: #0f172a` 車規級深色風格，頂部導航列顯示 `assets/img/wlogo_foxlink_s.png`。
- **淺色主題 (Light Theme)**：採用 `--bg-main: #f8fafc` 清爽風格，頂部導航列動態切換顯示 `assets/img/deepbluelogo_foxlink-m.png`。

---

## 🛠️ 技術棧與架構原則
1. **零編譯依賴 (No Build Step)**：採用原生 HTML5 + Vanilla CSS + 原生 ES Modules (`type="module"`)，可直接於本機雙擊開啟或託管於 GitHub Pages。
2. **零外部 CDN 依賴 (Air-gapped Safe)**：所有圖示採用內嵌 SVG，完全不依賴外網 CDN，離線或公司受控內網環境中 100% 穩定秒開。
3. **資料雙軌與 AI 閉環**：
   - 會議期間即時儲存於 `localStorage`，支援「📥 匯出資料庫 JSON」。
   - 審查意見標註為 `Pending_AI`，可直接交由 AI 代理人自動化消化並更新前端代碼。
