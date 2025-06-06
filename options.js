document.addEventListener('DOMContentLoaded', () => {
  const detect = document.getElementById('detectOnClickOnly');
  const showHidden = document.getElementById('showHiddenTables');
  const delimiter = document.getElementById('delimiter');
  const lineEnding = document.getElementById('lineEnding');

  chrome.storage.sync.get({
    detectOnClickOnly: false,
    showHiddenTables: false,
    delimiter: ',',
    lineEnding: '\n'
  }, items => {
    detect.checked = items.detectOnClickOnly;
    showHidden.checked = items.showHiddenTables;
    delimiter.value = items.delimiter;
    lineEnding.value = items.lineEnding;
  });

  document.getElementById('save').addEventListener('click', () => {
    chrome.storage.sync.set({
      detectOnClickOnly: detect.checked,
      showHiddenTables: showHidden.checked,
      delimiter: delimiter.value,
      lineEnding: lineEnding.value
    }, () => {
      alert('Options saved');
    });
  });
});
