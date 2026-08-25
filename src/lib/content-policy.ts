export const NOTE_STATUSES = ['draft', 'published', 'archived'] as const;
export const CONTENT_TYPES = [
  'book',
  'game',
  'video',
  'podcast',
  'technology',
  'issue',
  'learning',
  'career',
  'thought',
] as const;
export const NOTE_FORMATS = ['quick-note', 'reflection', 'essay'] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type NoteFormat = (typeof NOTE_FORMATS)[number];

export interface NoteSummary {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  status: NoteStatus;
  contentType: ContentType;
  format: NoteFormat;
  topics: string[];
  featured?: boolean;
  source?: {
    type: string;
    title: string;
    creator?: string;
    url?: string;
  };
}

export function isDiscoverable(note: NoteSummary): boolean {
  return note.status === 'published';
}

export function isRoutable(note: NoteSummary): boolean {
  return note.status === 'published' || note.status === 'archived';
}

export function sortNotesNewest(notes: readonly NoteSummary[]): NoteSummary[] {
  return [...notes].sort((left, right) => {
    const byDate = right.publishedAt.getTime() - left.publishedAt.getTime();
    return byDate || left.id.localeCompare(right.id);
  });
}

export function selectLeadNote(notes: readonly NoteSummary[]): NoteSummary | undefined {
  const discoverable = sortNotesNewest(notes.filter(isDiscoverable));
  return discoverable.find(({ featured }) => featured) ?? discoverable[0];
}

export function rankRelatedNotes(
  current: NoteSummary,
  candidates: readonly NoteSummary[],
  limit = 3,
): NoteSummary[] {
  const currentTopics = new Set(current.topics);

  return candidates
    .filter((candidate) => candidate.id !== current.id && isDiscoverable(candidate))
    .map((candidate) => ({
      candidate,
      sharedTopics: candidate.topics.filter((topic) => currentTopics.has(topic)).length,
    }))
    .filter(({ sharedTopics }) => sharedTopics > 0)
    .sort((left, right) => {
      const byTopics = right.sharedTopics - left.sharedTopics;
      const byDate = right.candidate.publishedAt.getTime() - left.candidate.publishedAt.getTime();
      return byTopics || byDate || left.candidate.id.localeCompare(right.candidate.id);
    })
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().match(/\S+/g)?.length ?? 0;
  return words === 0 ? 0 : Math.ceil(words / 225);
}
