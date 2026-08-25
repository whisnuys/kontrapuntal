import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildSitemapXml, xmlEscape, type SitemapEntry } from './sitemap.ts';

describe('xmlEscape', () => {
  test('escapes XML-sensitive URL characters', () => {
    assert.equal(xmlEscape('https://example.com/?a=1&b=<two>'), 'https://example.com/?a=1&amp;b=&lt;two&gt;');
  });
});

describe('buildSitemapXml', () => {
  test('serializes canonical locations and optional last-modified dates', () => {
    const entries: SitemapEntry[] = [
      { pathname: '/', lastModified: new Date('2026-08-21T00:00:00Z') },
      { pathname: '/notes' },
    ];
    const xml = buildSitemapXml(new URL('https://kontrapuntal.example'), entries);

    assert.match(xml, /<loc>https:\/\/kontrapuntal\.example\/<\/loc>/);
    assert.match(xml, /<lastmod>2026-08-21T00:00:00\.000Z<\/lastmod>/);
    assert.match(xml, /<loc>https:\/\/kontrapuntal\.example\/notes<\/loc>/);
  });
});
