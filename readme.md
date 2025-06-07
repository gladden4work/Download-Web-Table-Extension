# Web Table Auto-Download Extension

A Chrome extension that automatically detects tables on web pages, loads all table data, and downloads them as CSV files without requiring manual interaction.

## Features

### 🚀 Auto-Download Functionality
- **Automatic "Show All" Detection**: Automatically finds and clicks "Show All", "Load All", or similar buttons to load complete table data
- **Smart Table Monitoring**: Waits for table data to fully load before downloading
- **Direct CSV Download**: Downloads CSV files without requiring UI popup interaction
- **Domain-Based Auto-Download**: Enable automatic downloads for specific websites

### 📊 Manual Table Export
- Detect all tables on any webpage
- Preview table contents before downloading
- Export as CSV or copy as TSV (Excel-friendly)
- Support for hidden tables

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

### Auto-Download Mode

#### Quick Auto-Download
1. Click the extension icon
2. Click the green "Auto Download CSV" button
3. The extension will:
   - Search for "Show All" buttons and click them
   - Wait for the table to fully load
   - Automatically download the largest table as CSV

#### Enable Auto-Download for Domain
1. Click the extension icon
2. Click "Enable Auto Download" button
3. Now whenever you visit pages on this domain, tables will automatically download

### Manual Mode

#### Traditional Table Selection
1. Click the extension icon to see detected tables
2. Click "Preview" next to the table you want to export
3. Click "Download CSV" or "Copy Excel" to export the data

## How It Works

### Auto-Detection Logic
The extension searches for common "load all" patterns:
- Buttons containing "All", "Show All", "Load All"
- Select options with `value="all"` or `value="-1"`
- Pagination controls with "All" options
- Dropdowns with maximum value options

### Table Loading Detection
- Uses `MutationObserver` to monitor DOM changes
- Tracks table row count changes
- Waits for table to stabilize (no changes for 3 seconds)
- 30-second timeout as fallback

### CSV Export
- Proper CSV escaping for quotes, commas, and newlines
- UTF-8 BOM for Excel compatibility
- Auto-generated filenames with current date

## Testing

Run the test suite:
```bash
node test/run.js
node test/test-auto-download.js
```

Test with the included test page:
```bash
# Open test-page.html in Chrome to test the extension
```

## Configuration

### Storage Options
- `delimiter`: CSV delimiter (default: ',')
- `lineEnding`: Line ending character (default: '\n')  
- `showHiddenTables`: Include hidden tables (default: false)
- `autoDownloadDomains`: Array of domains with auto-download enabled

## Bug Fixes Applied

✅ **Fixed Auto-Load Issue**: Extension now automatically detects and clicks "Show All" buttons
✅ **Fixed Table Loading**: Waits for complete table data loading before download
✅ **Fixed UI Bypass**: Direct CSV download without requiring popup interaction
✅ **Enhanced Detection**: Improved selectors for various "load all" button patterns
✅ **Added Monitoring**: Real-time table change detection with stabilization logic

## API Reference

### Content Script Messages
- `getTables`: Get list of detected tables
- `getTableData`: Get data for specific table
- `highlightTable`: Highlight table on page
- `autoDownload`: Trigger auto-download process

### Storage Keys
- `autoDownloadDomains`: Array of enabled domains
- `delimiter`, `lineEnding`, `showHiddenTables`: Export options

## Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Other Chromium-based browsers

## Permissions Required

- `storage`: For saving domain preferences
- `downloads`: For CSV file downloads
- `scripting`: For content script injection
- `activeTab`: For accessing current tab content
