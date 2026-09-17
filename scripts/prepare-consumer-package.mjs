import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Consumers may deliberately disable install lifecycle scripts. A git dependency
// then contains Vellum's source but may lack dist, depending on npm/cache state.
// Build only this known package; do not enable arbitrary dependency scripts.
export async function prepareConsumerPackage(consumerRoot) {
  const packageRoot = join(consumerRoot, 'node_modules', '@benson', 'vellum-ui');
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  if (manifest.name !== '@benson/vellum-ui') {
    throw new Error(`Unexpected package at ${packageRoot}`);
  }
  const artifacts = ['dist/index.js', 'dist/vellum-ui.css'];
  const hasArtifacts = async () => {
    try {
      await Promise.all(artifacts.map((file) => access(join(packageRoot, file))));
      return true;
    } catch {
      return false;
    }
  };
  if (await hasArtifacts()) return;

  console.log('Building missing artifacts for the pinned @benson/vellum-ui package.');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: packageRoot,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Vellum consumer build failed: ${result.error?.message || result.stderr || result.status}`);
  }
  if (!(await hasArtifacts())) {
    throw new Error('Vellum consumer build did not produce its JavaScript and CSS exports.');
  }
}
