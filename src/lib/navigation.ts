import { isDiscoverable, type NoteSummary } from './content-policy.ts';

export interface NavigationTopics {
  featured: string[];
  all: string[];
}

export function selectNavigationTopics(notes: readonly NoteSummary[]): NavigationTopics {
  const counts = new Map<string, number>();

  for (const note of notes.filter(isDiscoverable)) {
    for (const topic of new Set(note.topics)) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  const all = [...counts.keys()].sort((left, right) => left.localeCompare(right));
  const featured = [...counts.entries()]
    .sort(([leftTopic, leftCount], [rightTopic, rightCount]) =>
      rightCount - leftCount || leftTopic.localeCompare(rightTopic),
    )
    .slice(0, 4)
    .map(([topic]) => topic);

  return { featured, all };
}
