# 📊 Web Table Auto-Download Extension

A powerful Chrome extension that automatically detects tables on web pages, intelligently loads all table data (including paginated content), and downloads them as CSV files without requiring manual interaction. Perfect for data extraction from web applications, especially those using modern frameworks like Quasar Vue.js.

## ✨ Key Features

### 🚀 **Intelligent Auto-Download**
- **Smart Button Detection**: Automatically finds and clicks "Show All", "Load All", or pagination controls
- **Framework Support**: Enhanced support for Quasar Vue.js, React tables, and other modern frameworks
- **Table Monitoring**: Waits for complete data loading using advanced DOM change detection
- **One-Click Download**: Downloads CSV files without requiring popup interaction
- **Domain Management**: Enable automatic downloads for specific websites

### 🎯 **Advanced Table Detection**
- **Dynamic Content**: Works with AJAX-loaded and dynamically generated tables
- **Pagination Handling**: Automatically expands paginated tables to show all records
- **Hidden Table Support**: Option to include hidden or off-screen tables
- **Multi-Table Pages**: Automatically selects the largest/most relevant table

### 📋 **Export Options**
- **CSV Export**: Properly formatted CSV with UTF-8 BOM for Excel compatibility
- **TSV Copy**: Copy as tab-separated values for direct Excel pasting
- **Custom Formatting**: Configurable delimiters and line endings
- **Data Integrity**: Proper escaping for quotes, commas, and newlines

## 🛠 Installation

### From Source (Recommended)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/gladden4work/Download-Web-Table-Extension.git
   cd Download-Web-Table-Extension
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the extension directory
   - The extension icon should appear in your toolbar

3. **Verify Installation**:
   - Visit any page with tables (try the included `debug-test.html`)
   - Look for the auto-injected "Download CSV" button
   - Check that the extension icon shows detected tables

## 🎮 Usage Guide

### 🔄 **Auto-Download Mode** (Recommended)

#### Quick One-Time Download
1. **Navigate** to any page with tables
2. **Look for** the automatically injected "Download CSV" button (appears near tables)
3. **Click** the button - it will:
   - Automatically expand paginated tables
   - Wait for all data to load
   - Download the complete dataset as CSV

#### Enable Domain Auto-Download
1. **Click** the extension icon in your toolbar
2. **Click** "Enable Auto Download" button
3. **Automatic behavior**: Now whenever you visit pages on this domain:
   - Tables will be automatically detected
   - Pagination will be expanded
   - CSV will download without any clicks

### 📋 **Manual Mode** (Traditional)

1. **Click** the extension icon to see all detected tables
2. **Preview** table contents by clicking "Preview"
3. **Export** using "Download CSV" or "Copy Excel" buttons

## 🔧 How It Works

### 🎯 **Intelligent Detection System**
```
Page Load → Table Detection → Button Injection → User Click → Auto-Expansion → Download
```

1. **Table Detection**: Scans for `<table>` elements with meaningful content
2. **Button Injection**: Adds "Download CSV" buttons near detected tables
3. **Smart Expansion**: Detects and clicks pagination controls:
   - "Show All" / "Load All" buttons
   - Dropdown menus with "All" options
   - Quasar Vue.js pagination controls
   - Maximum value selectors

4. **Loading Monitoring**: Uses `MutationObserver` to detect when data loading completes
5. **CSV Generation**: Creates properly formatted CSV with data integrity

### 🎨 **Framework-Specific Support**

#### Quasar Vue.js Tables
- Detects `.q-table__select` pagination dropdowns
- Handles `.q-menu .q-item` option selection
- Monitors `.q-table__bottom-item` pagination info
- Waits for complete data loading before download

#### Generic Tables
- Searches for common "Show All" button patterns
- Handles various pagination implementations
- Supports AJAX-loaded content

## 🧪 Testing

### Run Test Suite
```bash
# Core functionality tests
node test/test-auto-download.js

# Quasar-specific tests  
node test/test-quasar.js

# All tests
npm test
```

### Manual Testing
```bash
# Start local server
python3 -m http.server 8000

# Test pages available:
# http://localhost:8000/debug-test.html - Simple table test
# http://localhost:8000/test-page.html - Pagination simulation
# http://localhost:8000/test-quasar-page.html - Quasar framework test
```

