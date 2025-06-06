chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'downloadCsv' && msg.csv && msg.filename) {
    const blob = new Blob([msg.csv], { type: 'text/csv' });
    let blobUrl;
    const URLObject = (self && self.URL) || URL;
    if (URLObject && typeof URLObject.createObjectURL === 'function') {
      blobUrl = URLObject.createObjectURL(blob);
    } else {
      blobUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(msg.csv);
    }
    chrome.downloads.download({ url: blobUrl, filename: msg.filename }, () => {
      if (blobUrl.startsWith('blob:') && URLObject && URLObject.revokeObjectURL) {
        setTimeout(() => URLObject.revokeObjectURL(blobUrl), 1000);
      }
    });
  }
});
