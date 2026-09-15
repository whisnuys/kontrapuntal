import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../.vercel/output/static/', import.meta.url);
const rootPath = root.pathname;
const vercelConfigPath = new URL('../.vercel/output/config.json', import.meta.url).pathname;
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(pathname) {
  return readFileSync(join(rootPath, pathname), 'utf8');
}

function collectTextFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectTextFiles(path) : [path];
  });
}

const requiredFiles = [
  'index.html',
  'notes/index.html',
  'notes/orang-orang-bloomington-dan-kepedulian-yang-mengganggu/index.html',
  'topics/index.html',
  'library/index.html',
  'about/index.html',
  'feed.xml',
  'sitemap-index.xml',
  'sitemap-0.xml',
  'robots.txt',
  'nulis/index.html',
  'nulis/config.yml',
  'nulis/init.js',
  'nulis/preview.css',
];

assert(existsSync(rootPath), '.vercel/output/static/ is missing; run npm run build first.');
for (const file of requiredFiles) assert(existsSync(join(rootPath, file)), `Missing generated route: ${file}`);
assert(!existsSync(join(rootPath, 'admin/index.html')), 'The old /admin editor route must not be generated.');
assert(!existsSync(join(rootPath, 'admin/config.yml')), 'The old /admin CMS assets must not be generated.');

if (existsSync(rootPath)) {
  const files = collectTextFiles(rootPath).filter((file) => /\.(?:html|xml|txt|js|css)$/.test(file));
  const privateSentinels = [
    'PRIVATE-DEMO-WRITING-FOCUS',
    'PRIVATE-DEMO-NEW-WORD',
    'PRIVATE-DEMO-COMMON-MISTAKE',
    'PRIVATE-DEMO-DRAFT-NOTE',
    'PRIVATE-DRAFT-ROUTE-SENTINEL',
    'DRAFT-BODY-ROUTE-SENTINEL',
    'PRIVATE-DEMO-LIBRARY-NOTE',
  ];

  for (const file of files) {
    const output = readFileSync(file, 'utf8');
    for (const sentinel of privateSentinels) {
      assert(!output.includes(sentinel), `Private sentinel ${sentinel} leaked into ${relative(rootPath, file)}.`);
    }
  }
}

for (const surface of ['index.html', 'notes/index.html', 'topics/index.html', 'feed.xml', 'sitemap-0.xml']) {
  if (!existsSync(join(rootPath, surface))) continue;
  const output = read(surface);
  assert(!output.includes('/notes/demo-'), `A removed demo note leaked into ${surface}.`);
}

if (existsSync(join(rootPath, 'notes/orang-orang-bloomington-dan-kepedulian-yang-mengganggu/index.html'))) {
  const publishedPage = read('notes/orang-orang-bloomington-dan-kepedulian-yang-mengganggu/index.html');
  assert(publishedPage.includes('rel="canonical"'), 'Published note is missing its canonical link.');
  assert(publishedPage.includes('application/ld+json'), 'Published note is missing Article JSON-LD.');
  assert(publishedPage.includes('property="og:title"'), 'Published note is missing Open Graph metadata.');
  assert(publishedPage.includes('By Whisnu Ys'), 'Published note is missing its resolved author byline.');
  assert(
    publishedPage.includes('"author":[{"@type":"Person","name":"Whisnu Ys"}]'),
    'Published note JSON-LD is missing its Person author.',
  );
}

if (existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
  const acceptedAdapterRoutes = new Set([
    '^/_server-islands/([^/]+?)/?$',
    '^/_image/?$',
    '^/404/?$',
    '^/.*$',
  ]);
  const applicationFunctionRoutes = vercelConfig.routes
    .filter((route) => route.dest === '_render' && !acceptedAdapterRoutes.has(route.src))
    .map((route) => route.src);
  assert(
    JSON.stringify(applicationFunctionRoutes) ===
      JSON.stringify(['^/api/cms/auth/?$', '^/api/cms/callback/?$']),
    `Unexpected application function routes: ${applicationFunctionRoutes.join(', ') || '(none)'}.`,
  );
} else {
  assert(false, '.vercel/output/config.json is missing.');
}

