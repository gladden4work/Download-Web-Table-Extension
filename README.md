# Table Sniffer Chrome Extension

This extension detects HTML tables on any page and adds a **Download CSV** button to the top-left corner of each table. Clicking the button exports that table as CSV. Before downloading, the extension tries to expand paginated tables to show all rows. A background service worker handles the file download. A popup UI is also available for preview and clipboard copy.

## Features

- Inline download button on every detected table
- Buttons appear for tables added dynamically after page load
- Preview table contents via popup
- Download as CSV or copy as TSV
- Options for delimiter and line endings
- Automatically expands paginated tables, including custom dropdowns like Quasar,
  and waits up to 5 seconds for all rows to load before export

## Development

Run the simple unit test:

```bash
node test/run.js
```

Load the extension in Chrome via `chrome://extensions` (Developer mode) and selecting this directory.
