export function GET(context: { site?: URL }) {
  const site = context.site ?? new URL('https://kontrapuntal.whisnuys.com');
  const sitemapUrl = new URL('/sitemap-0.xml', site).href;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${sitemapUrl}</loc></sitemap>
</sitemapindex>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
