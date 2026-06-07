import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const workspace = await mkdtemp(join(tmpdir(), 'vellum-ui-package-smoke-'));
const npmCommand = 'npm';

try {
  const packResult = run(npmCommand, ['pack', '--json', '--ignore-scripts', '--pack-destination', workspace], {
    capture: true,
  });
  const [pack] = parsePackJson(packResult);
  if (!pack?.filename) throw new Error('npm pack did not report a tarball filename.');

  const consumer = join(workspace, 'consumer');
  await mkdir(consumer, { recursive: true });
  await writeFile(
    join(workspace, 'smoke.mjs'),
    `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as vui from '@benson/vellum-ui';

const require = createRequire(import.meta.url);

assert.equal(typeof vui.buttonHtml, 'function');
assert.equal(typeof vui.modal, 'function');
assert.equal(typeof vui.makeModalInteractive, 'function');
assert.equal(typeof vui.statusStateHtml, 'function');

const cssPath = require.resolve('@benson/vellum-ui/css');
assert.ok(cssPath.endsWith('vellum-ui.css'), cssPath);

const packagePath = require.resolve('@benson/vellum-ui/package.json');
const packageJson = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(packagePath, 'utf8')));
assert.equal(packageJson.name, '@benson/vellum-ui');
`,
  );
  await writeFile(join(consumer, 'package.json'), '{"private":true,"type":"module"}\n');

  run(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(workspace, pack.filename)], {
    cwd: consumer,
  });
  await writeFile(join(consumer, 'smoke.mjs'), await readFile(join(workspace, 'smoke.mjs'), 'utf8'));
  run('node', ['smoke.mjs'], { cwd: consumer });
  console.log('package smoke passed');
} finally {
  if (process.env.VELLUM_KEEP_PACKAGE_SMOKE !== '1') {
    await rm(workspace, { recursive: true, force: true });
  } else {
    console.log(`kept package smoke workspace: ${workspace}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.status !== 0) {
    const detail = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `\n${detail}` : ''}`);
  }
  return result.stdout || '';
}

function parsePackJson(output) {
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start < 0 || end < start) {
    throw new Error(`npm pack did not emit JSON output:\n${output}`);
  }
  return JSON.parse(output.slice(start, end + 1));
}
