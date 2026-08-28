/**
 * 🛠️ 08_SFC_SMT_Backend.gs
 * SSSTC & Foxlink SMT SFC 流程架構評審與 Google Sheets 雲端資料庫網關
 * 
 * 支援功能：
 * 1. 一鍵初始化工作表 (SFC_Nodes_Master, SFC_Review_Comments)
 * 2. 批次寫入節點主檔 (batchSyncNodes)
 * 3. 審查意見流水登記與狀態更新 (addComment / updateCommentStatus)
 * 4. 全量數據拉取 (getSFCWorkflowData)
 */

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    let params = {};
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }

    const action = params.action || "getWorkflowData";
    let result = {};

    switch (action) {
      case "getWorkflowData":
        result = getWorkflowData();
        break;
      case "batchSyncNodes":
        result = batchSyncNodes(params.nodes);
        break;
      case "addComment":
        result = addComment(params.comment);
        break;
      case "updateCommentStatus":
        result = updateCommentStatus(params.commentId, params.status, params.aiCommitLog);
        break;
      case "initSheets":
        result = initSheets();
        break;
      default:
        result = { status: "error", message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/** 1. 取得全量資料 */
function getWorkflowData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nodesSheet = ss.getSheetByName("SFC_Nodes_Master");
  const commentsSheet = ss.getSheetByName("SFC_Review_Comments");

  if (!nodesSheet || !commentsSheet) {
    return { initialized: false, nodes: [], comments: [] };
  }

  const nodeRows = nodesSheet.getDataRange().getValues();
  const nodes = [];
  for (let i = 1; i < nodeRows.length; i++) {
    const r = nodeRows[i];
    if (!r[0]) continue;
    nodes.push({
      id: r[0],
      name: r[1],
      name_en: r[2],
      group: r[3],
      type: r[4],
      label: r[5],
      desc: r[6],
      inputs: r[7] ? JSON.parse(r[7]) : [],
      validations: r[8] ? JSON.parse(r[8]) : [],
      outputs: r[9] ? JSON.parse(r[9]) : [],
      exceptions: r[10] ? JSON.parse(r[10]) : [],
      traceKeys: r[11] ? JSON.parse(r[11]) : []
    });
  }

  const commentRows = commentsSheet.getDataRange().getValues();
  const comments = [];
  for (let i = 1; i < commentRows.length; i++) {
    const c = commentRows[i];
    if (!c[0]) continue;
    comments.push({
      commentId: c[0],
      nodeId: c[1],
      nodeName: c[2],
      targetField: c[3],
      originalContent: c[4],
      proposedChange: c[5],
      reviewer: c[6],
      status: c[7],
      timestamp: c[8],
      aiCommitLog: c[9]
    });
  }

  return { initialized: true, nodes: nodes, comments: comments };
}

/** 2. 批次同步節點資料庫 */
function batchSyncNodes(nodesList) {
  if (!nodesList || !nodesList.length) return { updated: 0 };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("SFC_Nodes_Master");
  if (!sheet) {
    sheet = ss.insertSheet("SFC_Nodes_Master");
    sheet.appendRow(["ID", "Name_ZH", "Name_EN", "Group", "Type", "Label", "Description", "Inputs_JSON", "Validations_JSON", "Outputs_JSON", "Exceptions_JSON", "TraceKeys_JSON"]);
  }

  // 清空舊數據（保留第 1 列表頭）
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 12).clearContent();
  }

  const rows = nodesList.map(n => [
    n.id,
    n.name,
    n.name_en || "",
    n.group || "",
    n.type || "",
    n.label || "",
    n.desc || "",
    JSON.stringify(n.inputs || []),
    JSON.stringify(n.validations || []),
    JSON.stringify(n.outputs || []),
    JSON.stringify(n.exceptions || []),
    JSON.stringify(n.traceKeys || [])
  ]);

  sheet.getRange(2, 1, rows.length, 12).setValues(rows);
  return { updated: rows.length };
}

/** 3. 追加審查意見 (Append-only) */
function addComment(comment) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("SFC_Review_Comments");
  if (!sheet) {
    sheet = ss.insertSheet("SFC_Review_Comments");
    sheet.appendRow(["Comment_ID", "Node_ID", "Node_Name", "Target_Field", "Original_Content", "Proposed_Change", "Reviewer", "Status", "Timestamp", "AI_Commit_Log"]);
  }

  sheet.appendRow([
    comment.commentId || ("COM-" + new Date().getTime()),
    comment.nodeId,
    comment.nodeName,
    comment.targetField,
    comment.originalContent || "",
    comment.proposedChange,
    comment.reviewer || "HQ_SFC_Team",
    comment.status || "Pending_AI",
    comment.timestamp || new Date().toISOString(),
    comment.aiCommitLog || ""
  ]);

  return { added: true, commentId: comment.commentId };
}

/** 4. 更新意見狀態 (供 AI 代理人消費後回寫) */
function updateCommentStatus(commentId, status, aiCommitLog) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("SFC_Review_Comments");
  if (!sheet) return { updated: false };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === commentId) {
      sheet.getRange(i + 1, 8).setValue(status); // Status 欄
      if (aiCommitLog) {
        sheet.getRange(i + 1, 10).setValue(aiCommitLog); // AI_Commit_Log 欄
      }
      return { updated: true, commentId: commentId, newStatus: status };
    }
  }
  return { updated: false, message: "Comment ID not found" };
}
