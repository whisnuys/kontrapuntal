import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { after, describe, test } from 'node:test';

import { collectCollectionFiles } from '../../scripts/verify-cms-utils.mjs';

const fixtureRoot = mkdtempSync(join(tmpdir(), 'kontrapuntal-cms-'));
after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

describe('collectCollectionFiles', () => {
  test('finds matching content recursively while excluding other extensions', () => {
    mkdirSync(join(fixtureRoot, 'nested'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'root.md'), 'root');
    writeFileSync(join(fixtureRoot, 'nested', 'child.mdx'), 'child');
    writeFileSync(join(fixtureRoot, 'nested', 'ignored.json'), '{}');

    const paths = collectCollectionFiles(fixtureRoot, new Set(['.md', '.mdx']))
      .map((path) => relative(fixtureRoot, path));

    assert.deepEqual(paths, ['nested/child.mdx', 'root.md']);
  });
});
