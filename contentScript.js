(function() {
  if (window.tableSnifferInitialized) return;
  window.tableSnifferInitialized = true;

  let detectedTables = [];
  let highlightEl = null;
  let autoDownloadEnabled = false;
  let isWaitingForTableLoad = false;

  function detectTables(showHidden) {
    console.log('detectTables called, showHidden:', showHidden);
    detectedTables = [];
    const tables = Array.from(document.querySelectorAll('table'));
    console.log(`Found ${tables.length} table elements`);
    
    let id = 0;
    const infos = [];
    tables.forEach((table, index) => {
      console.log(`Processing table ${index + 1}:`, table);
      const visible = showHidden || (table.offsetWidth > 0 && table.offsetHeight > 0);
      console.log(`Table ${index + 1} visible:`, visible, `(${table.offsetWidth}x${table.offsetHeight})`);
      
      if (!visible) return;
      
      const cellCount = table.querySelectorAll('th, td').length;
      console.log(`Table ${index + 1} cell count:`, cellCount);
      
      if (cellCount < 2) return;
      
      table.dataset.tableSnifferId = id;
      detectedTables.push(table);
      const rows = table.rows.length;
      const cols = table.rows[0] ? table.rows[0].cells.length : 0;
      console.log(`Table ${index + 1} dimensions: ${rows} rows x ${cols} cols`);
      
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
    
    console.log(`detectTables returning ${infos.length} table infos:`, infos);
    return infos;
  }

  function getTableData(id) {
    console.log('getTableData called with id:', id);
    const table = detectedTables[id];
    
    if (!table) {
      console.error(`No table found with id ${id}. Available tables:`, detectedTables.length);
      return null;
    }
    
    console.log('Found table:', table, `with ${table.rows.length} rows`);
    
    const data = [];
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const rowData = [];
      for (let j = 0; j < row.cells.length; j++) {
        const cell = row.cells[j];
        rowData.push(cell.innerText.trim());
      }
      data.push(rowData);
    }
    
    console.log(`getTableData returning ${data.length} rows of data`);
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

  // Enhanced function to try loading all data from tables
  function tryLoadAllData() {
    console.log('Attempting to load all table data...');
    
    // Common selectors for "Show All" or "Load All" buttons
    const showAllSelectors = [
      'button[title*="Show All"]',
      'button[title*="Load All"]',
      'a[title*="Show All"]',
      '.show-all-btn',
      '.load-all-btn'
    ];
    
    // Try clicking show all buttons first
    for (const selector of showAllSelectors) {
      try {
        const button = document.querySelector(selector);
        if (button) {
          console.log('Found show all button:', button);
          button.click();
          return true;
        }
      } catch (error) {
        console.log('Error with selector:', selector, error);
      }
    }
    
    // Look for buttons with text content containing "Show All" or "Load All"
    const allButtons = document.querySelectorAll('button, a');
    for (const button of allButtons) {
      const text = button.textContent.toLowerCase().trim();
      if (text.includes('show all') || text.includes('load all') || text === 'all') {
        console.log('Found show all button by text:', button);
        button.click();
        return true;
      }
    }
    
    // Enhanced Quasar table handling
    const quasarDropdowns = [
      '.q-table__select .q-select__dropdown-icon',
      '.q-field--borderless.q-select .q-select__dropdown-icon', 
      '.q-table__bottom .q-select .q-select__dropdown-icon',
      '.q-select__dropdown-icon'
    ];
    
    for (const selector of quasarDropdowns) {
      try {
        const dropdown = document.querySelector(selector);
        if (dropdown) {
          console.log('Found Quasar dropdown:', selector);
          
          // Click the dropdown to open it
          dropdown.click();
          
          setTimeout(() => {
            // Look for "All" option in various ways
            const allOptions = [
              ...document.querySelectorAll('.q-menu .q-item'),
              ...document.querySelectorAll('.q-menu .q-item__section'),
              ...document.querySelectorAll('.pagination-option'),
              ...document.querySelectorAll('[role="option"]')
            ];
            
            console.log(`Found ${allOptions.length} dropdown options`);
            
            // Find the "All" option or the highest number
            let bestOption = null;
            let highestNumber = 0;
            
            for (const option of allOptions) {
              const text = option.textContent.trim().toLowerCase();
              console.log('Checking option:', text);
              
              if (text === 'all' || text.includes('all')) {
                bestOption = option;
                console.log('Found "All" option');
                break;
              }
              
              // Check for highest number
              const number = parseInt(text);
              if (!isNaN(number) && number > highestNumber) {
                highestNumber = number;
                bestOption = option;
              }
            }
            
            if (bestOption) {
              console.log('Clicking best option:', bestOption.textContent);
              bestOption.click();
            } else {
              console.log('No suitable option found, trying last option');
              const lastOption = allOptions[allOptions.length - 1];
              if (lastOption) {
                lastOption.click();
              }
            }
          }, 1000); // Increased delay to ensure dropdown is fully open
          
          return true;
        }
      } catch (error) {
        console.log('Error with Quasar selector:', selector, error);
      }
    }
    
    console.log('No load all buttons or dropdowns found');
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
      '.data-table-header',
      '.table-wrapper',
      'table'
    ];

    let targetContainer = null;
    for (const selector of containers) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        targetContainer = elements[0]; // Use the first found container
        console.log('Found container for download button:', selector);
        break;
      }
    }

    if (targetContainer) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'table-sniffer-download-btn q-btn q-btn-item non-selectable no-outline q-btn--outline q-btn--rectangle text-blue-grey-6 q-btn--actionable q-focusable q-hoverable q-mr-sm';
      downloadBtn.style.cssText = 'font-size: 15px; margin: 10px; position: relative; z-index: 1000; background: white; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer;';
      downloadBtn.innerHTML = `
        <span class="q-focus-helper"></span>
        <span class="q-btn__content text-center col items-center q-anchor--skip justify-center row">
          <i class="q-icon on-left notranslate material-icons" aria-hidden="true" role="img">download</i>
          <span class="block">Download CSV</span>
        </span>
      `;
      
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Download button clicked, starting auto-download...');
        
        // Show loading state
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `
          <span class="q-focus-helper"></span>
          <span class="q-btn__content text-center col items-center q-anchor--skip justify-center row">
            <i class="q-icon on-left notranslate material-icons" aria-hidden="true" role="img">hourglass_empty</i>
            <span class="block">Loading...</span>
          </span>
        `;
        downloadBtn.disabled = true;
        
        // Function to restore button state
        const restoreButton = () => {
          downloadBtn.innerHTML = originalText;
          downloadBtn.disabled = false;
        };
        
        try {
          // First, try to load all data
          console.log('Attempting to expand table...');
          const loadAllClicked = tryLoadAllData();
          
          if (loadAllClicked) {
            console.log('Load all triggered, waiting for table to complete loading...');
            setTimeout(() => {
              try {
                autoDownloadLargestTable();
                restoreButton();
              } catch (error) {
                console.error('Error during delayed download:', error);
                restoreButton();
              }
            }, 5000); // Wait 5 seconds for table to load
          } else {
            console.log('No load all option found, downloading current table state...');
            try {
              autoDownloadLargestTable();
              restoreButton();
            } catch (error) {
              console.error('Error during immediate download:', error);
              restoreButton();
            }
          }
        } catch (error) {
          console.error('Error in download process:', error);
          restoreButton();
        }
      });

      // Insert the button appropriately
      if (targetContainer.tagName.toLowerCase() === 'table') {
        // If target is a table, create a wrapper div
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; margin-bottom: 10px;';
        wrapper.appendChild(downloadBtn);
        targetContainer.parentNode.insertBefore(wrapper, targetContainer);
      } else if (targetContainer.querySelector('.q-space')) {
        // For Quasar tables, insert before the spacer
        targetContainer.insertBefore(downloadBtn, targetContainer.querySelector('.q-space'));
      } else {
        // Insert at the beginning of the container
        targetContainer.insertBefore(downloadBtn, targetContainer.firstChild);
      }
      
      console.log('Download button injected successfully');
    } else {
      console.log('No suitable container found for download button');
    }
  }

  // Function to continuously check for tables and inject button
  function checkAndInjectButton() {
    const tables = document.querySelectorAll('table');
    if (tables.length > 0 && !document.querySelector('.table-sniffer-download-btn')) {
      console.log('Tables detected, injecting download button...');
      injectDownloadButton();
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
    console.log('Starting autoDownloadLargestTable...');
    
    try {
      const tables = detectTables(true);
      console.log(`Found ${tables.length} tables`);
      
      if (tables.length === 0) {
        console.log('No tables found for auto-download');
        alert('No tables found on this page');
        return;
      }

      // Find the largest table by row count
      const largestTable = tables.reduce((max, table) => 
        table.rows > max.rows ? table : max
      );

      console.log(`Auto-downloading largest table (ID: ${largestTable.id}, ${largestTable.rows} rows, ${largestTable.cols} cols)`);
      
      const data = getTableData(largestTable.id);
      console.log('Retrieved table data:', data ? `${data.length} rows` : 'null');
      
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

        console.log(`CSV content created, length: ${csv.length} characters`);

        // Download the CSV
        const filename = `table-export-${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        console.log('Triggering download...');
        link.click();
        
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log(`CSV downloaded: ${filename} (${data.length} rows)`);
        alert(`CSV downloaded successfully! File: ${filename} (${data.length} rows)`);
      } else {
        console.error('No data retrieved from table');
        alert('No data found in table');
      }
    } catch (error) {
      console.error('Error in autoDownloadLargestTable:', error);
      alert(`Download failed: ${error.message}`);
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
        }, 3000); // Increased delay to ensure page is fully loaded
      }
    });
  }

  // Initialize auto-download check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkForAutoDownload();
      checkAndInjectButton();
    });
  } else {
    checkForAutoDownload();
    checkAndInjectButton();
  }

  // Set up observers to detect new tables and inject buttons
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'TABLE' || node.querySelector('table')) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldCheck) {
      setTimeout(checkAndInjectButton, 1000); // Delay to ensure DOM is stable
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also inject button immediately if tables are already present
  setTimeout(checkAndInjectButton, 2000);
})();
