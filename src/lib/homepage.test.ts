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
      { topic: 'technology', noteIds: ['newest', 'third', 'fourth'] },
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

  test('returns all eight homepage topics in editorial order with three cards each', () => {
    const topics = [
      'attention',
      'craft',
      'learning',
      'media',
      'books',
      'game',
      'society',
      'technology',
    ];
    const notes = topics.flatMap((topic, topicIndex) =>
      Array.from({ length: 3 }, (_, noteIndex) =>
        note(`${topic}-${noteIndex}`, topicIndex * 3 + noteIndex, [topic]),
      ),
    );

    const result = selectHomepageContent(notes);

    assert.deepEqual(result.topicGroups.map(({ topic }) => topic), topics);
    assert.ok(result.topicGroups.every(({ noteIds }) => noteIds.length === 3));
  });
});
