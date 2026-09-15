export function GET(context: { site?: URL }) {
  const site = context.site ?? new URL('https://kontrapuntal.whisnuys.com');
  const body = `User-agent: *
Allow: /
Disallow: /nulis/
Disallow: /api/cms/

Sitemap: ${new URL('/sitemap-index.xml', site).href}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
