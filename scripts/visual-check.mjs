// Browser-level gate for the design-system page. Loads dist/design-system.html
// in headless Chromium and fails on console errors, missing sections, or
// token-driven styles not reaching components. Intentionally not a pixel-diff:
// font rendering differs across platforms and pixel gates flake.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const dist = join(root, 'dist');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const file = join(dist, path === '/' ? 'design-system.html' : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));

  await page.goto(`${origin}/design-system.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ds-group', { timeout: 10000 });

  const report = await page.evaluate(() => {
    const issues = [];
    const expectSelector = (selector, label) => {
      if (!document.querySelector(selector)) issues.push(`missing ${label}: ${selector}`);
    };

    expectSelector('.ds-page-title', 'page title');
    expectSelector('.ds-toc', 'table of contents');
    expectSelector('.ds-playground [data-token]', 'token playground inputs');
    expectSelector('.ds-token-output', 'token override output');
    expectSelector('.btn', 'button primitive');
    expectSelector('.segmented .segment-btn', 'segmented control');
    expectSelector('.field-row input', 'form field');
    expectSelector('.status-state', 'status state');
    expectSelector('.chip', 'chip');
    expectSelector('.ui-modal-card', 'modal frame');

    // Tokens must actually reach components.
    const rootStyle = getComputedStyle(document.documentElement);
    if (!rootStyle.getPropertyValue('--vui-color-accent').trim()) issues.push('--vui-color-accent is undefined');
    const btn = document.querySelector('.btn');
    if (btn) {
      const borderWidth = parseFloat(getComputedStyle(btn).borderTopWidth);
      const tokenWidth = parseFloat(rootStyle.getPropertyValue('--vui-border-width'));
      if (Number.isFinite(tokenWidth) && borderWidth !== tokenWidth) {
        issues.push(`.btn border ${borderWidth}px != --vui-border-width ${tokenWidth}px`);
      }
    }

    // Playground roundtrip: an override applies live and shows up in the diff output.
    const colorInput = document.querySelector('.ds-playground input[type="color"][data-token]');
    if (colorInput) {
      colorInput.value = '#123456';
      colorInput.dispatchEvent(new Event('input', { bubbles: true }));
      const token = colorInput.dataset.token;
      const applied = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      if (applied !== '#123456') issues.push(`playground override did not apply: ${token} = ${applied}`);
      const output = document.querySelector('.ds-token-output')?.textContent || '';
      if (!output.includes(`${token}: #123456;`)) issues.push('override missing from diff output');
      if ((output.match(/--vui-/g) || []).length !== 1) issues.push('diff output should list only changed tokens');
      localStorage.clear();
    }
    return issues;
  });
  failures.push(...report);
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`visual check failed:\n${failures.map((failure) => `  - ${failure}`).join('\n')}`);
  process.exit(1);
}
console.log('visual check passed');
