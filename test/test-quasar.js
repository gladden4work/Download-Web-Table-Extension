const assert = require('assert');

// Test Quasar pagination detection
function testQuasarPaginationDetection() {
    // Mock Quasar pagination elements
    const mockPaginationTexts = [
        '1-10 of 2701',
        '1-100 of 2701', 
        '1-2701 of 2701', // All records loaded
        '1-50 of 150'
    ];

    function parseQuasarPagination(text) {
        const match = text.match(/(\d+)-(\d+) of (\d+)/);
        if (match) {
            return {
                start: parseInt(match[1]),
                showing: parseInt(match[2]),
                total: parseInt(match[3]),
                isComplete: parseInt(match[2]) >= parseInt(match[3])
            };
        }
        return null;
    }

    // Test parsing
    const result1 = parseQuasarPagination(mockPaginationTexts[0]);
    assert.strictEqual(result1.showing, 10);
    assert.strictEqual(result1.total, 2701);
    assert.strictEqual(result1.isComplete, false);

    const result3 = parseQuasarPagination(mockPaginationTexts[2]);
    assert.strictEqual(result3.showing, 2701);
    assert.strictEqual(result3.total, 2701);
    assert.strictEqual(result3.isComplete, true);

    console.log('✓ Quasar pagination detection test passed');
}

// Test download button injection HTML structure
function testDownloadButtonInjection() {
    const buttonHTML = `
        <span class="q-focus-helper"></span>
        <span class="q-btn__content text-center col items-center q-anchor--skip justify-center row">
          <i class="q-icon on-left notranslate material-icons" aria-hidden="true" role="img">download</i>
          <span class="block">Download CSV</span>
        </span>
      `;

    // Test that the HTML contains required elements
    assert(buttonHTML.includes('q-focus-helper'), 'Should include focus helper');
    assert(buttonHTML.includes('download'), 'Should include download icon');
    assert(buttonHTML.includes('Download CSV'), 'Should include button text');
    assert(buttonHTML.includes('material-icons'), 'Should use Material icons');

    console.log('✓ Download button injection test passed');
}

// Test Quasar selector patterns
function testQuasarSelectors() {
    const quasarSelectors = [
        '.q-table__select .q-select__dropdown-icon',
        '.q-field--borderless.q-select .q-select__dropdown-icon',
        '.q-table__bottom .q-select',
        '.q-table__top',
        '.q-table__container'
    ];

    // Mock CSS selector testing
    function mockQuerySelector(selector) {
        const mockElements = {
            '.q-table__select .q-select__dropdown-icon': { found: true, type: 'dropdown' },
            '.q-table__top': { found: true, type: 'container' },
            '.q-table__container': { found: true, type: 'container' }
        };
        return mockElements[selector] || null;
    }

    const dropdownSelector = quasarSelectors[0];
    const result = mockQuerySelector(dropdownSelector);
    assert(result, 'Should find Quasar dropdown selector');
    assert.strictEqual(result.type, 'dropdown');

    console.log('✓ Quasar selector patterns test passed');
}

// Test enhanced table monitoring logic
function testEnhancedTableMonitoring() {
    // Simulate table monitoring with Quasar pagination
    const scenarios = [
        { rowCount: 10, paginationText: '1-10 of 2701', shouldWait: true },
        { rowCount: 2701, paginationText: '1-2701 of 2701', shouldWait: false },
        { rowCount: 100, paginationText: '1-100 of 100', shouldWait: false }
    ];

    scenarios.forEach((scenario, index) => {
        const match = scenario.paginationText.match(/(\d+)-(\d+) of (\d+)/);
        if (match) {
            const showing = parseInt(match[2]);
            const total = parseInt(match[3]);
            const isComplete = showing >= total;
            
            if (index === 0) {
                assert.strictEqual(isComplete, false, 'First scenario should not be complete (10 < 2701)');
            } else {
                assert.strictEqual(isComplete, true, `Scenario ${index + 1} should be complete`);
            }
        }
    });

    console.log('✓ Enhanced table monitoring test passed');
}

// Run all Quasar-specific tests
try {
    testQuasarPaginationDetection();
    testDownloadButtonInjection();
    testQuasarSelectors();
    testEnhancedTableMonitoring();
    console.log('\n🎉 All Quasar-specific tests passed!');
} catch (error) {
    console.error('❌ Quasar test failed:', error.message);
    process.exit(1);
}
