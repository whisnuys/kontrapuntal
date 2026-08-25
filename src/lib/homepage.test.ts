import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { NoteSummary } from './content-policy.ts';
import { selectHomepageContent } from './homepage.ts';

const note = (
  id: string,
  daysAgo: number,
  topics: string[],
  overrides: Partial<NoteSummary> = {},
): NoteSummary => ({
  id,
  title: id,
  description: `${id} description`,
  publishedAt: new Date(Date.UTC(2026, 7, 24 - daysAgo)),
  status: 'published',
  contentType: 'technology',
  format: 'essay',
  topics,
  featured: false,
  ...overrides,
});

describe('selectHomepageContent', () => {
  test('builds deterministic sections without mutating the input', () => {
    const input = [
      note('older-feature', 5, ['technology', 'attention'], { featured: true }),
      note('newest', 0, ['technology', 'culture']),
      note('second', 1, ['culture', 'books']),
      note('third', 2, ['technology', 'books']),
      note('fourth', 3, ['technology']),
      note('fifth', 4, ['work']),
      note('draft', -1, ['technology'], { status: 'draft' }),
      note('archived', -2, ['technology'], { status: 'archived' }),
    ];
    const originalIds = input.map(({ id }) => id);

    const result = selectHomepageContent(input);

    assert.equal(result.leadId, 'older-feature');
    assert.deepEqual(result.popularIds, ['newest', 'second', 'third', 'fourth']);
    assert.deepEqual(result.latestIds, [
      'newest',
      'second',
      'third',
      'fourth',
      'fifth',
      'older-feature',
    ]);
    assert.deepEqual(result.topicGroups, [
      { topic: 'technology', noteIds: ['newest', 'third', 'fourth', 'older-feature'] },
      { topic: 'books', noteIds: ['second', 'third'] },
      { topic: 'culture', noteIds: ['newest', 'second'] },
    ]);
    assert.deepEqual(input.map(({ id }) => id), originalIds);
  });

  test('returns reduced sections when there is not enough published content', () => {
    assert.deepEqual(selectHomepageContent([]), {
      leadId: undefined,
      popularIds: [],
      latestIds: [],
      topicGroups: [],
    });
    assert.deepEqual(selectHomepageContent([note('only', 0, ['solo'])]), {
      leadId: 'only',
      popularIds: [],
      latestIds: ['only'],
      topicGroups: [],
    });
  });

  test('ranks topic bands by full note count before limiting their cards', () => {
    const notes = [
      ...Array.from({ length: 5 }, (_, index) => note(`z-${index}`, index, ['z-topic'])),
      ...Array.from({ length: 4 }, (_, index) => note(`a-${index}`, index + 5, ['a-topic'])),
    ];

    const result = selectHomepageContent(notes);

    assert.equal(result.topicGroups[0]?.topic, 'z-topic');
    assert.equal(result.topicGroups[0]?.noteIds.length, 4);
  });
});
