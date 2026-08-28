/**
 * =========================================================================
 * 🌐 SFC_SMT_Backend.gs (SSSTC & Foxlink SMT SFC 雲端資料庫萬能代理網關 v2.0)
 * =========================================================================
 * 核心特性：
 * 1. 擬人類全操作：資料列 CRUD + 頁籤生命週期 + 格點格式與活公式 + 凍結窗格
 * 2. 動態標頭映射 (Header Mapping)：零硬編碼索引，欄位任意增刪移動 0 次崩潰
 * 3. 局部增量原地修改 (Partial In-Place Update)：未傳入之欄位 100% 完好保留
 * 4. 實體精準刪除列與安全防誤刪保護 (防刪最後一頁)
 * 5. 車規級兩大頁籤支援：SFC_Nodes_Master (16 站主檔) / SFC_Review_Comments (HQ 意見表)
 * =========================================================================
 */

function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = p.action || "list";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = p.sheet_name || p.sheet || "";
    const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getActiveSheet();

    // 1. 列出所有工作表名稱 (List Sheets)
    if (action === "list_sheets") {
      const sheets = ss.getSheets().map((s, idx) => ({
        index: idx,
        name: s.getName(),
        id: s.getSheetId(),
        rows: s.getLastRow(),
        cols: s.getLastColumn(),
        is_hidden: s.isSheetHidden(),
        tab_color: s.getTabColor()
      }));
      return createJsonResponse({ status: "success", count: sheets.length, data: sheets });
    }

    if (!sheet) {
      return createJsonResponse({ status: "error", message: `Sheet '${sheetName}' not found` });
    }

    const headerMap = getHeaderMap(sheet);

    // 2. 列出工作表資料 (List Rows)
    if (action === "list") {
      const records = getSheetRecords(sheet, headerMap);
      return createJsonResponse({ status: "success", sheet: sheet.getName(), count: records.length, data: records });
    }

    // 3. 查詢單筆資料 (Get Row)
    if (action === "get") {
      const primaryKeyHeader = p.key_header || Object.keys(headerMap)[0] || "ID";
      const queryVal = (p.key_value || p.key || p.id || p.name || "").trim().toLowerCase();
      if (!queryVal) return createJsonResponse({ status: "error", message: "Missing query key value" });

      const records = getSheetRecords(sheet, headerMap);
      const found = records.find(r => String(r[primaryKeyHeader] || "").trim().toLowerCase() === queryVal);
      return found ? createJsonResponse({ status: "success", data: found })
                   : createJsonResponse({ status: "not_found", message: "Record not found" });
    }

    return createJsonResponse({ status: "error", message: "Unknown GET action: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "append";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = payload.sheet_name || payload.sheet || "";
    let sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getActiveSheet();

    // =========================================================================
    // 📑 模組 A：工作表/頁籤生命週期管理 (Sheet Lifecycle)
    // =========================================================================

    // A1. 新建工作表 (Create Sheet)
    if (action === "create_sheet") {
      const targetName = (payload.new_sheet_name || payload.name || sheetName || "").trim();
      if (!targetName) return createJsonResponse({ status: "error", message: "Missing new_sheet_name" });

      if (ss.getSheetByName(targetName)) {
        return createJsonResponse({ status: "already_exists", message: `Sheet '${targetName}' already exists` });
      }

      const newSheet = ss.insertSheet(targetName);

      // 設定標籤顏色
      if (payload.tab_color) newSheet.setTabColor(payload.tab_color);

      // 初始化標頭 (Headers)
      if (Array.isArray(payload.headers) && payload.headers.length > 0) {
        newSheet.getRange(1, 1, 1, payload.headers.length).setValues([payload.headers])
          .setFontWeight("bold")
          .setBackground(payload.header_bg || "#f1f5f9");
        if (payload.freeze_header !== false) newSheet.setFrozenRows(1);
      }

      return createJsonResponse({ status: "success", message: `Sheet '${targetName}' created successfully` });
    }

    // A2. 複製模板工作表 (Clone Sheet)
    if (action === "clone_sheet") {
      const templateName = payload.template_name || payload.from || "";
      const targetName = payload.new_sheet_name || payload.to || "";
      const template = ss.getSheetByName(templateName);
      if (!template) return createJsonResponse({ status: "error", message: `Template sheet '${templateName}' not found` });
      if (ss.getSheetByName(targetName)) return createJsonResponse({ status: "already_exists", message: `Sheet '${targetName}' already exists` });

      const cloned = template.copyTo(ss).setName(targetName);
      if (payload.tab_color) cloned.setTabColor(payload.tab_color);
      return createJsonResponse({ status: "success", message: `Sheet cloned from '${templateName}' to '${targetName}'` });
    }

    // A3. 重新命名工作表 (Rename Sheet)
    if (action === "rename_sheet") {
      const oldName = payload.old_name || sheetName || "";
      const newName = (payload.new_name || "").trim();
      const target = ss.getSheetByName(oldName);
      if (!target) return createJsonResponse({ status: "error", message: `Sheet '${oldName}' not found` });
      if (!newName) return createJsonResponse({ status: "error", message: "Missing new_name" });
      if (ss.getSheetByName(newName)) return createJsonResponse({ status: "already_exists", message: `Sheet '${newName}' already exists` });

      target.setName(newName);
      if (payload.tab_color) target.setTabColor(payload.tab_color);
      return createJsonResponse({ status: "success", message: `Sheet renamed from '${oldName}' to '${newName}'` });
    }

    // A4. 刪除工作表 (Delete Sheet - 內建防禦)
    if (action === "delete_sheet") {
      const targetName = payload.target_sheet || sheetName || "";
      const target = ss.getSheetByName(targetName);
      if (!target) return createJsonResponse({ status: "error", message: `Sheet '${targetName}' not found` });

      if (ss.getSheets().length <= 1) {
        return createJsonResponse({ status: "error", message: "Cannot delete the only sheet in the spreadsheet" });
      }

      ss.deleteSheet(target);
      return createJsonResponse({ status: "success", message: `Sheet '${targetName}' deleted successfully` });
    }

    // =========================================================================
    // 📊 模組 B：資料列精準 CRUD (Data Rows Operations)
    // =========================================================================

    if (!sheet) {
      return createJsonResponse({ status: "error", message: `Target sheet not found` });
    }

    const headerMap = getHeaderMap(sheet);
    const primaryKeyHeader = payload.primary_key_header || payload.key_header || Object.keys(headerMap)[0] || "ID";
    const keyVal = String(payload[primaryKeyHeader] || payload.key || payload.id || payload.name || "").trim();

    // B1. 新增資料列 (Append Row)
    if (action === "append" || action === "create") {
      if (keyVal) {
        const records = getSheetRecords(sheet, headerMap);
        const exists = records.find(r => String(r[primaryKeyHeader] || "").trim().toLowerCase() === keyVal.toLowerCase());
        if (exists) {
          return createJsonResponse({ status: "already_exists", message: `Record with key '${keyVal}' already exists`, data: exists });
        }
      }

      const newRow = buildRowArray(sheet, headerMap, payload);
      sheet.appendRow(newRow);
      return createJsonResponse({ status: "success", message: "Record appended successfully", key: keyVal });
    }

    // B2. 局部增量原地修改 (Partial In-Place Update)
    if (action === "update") {
      if (!keyVal) return createJsonResponse({ status: "error", message: `Missing key value for '${primaryKeyHeader}'` });

      const rowIndex = findRowIndexByKey(sheet, headerMap, primaryKeyHeader, keyVal);
      if (rowIndex === -1) {
        return createJsonResponse({ status: "not_found", message: `Record with key '${keyVal}' not found in sheet` });
      }

      const lastCol = Math.max(sheet.getLastColumn(), 1);
      const currentRow = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
      const updatedRow = applyPartialUpdate(headerMap, currentRow, payload);
      sheet.getRange(rowIndex, 1, 1, lastCol).setValues([updatedRow]);

      return createJsonResponse({ status: "success", message: "Record updated successfully", key: keyVal, row: rowIndex });
    }

    // B3. 實體行精準刪除 (Delete Row)
    if (action === "delete") {
      if (!keyVal) return createJsonResponse({ status: "error", message: `Missing key value for '${primaryKeyHeader}'` });

      const rowIndex = findRowIndexByKey(sheet, headerMap, primaryKeyHeader, keyVal);
      if (rowIndex === -1) {
        return createJsonResponse({ status: "not_found", message: `Record with key '${keyVal}' not found in sheet` });
      }

      sheet.deleteRow(rowIndex);
      return createJsonResponse({ status: "success", message: "Record deleted successfully", key: keyVal, deleted_row: rowIndex });
    }

    // B4. 批次新增列 (Batch Append)
    if (action === "batch_append") {
      const rows = payload.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return createJsonResponse({ status: "error", message: "Missing or empty 'rows' array" });
      }

      rows.forEach(r => {
        const rowArr = Array.isArray(r) ? r : buildRowArray(sheet, headerMap, r);
        sheet.appendRow(rowArr);
      });
      return createJsonResponse({ status: "success", message: `Appended ${rows.length} rows successfully` });
    }

    // =========================================================================
    // 🎨 模組 C：格點、格式與活公式 (Cells, Formulas & Formatting)
    // =========================================================================

    // C1. 寫入範圍數值 (Set Range Values)
    if (action === "set_range") {
      const a1Notation = payload.range || "A1";
      const values = payload.values;
      if (!Array.isArray(values)) return createJsonResponse({ status: "error", message: "'values' must be a 2D array" });
      sheet.getRange(a1Notation).setValues(values);
      return createJsonResponse({ status: "success", message: `Values written to ${a1Notation}` });
    }

    // C2. 注入生動計算公式 (Set Formulas)
    if (action === "set_formulas" || action === "set_formula") {
      const a1Notation = payload.range || "A1";
      if (Array.isArray(payload.formulas)) {
        sheet.getRange(a1Notation).setFormulas(payload.formulas);
      } else if (payload.formula) {
        sheet.getRange(a1Notation).setFormula(payload.formula);
      }
      return createJsonResponse({ status: "success", message: `Formula(s) applied to ${a1Notation}` });
    }

    // C3. 樣式與色彩格式化 (Format Range)
    if (action === "format_range") {
      const a1Notation = payload.range || "A1";
      const range = sheet.getRange(a1Notation);

      if (payload.bg || payload.background) range.setBackground(payload.bg || payload.background);
      if (payload.color || payload.font_color) range.setFontColor(payload.color || payload.font_color);
      if (payload.bold !== undefined) range.setFontWeight(payload.bold ? "bold" : "normal");
      if (payload.align) range.setHorizontalAlignment(payload.align);
      if (payload.font_size) range.setFontSize(payload.font_size);

      return createJsonResponse({ status: "success", message: `Formatting applied to ${a1Notation}` });
    }

    // C4. 凍結窗格 (Freeze Panes)
    if (action === "freeze_panes") {
      if (payload.rows !== undefined) sheet.setFrozenRows(payload.rows);
      if (payload.cols !== undefined || payload.columns !== undefined) sheet.setFrozenColumns(payload.cols || payload.columns);
      return createJsonResponse({ status: "success", message: "Panes frozen successfully" });
    }

    // C5. 清理範圍 (Clear Range)
    if (action === "clear_range") {
      const a1Notation = payload.range || "";
      if (a1Notation) sheet.getRange(a1Notation).clearContent();
      else sheet.clearContents();
      return createJsonResponse({ status: "success", message: "Range cleared" });
    }

    return createJsonResponse({ status: "error", message: "Unknown POST action: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// =========================================================================
// 🧩 輔助函數庫 (Helper Utilities)
// =========================================================================

function getHeaderMap(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h !== null && h !== undefined && h !== "") {
      map[h.toString().trim()] = i;
    }
  });
  return map;
}

function getSheetRecords(sheet, headerMap) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  const raw = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const records = [];

  raw.forEach((row, i) => {
    const item = { _rowNumber: i + 2 };
    Object.keys(headerMap).forEach(h => {
      item[h] = row[headerMap[h]];
    });
    records.push(item);
  });
  return records;
}

function findRowIndexByKey(sheet, headerMap, keyHeader, keyVal) {
  const colIdx = headerMap[keyHeader];
  if (colIdx === undefined) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  const colValues = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < colValues.length; i++) {
    if (String(colValues[i][0] || "").trim().toLowerCase() === keyVal.toLowerCase()) {
      return i + 2;
    }
  }
  return -1;
}

function buildRowArray(sheet, headerMap, payload) {
  const lastCol = sheet.getLastColumn();
  const row = new Array(lastCol).fill("");
  Object.keys(headerMap).forEach(h => {
    if (payload[h] !== undefined) row[headerMap[h]] = payload[h];
  });
  return row;
}

function applyPartialUpdate(headerMap, currentRow, payload) {
  const row = [...currentRow];
  Object.keys(headerMap).forEach(h => {
    if (payload[h] !== undefined && payload[h] !== null) {
      row[headerMap[h]] = payload[h];
    }
  });
  return row;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