if (existsSync(join(rootPath, 'topics/books/index.html'))) {
  const booksTopicPage = read('topics/books/index.html');
  assert(
    booksTopicPage.includes('/notes/orang-orang-bloomington-dan-kepedulian-yang-mengganggu'),
    'Books topic page is missing the published Orang-Orang Bloomington note.',
  );
  assert(
    booksTopicPage.includes('--topic-page-divider: #9BADA2'),
    'Books topic page must reuse its homepage color for the existing header divider.',
  );
  const stylesheetHref = booksTopicPage.match(/<link rel="stylesheet" href="([^"]+\.css)">/)?.[1];
  if (stylesheetHref) {
    assert(
      read(stylesheetHref.replace(/^\//, '')).includes('.topic-page-header{border-bottom-color:var(--topic-page-divider,var(--paper))'),
      'Topic page header divider must use the per-topic color custom property.',
    );
  }
}

const editorialStructures = [
  ['index.html', 'data-layout="editorial-front"'],
  ['index.html', 'class="editorial-lead"'],
  ['notes/index.html', 'data-layout="magazine-index"'],
  ['topics/index.html', 'data-layout="topic-directory"'],
  ['library/index.html', 'data-layout="library-directory"'],
  ['about/index.html', 'data-layout="editorial-about"'],
  ['notes/orang-orang-bloomington-dan-kepedulian-yang-mengganggu/index.html', 'data-layout="article-reading"'],
];

for (const [file, marker] of editorialStructures) {
  if (!existsSync(join(rootPath, file))) continue;
  assert(read(file).includes(marker), `${file} is missing the redesigned editorial marker ${marker}.`);
}

if (existsSync(join(rootPath, 'about/index.html'))) {
  const aboutPage = read('about/index.html');
  assert(
    aboutPage.includes('The name is rooted in the Latin phrase') &&
      aboutPage.includes('punctus contra punctum') &&
      aboutPage.includes('Every post here is a record of thinking in progress') &&
      aboutPage.includes('What appears here'),
    'About page is missing the approved Kontrapuntal editorial statement.',
  );
  assert(aboutPage.includes("information that’s not to follow trends"), 'About page must use the corrected contraction.');
  assert(!aboutPage.includes('How it is made'), 'About page must not retain the superseded production-method section.');
}

if (existsSync(join(rootPath, 'index.html'))) {
  const homepage = read('index.html');
  const topicNavigation = homepage.match(
    /<nav[^>]*class="header-topic-nav"[^>]*>([\s\S]*?)<\/nav>/,
  )?.[1];
  const siteMenu = homepage.match(/<dialog[^>]*id="site-menu"[^>]*>([\s\S]*?)<\/dialog>/)?.[1];
  const topicBands = [
    ...homepage.matchAll(
      /<section[^>]*class="[^"]*\btopic-band\b[^"]*"[^>]*>([\s\S]*?)<\/section>/g,
    ),
  ];

  assert(topicBands.length <= 8, `Homepage has ${topicBands.length} topic/category bands; expected at most 8.`);
  for (const [index, topicBand] of topicBands.entries()) {
    const storyCount = (topicBand[1].match(/<article\b/g) ?? []).length;
    assert(
      storyCount === 3,
      `Homepage topic/category band ${index + 1} has ${storyCount} stories; expected exactly 3.`,
    );
  }
  const homepageCards = [...homepage.matchAll(/<article[^>]*class="homepage-card[^"]*"[^>]*>([\s\S]*?)<\/article>/g)];
  assert(
    homepageCards.every(([card]) => card.includes('data-note-reveal')),
    'Homepage story cards must opt into the scroll reveal animation.',
  );
  assert(topicNavigation, 'Homepage is missing the editorial topic navigation.');
  const topicNavigationLinkCount = (topicNavigation?.match(/<a\b/g) ?? []).length;
  assert(
    topicNavigationLinkCount === 2,
    'Editorial topic navigation must contain the two topics present in published content.',
  );
  assert(
    ['/topics/books', '/topics/society']
      .every((href) => topicNavigation?.includes(`href="${href}"`)) &&
      !topicNavigation?.includes('href="/topics/technology"') &&
      !topicNavigation?.includes('href="/#popular"'),
    'Editorial topic navigation must contain only discoverable topics.',
  );
  const popularSection = homepage.match(/<section[^>]*id="popular"[^>]*>([\s\S]*?)<\/section>/)?.[0];
  assert(
    !popularSection || popularSection.includes('id="popular-heading"'),
    'A rendered Homepage Popular section is missing its accessible heading.',
  );
  assert(
    !homepage.includes('masthead-rail__nav'),
    'The superseded Home, Notes, Topics, Library, About navigation rail is still rendered.',
  );
  assert(
    !homepage.includes('masthead-caption'),
    'The removed caption row still renders beneath the masthead wordmark.',
  );
  assert(homepage.includes('class="masthead-wordmark"'), 'Homepage is missing its Kontrapuntal wordmark.');
  assert(
    homepage.includes('rel="icon" type="image/svg+xml" href="/favicon_kp/favicon.svg"'),
    'The site favicon must use the Kontrapuntal favicon asset.',
  );
  assert(
    homepage.includes('src="/images/logo-kp.svg"') && homepage.includes('src="/images/logo-kp-hover.svg"'),
    'The header mark must render its default and hover Kontrapuntal logo assets.',
  );
  assert(
    homepage.includes('class="masthead-wordmark"') &&
      homepage.includes('src="/images/wordmark.svg"') &&
      homepage.includes('src="/images/wordmark-hover.svg"'),
    'The homepage masthead must use the default and hover Kontrapuntal wordmark assets.',
  );
  const footerWordmark = homepage.match(
    /<a[^>]*class="footer-wordmark"[^>]*>([\s\S]*?)<\/a>/,
  )?.[1] ?? '';
  assert(
    footerWordmark.includes('src="/images/wordmark.svg"') &&
      footerWordmark.includes('src="/images/wordmark-hover.svg"'),
    'The footer must use the default and hover Kontrapuntal wordmark assets.',
  );
  assert(siteMenu, 'Homepage is missing the right-side navigation dialog.');
  for (const href of ['/', '/notes', '/topics', '/about', '/feed.xml']) {
    assert(siteMenu?.includes(`href="${href}"`), `Navigation dialog is missing ${href}.`);
  }
  assert(
    !siteMenu?.includes('href="/library"') && !homepage.includes('<a href="/library">Library</a>'),
    'Library must remain unpublished from navigation until its later release batch.',
  );
  assert(
    siteMenu?.includes('href="/topics/books"') && siteMenu.includes('href="/topics/society"'),
    'Navigation dialog does not include every published topic.',
  );
  assert(
    homepage.includes('aria-controls="site-menu"') && homepage.includes('aria-expanded="false"'),
    'Navigation dialog trigger is missing its accessible state and relationship.',
  );
  assert(
    homepage.includes('class="scroll-to-top"') &&
      homepage.includes('aria-label="Scroll to the top"') &&
      homepage.includes('hidden'),
    'Homepage is missing the initially hidden accessible scroll-to-top control.',
  );
  assert(
    homepage.includes('class="header-utility-sentinel"') && !homepage.includes('class="header-sticky"'),
    'Only the utility row should participate in sticky navigation behavior.',
  );
  const homepageUtilityActions = homepage.match(
    /<div[^>]*class="header-utility__actions"[^>]*>([\s\S]*?)<\/div>/,
  )?.[1] ?? '';
  assert(
    homepageUtilityActions.includes('class="notes-filter-trigger"') &&
      homepageUtilityActions.includes('aria-controls="notes-filter-dialog"') &&
      homepageUtilityActions.indexOf('notes-filter-trigger') < homepageUtilityActions.indexOf('href="/feed.xml"'),
    'Every route must render the icon-only Notes filter trigger immediately before RSS.',
  );
  assert(
    homepage.includes('id="notes-filter-dialog"') && homepage.includes('id="note-filters"'),
    'The global header is missing its Notes filter dialog.',
  );
  assert(
    homepageCards.every(([card]) => card.includes('<img ')),
    'Every homepage story card must render an image asset.',
  );
  assert(
    homepage.includes('class="editorial-announcement"'),
    'Homepage CTA is missing its neutral editorial announcement hook.',
  );
  assert(
    !homepage.includes('newsletter-announcement'),
    'Homepage CTA still exposes a generic newsletter class that can trigger cosmetic filters.',
  );

  const stylesheetHref = homepage.match(/<link rel="stylesheet" href="([^"]+\.css)">/)?.[1];
  if (stylesheetHref) {
    const stylesheet = read(stylesheetHref.replace(/^\//, ''));
    assert(
      stylesheet.includes('.homepage-popular{order:2'),
      'Mobile homepage does not place Popular posts after the featured story.',
    );
    assert(
      stylesheet.includes('.home-announcement{order:3'),
      'Mobile homepage does not place the newsletter between Popular posts and Latest notes.',
    );
    assert(
      stylesheet.includes('.homepage-card__read{padding-top:var(--space-3)') &&
        stylesheet.includes('align-self:flex-end'),
      'Homepage card Read links are not aligned to the right.',
    );
    assert(
      stylesheet.includes('.homepage-card{') &&
        stylesheet.includes('flex-direction:column') &&
        stylesheet.includes('.homepage-card__body{') &&
        stylesheet.includes('flex:1'),
      'Homepage cards must stretch their bodies so Read links share a consistent bottom alignment.',
    );
    assert(
      stylesheet.includes('[data-note-reveal].is-reveal-pending{opacity:0;transform:translateY(1rem)') &&
        stylesheet.includes('transition:opacity .42s ease-out,transform .42s ease-out'),
      'The note-card scroll reveal styles are missing.',
    );
    assert(
      stylesheet.includes('.story-card-grid:before,.story-card-grid:after{') &&
        stylesheet.includes('.story-card-grid:has(>.story-card:nth-child(3n+1):last-child):before') &&
        stylesheet.includes('.story-card-grid:has(>.story-card:nth-child(3n+2):last-child):after'),
      'Incomplete story-card grid rows must render empty divider cells on desktop.',
    );
    assert(
      stylesheet.includes('.homepage-card__read span,.topic-band__heading .text-link span{') &&
        stylesheet.includes('transition:transform .18s ease-out') &&
        stylesheet.includes('.topic-band__heading .text-link:is(:hover,:focus-visible) span{transform:translate(.2em)'),
      'Read and More arrows must have a subtle hover and keyboard-focus animation.',
    );
    assert(
      stylesheet.includes('.topic-band__grid a:hover{color:var(--topic-band-ink)') &&
        stylesheet.includes('.topic-band__grid a:focus-visible{outline-color:var(--topic-band-ink)'),
      'Topic card hover and focus states must retain contrast against each topic background.',
    );
    assert(
      stylesheet.includes('.homepage-card__read:is(:hover,:focus-visible){color:inherit;background-color:#0000}') &&
        stylesheet.includes('.topic-band__heading h2 a:hover{color:#c85a51'),
      'Read links must keep their colors while topic heading titles use the accent hover color.',
    );
    assert(
      stylesheet.includes('.topic-band__grid .homepage-card h3 a:hover{color:var(--topic-band-bg);background-color:var(--topic-band-ink)'),
      'Topic card title links must retain a visible contrast-safe hover state.',
    );
    assert(
      ['.editorial-lead h1 a:hover', '.homepage-card h3 a:hover', '.story-card h3 a:hover', '.story-row h3 a:hover', '.thread-block h3 a:hover', '.library-item h3 a:hover']
        .every((selector) => stylesheet.includes(selector)) &&
        stylesheet.includes('color:#c85a51'),
      'All card title links must share the accent hover treatment outside topic bands.',
    );
    assert(
      stylesheet.includes('background-color:var(--paper)') && stylesheet.includes('color:var(--ink)'),
      'Standard card title hovers must invert their normal paper and ink colors.',
    );
    assert(
      stylesheet.includes('.homepage-card__meta{flex-direction:row;align-items:center'),
      'Mobile homepage card metadata is not kept inline with centered alignment.',
    );
    assert(
      stylesheet.includes('.homepage-card__meta{flex-direction:row;align-items:center;gap:.35rem;font-size:.56rem'),
      'Mobile homepage card metadata does not use the compact font size.',
    );
    assert(
      stylesheet.includes('.editorial-lead h1{font-size:clamp(2.25rem,11vw,4.25rem)') &&
        stylesheet.includes('.topic-band__grid>.homepage-card--prominent h3{font-size:clamp(1.45rem,7vw,2rem)'),
      'Mobile lead titles must be smaller than the desktop scale while remaining larger than supporting card titles.',
    );
    const tabletMediaStart = stylesheet.indexOf('@media (width>=48.01rem) and (width<=64rem){');
    const mobileMediaStart = stylesheet.indexOf('@media (width<=48rem){');
    const tabletMedia = stylesheet.slice(
      tabletMediaStart,
      mobileMediaStart > tabletMediaStart ? mobileMediaStart : undefined,
    );
    assert(
      tabletMedia.includes('.editorial-lead h1{font-size:clamp(2.75rem,7vw,4.75rem)') &&
        tabletMedia.includes('.topic-band__grid>.homepage-card--prominent h3{font-size:clamp(2.2rem,3.5vw,3.4rem)') &&
        tabletMedia.includes('.topic-band__supporting .homepage-card h3{font-size:clamp(1.35rem,2.2vw,2.1rem)'),
      'Tablet lead titles must use the compact lead scale while remaining larger than supporting card titles.',
    );
    assert(
      stylesheet.includes('.homepage-card h3{') && stylesheet.includes('overflow-wrap:anywhere'),
      'Homepage card titles must wrap long words at every viewport size.',
    );
    const topicHeadingRule = stylesheet.match(/\.topic-band__heading\{([^}]*)\}/)?.[1] ?? '';
    assert(
      topicHeadingRule.includes('background:var(--ink)') &&
        topicHeadingRule.includes('color:var(--paper)') &&
        topicHeadingRule.includes('border-bottom:var(--space-3) solid var(--topic-band-bg)'),
      'Topic bands must render a dark title panel followed by a topic-color divider strip.',
    );
    assert(
      /@media \(width<=48rem\)\{[^}]*\}[^@]*\.topic-band\{padding:0/.test(stylesheet),
      'Mobile topic bands must not add a topic-color strip above the title panel.',
    );
    assert(
      stylesheet.includes('.topic-band__heading h2{font-size:clamp(2rem,10vw,3rem)'),
      'Mobile topic headings must use the compact title scale.',
    );
    assert(
      stylesheet.includes('.topic-band__heading .text-link,.topic-band__heading .text-link span{font-size:0') &&
        stylesheet.includes('.topic-band__heading .text-link span:before{content:"↗"'),
      'Mobile topic actions must hide the More label and use the Read-style arrow glyph.',
    );
    assert(
      stylesheet.includes('.topic-band__heading .text-link:is(:hover,:focus-visible) span{transform:translate(.2rem,-.2rem)'),
      'Mobile topic arrows must animate diagonally up and right.',
    );
    assert(
      stylesheet.includes('.site-frame{width:100%;min-width:0'),
      'Mobile layout is missing the full-width site frame guard.',
    );
    assert(
      stylesheet.includes('.header-utility{') &&
        stylesheet.includes('position:sticky') &&
        stylesheet.includes('top:0'),
      'The KTP, RSS, and menu utility row is not sticky.',
    );
    const stickyUtilityRule = stylesheet.match(/\.header-utility\.is-stuck\{([^}]*)\}/)?.[1] ?? '';
    assert(
      stickyUtilityRule.includes('header-utility-enter'),
      'The sticky utility row is missing its entry animation.',
    );
    assert(
      stylesheet.includes('.site-menu-trigger.is-open') &&
        stylesheet.includes('.site-menu.is-closing'),
      'Hamburger and drawer closing animation states are missing.',
    );
    assert(
      stylesheet.includes('.scroll-to-top{') && stylesheet.includes('position:fixed'),
      'Scroll-to-top control is not positioned as a floating action.',
    );
    const scrollToTopRules = [...stylesheet.matchAll(/\.scroll-to-top\{([^}]*)\}/g)].map((match) => match[1]);
    assert(
      scrollToTopRules.some((rule) =>
        rule.includes('width:2.5rem') && rule.includes('height:2.5rem') && rule.includes('font-size:1rem'),
      ),
      'Mobile scroll-to-top control is missing its compact size.',
    );
    const leadFooterRules = [...stylesheet.matchAll(/\.editorial-lead__footer\{([^}]*)\}/g)].map(
      (match) => match[1],
    );
    assert(
      leadFooterRules.some((rule) => rule.includes('flex-direction:row') && rule.includes('align-items:end')),
      'Featured-story Read action is not aligned to the right on narrow screens.',
    );
    assert(
      stylesheet.includes('overflow-x:clip') && !stylesheet.includes('overflow-x:hidden'),
      'A page-level overflow scroll container can prevent the navigation from sticking.',
    );
    const mastheadWordmarkRule = stylesheet.match(/\.masthead-wordmark\{([^}]*)\}/)?.[1] ?? '';
    const mastheadWordmarkImageRule = stylesheet.match(/\.masthead-wordmark__image\{([^}]*)\}/)?.[1] ?? '';
    assert(
      mastheadWordmarkRule.includes('display:grid') && mastheadWordmarkImageRule.includes('grid-area:1/1'),
      'Default and hover masthead wordmarks must occupy the same grid cell.',
    );
  }
}

