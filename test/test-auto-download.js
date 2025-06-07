const assert = require('assert');

// Test the auto-download selector logic
function testLoadAllSelectors() {
    // Mock DOM elements
    const mockElements = [
        { textContent: 'Show All', tagName: 'BUTTON', click: () => console.log('Show All clicked') },
        { textContent: 'Load All Data', tagName: 'BUTTON', click: () => console.log('Load All clicked') },
        { value: 'all', tagName: 'OPTION', selected: false, parentElement: { dispatchEvent: () => {} } }
    ];

    // Test text matching
    const showAllElement = mockElements.find(el => 
        el.textContent && el.textContent.toLowerCase().includes('all')
    );
    
    assert(showAllElement, 'Should find "Show All" element');
    console.log('✓ Auto-download selector detection test passed');
}

// Test CSV escaping for auto-download
function testCsvEscaping() {
    const testData = [
        ['Name', 'Description', 'Price'],
        ['Product "A"', 'Contains, comma', '$100.00'],
        ['Product\nB', 'Multi\nline\ndescription', '$200.00']
    ];

    function escapeCsvCell(cell) {
        cell = String(cell || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const needsQuote = cell.includes('"') || cell.includes(',') || cell.includes('\n');
        cell = cell.replace(/"/g, '""');
        return needsQuote ? `"${cell}"` : cell;
    }

    const csvOutput = testData.map(row => 
        row.map(cell => escapeCsvCell(cell)).join(',')
    ).join('\n');

    const expectedOutput = 'Name,Description,Price\n"Product ""A""","Contains, comma",$100.00\n"Product\nB","Multi\nline\ndescription",$200.00';
    
    assert.strictEqual(csvOutput, expectedOutput, 'CSV escaping should handle quotes, commas, and newlines');
    console.log('✓ CSV escaping test passed');
}

// Test table monitoring logic
function testTableMonitoring() {
    let rowCounts = [5, 10, 15, 15, 15]; // Simulates table loading then stabilizing
    let checkIndex = 0;
    let stableCount = 0;
    let previousRowCount = 0;
    const stableThreshold = 3;
    
    function simulateTableCheck() {
        const currentRowCount = rowCounts[checkIndex] || 15;
        
        if (currentRowCount === previousRowCount) {
            stableCount++;
        } else {
            stableCount = 0;
            previousRowCount = currentRowCount;
        }
        
        checkIndex++;
        return { currentRowCount, stableCount, isComplete: stableCount >= stableThreshold };
    }

    // Simulate monitoring
    let result;
    do {
        result = simulateTableCheck();
    } while (!result.isComplete && checkIndex < rowCounts.length + 3); // Allow extra checks

    assert(result.isComplete, 'Table monitoring should detect when loading is complete');
    assert.strictEqual(result.currentRowCount, 15, 'Should have final row count of 15');
    console.log('✓ Table monitoring test passed');
}

// Run all tests
try {
    testLoadAllSelectors();
    testCsvEscaping();
    testTableMonitoring();
    console.log('\n🎉 All auto-download tests passed!');
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}
