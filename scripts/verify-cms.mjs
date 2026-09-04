import { existsSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

import { parse } from 'yaml';

import { CONTENT_TYPES, NOTE_FORMATS, NOTE_STATUSES } from '../src/lib/content-policy.ts';
import { collectCollectionFiles } from './verify-cms-utils.mjs';

const rootPath = new URL('../', import.meta.url).pathname;
const configPath = join(rootPath, 'public/admin/config.yml');
const adminInitPath = join(rootPath, 'public/admin/init.js');
const previewScriptPath = join(rootPath, 'public/admin/preview.js');
const adminRoutePath = join(rootPath, 'src/pages/admin/index.astro');
const notesPath = join(rootPath, 'src/content/notes');
const authorsPath = join(rootPath, 'src/content/authors');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function field(fields, name) {
  return fields?.find((candidate) => candidate.name === name);
}

function optionValues(options) {
  return options?.map((option) => (typeof option === 'string' ? option : option.value));
}

assert(existsSync(configPath), 'Missing public/admin/config.yml.');
assert(existsSync(adminInitPath), 'Missing public/admin/init.js.');
assert(existsSync(previewScriptPath), 'Missing public/admin/preview.js.');
assert(existsSync(adminRoutePath), 'Missing Astro /admin entry route.');

if (existsSync(adminRoutePath)) {
  const adminIndex = readFileSync(adminRoutePath, 'utf8');
  assert(adminIndex.includes('<base href="/admin/"'), 'Admin must define a stable base URL for config loading.');
  assert(adminIndex.includes('src="/admin/preview.js"'), 'Admin must load its Notes preview template.');
  assert(
    adminIndex.includes('https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js'),
    'Admin must load the pinned Decap CMS 3.15.1 bundle.',
  );
  assert(
    adminIndex.includes(
      'integrity="sha384-in6eHztHveqQ7uMZ1fDaKlDmacQLFuLH2wWrFTiymyuS8zQ5bixwL8U3AeRi8h/L"',
    ),
    'Admin is missing the verified Decap CMS Subresource Integrity hash.',
  );
}

if (existsSync(previewScriptPath)) {
  const previewScript = readFileSync(previewScriptPath, 'utf8');
  assert(previewScript.includes("CMS.registerPreviewTemplate('notes'"), 'Admin must register the Notes preview template.');
  assert(previewScript.includes("className: 'article-header'"), 'Notes preview must mirror the article header structure.');
  assert(previewScript.includes("className: 'reading-width article-body'"), 'Notes preview must mirror the article body structure.');
  assert(previewScript.includes('this.props.getAsset(heroImage)'), 'Notes preview must resolve media-library assets.');
}

if (existsSync(adminInitPath)) {
  const adminInit = readFileSync(adminInitPath, 'utf8');
  assert(adminInit.includes("CMS.registerPreviewStyle('/admin/preview.css')"), 'Admin must load its article preview stylesheet.');
}

if (existsSync(configPath)) {
  const config = parse(readFileSync(configPath, 'utf8'));
  const notes = config.collections?.find((collection) => collection.name === 'notes');
  const authors = config.collections?.find((collection) => collection.name === 'authors');

  assert(config.backend?.name === 'github', 'CMS backend must use GitHub.');
  assert(config.backend?.repo === 'whisnuys/kontrapuntal', 'CMS backend repository is incorrect.');
  assert(config.backend?.branch === 'main', 'CMS must publish to main.');
  assert(config.backend?.base_url === 'https://kontrapuntal.whisnuys.com', 'CMS OAuth base URL must be canonical.');
  assert(config.backend?.auth_endpoint === '/api/cms/auth', 'CMS OAuth endpoint is incorrect.');
  assert(config.backend?.auth_scope === 'repo', 'CMS must request repo scope for the private repository.');
  assert(config.backend?.squash_merges === true, 'CMS publishing must squash merge editorial pull requests.');
  assert(config.publish_mode === 'editorial_workflow', 'CMS must use editorial workflow.');
  assert(config.local_backend === true, 'CMS local backend must remain available for local authoring.');
  assert(!config.media_folder, 'CMS must not stage new media in the Git repository.');
  assert(!config.public_folder, 'CMS must use complete Cloudinary URLs.');
  assert(config.media_library?.name === 'cloudinary', 'CMS media library must use Cloudinary.');
  assert(config.media_library?.output_filename_only === false, 'CMS must store complete Cloudinary URLs.');
  assert(config.media_library?.use_transformations === true, 'CMS must retain selected Cloudinary transformations.');
  assert(config.media_library?.use_secure_url === true, 'CMS must store HTTPS Cloudinary URLs.');
  assert(config.media_library?.config?.cloud_name === 'c8tgycuw', 'CMS Cloudinary cloud name is incorrect.');
  assert(
    String(config.media_library?.config?.api_key) === '192777111764447',
    'CMS Cloudinary public API key is incorrect.',
  );
  assert(!('api_secret' in (config.media_library?.config ?? {})), 'CMS must never expose a Cloudinary API secret.');
  assert(config.slug?.encoding === 'ascii', 'CMS slugs must use ASCII encoding.');
  assert(config.slug?.sanitize_replacement === '-', 'CMS slugs must use hyphens for sanitization.');

  assert(notes, 'CMS is missing the Notes collection.');
  assert(notes?.delete === false, 'CMS note deletion must be disabled.');
  assert(notes?.folder === 'src/content/notes', 'CMS Notes folder does not match Astro content.');
  assert(notes?.extension === 'md', 'CMS must create Markdown notes; MDX remains developer-only.');
  assert(authors, 'CMS is missing the Authors collection.');
  assert(authors?.delete === false, 'CMS author deletion must be disabled.');
  assert(authors?.folder === 'src/content/authors', 'CMS Authors folder does not match Astro content.');
  assert(authors?.extension === 'json' && authors?.format === 'json', 'CMS Authors must remain JSON records.');

  const authorField = field(notes?.fields, 'authors');
  assert(authorField?.widget === 'relation', 'Notes authors must use the relation widget.');
  assert(authorField?.collection === 'authors', 'Notes authors must reference the Authors collection.');
  assert(authorField?.multiple === true, 'Notes must support co-authors.');
  assert(authorField?.min === 1 && authorField?.max === 4, 'Notes must require one to four authors.');
  assert(authorField?.value_field === '{{slug}}', 'Notes must persist stable author entry IDs.');

  assert(field(notes?.fields, 'status')?.default === 'draft', 'New CMS notes must default to draft.');
  assert(
    JSON.stringify(optionValues(field(notes?.fields, 'status')?.options)) ===
      JSON.stringify(NOTE_STATUSES),
    'CMS note statuses do not match the content schema.',
  );
  assert(
    JSON.stringify(optionValues(field(notes?.fields, 'contentType')?.options)) === JSON.stringify(CONTENT_TYPES),
    'CMS content types do not match the content schema.',
  );
  assert(
    JSON.stringify(optionValues(field(notes?.fields, 'format')?.options)) === JSON.stringify(NOTE_FORMATS),
    'CMS note formats do not match the content schema.',
  );
  assert(field(notes?.fields, 'body')?.widget === 'richtext', 'CMS note body must use the rich-text editor.');
  assert(!field(notes?.fields, 'heroImage')?.media_library, 'Hero image must inherit the global Cloudinary library.');
  assert(field(notes?.fields, 'featured')?.required === false, 'Featured must remain optional.');
  assert(field(field(notes?.fields, 'source')?.fields, 'type')?.required === false, 'Source type must remain optional.');
  assert(field(field(notes?.fields, 'source')?.fields, 'title')?.required === false, 'Source title must remain optional.');
  for (const privateField of ['writingFocus', 'newWords', 'commonMistakes', 'draftNotes']) {
    assert(field(notes?.fields, privateField), `CMS is missing shared private authoring field ${privateField}.`);
  }
}

function entryId(path, collectionRoot) {
  const extension = extname(path);
  return relative(collectionRoot, path).split(sep).join('/').slice(0, -extension.length);
}

const authorIds = new Set(
  existsSync(authorsPath)
    ? collectCollectionFiles(authorsPath, new Set(['.json'])).map((path) => entryId(path, authorsPath))
    : [],
);

for (const path of existsSync(notesPath)
  ? collectCollectionFiles(notesPath, new Set(['.md', '.mdx']))
  : []) {
  const name = relative(notesPath, path).split(sep).join('/');
  const source = readFileSync(path, 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1];
  const data = frontmatter ? parse(frontmatter) : undefined;
  const authorReferences = data?.authors;
  assert(Array.isArray(authorReferences), `${name} is missing an authors list.`);
  assert(
    Array.isArray(authorReferences) && authorReferences.length >= 1 && authorReferences.length <= 4,
    `${name} must reference one to four authors.`,
  );
  for (const authorId of Array.isArray(authorReferences) ? authorReferences : []) {
    assert(authorIds.has(authorId), `${name} references missing author ${authorId}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('CMS configuration and content references verified.');
