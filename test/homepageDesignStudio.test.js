import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  UNIFIED_DESIGN_STUDIO_URL,
  writeUnifiedDesignStudioRedirect,
  writeVellumEntryPage,
} from '../scripts/homepage-design-studio.mjs';

test('the legacy Vellum catalog route redirects into the unified studio and preserves story state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vellum-studio-redirect-'));
  await writeUnifiedDesignStudioRedirect(root);
  const html = await readFile(join(root, 'vellum-ui', 'design-system', 'index.html'), 'utf8');

  assert.match(html, new RegExp(UNIFIED_DESIGN_STUDIO_URL.replaceAll('.', '\\.')));
  assert.match(html, /window\.location\.search \+ window\.location\.hash/);
  assert.doesNotMatch(html, /storybook-static/);
});

test('the Vellum homepage entry opens the same unified studio', async () => {
  const root = await mkdtemp(join(tmpdir(), 'vellum-studio-entry-'));
  await writeVellumEntryPage(root);
  const html = await readFile(join(root, 'vellum-ui', 'index.html'), 'utf8');

  assert.match(html, new RegExp(UNIFIED_DESIGN_STUDIO_URL.replaceAll('.', '\\.')));
  assert.match(html, /open the unified design studio/);
});
