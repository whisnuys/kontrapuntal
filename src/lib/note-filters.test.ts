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
    authors: ['whisnu-ys', 'fadhina-aqfa-nisa'],
    format: 'essay',
    topics: ['technology', 'culture'],
    source: undefined,
  },
  {
    id: 'book-margin',
    title: 'A Note from the Margin',
    description: 'Observations from a book.',
    authors: ['whisnu-ys'],
    format: 'thought',
    topics: ['books'],
    source: { type: 'book', title: 'A demonstration book' },
  },
];

describe('parseNoteFilters', () => {
  test('normalizes query values and accepts formats added through the CMS', () => {
    const parsed = parseNoteFilters(
      new URLSearchParams('q=%20ATTENTION%20&author=FADHINA-AQFA-NISA&topic=technology&format=essay'),
    );
    assert.deepEqual(parsed, {
      q: 'attention',
      author: 'fadhina-aqfa-nisa',
      topic: 'technology',
      format: 'essay',
    });

    assert.deepEqual(parseNoteFilters(new URLSearchParams('format=thread')), {
      q: '',
      author: '',
      topic: '',
      format: 'thread',
    });
  });
});

describe('filterNotes', () => {
  test('uses AND semantics across text, author, topic, and format filters', () => {
    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        author: 'fadhina-aqfa-nisa',
        topic: 'technology',
        format: 'essay',
      }).map(({ id }) => id),
      ['signal-and-noise'],
    );

    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        author: 'whisnu-ys',
        topic: 'books',
        format: 'thought',
      }),
      [],
    );

    assert.deepEqual(
      filterNotes(fixtures, { q: '', author: 'fadhina-aqfa-nisa', topic: '', format: '' }).map(({ id }) => id),
      ['signal-and-noise'],
    );
  });

  test('searches title, description, topics, and source case-insensitively', () => {
    const emptyFacets = { author: '', topic: '', format: '' } as const;

    assert.equal(filterNotes(fixtures, { q: 'MARGIN', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'observations', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'culture', ...emptyFacets })[0]?.id, 'signal-and-noise');
    assert.equal(filterNotes(fixtures, { q: 'demonstration book', ...emptyFacets })[0]?.id, 'book-margin');
  });
});
