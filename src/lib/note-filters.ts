import {
  CONTENT_TYPES,
  NOTE_FORMATS,
  type ContentType,
  type NoteFormat,
} from './content-policy.ts';

export interface FilterableNote {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  format: NoteFormat;
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
  type: ContentType | '';
  topic: string;
  format: NoteFormat | '';
}

function isContentType(value: string): value is ContentType {
  return CONTENT_TYPES.some((type) => type === value);
}

function isNoteFormat(value: string): value is NoteFormat {
  return NOTE_FORMATS.some((format) => format === value);
}

export function parseNoteFilters(params: URLSearchParams): NoteFilters {
  const type = params.get('type')?.trim().toLowerCase() ?? '';
  const format = params.get('format')?.trim().toLowerCase() ?? '';

  return {
    q: params.get('q')?.trim().toLowerCase() ?? '',
    type: isContentType(type) ? type : '',
    topic: params.get('topic')?.trim().toLowerCase() ?? '',
    format: isNoteFormat(format) ? format : '',
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
      (!filters.type || note.contentType === filters.type) &&
      (!filters.topic || note.topics.includes(filters.topic)) &&
      (!filters.format || note.format === filters.format)
    );
  });
}
