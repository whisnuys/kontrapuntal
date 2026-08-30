export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatAuthorNames(names: string[]): string {
  if (names.length === 0) {
    throw new Error('A byline requires at least one author.');
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
}

export function noteHref(id: string): string {
  return `/notes/${id}`;
}

export function topicHref(topic: string): string {
  return `/topics/${encodeURIComponent(topic)}`;
}
