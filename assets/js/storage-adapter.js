// [ANCHOR: JS-STORAGE-ADAPTER]
(function() {
  window.STORAGE_KEY_THEME = "SSSTC_08_THEME";
  window.STORAGE_KEY_NODES = "SSSTC_08_NODES_V3";
  window.STORAGE_KEY_COMMENTS = "SSSTC_08_COMMENTS_V3";
  window.STORAGE_KEY_GAS_URL = "SSSTC_08_GAS_URL";

  // 預設綁定用戶的專屬 GAS WebApp 網址
  const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbxgTNHLrYWs8vaLgUzSUW27mG6tY5LXjcWKi6ijMJL1Xv-ycQuekhkzIlr4OznJKyfz/exec";

  class StorageAdapter {
    static getGasUrl() {
      return localStorage.getItem(window.STORAGE_KEY_GAS_URL) || DEFAULT_GAS_URL;
    }

    static setGasUrl(url) {
      localStorage.setItem(window.STORAGE_KEY_GAS_URL, url);
      window.GAS_DATABASE_URL = url;
    }

    static getTheme() {
      return localStorage.getItem(window.STORAGE_KEY_THEME) || "dark";
    }

    static setTheme(theme) {
      localStorage.setItem(window.STORAGE_KEY_THEME, theme);
    }

    static async loadNodes() {
      const cached = localStorage.getItem(window.STORAGE_KEY_NODES);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // 背景嘗試自 Google Sheets 靜默增量拉取
          this.fetchCloudNodesSilently();
          return parsed;
        } catch (e) {
          console.warn("快取節點解析失敗，重新讀取資料", e);
        }
      }

      // 優先嘗試自 GAS 萬能網關讀取
      try {
        const cloudNodes = await this.fetchCloudNodes();
        if (cloudNodes && cloudNodes.length > 0) {
          this.saveNodes(cloudNodes, false);
          return cloudNodes;
        }
      } catch (err) {
        console.warn("從 GAS 雲端拉取節點失敗，降級嘗試本機 JSON", err);
      }

      // 降級嘗試 fetch 本機 JSON
      try {
        const res = await fetch('./assets/data/sfc_nodes_master.json');
        if (res.ok) {
          const data = await res.json();
          this.saveNodes(data, false);
          return data;
        }
      } catch (e) {
        console.warn("fetch 失敗 (可能是 file:// 協議)，降級使用 DEFAULT_SFC_NODES");
      }

      // Fallback 內嵌資料
      const fallback = window.DEFAULT_SFC_NODES || [];
      this.saveNodes(fallback, false);
      return fallback;
    }

    static async fetchCloudNodes() {
      const gasUrl = this.getGasUrl();
      if (!gasUrl) return null;
      const resp = await fetch(`${gasUrl}?action=list&sheet_name=SFC_Nodes_Master`);
      const res = await resp.json();
      if (res && res.status === "success" && Array.isArray(res.data)) {
        return res.data.map(r => ({
          id: r.ID,
          name: r.Name_ZH,
          name_en: r.Name_EN || "",
          group: r.Group || "process",
          type: r.Type || "",
          label: r.Label || "",
          desc: r.Description || "",
          systems: r.Systems_JSON ? JSON.parse(r.Systems_JSON) : [],
          inputs: r.Inputs_JSON ? JSON.parse(r.Inputs_JSON) : [],
          validations: r.Validations_JSON ? JSON.parse(r.Validations_JSON) : [],
          outputs: r.Outputs_JSON ? JSON.parse(r.Outputs_JSON) : [],
          exceptions: r.Exceptions_JSON ? JSON.parse(r.Exceptions_JSON) : [],
          traceKeys: r.TraceKeys_JSON ? JSON.parse(r.TraceKeys_JSON) : [],
          auditRefs: r.AuditRefs_JSON ? JSON.parse(r.AuditRefs_JSON) : [],
          x: Number(r.X || 70),
          y: Number(r.Y || 80),
          w: Number(r.W || 170),
          h: Number(r.H || 76)
        }));
      }
      return null;
    }

    static async fetchCloudNodesSilently() {
      try {
        const cloudNodes = await this.fetchCloudNodes();
        if (cloudNodes && cloudNodes.length > 0) {
          this.saveNodes(cloudNodes, false);
        }
      } catch (e) {
        console.log("[StorageAdapter] 靜默同步節點稍後重試");
      }
    }

    static saveNodes(nodes, syncToCloud = true) {
      localStorage.setItem(window.STORAGE_KEY_NODES, JSON.stringify(nodes));
    }

    static syncNodeToCloud(node) {
      if (!window.SyncQueueEngine) return;
      window.SyncQueueEngine.enqueue({
        desc: `更新節點 ${node.name} (${node.id})`,
        payload: {
          action: "update",
          sheet_name: "SFC_Nodes_Master",
          primary_key_header: "ID",
          ID: node.id,
          Name_ZH: node.name,
          Name_EN: node.name_en || "",
          Group: node.group || "",
          Type: node.type || "",
          Label: node.label || "",
          Description: node.desc || "",
          Systems_JSON: JSON.stringify(node.systems || []),
          Inputs_JSON: JSON.stringify(node.inputs || []),
          Validations_JSON: JSON.stringify(node.validations || []),
          Outputs_JSON: JSON.stringify(node.outputs || []),
          Exceptions_JSON: JSON.stringify(node.exceptions || []),
          TraceKeys_JSON: JSON.stringify(node.traceKeys || []),
          AuditRefs_JSON: JSON.stringify(node.auditRefs || []),
          X: node.x || 0,
          Y: node.y || 0,
          W: node.w || 170,
          H: node.h || 76
        }
      });
    }

    static async loadComments() {
      const cached = localStorage.getItem(window.STORAGE_KEY_COMMENTS);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          this.fetchCloudCommentsSilently();
          return parsed;
        } catch (e) {
          console.warn("快取意見解析失敗，重新讀取資料", e);
        }
      }

      try {
        const cloudComments = await this.fetchCloudComments();
        if (cloudComments && Array.isArray(cloudComments)) {
          this.saveComments(cloudComments, false);
          return cloudComments;
        }
      } catch (err) {
        console.warn("從 GAS 雲端拉取意見失敗，降級使用本地 JSON", err);
      }

      try {
        const res = await fetch('./assets/data/sfc_review_comments.json');
        if (res.ok) {
          const data = await res.json();
          this.saveComments(data, false);
          return data;
        }
      } catch (e) {
        console.warn("fetch comments 失敗，降級使用 DEFAULT_SFC_COMMENTS");
      }

      const fallback = window.DEFAULT_SFC_COMMENTS || [];
      this.saveComments(fallback, false);
      return fallback;
    }

    static async fetchCloudComments() {
      const gasUrl = this.getGasUrl();
      if (!gasUrl) return null;
      const resp = await fetch(`${gasUrl}?action=list&sheet_name=SFC_Review_Comments`);
      const res = await resp.json();
      if (res && res.status === "success" && Array.isArray(res.data)) {
        return res.data.map(r => ({
          commentId: r.Comment_ID,
          nodeId: r.Node_ID,
          nodeName: r.Node_Name,
          targetField: r.Target_Field,
          originalContent: r.Original_Content || "",
          proposedChange: r.Proposed_Change || "",
          reviewer: r.Reviewer || "HQ_SFC_Team",
          status: r.Status || "Pending_AI",
          timestamp: r.Timestamp || "",
          aiCommitLog: r.AI_Commit_Log || ""
        }));
      }
      return null;
    }

    static async fetchCloudCommentsSilently() {
      try {
        const cloudComments = await this.fetchCloudComments();
        if (cloudComments && Array.isArray(cloudComments)) {
          this.saveComments(cloudComments, false);
        }
      } catch (e) {
        console.log("[StorageAdapter] 靜默同步意見稍後重試");
      }
    }

    static saveComments(comments, syncToCloud = false) {
      localStorage.setItem(window.STORAGE_KEY_COMMENTS, JSON.stringify(comments));
    }

    static appendCommentToCloud(comment) {
      if (!window.SyncQueueEngine) return;
      window.SyncQueueEngine.enqueue({
        desc: `新增審查意見 ${comment.commentId}`,
        payload: {
          action: "append",
          sheet_name: "SFC_Review_Comments",
          primary_key_header: "Comment_ID",
          Comment_ID: comment.commentId,
          Node_ID: comment.nodeId,
          Node_Name: comment.nodeName,
          Target_Field: comment.targetField,
          Original_Content: comment.originalContent || "",
          Proposed_Change: comment.proposedChange,
          Reviewer: comment.reviewer || "HQ_SFC_Team",
          Status: comment.status || "Pending_AI",
          Timestamp: comment.timestamp || new Date().toISOString(),
          AI_Commit_Log: comment.aiCommitLog || ""
        }
      });
    }

    static updateCommentToCloud(comment) {
      if (!window.SyncQueueEngine) return;
      window.SyncQueueEngine.enqueue({
        desc: `修改審查意見 ${comment.commentId}`,
        payload: {
          action: "update",
          sheet_name: "SFC_Review_Comments",
          primary_key_header: "Comment_ID",
          Comment_ID: comment.commentId,
          Node_ID: comment.nodeId,
          Node_Name: comment.nodeName,
          Target_Field: comment.targetField,
          Original_Content: comment.originalContent || "",
          Proposed_Change: comment.proposedChange,
          Reviewer: comment.reviewer || "HQ_SFC_Team",
          Status: comment.status || "Pending_AI",
          Timestamp: new Date().toISOString(),
          AI_Commit_Log: comment.aiCommitLog || ""
        }
      });
    }

    static deleteCommentFromCloud(commentId) {
      if (!window.SyncQueueEngine) return;
      window.SyncQueueEngine.enqueue({
        desc: `刪除審查意見 ${commentId}`,
        payload: {
          action: "delete",
          sheet_name: "SFC_Review_Comments",
          primary_key_header: "Comment_ID",
          Comment_ID: commentId
        }
      });
    }

    static resetAll() {
      localStorage.removeItem(window.STORAGE_KEY_NODES);
      localStorage.removeItem(window.STORAGE_KEY_COMMENTS);
    }
  }

  window.GAS_DATABASE_URL = StorageAdapter.getGasUrl();
  window.StorageAdapter = StorageAdapter;
})();
