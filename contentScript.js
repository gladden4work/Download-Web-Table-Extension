(function() {
  if (window.tableSnifferInitialized) return;
  window.tableSnifferInitialized = true;

  let detectedTables = [];
  let highlightEl = null;

  const STYLE_ID = 'table-sniffer-btn-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .table-sniffer-wrapper {
        position: relative;
        display: inline-block;
      }
      .table-sniffer-download-btn {
        position: absolute;
        top: 2px;
        right: 2px;
        z-index: 2147483647;
        padding: 2px 4px;
        font-size: 12px;
        cursor: pointer;
        background: #fff;
        border: 1px solid #ccc;
      }
    `;
    document.head.appendChild(style);
  }

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
    addButtons();
    return infos;
  }

  function getTableDataByElement(table) {
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

  function findPageSizeSelect() {
    const selects = Array.from(document.querySelectorAll('select'));
    let best = null;
    selects.forEach(sel => {
      let bestOpt = null;
      let bestVal = -1;
      for (const opt of sel.options) {
        const text = opt.textContent.trim();
        if (/all/i.test(text)) {
          bestOpt = opt;
          bestVal = Infinity;
          break;
        }
        const num = parseInt(text.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > bestVal) {
          bestVal = num;
          bestOpt = opt;
        }
      }
      if (bestOpt && (!best || bestVal > best.value)) {
        best = { select: sel, option: bestOpt, value: bestVal };
      }
    });
    return best;
  }

  function adjustPageSize() {
    const info = findPageSizeSelect();
    if (!info) return Promise.resolve();
    if (info.select.value === info.option.value) return Promise.resolve();
    info.select.value = info.option.value;
    info.select.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  function handleDownload(table) {
    adjustPageSize().then(() => {
      const data = getTableDataByElement(table);
      const csv = encodeCsv(data);
      const filename = 'table-' + new Date().toISOString().slice(0, 10) + '.csv';
      downloadCsv(filename, csv);
    });
  }

  function addButtons() {
    ensureStyle();
    detectedTables.forEach(table => {
      if (table.dataset.snifferWrapped) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-sniffer-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      const btn = document.createElement('button');
      btn.textContent = chrome.i18n ? chrome.i18n.getMessage('downloadCsv') || 'Download CSV' : 'Download CSV';
      btn.className = 'table-sniffer-download-btn';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        handleDownload(table);
      });
      wrapper.appendChild(btn);
      table.dataset.snifferWrapped = '1';
    });
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

  let moTimer = null;
  const observer = new MutationObserver(() => {
    if (moTimer) clearTimeout(moTimer);
    moTimer = setTimeout(() => {
      detectTables(false);
      moTimer = null;
    }, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  detectTables(false);
})();
