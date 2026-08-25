import rss from '@astrojs/rss';

import { getDiscoverableNotes } from '../lib/content.ts';

export async function GET(context: { site?: URL }) {
  const notes = await getDiscoverableNotes();

  return rss({
    title: 'Kontrapuntal',
    description: 'Essays, criticism, and notes in counterpoint.',
    site: context.site ?? new URL('https://kontrapuntal.whisnuys.com'),
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.publishedAt,
      link: `/notes/${note.id}`,
      categories: note.data.topics,
    })),
    customData: '<language>en</language>',
  });
}
