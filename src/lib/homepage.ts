import {
  isDiscoverable,
  selectLeadNote,
  sortNotesNewest,
  type NoteSummary,
} from './content-policy.ts';

export const HOMEPAGE_TOPIC_PALETTE = [
  { topic: 'attention', background: '#8B362F', foreground: '#ECE5D8' },
  { topic: 'craft', background: '#FDCDAD', foreground: '#151613' },
  { topic: 'learning', background: '#C9C9C9', foreground: '#151613' },
  { topic: 'media', background: '#6D4540', foreground: '#ECE5D8' },
  { topic: 'books', background: '#9BADA2', foreground: '#151613' },
  { topic: 'game', background: '#8F8F8F', foreground: '#151613' },
  { topic: 'society', background: '#C85A51', foreground: '#151613' },
  { topic: 'technology', background: '#DBCD9F', foreground: '#151613' },
] as const;

export function getHomepageTopicPalette(topic: string) {
  return HOMEPAGE_TOPIC_PALETTE.find((item) => item.topic === topic);
}

export interface HomepageTopicGroup {
  topic: string;
  noteIds: string[];
}

export interface HomepageSelection {
  leadId: string | undefined;
  popularIds: string[];
  latestIds: string[];
  topicGroups: HomepageTopicGroup[];
}

export function selectHomepageContent(notes: readonly NoteSummary[]): HomepageSelection {
  const ordered = sortNotesNewest(notes.filter(isDiscoverable));
  const leadId = selectLeadNote(ordered)?.id;
  const topics = new Map<string, string[]>();

  for (const note of ordered) {
    for (const topic of new Set(note.topics)) {
      const noteIds = topics.get(topic) ?? [];
      noteIds.push(note.id);
      topics.set(topic, noteIds);
    }
  }

  const topicGroups = HOMEPAGE_TOPIC_PALETTE.flatMap(({ topic }) => {
    const noteIds = topics.get(topic) ?? [];
    return noteIds.length >= 3 ? [{ topic, noteIds: noteIds.slice(0, 3) }] : [];
  });

  return {
    leadId,
    popularIds: ordered
      .filter(({ id }) => id !== leadId)
      .slice(0, 4)
      .map(({ id }) => id),
    latestIds: ordered.slice(0, 6).map(({ id }) => id),
    topicGroups,
  };
}
