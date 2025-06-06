const assert = require('assert');
const { encodeCsv } = require('../util');

const data = [['a', 'b,c', 'd"e'], ['1', '2', '3']];
const expected = 'a,"b,c","d""e"\n1,2,3';
assert.strictEqual(encodeCsv(data), expected);
console.log('encodeCsv test passed');