if (existsSync(join(rootPath, 'notes/index.html'))) {
  const notesPage = read('notes/index.html');
  assert(
    notesPage.includes('data-note-reveal'),
    'Notes listing cards must opt into the scroll reveal animation.',
  );
  assert(
    notesPage.includes('IntersectionObserver') &&
      notesPage.includes('is-reveal-pending') &&
      notesPage.includes('prefers-reduced-motion: reduce'),
    'The shared one-time, reduced-motion-safe scroll reveal script is missing.',
  );
  assert(
    !notesPage.includes('masthead-wordmark'),
    'The Kontrapuntal wordmark must render only on the homepage.',
  );
  assert(
    !notesPage.includes('header-topic-nav'),
    'The Popular and topic navigation row must render only on the homepage.',
  );
  const notesUtilityActions = notesPage.match(
    /<div[^>]*class="header-utility__actions"[^>]*>([\s\S]*?)<\/div>/,
  )?.[1] ?? '';
  assert(
    notesUtilityActions.includes('class="notes-filter-trigger"') &&
      notesUtilityActions.includes('aria-controls="notes-filter-dialog"') &&
      notesUtilityActions.includes('aria-haspopup="dialog"') &&
      notesUtilityActions.indexOf('notes-filter-trigger') < notesUtilityActions.indexOf('href="/feed.xml"'),
    'Notes navigation must render its accessible filter trigger immediately before RSS.',
  );
  assert(
    notesPage.includes('class="notes-filter-dialog"') &&
      notesPage.includes('id="notes-filter-dialog"') &&
      notesPage.includes('aria-labelledby="notes-filter-heading"'),
    'Notes page is missing its labelled native filter dialog.',
  );
  for (const field of ['q', 'author', 'topic', 'format']) {
    assert(
      notesPage.includes(`name="${field}"`),
      `Notes filter dialog is missing its ${field} field.`,
    );
  }
  assert(
    notesPage.includes('id="clear-note-filters"') && notesPage.includes('type="submit">Apply filters'),
    'Notes filter dialog must provide Clear and Apply actions.',
  );
  assert(
    notesPage.includes('class="story-card__open"') &&
      notesPage.includes('aria-label="Read Orang-Orang Bloomington dan Kepedulian yang Mengganggu"'),
    'Notes listing cards must expose an accessible arrow link to the full note.',
  );
  const notesStylesheetHref = notesPage.match(/<link rel="stylesheet" href="([^"]+\.css)">/)?.[1];
  if (notesStylesheetHref) {
    const notesStylesheet = read(notesStylesheetHref.replace(/^\//, ''));
    const tabletMediaStart = notesStylesheet.indexOf('@media (width<=64rem){');
    const mobileMediaStart = notesStylesheet.indexOf('@media (width<=30rem){');
    const tabletMedia = notesStylesheet.slice(
      tabletMediaStart,
      mobileMediaStart > tabletMediaStart ? mobileMediaStart : undefined,
    );
    const mobileMedia = notesStylesheet.slice(mobileMediaStart);
    assert(
      notesStylesheet.includes('.story-card-grid:has(>[data-filter-item]:nth-child(3n+1):last-child):before') &&
        notesStylesheet.includes('.story-card-grid:has(>[data-filter-item]:nth-child(3n+2):last-child):after') &&
        notesStylesheet.includes('.story-card-grid:has(>[data-filter-item]:nth-child(odd):last-child):after'),
      'Incomplete Notes index rows must render their missing right-side grid dividers.',
    );
    assert(
      notesStylesheet.includes('.story-card-grid--remainder-1:before,.story-card-grid--remainder-1:after') &&
        notesStylesheet.includes('.story-card-grid--remainder-2:after'),
      'Filtered Notes results must retain incomplete-row divider support.',
    );
    assert(
      notesPage.includes('classList.toggle(`story-card-grid--remainder-1`') &&
        notesPage.includes('classList.toggle(`story-card-grid--remainder-2`'),
      'Notes filtering must mark one- and two-card final rows for their grid dividers.',
    );
    assert(
      notesStylesheet.includes('.note-filters{grid-template-columns:repeat(3,minmax(0,1fr))') &&
        tabletMedia.includes('.note-filters{grid-template-columns:repeat(3,minmax(0,1fr))'),
      'Tablet Notes filters must keep all three select fields balanced.',
    );
    assert(
      mobileMedia.includes('.note-filters{grid-template-columns:repeat(2,minmax(0,1fr))') &&
        mobileMedia.includes('.filter-field:nth-of-type(4){grid-column:1/-1}'),
      'Mobile Notes filters must use a compact two-column select layout.',
    );
  }
}

if (existsSync(join(rootPath, 'robots.txt'))) {
  const robots = read('robots.txt');
  assert(robots.includes('/sitemap-index.xml'), 'robots.txt does not advertise the sitemap index.');
  assert(robots.includes('Disallow: /nulis/'), 'robots.txt does not disallow the CMS editor.');
  assert(robots.includes('Disallow: /api/cms/'), 'robots.txt does not disallow CMS OAuth routes.');
}

if (failures.length > 0) {
  console.error('Build verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Build verification passed (${requiredFiles.length} required outputs, privacy and status policies checked).`);
}
