let currentTabId = null;
let currentTableId = null;
let options = {
  delimiter: ',',
  lineEnding: '\n',
  showHiddenTables: false
};

function loadOptions() {
  return new Promise(resolve => {
    chrome.storage.sync.get(options, items => {
      options = Object.assign(options, items);
      resolve();
    });
  });
}

function requestTables() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    currentTabId = tab.id;
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] }).then(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'getTables', showHidden: options.showHiddenTables }, tables => {
        populateList(tables);
      });
    });
  });
}

function populateList(tables) {
  const ul = document.getElementById('table-list');
  ul.innerHTML = '';
  tables.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `Table ${t.id} (${t.rows}\u00d7${t.cols})`;
    const btn = document.createElement('button');
    btn.textContent = chrome.i18n.getMessage('preview');
    btn.dataset.id = t.id;
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

document.getElementById('table-list').addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    showPreview(parseInt(e.target.dataset.id, 10));
  }
});

function showPreview(id) {
  currentTableId = id;
  chrome.tabs.sendMessage(currentTabId, { action: 'getTableData', id }, data => {
    const table = document.getElementById('preview-table');
    table.innerHTML = '';
    data.slice(0, 5).forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    document.getElementById('preview-container').hidden = false;
  });
  chrome.tabs.sendMessage(currentTabId, { action: 'highlightTable', id });
}

// Set up button labels
document.getElementById('download').textContent = chrome.i18n.getMessage('downloadCsv');
document.getElementById('copy').textContent = chrome.i18n.getMessage('copyExcel');

// Add Auto Download button functionality
if (document.getElementById('auto-download')) {
  document.getElementById('auto-download').textContent = 'Auto Download CSV';
  document.getElementById('auto-download').addEventListener('click', triggerAutoDownload);
}

document.getElementById('download').addEventListener('click', () => exportTable('csv'));
document.getElementById('copy').addEventListener('click', () => exportTable('tsv'));

function triggerAutoDownload() {
  if (!currentTabId) return;
  
  // Show loading state
  const autoDownloadBtn = document.getElementById('auto-download');
  const originalText = autoDownloadBtn.textContent;
  autoDownloadBtn.textContent = 'Loading All Data...';
  autoDownloadBtn.disabled = true;

  chrome.tabs.sendMessage(currentTabId, { action: 'autoDownload' }, response => {
    // Reset button state
    autoDownloadBtn.textContent = originalText;
    autoDownloadBtn.disabled = false;
    
    if (response && response.success) {
      // Close popup after successful auto-download
      window.close();
    }
  });
}

function exportTable(type) {
  if (currentTableId == null) return;
  chrome.tabs.sendMessage(currentTabId, { action: 'getTableData', id: currentTableId }, data => {
    if (type === 'csv') {
      const csv = encodeCsv(data, options.delimiter, options.lineEnding);
      const filename = 'table-' + new Date().toISOString().slice(0, 10) + '.csv';
      downloadCsv(filename, csv);
    } else {
      const tsv = encodeCsv(data, '\t', options.lineEnding);
      copyText(tsv);
    }
  });
}

// Domain management for auto-download
function toggleAutoDownloadForCurrentDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentDomain = new URL(tabs[0].url).hostname;
    
    chrome.storage.sync.get(['autoDownloadDomains'], (result) => {
      let autoDownloadDomains = result.autoDownloadDomains || [];
      
      if (autoDownloadDomains.includes(currentDomain)) {
        // Remove domain
        autoDownloadDomains = autoDownloadDomains.filter(domain => domain !== currentDomain);
        console.log('Disabled auto-download for:', currentDomain);
      } else {
        // Add domain
        autoDownloadDomains.push(currentDomain);
        console.log('Enabled auto-download for:', currentDomain);
      }
      
      chrome.storage.sync.set({ autoDownloadDomains }, () => {
        updateAutoDownloadButton(autoDownloadDomains.includes(currentDomain));
      });
    });
  });
}

function updateAutoDownloadButton(isEnabled) {
  const toggleBtn = document.getElementById('toggle-auto-download');
  if (toggleBtn) {
    toggleBtn.textContent = isEnabled ? 'Disable Auto Download' : 'Enable Auto Download';
    toggleBtn.style.backgroundColor = isEnabled ? '#d73502' : '#0b57d0';
  }
}

// Initialize auto-download toggle button
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (tabs[0]) {
    const currentDomain = new URL(tabs[0].url).hostname;
    chrome.storage.sync.get(['autoDownloadDomains'], (result) => {
      const autoDownloadDomains = result.autoDownloadDomains || [];
      updateAutoDownloadButton(autoDownloadDomains.includes(currentDomain));
    });
  }
});

if (document.getElementById('toggle-auto-download')) {
  document.getElementById('toggle-auto-download').addEventListener('click', toggleAutoDownloadForCurrentDomain);
}

loadOptions().then(requestTables);
