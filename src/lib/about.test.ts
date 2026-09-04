import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const aboutPage = readFileSync(new URL('../pages/about.astro', import.meta.url), 'utf8');

describe('About page portrait', () => {
  test('places the portrait before the body copy with descriptive alternative text', () => {
    const portrait = '<img class="about-portrait" src="/images/uploads/pic-about.webp" alt="A suited skull in profile"';
    const portraitPosition = aboutPage.indexOf('<figure class="about-portrait-frame">');
    const sectionHeadingPosition = aboutPage.indexOf('<h2>What appears here</h2>');

    assert.ok(portraitPosition !== -1);
    assert.ok(aboutPage.includes(portrait));
    assert.ok(portraitPosition < sectionHeadingPosition);
    assert.ok(aboutPage.lastIndexOf('</p>', sectionHeadingPosition) < portraitPosition);
    assert.ok(existsSync(new URL('../../public/images/uploads/pic-about.webp', import.meta.url)));
  });
});
