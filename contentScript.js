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
        left: 2px;
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

  function waitForElement(selector, timeout = 1000) {
    return new Promise(resolve => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      let timer = null;
      const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearTimeout(timer);
          obs.disconnect();
          resolve(el);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      timer = setTimeout(() => {
        obs.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  async function findComboBoxPageSize() {
    const combos = Array.from(document.querySelectorAll('[role="combobox"][aria-controls]'));
    for (const combo of combos) {
      const listId = combo.getAttribute('aria-controls');
      combo.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const listbox = await waitForElement('#' + CSS.escape(listId), 1000);
      if (!listbox) continue;
      let bestOpt = null;
      let bestVal = -1;
      const options = Array.from(listbox.querySelectorAll('[role="option"], li, div'));
      options.forEach(opt => {
        const text = opt.textContent.trim();
        let val = -1;
        if (/all/i.test(text)) {
          val = Infinity;
        } else {
          const num = parseInt(text.replace(/\D/g, ''), 10);
          if (!isNaN(num)) val = num;
        }
        if (val > bestVal) {
          bestVal = val;
          bestOpt = opt;
        }
      });
      if (bestOpt) {
        return { combo, option: bestOpt };
      }
    }
    return null;
  }

  function waitForTableUpdate(table) {
    return new Promise(resolve => {
      const target = table.tBodies[0] || table;
      let timer = null;
      let maxTimer = null;
      const finish = () => {
        clearTimeout(timer);
        clearTimeout(maxTimer);
        observer.disconnect();
        resolve();
      };
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(finish, 500);
      });
      observer.observe(target, { childList: true, subtree: true });
      timer = setTimeout(finish, 500);
      maxTimer = setTimeout(finish, 5000);
    });
  }

  function adjustPageSize(table) {
    const info = findPageSizeSelect();
    if (info) {
      const selectedText = info.select.options[info.select.selectedIndex]?.textContent.trim();
      if (selectedText === info.option.textContent.trim()) return Promise.resolve();
      info.select.value = info.option.value;
      info.select.dispatchEvent(new Event('input', { bubbles: true }));
      info.select.dispatchEvent(new Event('change', { bubbles: true }));
      return waitForTableUpdate(table);
    }

    return findComboBoxPageSize().then(comboInfo => {
      if (!comboInfo) return;
      const current = (comboInfo.combo.value || comboInfo.combo.textContent || '').trim();
      if (current === comboInfo.option.textContent.trim()) return;
      comboInfo.option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return waitForTableUpdate(table);
    });
  }

  function handleDownload(table) {
    adjustPageSize(table).then(() => {
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
