import assert from 'node:assert/strict';
import test from 'node:test';

import { assertValidFormat, assertValidProfile } from '../../src/rules/validation.js';

test('accepts each supported format boundary', () => {
  assert.equal(assertValidFormat('2v2'), '2v2');
  assert.equal(assertValidFormat('4v4'), '4v4');
  assert.equal(assertValidFormat('6v6'), '6v6');
});

test('rejects an unsupported format with its field and value', () => {
  assert.throws(
    () => assertValidFormat('3v3'),
    /^RangeError: format must be one of "2v2", "4v4", "6v6"; received "3v3"$/,
  );
});

test('rejects format coercion attempts', () => {
  assert.throws(
    () => assertValidFormat(2),
    /^TypeError: format must be a string; received 2$/,
  );
});

test('accepts each stable profile id, version, and timing shape', () => {
  const timingShapes = {
    traditional: 'traditional',
    'competitive-standard': 'standard',
    'quick-match': 'quick',
    pro: 'selectable',
  };
  for (const [id, timingShape] of Object.entries(timingShapes)) {
    const profile = { id, version: '0.1', timingShape };
    assert.equal(assertValidProfile(profile), profile);
  }
});

test('rejects missing profile fields with field and value', () => {
  assert.throws(
    () => assertValidProfile({ id: 'traditional' }),
    /^TypeError: profile\.version must be a string; received undefined$/,
  );
});

test('rejects missing, mistyped, and mismatched profile timing shapes', () => {
  assert.throws(
    () => assertValidProfile({ id: 'traditional', version: '0.1' }),
    /^TypeError: profile\.timingShape must be a string; received undefined$/,
  );
  assert.throws(
    () => assertValidProfile({ id: 'traditional', version: '0.1', timingShape: 1 }),
    /^TypeError: profile\.timingShape must be a string; received 1$/,
  );
  assert.throws(
    () => assertValidProfile({ id: 'traditional', version: '0.1', timingShape: 'quick' }),
    /^RangeError: profile\.timingShape must be "traditional" for profile\.id "traditional"; received "quick"$/,
  );
});

test('rejects unknown profile ids and versions without coercion', () => {
  assert.throws(
    () => assertValidProfile({ id: 'quick-match', version: '1' }),
    /^RangeError: profile\.version must be "0\.1" for profile\.id "quick-match"; received "1"$/,
  );
  assert.throws(
    () => assertValidProfile({ id: 'traditional', version: 0.1 }),
    /^TypeError: profile\.version must be a string; received 0\.1$/,
  );
  assert.throws(
    () => assertValidProfile({ id: 'unranked', version: '0.1' }),
    /^RangeError: profile\.id must be one of "traditional", "competitive-standard", "quick-match", "pro"; received "unranked"$/,
  );
});
