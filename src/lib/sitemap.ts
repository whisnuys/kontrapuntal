export interface SitemapEntry {
  pathname: string;
  lastModified?: Date;
}

export function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemapXml(site: URL, entries: readonly SitemapEntry[]): string {
  const urls = entries
    .map(({ pathname, lastModified }) => {
      const location = xmlEscape(new URL(pathname, site).href);
      const modified = lastModified ? `\n    <lastmod>${lastModified.toISOString()}</lastmod>` : '';
      return `  <url>\n    <loc>${location}</loc>${modified}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
