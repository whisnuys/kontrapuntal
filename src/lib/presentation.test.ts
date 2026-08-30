import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatAuthorNames } from './presentation.ts';

describe('formatAuthorNames', () => {
  test('preserves editorial author order for one to four names', () => {
    assert.equal(formatAuthorNames(['Whisnu Ys']), 'Whisnu Ys');
    assert.equal(formatAuthorNames(['Whisnu Ys', 'Second Writer']), 'Whisnu Ys & Second Writer');
    assert.equal(
      formatAuthorNames(['Whisnu Ys', 'Second Writer', 'Third Writer']),
      'Whisnu Ys, Second Writer & Third Writer',
    );
    assert.equal(
      formatAuthorNames(['Whisnu Ys', 'Second Writer', 'Third Writer', 'Fourth Writer']),
      'Whisnu Ys, Second Writer, Third Writer & Fourth Writer',
    );
  });

  test('rejects an empty byline instead of rendering anonymous metadata', () => {
    assert.throws(() => formatAuthorNames([]), /at least one author/i);
  });
});
