import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const cssRoot = join(process.cwd(), 'src', 'css');
const runtimeTokens = new Set([
  '--lab-swatch-color',
  '--vui-modal-x',
  '--vui-modal-y',
  // Modal-lab close knobs: set inline by the lab JS, no :root defaults since
  // the quiet × stopped carrying decoration tokens (BEN-604).
  '--vui-modal-close-border',
  '--vui-modal-close-radius',
  '--vui-modal-close-bg',
  '--vui-modal-close-color',
  '--vui-modal-close-shadow',
  '--vui-modal-close-hover-bg',
  '--vui-modal-close-hover-color',
  '--vui-modal-close-hover-shadow',
  // Per-chip tint hooks: set inline by apps (tag colors, location types), no
  // :root defaults — the .ui-chip rule carries the neutral fallbacks.
  '--ui-chip-bg',
  '--ui-chip-border',
  '--ui-chip-ink',
]);

const files = (await readdir(cssRoot))
  .filter((file) => file.endsWith('.css'))
  .map((file) => join(cssRoot, file));

const definitions = new Set();
const references = [];

for (const file of files) {
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
      definitions.add(match[1]);
    }
    for (const match of line.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
      references.push({ name: match[1], file, line: index + 1 });
    }
  }
}

const missing = references.filter(({ name }) => !definitions.has(name) && !runtimeTokens.has(name));

if (missing.length) {
  const details = missing
    .map(({ name, file, line }) => `- ${name} at ${file}:${line}`)
    .join('\n');
  throw new Error(`CSS references undefined custom properties:\n${details}`);
}

console.log(`checked ${definitions.size} CSS custom properties`);
