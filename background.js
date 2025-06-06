chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'downloadCsv' && msg.csv && msg.filename) {
    const blobUrl = URL.createObjectURL(new Blob([msg.csv], { type: 'text/csv' }));
    chrome.downloads.download({ url: blobUrl, filename: msg.filename }, () => {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    });
  }
});
