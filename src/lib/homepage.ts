import {
  isDiscoverable,
  selectLeadNote,
  sortNotesNewest,
  type NoteSummary,
} from './content-policy.ts';

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

  const topicGroups = [...topics]
    .map(([topic, noteIds]) => ({ topic, noteIds }))
    .filter(({ noteIds }) => noteIds.length >= 2)
    .sort(
      (left, right) =>
        right.noteIds.length - left.noteIds.length || left.topic.localeCompare(right.topic),
    )
    .slice(0, 3)
    .map(({ topic, noteIds }) => ({ topic, noteIds: noteIds.slice(0, 4) }));

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
