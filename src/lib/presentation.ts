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

export function noteHref(id: string): string {
  return `/notes/${id}`;
}

export function topicHref(topic: string): string {
  return `/topics/${encodeURIComponent(topic)}`;
}
