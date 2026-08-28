// [ANCHOR: JS-STORAGE-ADAPTER]
(function() {
  class StorageAdapter {
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
          return JSON.parse(cached);
        } catch (e) {
          console.warn("快取節點解析失敗，重新讀取資料", e);
        }
      }

      // 優先嘗試 fetch JSON
      try {
        const res = await fetch('./assets/data/sfc_nodes_master.json');
        if (res.ok) {
          const data = await res.json();
          this.saveNodes(data);
          return data;
        }
      } catch (e) {
        console.warn("fetch 失敗 (可能是 file:// 協議)，降級使用 DEFAULT_SFC_NODES");
      }

      // Fallback 內嵌資料
      const fallback = window.DEFAULT_SFC_NODES || [];
      this.saveNodes(fallback);
      return fallback;
    }

    static saveNodes(nodes) {
      localStorage.setItem(window.STORAGE_KEY_NODES, JSON.stringify(nodes));
    }

    static async loadComments() {
      const cached = localStorage.getItem(window.STORAGE_KEY_COMMENTS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn("快取意見解析失敗，重新讀取資料", e);
        }
      }

      try {
        const res = await fetch('./assets/data/sfc_review_comments.json');
        if (res.ok) {
          const data = await res.json();
          this.saveComments(data);
          return data;
        }
      } catch (e) {
        console.warn("fetch comments 失敗，降級使用 DEFAULT_SFC_COMMENTS");
      }

      const fallback = window.DEFAULT_SFC_COMMENTS || [];
      this.saveComments(fallback);
      return fallback;
    }

    static saveComments(comments) {
      localStorage.setItem(window.STORAGE_KEY_COMMENTS, JSON.stringify(comments));
    }

    static resetAll() {
      localStorage.removeItem(window.STORAGE_KEY_NODES);
      localStorage.removeItem(window.STORAGE_KEY_COMMENTS);
    }
  }

  window.StorageAdapter = StorageAdapter;
})();
