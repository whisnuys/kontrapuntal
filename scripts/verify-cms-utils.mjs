import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} directory
 * @param {Set<string>} extensions
 * @returns {string[]}
 */
export function collectCollectionFiles(directory, extensions) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectCollectionFiles(path, extensions);
      return extensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [path] : [];
    })
    .sort();
}
