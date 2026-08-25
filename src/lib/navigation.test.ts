import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { NoteSummary } from './content-policy.ts';
import { selectNavigationTopics } from './navigation.ts';

const note = (
  id: string,
  topics: string[],
  overrides: Partial<NoteSummary> = {},
): NoteSummary => ({
  id,
  title: id,
  description: `${id} description`,
  publishedAt: new Date('2026-08-24T00:00:00Z'),
  status: 'published',
  contentType: 'technology',
  format: 'essay',
  topics,
  featured: false,
  ...overrides,
});

describe('selectNavigationTopics', () => {
  test('ranks four published topics by note count with stable alphabetical ties', () => {
    const input = [
      note('one', ['learning', 'craft', 'craft']),
      note('two', ['learning', 'attention']),
      note('three', ['media', 'attention']),
      note('four', ['craft', 'society']),
      note('five', ['learning']),
      note('draft', ['technology'], { status: 'draft' }),
      note('archived', ['books'], { status: 'archived' }),
    ];

    assert.deepEqual(selectNavigationTopics(input), {
      featured: ['learning', 'attention', 'craft', 'media'],
      all: ['attention', 'craft', 'learning', 'media', 'society'],
    });
  });

  test('returns every available topic when fewer than four are published', () => {
    assert.deepEqual(selectNavigationTopics([note('one', ['books']), note('two', ['craft'])]), {
      featured: ['books', 'craft'],
      all: ['books', 'craft'],
    });
  });
});
