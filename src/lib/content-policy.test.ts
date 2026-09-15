import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  estimateReadingMinutes,
  isDiscoverable,
  isRoutable,
  rankRelatedNotes,
  selectLeadNote,
  sortNotesNewest,
  type NoteSummary,
} from './content-policy.ts';

const note = (overrides: Partial<NoteSummary> = {}): NoteSummary => ({
  id: 'example',
  title: 'Example note',
  description: 'A compact description.',
  publishedAt: new Date('2026-08-20T00:00:00Z'),
  status: 'published',
  format: 'essay',
  topics: ['technology'],
  featured: false,
  ...overrides,
});

describe('publication status policy', () => {
  test('only published notes appear in discovery surfaces', () => {
    assert.equal(isDiscoverable(note({ status: 'published' })), true);
    assert.equal(isDiscoverable(note({ status: 'archived' })), false);
    assert.equal(isDiscoverable(note({ status: 'draft' })), false);
  });

  test('published and archived notes have direct routes, while drafts do not', () => {
    assert.equal(isRoutable(note({ status: 'published' })), true);
    assert.equal(isRoutable(note({ status: 'archived' })), true);
    assert.equal(isRoutable(note({ status: 'draft' })), false);
  });
});

describe('editorial ordering', () => {
  test('sorts newest first without mutating the input', () => {
    const older = note({ id: 'older', publishedAt: new Date('2026-08-01T00:00:00Z') });
    const newer = note({ id: 'newer', publishedAt: new Date('2026-08-21T00:00:00Z') });
    const input = [older, newer];

    assert.deepEqual(sortNotesNewest(input).map(({ id }) => id), ['newer', 'older']);
    assert.deepEqual(input.map(({ id }) => id), ['older', 'newer']);
  });

  test('selects the newest featured note, then falls back to the newest note', () => {
    const newest = note({ id: 'newest', publishedAt: new Date('2026-08-22T00:00:00Z') });
    const featuredOlder = note({
      id: 'featured-older',
      featured: true,
      publishedAt: new Date('2026-08-10T00:00:00Z'),
    });
    const featuredNewer = note({
      id: 'featured-newer',
      featured: true,
      publishedAt: new Date('2026-08-20T00:00:00Z'),
    });

    assert.equal(selectLeadNote([newest, featuredOlder, featuredNewer])?.id, 'featured-newer');
    assert.equal(selectLeadNote([newest, featuredOlder])?.id, 'featured-older');
    assert.equal(selectLeadNote([newest])?.id, 'newest');
    assert.equal(selectLeadNote([]), undefined);
  });

  test('ranks related notes by shared topics, then recency, excluding archived notes', () => {
    const current = note({ id: 'current', topics: ['technology', 'culture'] });
    const twoTopics = note({
      id: 'two-topics',
      topics: ['culture', 'technology'],
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    });
    const oneTopicNew = note({
      id: 'one-new',
      topics: ['technology'],
      publishedAt: new Date('2026-08-21T00:00:00Z'),
    });
    const oneTopicOld = note({
      id: 'one-old',
      topics: ['culture'],
      publishedAt: new Date('2026-06-01T00:00:00Z'),
    });
    const unrelated = note({ id: 'unrelated', topics: ['books'] });
    const archived = note({ id: 'archived', status: 'archived', topics: ['technology', 'culture'] });

    assert.deepEqual(
      rankRelatedNotes(current, [current, oneTopicOld, unrelated, archived, twoTopics, oneTopicNew], 3).map(
        ({ id }) => id,
      ),
      ['two-topics', 'one-new', 'one-old'],
    );
  });
});

describe('reading time', () => {
  test('returns zero for empty text and rounds non-empty prose up by 225 words per minute', () => {
    assert.equal(estimateReadingMinutes(''), 0);
    assert.equal(estimateReadingMinutes('one short note'), 1);
    assert.equal(estimateReadingMinutes(Array.from({ length: 226 }, () => 'word').join(' ')), 2);
  });
});
