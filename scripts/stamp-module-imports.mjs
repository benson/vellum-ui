import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RELATIVE_MODULE_IMPORT =
  /(from\s+|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+\.js)(\2)/g;

export async function stampModuleImports(root, version) {
  const stamp = String(version || '').trim();
  if (!stamp) throw new Error('module import cache stamp is required');

  const changed = [];
  for (const file of await javascriptFiles(root)) {
    const source = await readFile(file, 'utf8');
    const next = source.replace(
      RELATIVE_MODULE_IMPORT,
      (_match, prefix, quote, specifier, closingQuote) =>
        `${prefix}${quote}${specifier}?v=${encodeURIComponent(stamp)}${closingQuote}`,
    );
    if (next === source) continue;
    await writeFile(file, next);
    changed.push(file);
  }
  return changed;
}

async function javascriptFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await javascriptFiles(path)));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}
