import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const UNIFIED_DESIGN_STUDIO_URL = 'https://biblioplex.bensonperry.com/design-system/';

export async function writeUnifiedDesignStudioRedirect(path) {
  const directory = join(path, 'vellum-ui', 'design-system');
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Biblioplex · Design Studio</title>
    <meta name="description" content="Unified design studio for Biblioplex and Vellum UI." />
    <link rel="canonical" href="${UNIFIED_DESIGN_STUDIO_URL}" />
    <meta http-equiv="refresh" content="0; url=${UNIFIED_DESIGN_STUDIO_URL}" />
  </head>
  <body>
    <p><a href="${UNIFIED_DESIGN_STUDIO_URL}">open the unified design studio</a></p>
    <script>
      window.location.replace(
        '${UNIFIED_DESIGN_STUDIO_URL}' + window.location.search + window.location.hash,
      );
    </script>
  </body>
</html>
`,
  );
}

export async function writeVellumEntryPage(path) {
  const directory = join(path, 'vellum-ui');
  await mkdir(directory, { recursive: true });
  const pagePath = join(directory, 'index.html');
  await writeFile(
    pagePath,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vellum UI</title>
    <meta name="description" content="Shared design system for Benson Perry apps." />
    <link rel="canonical" href="${UNIFIED_DESIGN_STUDIO_URL}" />
    <meta http-equiv="refresh" content="0; url=${UNIFIED_DESIGN_STUDIO_URL}" />
  </head>
  <body>
    <p><a href="${UNIFIED_DESIGN_STUDIO_URL}">open the unified design studio</a></p>
    <script>window.location.replace('${UNIFIED_DESIGN_STUDIO_URL}');</script>
  </body>
</html>
`,
  );
}
