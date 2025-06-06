(function() {
  if (window.tableSnifferInitialized) return;
  window.tableSnifferInitialized = true;

  let detectedTables = [];
  let highlightEl = null;

  function detectTables(showHidden) {
    detectedTables = [];
    const tables = Array.from(document.querySelectorAll('table'));
    let id = 0;
    const infos = [];
    tables.forEach(table => {
      const visible = showHidden || (table.offsetWidth > 0 && table.offsetHeight > 0);
      if (!visible) return;
      const cellCount = table.querySelectorAll('th, td').length;
      if (cellCount < 2) return;
      table.dataset.tableSnifferId = id;
      detectedTables.push(table);
      const rows = table.rows.length;
      const cols = table.rows[0] ? table.rows[0].cells.length : 0;
      const preview = [];
      for (let r = 0; r < Math.min(2, rows); r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const cell = table.rows[r].cells[c];
          row.push(cell ? cell.innerText.trim() : '');
        }
        preview.push(row);
      }
      infos.push({ id: id, rows, cols, preview });
      id++;
    });
    return infos;
  }

  function getTableData(id) {
    const table = detectedTables[id];
    if (!table) return null;
    const data = [];
    for (const row of table.rows) {
      const rowData = [];
      for (const cell of row.cells) {
        rowData.push(cell.innerText.trim());
      }
      data.push(rowData);
    }
    return data;
  }

  function highlightTable(id) {
    if (highlightEl) highlightEl.style.outline = '';
    const table = detectedTables[id];
    if (table) {
      highlightEl = table;
      table.style.outline = '2px solid orange';
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getTables') {
      sendResponse(detectTables(msg.showHidden));
    } else if (msg.action === 'getTableData') {
      sendResponse(getTableData(msg.id));
    } else if (msg.action === 'highlightTable') {
      highlightTable(msg.id);
    }
  });
})();
