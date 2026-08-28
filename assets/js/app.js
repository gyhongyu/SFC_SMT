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
          onOpenCommentModal: (nodeId) => this.openAddCommentModal(nodeId),
          onEditComment: (commentId) => this.openEditCommentModal(commentId),
          onDeleteComment: (commentId) => this.handleDeleteComment(commentId)
        }
      );
    }

    async init() {
      // 1. 初始化主題與語言
      window.AppState.theme = window.StorageAdapter.getTheme();
      window.AppState.lang = window.i18n.getLang();

      document.documentElement.setAttribute("data-theme", window.AppState.theme);
      this.updateThemeUI(window.AppState.theme);
      this.updateLangUI(window.AppState.lang);

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

      // 語言切換
      const langBtn = document.getElementById("btnLang");
      if (langBtn) {
        langBtn.onclick = () => this.toggleLang();
      }

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
        this.showToast(window.AppState.lang === 'en' ? "Database exported successfully!" : "已成功匯出最新資料庫 JSON！");
      };

      // 匯入 JSON 按鈕與事件
      const importBtn = document.getElementById("btnImport");
      const fileInput = document.getElementById("importFileInput");
      if (importBtn && fileInput) {
        importBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => this.handleImportJSON(e);
      }

      document.getElementById("btnReset").onclick = () => {
        const msg = window.AppState.lang === 'en' ? "Reset to defaults and clear local changes?" : "確定要重置為預設資料並清除本地所有修改嗎？";
        if (confirm(msg)) {
          window.StorageAdapter.resetAll();
          location.reload();
        }
      };

      document.getElementById("btnOpenComment").onclick = () => this.openAddCommentModal();

      // Modal 內部按鈕
      document.getElementById("btnCancelModal").onclick = () => this.closeAddCommentModal();
      document.getElementById("btnSubmitModal").onclick = () => this.submitComment();
    }

    render() {
      this.svgRenderer.render(window.AppState);
      this.sidebarView.render(window.AppState);
      this.updateCommentCount();
      this.updateStaticI18nText();
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
      this.updateViewDescription();
      this.svgRenderer.render(window.AppState);
    }

    updateViewDescription() {
      const isEn = window.AppState.lang === 'en';
      const descMap = {
        process: isEn ? "Process View: SMT main workflow from incoming to packing." : "當前視圖：顯示 SMT 從來料到包裝出貨的主流程。點擊節點可在右側編輯或填寫意見。",
        data: isEn ? "Data Flow View: Data output & ERP/SFC communication." : "當前視圖：資料流視圖，著重於各站數據輸出與 ERP/SFC 交互。",
        trace: isEn ? "Traceability View: Trace back chain (Box → PCBA → Reel Lot → Supplier Lot)." : "當前視圖：追溯鏈視圖 (Box → PCBA → Reel Lot → Supplier Lot)。",
        audit: isEn ? "Audit View: Quality audit focus nodes (53/61 Feeder, 112 Paste, 110 Stencil, 109 Reflow, 39 Packing)." : "當前視圖：車規級稽核焦點視圖 (53/61 飛達, 112 錫膏, 110 鋼網, 109 爐溫, 39 包裝)。"
      };
      document.getElementById("viewDescription").textContent = descMap[window.AppState.currentView] || "";
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
      this.render();
    }

    updateThemeUI(theme) {
      document.getElementById("themeBtn").textContent = theme === "light" ? "☀️" : "🌙";
      const logoImg = document.getElementById("brandLogo");
      if (logoImg) {
        logoImg.src = theme === "light" ? "./assets/img/deepbluelogo_foxlink-m.png" : "./assets/img/wlogo_foxlink_s.png";
      }
    }

    toggleLang() {
      window.AppState.lang = window.AppState.lang === "zh" ? "en" : "zh";
      window.i18n.setLang(window.AppState.lang);
      this.updateLangUI(window.AppState.lang);
      this.render();
      this.showToast(window.AppState.lang === "en" ? "Switched to English" : "已切換為繁體中文");
    }

    updateLangUI(lang) {
      const langBtn = document.getElementById("btnLang");
      if (langBtn) {
        langBtn.textContent = lang === "zh" ? "🌐 繁中" : "🌐 English";
      }
      this.updateStaticI18nText();
    }

    updateStaticI18nText() {
      const isEn = window.AppState.lang === 'en';
      
      // 頂部標題
      const titleEl = document.getElementById("brandTitleText");
      if (titleEl) titleEl.textContent = window.i18n.t("appTitle");
      const tagEl = document.getElementById("brandTagText");
      if (tagEl) tagEl.textContent = window.i18n.t("offlineDb");

      // 畫布統計
      const canvasCount = document.getElementById("totalNodesCanvas");
      if (canvasCount) canvasCount.textContent = window.i18n.t("totalNodes");

      // 抽屜 Tab
      document.getElementById("tabDetailBtn").textContent = window.i18n.t("tabDetail");
      const commentCount = window.AppState.comments.filter(c => c.nodeId === window.AppState.selectedNodeId).length;
      document.getElementById("tabCommentsBtn").innerHTML = `${window.i18n.t("tabComments")} (<span id="commentCount">${commentCount}</span>)`;
      
      // 頂部按鈕
      document.getElementById("btnOpenComment").textContent = window.i18n.t("btnAddComment");
      document.getElementById("btnExport").textContent = window.i18n.t("btnExport");
      document.getElementById("btnImport").textContent = window.i18n.t("btnImport");
      document.getElementById("btnReset").textContent = window.i18n.t("btnReset");

      // 視圖按鈕文字
      const vMap = { process: "viewProcess", data: "viewData", trace: "viewTrace", audit: "viewAudit" };
      document.querySelectorAll(".view-btn").forEach(btn => {
        const v = btn.getAttribute("data-view");
        if (vMap[v]) btn.textContent = window.i18n.t(vMap[v]);
      });

      this.updateViewDescription();
    }

    handleAddItem(nodeId, field) {
      const promptText = window.AppState.lang === 'en' ? `Enter new item for [${field}]:` : `請輸入要新增至 [${field}] 的項目名稱：`;
      const val = prompt(promptText);
      if (!val || !val.trim()) return;
      const node = window.AppState.nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (!node[field]) node[field] = [];
      node[field].push(val.trim());
      window.StorageAdapter.saveNodes(window.AppState.nodes);
      this.sidebarView.render(window.AppState);
      this.showToast(window.AppState.lang === 'en' ? `Item added to ${node.name_en || node.name}` : `已新增項目至 ${node.name}`);
    }

    handleRemoveItem(nodeId, field, index) {
      const node = window.AppState.nodes.find(n => n.id === nodeId);
      if (!node || !node[field]) return;
      node[field].splice(index, 1);
      window.StorageAdapter.saveNodes(window.AppState.nodes);
      this.sidebarView.render(window.AppState);
      this.showToast(window.AppState.lang === 'en' ? "Item removed" : `已移除項目`);
    }

    handleImportJSON(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (importedData.nodes && Array.isArray(importedData.nodes)) {
            window.AppState.nodes = importedData.nodes;
            window.StorageAdapter.saveNodes(importedData.nodes);
          }
          if (importedData.reviewComments && Array.isArray(importedData.reviewComments)) {
            window.AppState.comments = importedData.reviewComments;
            window.StorageAdapter.saveComments(importedData.reviewComments);
          }
          this.render();
          this.showToast(window.AppState.lang === 'en' ? "Database imported successfully!" : "已成功載入外部資料庫 JSON！");
        } catch (err) {
          alert("Import failed: invalid JSON! " + err);
        } finally {
          event.target.value = "";
        }
      };
      reader.readAsText(file, "utf-8");
    }

    openAddCommentModal(preselectNodeId) {
      const isEn = window.AppState.lang === 'en';
      document.getElementById("modalTitle").textContent = isEn ? "➕ Add HQ Review Comment" : "➕ 新增 HQ 審查意見 / 修改建議";
      document.getElementById("modalCommentId").value = "";
      const select = document.getElementById("modalNodeSelect");
      select.innerHTML = window.AppState.nodes.map(n => `<option value="${n.id}" ${n.id === (preselectNodeId || window.AppState.selectedNodeId) ? 'selected' : ''}>${isEn ? (n.name_en || n.name) : n.name} (${n.id})</option>`).join('');
      document.getElementById("modalFieldSelect").value = "validations";
      document.getElementById("modalOriginal").value = "";
      document.getElementById("modalProposed").value = "";
      document.getElementById("modalReviewer").value = "HQ_SFC_Team";
      document.getElementById("btnSubmitModal").textContent = isEn ? "Save (Pending_AI)" : "確認登記 (Pending_AI)";
      document.getElementById("commentModal").style.display = "flex";
    }

    openEditCommentModal(commentId) {
      const comment = window.AppState.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const isEn = window.AppState.lang === 'en';

      document.getElementById("modalTitle").textContent = isEn ? "✏️ Edit Review Comment" : "✏️ 編輯審查意見";
      document.getElementById("modalCommentId").value = comment.commentId;
      const select = document.getElementById("modalNodeSelect");
      select.innerHTML = window.AppState.nodes.map(n => `<option value="${n.id}" ${n.id === comment.nodeId ? 'selected' : ''}>${isEn ? (n.name_en || n.name) : n.name} (${n.id})</option>`).join('');
      document.getElementById("modalFieldSelect").value = comment.targetField || "validations";
      document.getElementById("modalOriginal").value = comment.originalContent || "";
      document.getElementById("modalProposed").value = comment.proposedChange || "";
      document.getElementById("modalReviewer").value = comment.reviewer || "HQ_SFC_Team";
      document.getElementById("btnSubmitModal").textContent = isEn ? "Update Comment" : "儲存修改";
      document.getElementById("commentModal").style.display = "flex";
    }

    closeAddCommentModal() {
      document.getElementById("commentModal").style.display = "none";
    }

    submitComment() {
      const commentId = document.getElementById("modalCommentId").value;
      const nodeId = document.getElementById("modalNodeSelect").value;
      const field = document.getElementById("modalFieldSelect").value;
      const original = document.getElementById("modalOriginal").value.trim();
      const proposed = document.getElementById("modalProposed").value.trim();
      const reviewer = document.getElementById("modalReviewer").value.trim() || "HQ_SFC_Team";

      if (!proposed) {
        alert(window.AppState.lang === 'en' ? "Please enter proposed change description!" : "請填寫具體建議修改內容！");
        return;
      }

      const node = window.AppState.nodes.find(n => n.id === nodeId);
      const nodeName = node ? node.name : nodeId;

      if (commentId) {
        const target = window.AppState.comments.find(c => c.commentId === commentId);
        if (target) {
          target.nodeId = nodeId;
          target.nodeName = nodeName;
          target.targetField = field;
          target.originalContent = original;
          target.proposedChange = proposed;
          target.reviewer = reviewer;
          target.timestamp = new Date().toISOString();
        }
        this.showToast(window.AppState.lang === 'en' ? "Comment updated successfully!" : "審查意見已成功修改！");
      } else {
        const newComment = window.CommentManager.createComment({
          nodeId,
          nodeName,
          targetField: field,
          originalContent: original,
          proposedChange: proposed,
          reviewer
        });
        window.AppState.comments.unshift(newComment);
        this.showToast(window.AppState.lang === 'en' ? "Comment registered (Pending_AI)" : "HQ 審查意見已登記 (Pending_AI)");
      }

      window.StorageAdapter.saveComments(window.AppState.comments);
      this.closeAddCommentModal();
      this.switchSideTab("comments");
      this.render();
    }

    handleDeleteComment(commentId) {
      const confirmMsg = window.AppState.lang === 'en' ? "Are you sure you want to delete this comment?" : "確定要刪除這條審查意見嗎？";
      if (!confirm(confirmMsg)) return;
      const index = window.AppState.comments.findIndex(c => c.commentId === commentId);
      if (index !== -1) {
        window.AppState.comments.splice(index, 1);
        window.StorageAdapter.saveComments(window.AppState.comments);
        this.render();
        this.showToast(window.AppState.lang === 'en' ? "Comment deleted" : "審查意見已刪除");
      }
    }

    updateCommentCount() {
      const currentNodeComments = window.AppState.comments.filter(c => c.nodeId === window.AppState.selectedNodeId);
      const badge = document.getElementById("commentCount");
      if (badge) badge.textContent = currentNodeComments.length;
    }

    showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 2500);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    app.init();
  });
})();
