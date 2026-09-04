import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isApprovedStringImageSource } from './media-policy.ts';

describe('structured image source policy', () => {
  test('accepts legacy root-relative paths', () => {
    assert.equal(isApprovedStringImageSource('/images/uploads/existing.webp'), true);
  });

  test('accepts secure assets from the configured Cloudinary cloud', () => {
    assert.equal(
      isApprovedStringImageSource(
        'https://res.cloudinary.com/c8tgycuw/image/upload/f_auto,q_auto/kontrapuntal/example.webp',
      ),
      true,
    );
  });

  test('rejects untrusted string image sources', () => {
    assert.equal(isApprovedStringImageSource('//example.com/image.webp'), false);
    assert.equal(isApprovedStringImageSource('http://res.cloudinary.com/c8tgycuw/image/upload/example.webp'), false);
    assert.equal(isApprovedStringImageSource('https://example.com/image.webp'), false);
    assert.equal(isApprovedStringImageSource('https://res.cloudinary.com/another-cloud/image/upload/example.webp'), false);
    assert.equal(isApprovedStringImageSource('images/example.webp'), false);
  });
});
