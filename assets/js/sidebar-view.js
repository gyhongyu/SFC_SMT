// [ANCHOR: JS-SIDEBAR-VIEW]
(function() {
  class SidebarView {
    constructor(containerElement, callbacks) {
      this.container = containerElement;
      this.callbacks = callbacks; // { onAddItem, onRemoveItem, onOpenCommentModal }
    }

    render(state) {
      const node = state.nodes.find(n => n.id === state.selectedNodeId);
      if (!node) {
        this.container.innerHTML = "<div style='color:var(--text-muted); padding:20px;'>請選擇左側流程圖中的一個節點。</div>";
        return;
      }

      if (state.activeSideTab === "detail") {
        this.renderDetailTab(node);
      } else {
        this.renderCommentsTab(node, state.comments);
      }
    }

    renderDetailTab(node) {
      this.container.innerHTML = `
        <div>
          <h2 style="font-size:18px; font-weight:800; margin-bottom:4px;">${node.name} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">(${node.name_en || ''})</span></h2>
          <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">${node.desc || ''}</p>
        </div>

        <!-- 校驗關卡 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>🛡️ 校驗關卡 (Validations)</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="validations">+ 新增</button>
          </div>
          <div class="tag-group">
            ${(node.validations || []).map((v, i) => `
              <span class="chip-tag edit-mode">
                ${v}
                <span class="del-btn" data-action="del" data-field="validations" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 防呆異常與處置 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>⚠️ 防呆異常與處置 (Exceptions)</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="exceptions">+ 新增</button>
          </div>
          <div class="tag-group">
            ${(node.exceptions || []).map((ex, i) => `
              <span class="chip-tag edit-mode" style="background:#ef444422; border-color:#ef4444; color:#fca5a5;">
                ${ex}
                <span class="del-btn" data-action="del" data-field="exceptions" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 輸入參數 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>📥 輸入參數 (Inputs)</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="inputs">+ 新增</button>
          </div>
          <div class="tag-group">
            ${(node.inputs || []).map((inp, i) => `
              <span class="chip-tag edit-mode">
                ${inp}
                <span class="del-btn" data-action="del" data-field="inputs" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 輸出數據 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>📤 輸出數據 (Outputs)</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="outputs">+ 新增</button>
          </div>
          <div class="tag-group">
            ${(node.outputs || []).map((out, i) => `
              <span class="chip-tag edit-mode">
                ${out}
                <span class="del-btn" data-action="del" data-field="outputs" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- 追溯鍵 -->
        <div class="card-section">
          <div class="card-section-title">
            <span>🔑 追溯鍵 (TraceKeys)</span>
            <button class="btn-icon" style="padding:2px 6px; font-size:10px;" data-action="add" data-field="traceKeys">+ 新增</button>
          </div>
          <div class="tag-group">
            ${(node.traceKeys || []).map((tk, i) => `
              <span class="chip-tag edit-mode" style="background:#3b82f622; border-color:#3b82f6; color:#93c5fd;">
                ${tk}
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

    renderCommentsTab(node, comments) {
      const nodeComments = comments.filter(c => c.nodeId === node.id);
      this.container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:14px;">與 HQ 審查意見 (${node.name})</h3>
          <button class="btn-icon btn-accent" style="padding:4px 8px; font-size:11px;" id="btnAddNodeComment">+ 新增意見</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
          ${nodeComments.length === 0 ? `<div style="color:var(--text-muted); font-size:12px; padding:16px 0;">目前尚無此節點的審查意見。</div>` : ''}
          ${nodeComments.map(c => `
            <div class="comment-card ${c.status === 'Pending_AI' ? 'pending' : 'done'}">
              <div class="comment-header">
                <span>${c.reviewer} · ${c.targetField}</span>
                <span class="comment-badge ${c.status === 'Implemented' ? 'implemented' : ''}">${c.status}</span>
              </div>
              <div class="comment-body">
                ${c.proposedChange}
              </div>
              ${c.originalContent ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">原內容: ${c.originalContent}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;

      const addBtn = this.container.querySelector('#btnAddNodeComment');
      if (addBtn) {
        addBtn.onclick = () => this.callbacks.onOpenCommentModal(node.id);
      }
    }
  }

  window.SidebarView = SidebarView;
})();
