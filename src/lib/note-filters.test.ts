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
    contentType: 'technology',
    format: 'essay',
    topics: ['technology', 'culture'],
    source: undefined,
  },
  {
    id: 'book-margin',
    title: 'A Note from the Margin',
    description: 'Observations from a book.',
    contentType: 'book',
    format: 'reflection',
    topics: ['books'],
    source: { type: 'book', title: 'A demonstration book' },
  },
];

describe('parseNoteFilters', () => {
  test('normalizes valid query values and discards unsupported enum values', () => {
    const parsed = parseNoteFilters(
      new URLSearchParams('q=%20ATTENTION%20&type=technology&topic=technology&format=essay'),
    );
    assert.deepEqual(parsed, {
      q: 'attention',
      type: 'technology',
      topic: 'technology',
      format: 'essay',
    });

    assert.deepEqual(parseNoteFilters(new URLSearchParams('type=report&format=thread')), {
      q: '',
      type: '',
      topic: '',
      format: '',
    });
  });
});

describe('filterNotes', () => {
  test('uses AND semantics across text, type, topic, and format filters', () => {
    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        type: 'technology',
        topic: 'technology',
        format: 'essay',
      }).map(({ id }) => id),
      ['signal-and-noise'],
    );

    assert.deepEqual(
      filterNotes(fixtures, {
        q: 'attention',
        type: 'book',
        topic: '',
        format: '',
      }),
      [],
    );
  });

  test('searches title, description, topics, and source case-insensitively', () => {
    const emptyFacets = { type: '', topic: '', format: '' } as const;

    assert.equal(filterNotes(fixtures, { q: 'MARGIN', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'observations', ...emptyFacets })[0]?.id, 'book-margin');
    assert.equal(filterNotes(fixtures, { q: 'culture', ...emptyFacets })[0]?.id, 'signal-and-noise');
    assert.equal(filterNotes(fixtures, { q: 'demonstration book', ...emptyFacets })[0]?.id, 'book-margin');
  });
});
