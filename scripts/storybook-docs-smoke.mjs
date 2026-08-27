import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const root = path.resolve("storybook-static");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const relative =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("forbidden");
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type":
        contentTypes.get(path.extname(file)) || "application/octet-stream",
    });
    response.end(body);
  } catch (_error) {
    response.writeHead(404).end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await checkDrawerDocs();
  await checkModalDocs();
  await checkPopoverDocs();
  console.log("storybook docs smoke passed");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function docsFrame(id) {
  await page.goto(`${origin}/?path=/docs/${id}--documentation`, {
    waitUntil: "domcontentloaded",
  });
  const frame = page.frameLocator("#storybook-preview-iframe");
  await frame.locator("body").waitFor({ state: "visible" });
  return frame;
}

async function checkDrawerDocs() {
  const frame = await docsFrame("patterns-drawer");
  const layers = frame.locator(".ui-drawer-layer");
  await expectCount(
    layers,
    4,
    "drawer docs should render four independent examples",
  );

  await layers.nth(3).locator("[data-drawer-close]").first().click();
  await expectAttribute(
    layers.nth(3),
    "aria-hidden",
    "true",
    "the open example should close",
  );

  const rightTriggers = frame.getByRole("button", {
    name: "open right drawer",
    exact: true,
  });
  await expectCount(
    rightTriggers,
    3,
    "drawer docs should render three right-side triggers",
  );
  for (const index of [0, 1]) {
    await rightTriggers.nth(index).click();
    await expectAttribute(
      layers.nth(index),
      "aria-hidden",
      "false",
      `right drawer ${index + 1} should open`,
    );
    await layers.nth(index).locator("[data-drawer-close]").first().click();
    await expectAttribute(
      layers.nth(index),
      "aria-hidden",
      "true",
      `right drawer ${index + 1} should close`,
    );
  }

  await frame
    .getByRole("button", { name: "open bottom drawer", exact: true })
    .click();
  await expectAttribute(
    layers.nth(2),
    "aria-hidden",
    "false",
    "bottom drawer should open",
  );
}

async function checkModalDocs() {
  const frame = await docsFrame("patterns-modal");
  const overlays = frame.locator(".ui-modal");
  await expectCount(
    overlays,
    3,
    "modal docs should render three independent examples",
  );
  await overlays.nth(2).locator("[data-modal-close]").first().click();
  await expectAttribute(
    overlays.nth(2),
    "aria-hidden",
    "true",
    "the open modal example should close",
  );

  const triggers = frame.getByRole("button", {
    name: "open dialog",
    exact: true,
  });
  await expectCount(
    triggers,
    3,
    "modal docs should render three interactive triggers",
  );
  for (const index of [0, 1, 2]) {
    await triggers.nth(index).click();
    await expectAttribute(
      overlays.nth(index),
      "aria-hidden",
      "false",
      `modal ${index + 1} should open`,
    );
    await overlays.nth(index).locator("[data-modal-close]").first().click();
    await expectAttribute(
      overlays.nth(index),
      "aria-hidden",
      "true",
      `modal ${index + 1} should close`,
    );
  }
}

async function checkPopoverDocs() {
  const frame = await docsFrame("patterns-popover-menu");
  const triggers = frame.getByRole("button", {
    name: "book actions",
    exact: true,
  });
  // Hidden menus are intentionally absent from the accessibility tree until
  // opened, so locate the rendered instances by their explicit role.
  const menus = frame.locator('[role="menu"]');
  await expectCount(
    triggers,
    2,
    "popover docs should render two independent menu triggers",
  );
  await expectCount(
    menus,
    2,
    "popover docs should render two independent menus",
  );
  for (const index of [0, 1]) {
    await triggers.nth(index).click();
    await expectAttribute(
      triggers.nth(index),
      "aria-expanded",
      "true",
      `menu ${index + 1} should open`,
    );
    await menus
      .nth(index)
      .getByRole("menuitem", { name: "edit details" })
      .click();
    await expectAttribute(
      triggers.nth(index),
      "aria-expanded",
      "false",
      `menu ${index + 1} should close`,
    );
  }
}

async function expectCount(locator, expected, message) {
  await locator.first().waitFor({ state: "attached" });
  const actual = await locator.count();
  if (actual !== expected)
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
}

async function expectAttribute(locator, name, expected, message) {
  await locator.waitFor({ state: "attached" });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const actual = await locator.getAttribute(name);
    if (actual === expected) return;
    await page.waitForTimeout(25);
  }
  const actual = await locator.getAttribute(name);
  throw new Error(
    `${message}: expected ${name}=${expected}, received ${actual}`,
  );
}
