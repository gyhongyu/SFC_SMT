// [ANCHOR: JS-APP-ENTRY]
(function() {
  class App {
    constructor() {
      this.svgRenderer = new window.SvgRenderer(
        document.getElementById("sfcSvg"),
        (nodeId) => this.selectNode(nodeId)
      );

      this.sidebarView = new window.SidebarView(
        document.getElementById("sideContent"),
        {
          onAddItem: (nodeId, field) => this.handleAddItem(nodeId, field),
          onRemoveItem: (nodeId, field, index) => this.handleRemoveItem(nodeId, field, index),
          onOpenCommentModal: (nodeId) => this.openAddCommentModal(nodeId)
        }
      );
    }

    async init() {
      // 1. 初始化主題與 Logo
      window.AppState.theme = window.StorageAdapter.getTheme();
      document.documentElement.setAttribute("data-theme", window.AppState.theme);
      this.updateThemeUI(window.AppState.theme);

      // 2. 載入資料
      window.AppState.nodes = await window.StorageAdapter.loadNodes();
      window.AppState.comments = await window.StorageAdapter.loadComments();

      // 3. 綁定全域 UI 事件
      this.bindEvents();

      // 4. 初次渲染
      this.render();
    }

    bindEvents() {
      // 主題切換
      document.getElementById("themeBtn").onclick = () => this.toggleTheme();

      // 視圖切換
      document.querySelectorAll(".view-btn").forEach(btn => {
        btn.onclick = () => this.switchView(btn.getAttribute("data-view"));
      });

      // 側邊欄 Tab 切換
      document.getElementById("tabDetailBtn").onclick = () => this.switchSideTab("detail");
      document.getElementById("tabCommentsBtn").onclick = () => this.switchSideTab("comments");

      // 頂部按鈕
      document.getElementById("btnExport").onclick = () => {
        window.CommentManager.exportDatabase(window.AppState.nodes, window.AppState.comments);
        this.showToast("已成功匯出最新資料庫 JSON！");
      };

      document.getElementById("btnReset").onclick = () => {
        if (confirm("確定要重置為預設資料並清除本地所有修改嗎？")) {
          window.StorageAdapter.resetAll();
          location.reload();
        }
      };

      document.getElementById("btnOpenComment").onclick = () => this.openAddCommentModal();

      // Modal 內部按鈕
      document.getElementById("btnCancelModal").onclick = () => this.closeAddCommentModal();
      document.getElementById("btnSubmitModal").onclick = () => this.submitNewComment();
    }

    render() {
      this.svgRenderer.render(window.AppState);
      this.sidebarView.render(window.AppState);
      this.updateCommentCount();
    }

    selectNode(nodeId) {
      window.AppState.selectedNodeId = nodeId;
      this.render();
    }

    switchView(view) {
      window.AppState.currentView = view;
      document.querySelectorAll(".view-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-view") === view);
      });
      const descMap = {
        process: "當前視圖：顯示 SMT 從來料到包裝出貨的主流程。點擊節點可在右側編輯或填寫意見。",
        data: "當前視圖：資料流視圖，著重於各站數據輸出與 ERP/SFC 交互。",
        trace: "當前視圖：追溯鏈視圖 (Box → PCBA → Reel Lot → Supplier Lot)。",
        audit: "當前視圖：車規級稽核焦點視圖 (53/61 飛達, 112 錫膏, 110 鋼網, 109 爐溫, 39 包裝)。"
      };
      document.getElementById("viewDescription").textContent = descMap[view] || "";
      this.svgRenderer.render(window.AppState);
    }

    switchSideTab(tab) {
      window.AppState.activeSideTab = tab;
      document.getElementById("tabDetailBtn").classList.toggle("active", tab === "detail");
      document.getElementById("tabCommentsBtn").classList.toggle("active", tab === "comments");
      this.sidebarView.render(window.AppState);
    }

    toggleTheme() {
      window.AppState.theme = window.AppState.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", window.AppState.theme);
      window.StorageAdapter.setTheme(window.AppState.theme);
      this.updateThemeUI(window.AppState.theme);
    }

    updateThemeUI(theme) {
      document.getElementById("themeBtn").textContent = theme === "light" ? "☀️" : "🌙";
      const logoImg = document.getElementById("brandLogo");
      if (logoImg) {
        logoImg.src = theme === "light" ? "./assets/img/deepbluelogo_foxlink-m.png" : "./assets/img/wlogo_foxlink_s.png";
      }
    }

    handleAddItem(nodeId, field) {
      const val = prompt(`請輸入要新增至 [${field}] 的項目名稱：`);
      if (!val || !val.trim()) return;
      const node = window.AppState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (!node[field]) node[field] = [];
      node[field].push(val.trim());
      window.StorageAdapter.saveNodes(window.AppState.nodes);
      this.sidebarView.render(window.AppState);
      this.showToast(`已新增項目至 ${node.name}`);
    }

    handleRemoveItem(nodeId, field, index) {
      const node = window.AppState.nodes.find(n => n.id === nodeId);
      if (!node || !node[field]) return;
      node[field].splice(index, 1);
      window.StorageAdapter.saveNodes(window.AppState.nodes);
      this.sidebarView.render(window.AppState);
      this.showToast(`已移除項目`);
    }

    openAddCommentModal(preselectNodeId) {
      const select = document.getElementById("modalNodeSelect");
      select.innerHTML = window.AppState.nodes.map(n => `<option value="${n.id}" ${n.id === (preselectNodeId || window.AppState.selectedNodeId) ? 'selected' : ''}>${n.name} (${n.id})</option>`).join('');
      document.getElementById("commentModal").style.display = "flex";
    }

    closeAddCommentModal() {
      document.getElementById("commentModal").style.display = "none";
    }

    submitNewComment() {
      const nodeId = document.getElementById("modalNodeSelect").value;
      const field = document.getElementById("modalFieldSelect").value;
      const original = document.getElementById("modalOriginal").value.trim();
      const proposed = document.getElementById("modalProposed").value.trim();
      const reviewer = document.getElementById("modalReviewer").value.trim() || "HQ_SFC_Team";

      if (!proposed) {
        alert("請填寫具體建議修改內容！");
        return;
      }

      const node = window.AppState.nodes.find(n => n.id === nodeId);
      const newComment = window.CommentManager.createComment({
        nodeId,
        nodeName: node ? node.name : nodeId,
        targetField: field,
        originalContent: original,
        proposedChange: proposed,
        reviewer
      });

      window.AppState.comments.unshift(newComment);
      window.StorageAdapter.saveComments(window.AppState.comments);
      this.closeAddCommentModal();
      this.switchSideTab("comments");
      this.showToast("HQ 審查意見已登記 (Pending_AI)");
    }

    updateCommentCount() {
      document.getElementById("commentCount").textContent = window.AppState.comments.length;
    }

    showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 2500);
    }
  }

  // 啟動應用
  window.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    app.init();
  });
})();
