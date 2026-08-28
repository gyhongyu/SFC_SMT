/**
 * SyncQueueEngine - 單管道 FIFO 背景序列化佇列引擎
 * 
 * 特性：
 * 1. 0ms 樂觀更新 (Optimistic UI) ＋ 失敗防禦回滾
 * 2. 單管道逐筆發送，杜絕 Google Apps Script LockService 併發衝突
 * 3. 支援同步狀態監聽回呼 (onStatusChange)
 * 4. 離頁守門員 (beforeunload Guard)
 */
(function() {
  const queue = [];
  let isProcessing = false;
  let statusListeners = [];

  window.addEventListener('beforeunload', (e) => {
    if (queue.length > 0 || isProcessing) {
      e.preventDefault();
      e.returnValue = '尚有雲端資料正在同步至 Google Sheets，確定要離開嗎？';
      return e.returnValue;
    }
  });

  function notifyStatus() {
    const pending = queue.length + (isProcessing ? 1 : 0);
    statusListeners.forEach(cb => {
      try { cb(pending); } catch (e) { console.error(e); }
    });
  }

  async function processQueue() {
    if (isProcessing || queue.length === 0) {
      notifyStatus();
      return;
    }
    isProcessing = true;
    notifyStatus();

    const task = queue[0];
    const targetUrl = task.apiUrl || window.GAS_DATABASE_URL;

    if (!targetUrl) {
      console.warn("[SyncQueueEngine] 未設定 GAS_DATABASE_URL，僅保存本地快取");
      queue.shift();
      isProcessing = false;
      notifyStatus();
      return;
    }

    try {
      const resp = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(task.payload)
      });
      const res = await resp.json();
      if (res && res.status === "success") {
        if (task.onSuccess) task.onSuccess(res);
      } else {
        throw new Error(res.message || "GAS 回傳異常");
      }
    } catch (err) {
      console.error(`[SyncQueueEngine] 同步失敗: ${task.desc || 'Task'}`, err);
      if (task.onFailure && task.snapshot) {
        task.onFailure(task.snapshot);
      }
    } finally {
      queue.shift();
      isProcessing = false;
      notifyStatus();
      if (queue.length > 0) {
        setTimeout(processQueue, 60);
      }
    }
  }

  window.SyncQueueEngine = {
    enqueue: (task) => {
      queue.push(task);
      processQueue();
    },
    getPendingCount: () => queue.length + (isProcessing ? 1 : 0),
    onStatusChange: (callback) => {
      if (typeof callback === "function") {
        statusListeners.push(callback);
      }
    }
  };
})();
