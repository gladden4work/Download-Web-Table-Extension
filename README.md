# Table Sniffer Chrome Extension

This extension detects HTML tables on any page and adds a **Download CSV** button to the top-right corner of each table. Clicking the button exports that table as CSV. A popup UI is also available for preview and clipboard copy.

## Features

- Inline download button on every detected table
- Preview table contents via popup
- Download as CSV or copy as TSV
- Options for delimiter and line endings

## Development

Run the simple unit test:

```bash
node test/run.js
```

Load the extension in Chrome via `chrome://extensions` (Developer mode) and selecting this directory.
