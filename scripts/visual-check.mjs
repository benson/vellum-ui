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
    expectSelector('.ui-chip', 'chip');
    expectSelector('.ui-modal-card', 'modal frame');
    expectSelector('.toast', 'toast frame');
    expectSelector('[data-ds-fire-toast]', 'toast fire button');
    expectSelector('.tooltip-host[data-tooltip]', 'tooltip host');
    expectSelector('.switch .switch-track', 'switch');
    expectSelector('input[type="range"]', 'range');
    expectSelector('.combobox input[role="combobox"]', 'combobox input');
    expectSelector('.vui-table tbody tr', 'table rows');
    expectSelector('.skeleton-line', 'skeleton');
    expectSelector('.empty-state', 'empty state');
    expectSelector('.vui-resize-divider', 'resize divider');
    expectSelector('.vui-resize-grip', 'resize grip');

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
      const overrideStyle = document.getElementById('ds-token-overrides');
      if (overrideStyle) overrideStyle.textContent = '';
    }
    return issues;
  });
  failures.push(...report);

  // Live toast roundtrip: the fire button mounts a stack and the toast auto-dismisses.
  await page.click('[data-ds-fire-toast]');
  const fired = await page.waitForSelector('.toast-stack .toast', { timeout: 3000 }).catch(() => null);
  if (!fired) failures.push('firing a toast did not mount .toast-stack .toast');

  // Edge-resize roundtrip: drag resizes the demo pane, dragging past the snap
  // threshold collapses it, and a click on the collapsed edge reopens it.
  const edgeDemo = await page.$('.ds-edge-resize-demo');
  if (!edgeDemo) {
    failures.push('edge resize demo missing');
  } else {
    // page.mouse uses viewport coordinates and does not auto-scroll.
    await edgeDemo.scrollIntoViewIfNeeded();
    const handleBox = await (await page.$('.ds-edge-resize-demo .vui-resize-divider')).boundingBox();
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 60, startY, { steps: 4 });
    await page.mouse.up();
    const widened = await page.evaluate(() =>
      document.querySelector('.ds-edge-resize-demo').style.getPropertyValue('--ds-edge-pane-w'),
    );
    if (widened !== '240px') failures.push(`edge resize drag expected 240px, got "${widened}"`);
    await page.mouse.move(startX + 60, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 200, startY, { steps: 6 });
    await page.mouse.up();
    const collapsed = await page.evaluate(() =>
      document.querySelector('.ds-edge-resize-demo').classList.contains('ds-edge-resize-collapsed'),
    );
    if (!collapsed) failures.push('edge resize drag past threshold did not collapse');
    // Reopen via a realistic click: real input fires a ~1px pointermove during
    // a stationary click, which must not cancel click-to-open.
    const collapsedHandle = await page.$('.ds-edge-resize-demo .vui-resize-divider');
    const collapsedBox = await collapsedHandle.boundingBox();
    const cx = collapsedBox.x + collapsedBox.width / 2;
    const cy = collapsedBox.y + collapsedBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 1, cy);
    await page.mouse.up();
    const reopened = await page.evaluate(() =>
      !document.querySelector('.ds-edge-resize-demo').classList.contains('ds-edge-resize-collapsed'),
    );
    if (!reopened) failures.push('wiggle-click on collapsed edge did not reopen');
  }

  // Combobox roundtrip: typing opens the option list.
  await page.fill('.combobox input', 'e');
  const options = await page.waitForSelector('.combobox-list .combobox-option', { timeout: 3000 }).catch(() => null);
  if (!options) failures.push('combobox input did not open an option list');
  await page.keyboard.press('Escape');

  // Dark theme roundtrip: toggling flips --vui-* on :root and the choice
  // persists across reload.
  const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--vui-color-bg').trim());
  await page.click('.ds-theme-toggle .switch-track');
  const dark = await page.evaluate((light) => {
    const issues = [];
    const rootStyle = getComputedStyle(document.documentElement);
    if (document.documentElement.dataset.theme !== 'dark') issues.push('toggle did not set data-theme="dark" on <html>');
    const darkBg = rootStyle.getPropertyValue('--vui-color-bg').trim();
    if (darkBg === light) issues.push('--vui-color-bg did not change in dark theme');
    const body = getComputedStyle(document.body).backgroundColor;
    if (body === 'rgba(0, 0, 0, 0)') issues.push('body background did not pick up theme');
    return issues;
  }, lightBg);
  failures.push(...dark);
  await page.reload({ waitUntil: 'networkidle' });
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme === 'dark');
  if (!persisted) failures.push('dark theme did not persist across reload');
  await page.evaluate(() => localStorage.clear());
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`visual check failed:\n${failures.map((failure) => `  - ${failure}`).join('\n')}`);
  process.exit(1);
}
console.log('visual check passed');
