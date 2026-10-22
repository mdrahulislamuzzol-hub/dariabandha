import assert from 'node:assert/strict';
import test from 'node:test';
import { drawMulberry32 } from '../../src/rules/random.js';

test('Mulberry32 matches known uint32 seed vectors and returns advanced state', () => {
  assert.deepEqual(drawMulberry32(0), { value: 0.26642920868471265, state: 1831565813 });
  assert.deepEqual(drawMulberry32(1), { value: 0.6270739405881613, state: 1831565814 });
  assert.throws(() => drawMulberry32(-1), /unsigned 32-bit integer/);
});
