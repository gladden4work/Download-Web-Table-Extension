(function() {
  if (window.tableSnifferInitialized) return;
  window.tableSnifferInitialized = true;

  let detectedTables = [];
  let highlightEl = null;
  let autoDownloadEnabled = false;
  let isWaitingForTableLoad = false;

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

  // New function to automatically detect "Load All" or "Show All" buttons and click them
  function tryLoadAllData() {
    console.log('Attempting to load all data...');
    
    // Quasar-specific selectors for pagination and records per page
    const quasarSelectors = [
      // Quasar records per page dropdown
      '.q-table__select .q-select__dropdown-icon',
      '.q-field--borderless.q-select .q-select__dropdown-icon',
      // Quasar pagination controls
      '.q-table__bottom .q-select',
      // General pagination selectors
      'select[aria-label*="per page" i]',
      'select[aria-label*="records" i]'
    ];

    // First, try Quasar-specific approach
    if (tryQuasarPagination()) return true;
    
    const loadAllSelectors = [
      'button:contains("All")',
      'button:contains("Show All")',
      'button:contains("Load All")',
      'select option[value="all"]',
      'select option[value="-1"]',
      'select option[value="0"]', // Sometimes 0 means all
      'a:contains("All")',
      '.pagination button:contains("All")',
      '[data-value="all"]',
      '[data-value="-1"]',
      '[data-value="0"]'
    ];

    // Try to find and click "All" buttons or options
    for (const selector of loadAllSelectors) {
      if (selector.includes(':contains')) {
        const elements = Array.from(document.querySelectorAll(selector.split(':contains')[0]));
        const matchingElements = elements.filter(el => 
          el.textContent.toLowerCase().includes('all') || 
          el.textContent.toLowerCase().includes('show all') ||
          el.textContent.toLowerCase().includes('load all')
        );
        
        if (matchingElements.length > 0) {
          console.log('Found "All" button, clicking:', matchingElements[0]);
          matchingElements[0].click();
          return true;
        }
      } else {
        const element = document.querySelector(selector);
        if (element) {
          console.log('Found "All" option, selecting:', element);
          if (element.tagName === 'OPTION') {
            element.selected = true;
            element.parentElement.dispatchEvent(new Event('change'));
          } else {
            element.click();
          }
          return true;
        }
      }
    }

    // Try to set dropdown/select to maximum value or "All"
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const options = Array.from(select.options);
      
      // Look for "All" option first
      const allOption = options.find(opt => 
        opt.text.toLowerCase().includes('all') || 
        opt.value.toLowerCase() === 'all' ||
        opt.value === '-1' || 
        opt.value === '0'
      );
      
      if (allOption) {
        console.log('Setting select to "All" option:', allOption.value);
        allOption.selected = true;
        select.dispatchEvent(new Event('change'));
        return true;
      }
      
      // If no "All" option, find maximum numeric value
      const maxValueOption = options.reduce((max, option) => {
        const value = parseInt(option.value);
        return !isNaN(value) && value > parseInt(max.value || '0') ? option : max;
      }, { value: '0' });
      
      if (maxValueOption && parseInt(maxValueOption.value) > 0) {
        console.log('Setting select to maximum value:', maxValueOption.value);
        maxValueOption.selected = true;
        select.dispatchEvent(new Event('change'));
        return true;
      }
    }

    return false;
  }

  // New function specifically for Quasar Vue.js framework tables
  function tryQuasarPagination() {
    console.log('Checking for Quasar table pagination...');
    
    // Look for Quasar table pagination info
    const paginationInfo = document.querySelector('.q-table__bottom-item');
    if (paginationInfo && paginationInfo.textContent.includes('of')) {
      console.log('Found Quasar pagination:', paginationInfo.textContent);
      
      // Try to find the records per page dropdown
      const recordsDropdown = document.querySelector('.q-table__select .q-select__dropdown-icon');
      if (recordsDropdown) {
        console.log('Found Quasar records per page dropdown');
        recordsDropdown.click();
        
        // Wait a bit for the dropdown to open, then select the highest option
        setTimeout(() => {
          const dropdownOptions = document.querySelectorAll('.q-menu .q-item');
          let maxOption = null;
          let maxValue = 0;
          
          dropdownOptions.forEach(option => {
            const text = option.textContent.trim();
            if (text.toLowerCase().includes('all')) {
              maxOption = option;
              maxValue = Infinity;
            } else {
              const value = parseInt(text);
              if (!isNaN(value) && value > maxValue) {
                maxValue = value;
                maxOption = option;
              }
            }
          });
          
          if (maxOption) {
            console.log('Clicking Quasar dropdown option:', maxOption.textContent);
            maxOption.click();
            return true;
          }
        }, 500);
        
        return true;
      }
      
      // Try alternative Quasar selectors
      const altDropdown = document.querySelector('.q-field--borderless.q-select');
      if (altDropdown) {
        console.log('Found alternative Quasar dropdown');
        altDropdown.click();
        setTimeout(() => {
          const options = document.querySelectorAll('.q-menu .q-item');
          const lastOption = options[options.length - 1];
          if (lastOption) {
            console.log('Clicking last Quasar option:', lastOption.textContent);
            lastOption.click();
          }
        }, 500);
        return true;
      }
    }
    
    return false;
  }

  // Enhanced function to inject download button if missing
  function injectDownloadButton() {
    // Check if download button already exists
    if (document.querySelector('.table-sniffer-download-btn')) {
      return;
    }

    // Look for appropriate container to inject the button
    const containers = [
      '.q-table__top', // Quasar table top
      '.q-table__container', // Quasar table container
      '.table-header',
      '.table-controls',
      '.data-table-header'
    ];

    let targetContainer = null;
    for (const selector of containers) {
      targetContainer = document.querySelector(selector);
      if (targetContainer) break;
    }

    if (targetContainer) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'table-sniffer-download-btn q-btn q-btn-item non-selectable no-outline q-btn--outline q-btn--rectangle text-blue-grey-6 q-btn--actionable q-focusable q-hoverable q-mr-sm';
      downloadBtn.style.cssText = 'font-size: 15px; margin-left: 10px;';
      downloadBtn.innerHTML = `
        <span class="q-focus-helper"></span>
        <span class="q-btn__content text-center col items-center q-anchor--skip justify-center row">
          <i class="q-icon on-left notranslate material-icons" aria-hidden="true" role="img">download</i>
          <span class="block">Download CSV</span>
        </span>
      `;
      
      downloadBtn.addEventListener('click', () => {
        console.log('Download button clicked, starting auto-download...');
        
        // First, try to load all data
        const loadAllClicked = tryLoadAllData();
        
        if (loadAllClicked) {
          console.log('Load all triggered, waiting for table to complete loading...');
          waitForTableComplete(() => {
            autoDownloadLargestTable();
          });
        } else {
          console.log('No load all option found, downloading current table state...');
          autoDownloadLargestTable();
        }
      });

      // Insert the button at the beginning of the container
      if (targetContainer.querySelector('.q-space')) {
        // For Quasar tables, insert before the spacer
        targetContainer.insertBefore(downloadBtn, targetContainer.querySelector('.q-space'));
      } else {
        targetContainer.appendChild(downloadBtn);
      }
      
      console.log('Download button injected successfully');
    }
  }

  // Function to monitor table changes and wait for loading completion
  function waitForTableComplete(callback) {
    let previousRowCount = 0;
    let stableCount = 0;
    const checkInterval = 1000; // Check every second
    const stableThreshold = 3; // Wait for 3 stable checks
    let checkCount = 0;
    const maxChecks = 30; // Maximum 30 checks (30 seconds)

    const observer = new MutationObserver(() => {
      const tables = detectTables(true);
      let currentRowCount = tables.reduce((total, table) => total + table.rows, 0);
      
      // Also check Quasar pagination info for actual record count
      const quasarPagination = document.querySelector('.q-table__bottom-item');
      if (quasarPagination && quasarPagination.textContent.includes('of')) {
        const match = quasarPagination.textContent.match(/(\d+)-(\d+) of (\d+)/);
        if (match) {
          const showing = parseInt(match[2]);
          const total = parseInt(match[3]);
          console.log(`Quasar table showing ${showing} of ${total} records`);
          
          // If we're showing all records, consider it complete
          if (showing >= total || showing === currentRowCount) {
            console.log('Quasar table appears to be showing all records');
            observer.disconnect();
            callback();
            return;
          }
        }
      }
      
      if (currentRowCount === previousRowCount) {
        stableCount++;
        if (stableCount >= stableThreshold) {
          observer.disconnect();
          console.log('Table loading appears complete, proceeding with download');
          callback();
        }
      } else {
        stableCount = 0;
        previousRowCount = currentRowCount;
        console.log('Table still loading, current row count:', currentRowCount);
      }
      
      checkCount++;
      if (checkCount >= maxChecks) {
        observer.disconnect();
        console.log('Maximum wait time reached, proceeding with download');
        callback();
      }
    });

    // Observe changes to the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Also set a maximum timeout
    setTimeout(() => {
      observer.disconnect();
      console.log('Timeout reached, proceeding with download');
      callback();
    }, 30000); // 30 second timeout
  }

  // Function to automatically download CSV of the largest table
  function autoDownloadLargestTable() {
    const tables = detectTables(true);
    if (tables.length === 0) {
      console.log('No tables found for auto-download');
      return;
    }

    // Find the largest table by row count
    const largestTable = tables.reduce((max, table) => 
      table.rows > max.rows ? table : max
    );

    console.log(`Auto-downloading largest table (ID: ${largestTable.id}, ${largestTable.rows} rows)`);
    
    const data = getTableData(largestTable.id);
    if (data && data.length > 0) {
      // Create CSV content
      const csv = data.map(row => 
        row.map(cell => {
          // Escape CSV cells properly
          cell = String(cell || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const needsQuote = cell.includes('"') || cell.includes(',') || cell.includes('\n');
          cell = cell.replace(/"/g, '""');
          return needsQuote ? `"${cell}"` : cell;
        }).join(',')
      ).join('\n');

      // Download the CSV
      const filename = `table-export-${new Date().toISOString().slice(0, 10)}.csv`;
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log(`CSV downloaded: ${filename} (${data.length} rows)`);
    }
  }

  // Enhanced message listener
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getTables') {
      sendResponse(detectTables(msg.showHidden));
    } else if (msg.action === 'getTableData') {
      sendResponse(getTableData(msg.id));
    } else if (msg.action === 'highlightTable') {
      highlightTable(msg.id);
    } else if (msg.action === 'autoDownload') {
      // Auto-download functionality
      console.log('Starting auto-download process...');
      
      // First, try to load all data
      const loadAllClicked = tryLoadAllData();
      
      if (loadAllClicked) {
        console.log('Load all triggered, waiting for table to complete loading...');
        waitForTableComplete(() => {
          autoDownloadLargestTable();
        });
      } else {
        console.log('No load all button found, downloading current table state...');
        autoDownloadLargestTable();
      }
      
      sendResponse({ success: true });
    }
  });

  // Auto-trigger download on page load if enabled
  function checkForAutoDownload() {
    // Check if this domain should auto-download
    chrome.storage.sync.get(['autoDownloadDomains'], (result) => {
      const autoDownloadDomains = result.autoDownloadDomains || [];
      const currentDomain = window.location.hostname;
      
      if (autoDownloadDomains.includes(currentDomain)) {
        console.log('Auto-download enabled for this domain');
        setTimeout(() => {
          // Trigger auto-download directly
          console.log('Starting auto-download process...');
          
          // First, try to load all data
          const loadAllClicked = tryLoadAllData();
          
          if (loadAllClicked) {
            console.log('Load all triggered, waiting for table to complete loading...');
            waitForTableComplete(() => {
              autoDownloadLargestTable();
            });
          } else {
            console.log('No load all button found, downloading current table state...');
            autoDownloadLargestTable();
          }
        }, 2000);
      }
    });
  }

  // Initialize auto-download check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForAutoDownload);
  } else {
    checkForAutoDownload();
  }

  // Inject download button if missing
  injectDownloadButton();
})();
