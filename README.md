# Table Sniffer Chrome Extension

This extension detects HTML tables on the active page and allows exporting them to CSV or copying to the clipboard for Excel.

## Features

- Lists visible tables on the current page
- Preview table contents
- Download as CSV or copy as TSV
- Options for delimiter and line endings

## Development

Run the simple unit test:

```bash
node test/run.js
```

Load the extension in Chrome via `chrome://extensions` (Developer mode) and selecting this directory.
