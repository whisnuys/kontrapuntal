import { getDiscoverableNotes } from '../lib/content.ts';
import { buildSitemapXml, type SitemapEntry } from '../lib/sitemap.ts';

export async function GET(context: { site?: URL }) {
  const site = context.site ?? new URL('https://kontrapuntal.whisnuys.com');
  const notes = await getDiscoverableNotes();
  const topics = [...new Set(notes.flatMap(({ data }) => data.topics))].sort();
  const staticPages: SitemapEntry[] = [
    { pathname: '/' },
    { pathname: '/notes' },
    { pathname: '/topics' },
    { pathname: '/library' },
    { pathname: '/about' },
  ];
  const notePages: SitemapEntry[] = notes.map((note) => ({
    pathname: `/notes/${note.id}`,
    lastModified: note.data.updatedAt ?? note.data.publishedAt,
  }));
  const topicPages: SitemapEntry[] = topics.map((topic) => ({ pathname: `/topics/${topic}` }));

  return new Response(buildSitemapXml(site, [...staticPages, ...notePages, ...topicPages]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
