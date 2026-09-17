import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepareConsumerPackage } from '../scripts/prepare-consumer-package.mjs';

test('source-only git installs get working exports without enabling install scripts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vellum-consumer-test-'));
  const pkg = join(root, 'node_modules', '@benson', 'vellum-ui');
  try {
    await mkdir(pkg, { recursive: true });
    for (const name of ['package.json', 'src', 'scripts']) {
      await cp(new URL(`../${name}`, import.meta.url), join(pkg, name), { recursive: true });
    }
    await prepareConsumerPackage(root);
    const exports = await import(pathToFileURL(join(pkg, 'dist/index.js')));
    assert.equal(typeof exports.buttonHtml, 'function');
    assert.match(await readFile(join(pkg, 'dist/vellum-ui.css'), 'utf8'), /--vui-/);
    // A complete install is left alone, even if a rebuild would now fail.
    await writeFile(join(pkg, 'scripts/build.mjs'), 'throw new Error("must not rebuild");');
    await prepareConsumerPackage(root);
    // An incomplete install must fail before release checks or publication.
    await rm(join(pkg, 'dist/index.js'));
    await assert.rejects(prepareConsumerPackage(root), /Vellum consumer build failed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
