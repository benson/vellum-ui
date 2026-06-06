import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const buildId = Date.now();
const cssFiles = [
  'tokens.css',
  'base.css',
  'primitives.css',
  'overlays.css',
  'components.css',
  'design-system.css',
  'labs.css',
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(join(dist, 'demo'), { recursive: true });
await mkdir(join(dist, 'labs'), { recursive: true });

const css = [];
for (const file of cssFiles) {
  const path = join(root, 'src', 'css', file);
  css.push(`/* ${file} */\n${await readFile(path, 'utf8')}`);
}
await writeFile(join(dist, 'vellum-ui.css'), css.join('\n\n'));

await cp(join(root, 'src', 'js'), dist, { recursive: true, force: true });
await cp(join(root, 'src', 'demo'), join(dist, 'demo'), { recursive: true, force: true });
await cp(join(root, 'src', 'labs'), join(dist, 'labs'), { recursive: true, force: true });

await writeFile(
  join(dist, 'design-system.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vellum UI Design System</title>
    <link rel="stylesheet" href="./vellum-ui.css?v=${buildId}" />
  </head>
  <body class="vui-app vui-design-system-page design-system-page">
    <main id="designSystemMount" class="vui-design-system ds-page-wrap"></main>
    <script type="module" src="./demo/designSystem.js?v=${buildId}"></script>
  </body>
</html>
`,
);

await writeFile(
  join(dist, 'labs', 'modal', 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vellum UI Modal Lab</title>
    <link rel="stylesheet" href="../../vellum-ui.css?v=${buildId}" />
  </head>
  <body class="vui-app vui-lab-page modal-lab-page">
    <main id="modalLabMount" class="vui-modal-lab vui-lab-wrap"></main>
    <script type="module" src="./index.js?v=${buildId}"></script>
  </body>
</html>
`,
);

console.log('built dist/vellum-ui.css and dist ESM modules');
