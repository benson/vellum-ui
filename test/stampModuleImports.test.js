import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stampModuleImports } from '../scripts/stamp-module-imports.mjs';

test('stampModuleImports versions every relative JavaScript dependency in a vendored module graph', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vellum-module-stamp-'));
  await mkdir(join(root, 'demo'));
  await writeFile(
    join(root, 'demo', 'designSystem.js'),
    `import { drawer } from '../index.js';\nimport('./lazy.js');\n`,
  );
  await writeFile(
    join(root, 'index.js'),
    `export { drawer } from './drawer.js';\nimport './setup.js';\n`,
  );

  const changed = await stampModuleImports(root, 'abc123');

  assert.equal(changed.length, 2);
  assert.match(
    await readFile(join(root, 'demo', 'designSystem.js'), 'utf8'),
    /\.\.\/index\.js\?v=abc123/,
  );
  assert.match(
    await readFile(join(root, 'demo', 'designSystem.js'), 'utf8'),
    /\.\/lazy\.js\?v=abc123/,
  );
  assert.match(await readFile(join(root, 'index.js'), 'utf8'), /\.\/drawer\.js\?v=abc123/);
  assert.match(await readFile(join(root, 'index.js'), 'utf8'), /\.\/setup\.js\?v=abc123/);
});

test('stampModuleImports leaves already-versioned and non-JavaScript imports alone', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vellum-module-stamp-'));
  const file = join(root, 'index.js');
  await writeFile(
    file,
    `export { x } from './x.js?v=old';\nimport data from './data.json';\nimport 'package';\n`,
  );

  assert.deepEqual(await stampModuleImports(root, 'abc123'), []);
  assert.equal(
    await readFile(file, 'utf8'),
    `export { x } from './x.js?v=old';\nimport data from './data.json';\nimport 'package';\n`,
  );
});
