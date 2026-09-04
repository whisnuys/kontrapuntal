import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isOptionalSourceComplete, isOptionalSourceEmpty } from './source-policy.ts';

describe('optional note source policy', () => {
  test('accepts an omitted or empty source object', () => {
    assert.equal(isOptionalSourceComplete(undefined), true);
    assert.equal(isOptionalSourceComplete({}), true);
    assert.equal(isOptionalSourceComplete({ type: '', title: '' }), true);
    assert.equal(isOptionalSourceEmpty(undefined), true);
    assert.equal(isOptionalSourceEmpty({ type: '', title: '' }), true);
    assert.equal(isOptionalSourceEmpty({ type: 'book', title: 'A Book' }), false);
  });

  test('requires type and title only when source details are entered', () => {
    assert.equal(isOptionalSourceComplete({ type: 'book', title: 'A Book' }), true);
    assert.equal(isOptionalSourceComplete({ type: 'book' }), false);
    assert.equal(isOptionalSourceComplete({ title: 'A Book' }), false);
    assert.equal(isOptionalSourceComplete({ creator: 'A Creator' }), false);
  });
});
