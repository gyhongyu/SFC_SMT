// [ANCHOR: JS-I18N-MAP]
(function() {
  const DICT = {
    zh: {
      // 導航與視圖
      "appTitle": "08 SMT SFC 流程協同台",
      "offlineDb": "本地離線資料庫 (Offline DB)",
      "viewProcess": "流程視圖",
      "viewData": "資料流視圖",
      "viewTrace": "追溯視圖",
      "viewAudit": "稽核視圖",
      "btnAddComment": "➕ 新增 HQ 審查意見",
      "btnExport": "📥 匯出資料庫 JSON",
      "btnImport": "📤 匯入 JSON",
      "btnReset": "🔄 重置預設",
      "totalNodes": "總節點數: 16",
      "tabDetail": "節點規格定義",
      "tabComments": "HQ 審查意見",
      
      // 區塊標題
      "secValidations": "🛡️ 校驗關卡 (Validations)",
      "secExceptions": "⚠️ 防呆異常與處置 (Exceptions)",
      "secInputs": "📥 輸入參數 (Inputs)",
      "secOutputs": "📤 輸出數據 (Outputs)",
      "secTraceKeys": "🔑 追溯鍵 (TraceKeys)",
      
      // 16 個節點名稱
      "來料": "來料",
      "IQC": "IQC",
      "入庫": "入庫",
      "工單": "工單",
      "備料": "備料",
      "飛達確認": "飛達確認",
      "錫膏管制": "錫膏管制",
      "鋼網確認": "鋼網確認",
      "錫膏印刷": "錫膏印刷",
      "SPI 檢測": "SPI 檢測",
      "SMT 貼片": "SMT 貼片",
      "回焊爐": "回焊爐",
      "AOI 檢測": "AOI 檢測",
      "維修站": "維修站",
      "分板 / 測試": "分板 / 測試",
      "包裝出貨": "包裝出貨",

      // 連線標籤
      "來料檢驗": "來料檢驗",
      "合格入庫": "合格入庫",
      "工單配料": "工單配料",
      "工單發料": "工單發料",
      "飛達上料": "飛達上料",
      "Reel 綁定": "Reel 綁定",
      "線邊確認": "線邊確認",
      "線邊管控": "線邊管控",
      "鋼網在線": "鋼網在線",
      "3D 錫厚檢測": "3D 錫厚檢測",
      "3D 錫厚": "3D 錫厚",
      "SMT 貼片扣料": "SMT 貼片扣料",
      "回焊爐焊接": "回焊爐焊接",
      "回焊焊接": "回焊焊接",
      "光學檢驗": "光學檢驗",
      "AOI 檢驗": "AOI 檢驗",
      "不良維修": "不良維修",
      "單板切割/測試": "單板切割/測試",
      "PCBA 測試": "PCBA 測試",
      "維修復測": "維修復測",
      "裝箱封箱": "裝箱封箱"
    },

    en: {
      // 導航與視圖
      "appTitle": "08 SMT SFC Workflow Collaboration",
      "offlineDb": "Local Offline DB",
      "viewProcess": "Process View",
      "viewData": "Data Flow View",
      "viewTrace": "Traceability View",
      "viewAudit": "Audit View",
      "btnAddComment": "➕ Add HQ Comment",
      "btnExport": "📥 Export JSON",
      "btnImport": "📤 Import JSON",
      "btnReset": "🔄 Reset",
      "totalNodes": "Total Nodes: 16",
      "tabDetail": "Node Specification",
      "tabComments": "HQ Review Comments",

      // 區塊標題
      "secValidations": "🛡️ Validations",
      "secExceptions": "⚠️ Exceptions & Controls",
      "secInputs": "📥 Inputs",
      "secOutputs": "📤 Outputs",
      "secTraceKeys": "🔑 Trace Keys",

      // 16 個節點名稱
      "來料": "Incoming",
      "IQC": "IQC",
      "入庫": "Inventory",
      "工單": "Work Order",
      "備料": "Kitting",
      "飛達確認": "Feeder",
      "錫膏管制": "Paste Control",
      "鋼網確認": "Stencil",
      "錫膏印刷": "Printing",
      "SPI 檢測": "3D SPI",
      "SMT 貼片": "Pick & Place",
      "回焊爐": "Reflow Oven",
      "AOI 檢測": "AOI Check",
      "維修站": "Repair Station",
      "分板 / 測試": "Router & Test",
      "包裝出貨": "Packing & Outgoing",

      // 連線標籤
      "來料檢驗": "Incoming Inspection",
      "合格入庫": "Warehouse In",
      "工單配料": "Kitting Request",
      "工單發料": "WO Issue",
      "飛達上料": "Feeder Setup",
      "Reel 綁定": "Reel Binding",
      "線邊確認": "Line-side Check",
      "線邊管控": "Line Control",
      "鋼網在線": "Stencil Online",
      "3D 錫厚檢測": "3D SPI Check",
      "3D 錫厚": "3D SPI Thickness",
      "SMT 貼片扣料": "Placement Deduct",
      "回焊爐焊接": "Reflow Soldering",
      "回焊焊接": "Reflow Soldering",
      "光學檢驗": "AOI Inspection",
      "AOI 檢驗": "AOI Inspection",
      "不良維修": "Defect Repair",
      "單板切割/測試": "Routing & Test",
      "PCBA 測試": "PCBA Test",
      "維修復測": "Retest After Repair",
      "裝箱封箱": "Box Packing"
    }
  };

  class I18nManager {
    static t(key, defaultVal = null) {
      const lang = window.AppState ? (window.AppState.lang || "zh") : "zh";
      if (DICT[lang] && DICT[lang][key] !== undefined) {
        return DICT[lang][key];
      }
      return defaultVal !== null ? defaultVal : key;
    }

    static getLang() {
      return localStorage.getItem("SSSTC_08_LANG") || "zh";
    }

    static setLang(lang) {
      localStorage.setItem("SSSTC_08_LANG", lang);
    }
  }

  window.i18n = I18nManager;
})();
