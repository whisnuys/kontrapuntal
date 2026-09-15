import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  filterNotes,
  parseNoteFilters,
  type FilterableNote,
} from './note-filters.ts';

const fixtures: FilterableNote[] = [
  {
    id: 'signal-and-noise',
    title: 'Signal and Noise',
    description: 'An essay about attention and technology.',
    format: 'essay',
    topics: ['technology', 'culture'],
    source: undefined,
  },
  {
    id: 'book-margin',
    title: 'A Note from the Margin',
    description: 'Observations from a book.',
    format: 'thought',
    topics: ['books'],
    source: { type: 'book', title: 'A demonstration book' },
  },
];

describe('parseNoteFilters', () => {
  test('normalizes query values and accepts formats added through the CMS', () => {
    const parsed = parseNoteFilters(
      new URLSearchParams('q=%20ATTENTION%20&topic=technology&format=essay'),
    );
    assert.deepEqual(parsed, {
      q: 'attention',
      topic: 'technology',
      format: 'essay',
    });

    assert.deepEqual(parseNoteFilters(new URLSearchParams('format=thread')), {
      q: '',
      topic: '',
      format: 'thread',
    });
  });
});

describe('filterNotes', () => {
  test('uses AND semantics across text, topic, and format filters', () => {
    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        topic: 'technology',
        format: 'essay',
      }).map(({ id }) => id),
      ['signal-and-noise'],
    );

    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        topic: 'books',
        format: 'thought',
      }),
      [],
    );
  });

  test('searches title, description, topics, and source case-insensitively', () => {
    const emptyFacets = { topic: '', format: '' } as const;

    assert.equal(filterNotes(fixtures, { q: 'MARGIN', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'observations', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'culture', ...emptyFacets })[0]?.id, 'signal-and-noise');
    assert.equal(filterNotes(fixtures, { q: 'demonstration book', ...emptyFacets })[0]?.id, 'book-margin');
  });
});
