export interface FilterableNote {
  id: string;
  title: string;
  description: string;
  format: string;
  topics: string[];
  source?: {
    type: string;
    title: string;
    creator?: string;
    url?: string;
  };
}

export interface NoteFilters {
  q: string;
  topic: string;
  format: string;
}

export function parseNoteFilters(params: URLSearchParams): NoteFilters {
  const format = params.get('format')?.trim().toLowerCase() ?? '';

  return {
    q: params.get('q')?.trim().toLowerCase() ?? '',
    topic: params.get('topic')?.trim().toLowerCase() ?? '',
    format,
  };
}

export function filterNotes(notes: readonly FilterableNote[], filters: NoteFilters): FilterableNote[] {
  const query = filters.q.toLowerCase();

  return notes.filter((note) => {
    const searchableText = [
      note.title,
      note.description,
      note.source?.type,
      note.source?.title,
      note.source?.creator,
      ...note.topics,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      (!query || searchableText.includes(query)) &&
      (!filters.topic || note.topics.includes(filters.topic)) &&
      (!filters.format || note.format === filters.format)
    );
  });
}
