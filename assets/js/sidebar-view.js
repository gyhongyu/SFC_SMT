// [ANCHOR: JS-SIDEBAR-VIEW]
(function() {
  class SidebarView {
    constructor(containerElement, callbacks) {
      this.container = containerElement;
      this.callbacks = callbacks; // { onAddItem, onRemoveItem, onOpenCommentModal, onEditComment, onDeleteComment }
    }

    render(state) {
      const node = state.nodes.find(n => n.id === state.selectedNodeId);
      if (!node) {
        this.container.innerHTML = `<div style='color:var(--text-muted); padding:20px;'>${state.lang === 'en' ? 'Please select a node on the left.' : '請選擇左側流程圖中的一個節點。'}</div>`;
        return;
      }

      if (state.activeSideTab === "detail") {
        this.renderDetailTab(node, state.lang);
      } else {
        this.renderCommentsTab(node, state.comments, state.lang);
      }
    }

    renderDetailTab(node, lang) {
      const isEn = lang === "en";
      const titleName = isEn ? (node.name_en || window.i18n.t(node.name)) : node.name;
      const descText = isEn ? window.i18n.t(node.desc) : node.desc;
      const addBtnText = isEn ? "+ Add" : "+ 新增";

      this.container.innerHTML = `
        <div>
          <h2 style="font-size:18px; font-weight:800; margin-bottom:6px;">${titleName}</h2>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">${descText || ''}</p>
        </div>

        <!-- 交互系統與通訊協議 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secSystems")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="systems">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.systems || []).map((sys, i) => `
              <span class="chip-tag edit-mode" style="background:#8b5cf622; border-color:#8b5cf6; color:#c4b5fd;">
                ${window.i18n.t(sys)}
                <span class="del-btn" data-action="del" data-field="systems" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 校驗關卡 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secValidations")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="validations">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.validations || []).map((v, i) => `
              <span class="chip-tag edit-mode">
                ${window.i18n.t(v)}
                <span class="del-btn" data-action="del" data-field="validations" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 防呆異常與處置 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secExceptions")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="exceptions">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.exceptions || []).map((ex, i) => `
              <span class="chip-tag edit-mode" style="background:#ef444422; border-color:#ef4444; color:#fca5a5;">
                ${window.i18n.t(ex)}
                <span class="del-btn" data-action="del" data-field="exceptions" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 輸入參數 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secInputs")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="inputs">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.inputs || []).map((inp, i) => `
              <span class="chip-tag edit-mode">
                ${window.i18n.t(inp)}
                <span class="del-btn" data-action="del" data-field="inputs" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 輸出數據 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secOutputs")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="outputs">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.outputs || []).map((out, i) => `
              <span class="chip-tag edit-mode">
                ${window.i18n.t(out)}
                <span class="del-btn" data-action="del" data-field="outputs" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 追溯鍵 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>${window.i18n.t("secTraceKeys")}</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="traceKeys">${addBtnText}</button>
          </div>
          <div class="tag-group">
            ${(node.traceKeys || []).map((tk, i) => `
              <span class="chip-tag edit-mode" style="background:#3b82f622; border-color:#3b82f6; color:#93c5fd;">
                ${window.i18n.t(tk)}
                <span class="del-btn" data-action="del" data-field="traceKeys" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>
      `;

      // 綁定事件代理
      this.container.querySelectorAll('[data-action="add"]').forEach(btn => {
        btn.onclick = () => this.callbacks.onAddItem(node.id, btn.getAttribute('data-field'));
      });
      this.container.querySelectorAll('[data-action="del"]').forEach(btn => {
        btn.onclick = () => this.callbacks.onRemoveItem(node.id, btn.getAttribute('data-field'), parseInt(btn.getAttribute('data-index'), 10));
      });
    }

    renderCommentsTab(node, comments, lang) {
      const isEn = lang === "en";
      const nodeComments = comments.filter(c => c.nodeId === node.id);
      const totalCommentsCount = comments.length;
      const titleNodeName = isEn ? (node.name_en || window.i18n.t(node.name)) : node.name;
      const subtitleText = isEn 
        ? `Node comments: ${nodeComments.length} · Total: ${totalCommentsCount}`
        : `本節點 ${nodeComments.length} 筆 · 全局共 ${totalCommentsCount} 筆`;
      const noCommentText = isEn 
        ? `No review comments recorded for [${titleNodeName}].`
        : `目前 [${node.name}] 尚無專屬審查意見。`;
      const addBtnText = isEn ? "+ Add Comment" : "+ 新增意見";

      this.container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:14px; font-weight:700;">${isEn ? 'HQ Review Comments' : '與 HQ 審查意見'} (${titleNodeName})</h3>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${subtitleText}</div>
          </div>
          <button class="btn-icon btn-accent" style="padding:4px 8px; font-size:11px;" id="btnAddNodeComment">${addBtnText}</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
          ${nodeComments.length === 0 ? `<div style="color:var(--text-muted); font-size:12px; padding:16px 0;">${noCommentText}</div>` : ''}
          ${nodeComments.map(c => `
            <div class="comment-card ${c.status === 'Pending_AI' ? 'pending' : 'done'}">
              <div class="comment-header">
                <span>${c.reviewer} · ${c.targetField}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="comment-badge ${c.status === 'Implemented' ? 'implemented' : ''}">${c.status}</span>
                  <button class="comment-action-btn" title="${isEn ? 'Edit' : '編輯意見'}" data-action="edit-comment" data-cid="${c.commentId}">✏️</button>
                  <button class="comment-action-btn del" title="${isEn ? 'Delete' : '刪除意見'}" data-action="del-comment" data-cid="${c.commentId}">🗑️</button>
                </div>
              </div>
              <div class="comment-body">
                ${c.proposedChange}
              </div>
              ${c.originalContent ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${isEn ? 'Original: ' : '原內容: '}${c.originalContent}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;

      const addBtn = this.container.querySelector('#btnAddNodeComment');
      if (addBtn) {
        addBtn.onclick = () => this.callbacks.onOpenCommentModal(node.id);
      }

      // 綁定意見編輯與刪除按鈕
      this.container.querySelectorAll('[data-action="edit-comment"]').forEach(btn => {
        btn.onclick = () => this.callbacks.onEditComment(btn.getAttribute('data-cid'));
      });
      this.container.querySelectorAll('[data-action="del-comment"]').forEach(btn => {
        btn.onclick = () => this.callbacks.onDeleteComment(btn.getAttribute('data-cid'));
      });
    }
  }

  window.SidebarView = SidebarView;
})();