## ⚙️ Configuration

### Storage Options
| Option | Default | Description |
|--------|---------|-------------|
| `delimiter` | `','` | CSV field separator |
| `lineEnding` | `'\n'` | Line ending character |
| `showHiddenTables` | `false` | Include hidden tables |
| `autoDownloadDomains` | `[]` | Domains with auto-download enabled |

### Advanced Settings
Access via extension popup → Settings (gear icon):
- **Timeout Settings**: Adjust wait times for slow-loading tables
- **Selector Customization**: Add custom button selectors
- **Debug Mode**: Enable detailed console logging

## 🐛 Recent Bug Fixes & Improvements

### ✅ **Critical Fixes Applied**
- **Fixed CSS Selector Error**: Resolved invalid `:contains()` selectors causing download failures
- **Enhanced Button Injection**: Now automatically appears without extension interaction
- **Improved Quasar Support**: Better dropdown detection and option selection
- **Robust Error Handling**: Comprehensive try-catch blocks and user feedback
- **Loading State Management**: Visual feedback during download process

### 🔄 **Performance Improvements**
- **Optimized DOM Monitoring**: Reduced CPU usage with smarter change detection
- **Better Memory Management**: Proper cleanup of observers and event listeners
- **Faster Table Detection**: Improved selector performance

### 🎯 **Enhanced Compatibility**
- **Modern Frameworks**: Better support for React, Vue, Angular tables
- **Dynamic Content**: Improved handling of AJAX-loaded tables
- **Mobile Responsive**: Works on responsive table designs

## 🔌 API Reference

### Content Script Messages
```javascript
// Get detected tables
chrome.tabs.sendMessage(tabId, { action: 'getTables', showHidden: false });

// Get table data
chrome.tabs.sendMessage(tabId, { action: 'getTableData', id: 0 });

// Trigger auto-download
chrome.tabs.sendMessage(tabId, { action: 'autoDownload' });
```

### Storage Schema
```javascript
{
  "autoDownloadDomains": ["example.com", "data-site.org"],
  "delimiter": ",",
  "lineEnding": "\n",
  "showHiddenTables": false
}
```

## 🌐 Browser Compatibility

| Browser | Version | Status |
|---------|---------|---------|
| Chrome | 88+ | ✅ Fully Supported |
| Edge | 88+ | ✅ Fully Supported |
| Brave | Latest | ✅ Tested |
| Opera | Latest | ⚠️ Should work |
| Firefox | N/A | ❌ Not supported (Manifest V3) |

## 🔐 Permissions Required

| Permission | Purpose |
|------------|---------|
| `storage` | Save domain preferences and settings |
| `downloads` | Download CSV files to user's computer |
| `scripting` | Inject content scripts into web pages |
| `activeTab` | Access current tab content for table detection |

## 🚀 Development

### Project Structure
```
table-sniffer-extension/
├── manifest.json          # Extension configuration
├── contentScript.js       # Main table detection logic
├── popup.html/js/css      # Extension popup interface
├── util.js               # CSV utilities
├── test/                 # Test suite
│   ├── test-auto-download.js
│   ├── test-quasar.js
│   └── run.js
├── debug-test.html       # Simple test page
├── test-page.html        # Pagination test
└── test-quasar-page.html # Quasar framework test
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Run tests: `npm test`
4. Commit changes: `git commit -m "Description"`
5. Push and create a Pull Request

## 📞 Support

### Common Issues
- **Button doesn't appear**: Check console for errors, ensure tables are detected
- **Download fails**: Verify browser permissions, check for popup blockers
- **Pagination not working**: Enable debug mode to see detection logs

### Debug Mode
Enable detailed logging by opening browser console and running:
```javascript
localStorage.setItem('tableSnifferDebug', 'true');
```

## 📄 License

MIT License - see LICENSE file for details.

## 🏆 Acknowledgments

- Built for efficient data extraction from modern web applications
- Special thanks to the Quasar Vue.js community for framework insights
- Inspired by the need for automated table data extraction

---

**🎯 Perfect for**: Data analysts, researchers, QA testers, and anyone who needs to extract table data from web applications without manual clicking through pagination.
