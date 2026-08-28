// [ANCHOR: JS-STATE-STORE]
(function() {
  window.STORAGE_KEY_NODES = "SSSTC_08_SFC_NODES_V1";
  window.STORAGE_KEY_COMMENTS = "SSSTC_08_SFC_COMMENTS_V1";
  window.STORAGE_KEY_THEME = "SSSTC_08_THEME";

  window.AppState = {
    nodes: [],
    comments: [],
    selectedNodeId: "feeder",
    currentView: "process", // 'process' | 'data' | 'trace' | 'audit'
    activeSideTab: "detail", // 'detail' | 'comments'
    theme: "dark"
  };

  // 流程拓撲連線定義 (包含資料標籤與追溯鏈)
  window.FLOW_LINKS = [
    { from: "incoming", to: "iqc", label: "來料批次", trace: true, audit: false },
    { from: "iqc", to: "inventory", label: "IQC 判定", trace: true, audit: false },
    { from: "inventory", to: "wo", label: "領料請求", trace: true, audit: false },
    { from: "wo", to: "kitting", label: "工單發料", trace: true, audit: false },
    { from: "kitting", to: "feeder", label: "Reel 綁定", trace: true, audit: true },
    { from: "feeder", to: "solder", label: "線邊確認", trace: true, audit: true },
    { from: "solder", to: "stencil", label: "鋼網在線", trace: true, audit: true },
    { from: "stencil", to: "print", label: "錫膏印刷", trace: true, audit: false },
    { from: "print", to: "spi", label: "3D 錫厚", trace: true, audit: false },
    { from: "spi", to: "mount", label: "SMT 貼片", trace: true, audit: true },
    { from: "mount", to: "reflow", label: "回焊焊接", trace: true, audit: true },
    { from: "reflow", to: "aoi", label: "AOI 檢驗", trace: true, audit: false },
    { from: "aoi", to: "repair", label: "不良維修", trace: false, audit: false },
    { from: "aoi", to: "routing", label: "PCBA 測試", trace: true, audit: false },
    { from: "repair", to: "routing", label: "維修復測", trace: false, audit: false },
    { from: "routing", to: "packing", label: "裝箱封箱", trace: true, audit: true }
  ];

  // 車規級稽核焦點節點對照
  window.AUDIT_NODES = ["feeder", "solder", "stencil", "reflow", "packing"];
})();
