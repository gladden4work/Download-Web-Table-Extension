function escapeCsvCell(cell, delimiter) {
  cell = cell.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const needsQuote = cell.includes('"') || cell.includes(delimiter) || cell.includes('\n');
  cell = cell.replace(/"/g, '""');
  return needsQuote ? `"${cell}"` : cell;
}

function encodeCsv(data, delimiter = ',', lineEnd = '\n') {
  return data
    .map(row => row.map(cell => escapeCsvCell(String(cell ?? ''), delimiter)).join(delimiter))
    .join(lineEnd);
}

function downloadCsv(filename, csvText) {
  const blobUrl = URL.createObjectURL(new Blob(['\uFEFF' + csvText], { type: 'text/csv' }));
  chrome.downloads.download({ url: blobUrl, filename }, () => {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });
}

function copyText(text) {
  return navigator.clipboard.writeText(text).catch(() => {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: t => {
              const textarea = document.createElement('textarea');
              textarea.value = t;
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              textarea.remove();
            },
            args: [text]
          },
          () => resolve()
        );
      });
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { encodeCsv, escapeCsvCell };
}
