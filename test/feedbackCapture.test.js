import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEEDBACK_OWNER_KEY_HEADER,
  FEEDBACK_OWNER_KEY_STORAGE,
  adoptFeedbackOwnerKeyFromUrl,
  buildFeedbackBundle,
  calculateFeedbackResize,
  clampFeedbackPosition,
  clampFeedbackSize,
  isFeedbackShortcut,
  normalizeReporterFlow,
  prepareFeedbackSubmission,
  submitFeedbackBundle,
} from '../src/js/feedbackCapture.js';

const viewport = { width: 1280, height: 800 };

test('clampFeedbackSize keeps the widget inside the viewport', () => {
  assert.deepEqual(clampFeedbackSize({ width: 5000, height: 5000 }, viewport), {
    width: 1256,
    height: 776,
  });
  assert.deepEqual(clampFeedbackSize({ width: 100, height: 100 }, viewport), {
    width: 320,
    height: 280,
  });
});

test('clampFeedbackPosition keeps the widget on screen', () => {
  const position = clampFeedbackPosition({ left: -50, top: 9000 }, viewport, {
    width: 360,
    height: 360,
  });
  assert.equal(position.left, 12);
  assert.equal(position.top, 800 - 360 - 12);
});

test('calculateFeedbackResize anchors the right edge on left resize', () => {
  const startRect = { left: 400, top: 100, width: 400, height: 300 };
  const { position, size } = calculateFeedbackResize({
    edge: 'left',
    startRect,
    delta: { x: -60, y: 0 },
    viewport,
  });
  assert.equal(size.width, 460);
  assert.equal(position.left + size.width, startRect.left + startRect.width);
});

test('buildFeedbackBundle stamps project, reporter, and merged diagnostics', () => {
  const bundle = buildFeedbackBundle({
    project: 'poolbuilder',
    note: '  the table wobbles  ',
    reporter: { flow: 'owner-dogfood', signedIn: false },
    diagnostics: { route: { path: '/custom', search: '' }, custom: 7 },
    extras: { appSnapshotSummary: { collection: 3 } },
    documentObj: null,
    locationObj: { href: 'https://x.test/p?a=1', pathname: '/p', search: '?a=1' },
    navigatorObj: { userAgent: 'ua', language: 'en', onLine: true },
    now: () => new Date('2026-06-09T12:00:00Z'),
  });
  assert.equal(bundle.kind, 'vellum.feedback');
  assert.equal(bundle.project, 'poolbuilder');
  assert.equal(bundle.note, 'the table wobbles');
  assert.equal(bundle.reporter.flow, 'owner-dogfood');
  assert.equal(bundle.reporter.label, 'owner / dogfood');
  assert.equal(bundle.diagnostics.app, 'poolbuilder');
  // app-provided diagnostics override the generic route
  assert.equal(bundle.diagnostics.route.path, '/custom');
  assert.equal(bundle.diagnostics.custom, 7);
  assert.equal(bundle.diagnostics.browser.userAgent, 'ua');
  assert.deepEqual(bundle.appSnapshotSummary, { collection: 3 });
});

test('normalizeReporterFlow defaults unknown flows to public-user', () => {
  assert.equal(normalizeReporterFlow('owner-dogfood'), 'owner-dogfood');
  assert.equal(normalizeReporterFlow('admin'), 'public-user');
});

test('prepareFeedbackSubmission annotates the screenshot payload', () => {
  const prepared = prepareFeedbackSubmission({
    kind: 'vellum.feedback',
    screenshot: { mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,aaaa' },
  });
  assert.equal(prepared.screenshot.captured, true);
  assert.equal(prepared.screenshot.mimeType, 'image/jpeg');
  assert.ok(prepared.screenshot.approxBytes > 0);
});

test('isFeedbackShortcut matches plain f and ctrl+alt+f outside inputs', () => {
  const noTarget = { closest: () => null };
  assert.equal(isFeedbackShortcut({ key: 'f', target: noTarget }), true);
  assert.equal(isFeedbackShortcut({ key: 'f', ctrlKey: true, altKey: true, target: noTarget }), true);
  assert.equal(isFeedbackShortcut({ key: 'f', ctrlKey: true, target: noTarget }), false);
  assert.equal(isFeedbackShortcut({ key: 'f', target: { closest: () => ({}) } }), false);
});

test('adoptFeedbackOwnerKeyFromUrl stores the key and strips the param', () => {
  const stored = new Map();
  const storageObj = {
    getItem: (key) => stored.get(key) || null,
    setItem: (key, value) => stored.set(key, value),
  };
  let replaced = '';
  const key = adoptFeedbackOwnerKeyFromUrl({
    locationObj: { href: 'https://x.test/app?feedback-key=sekrit&b=2' },
    historyObj: {
      replaceState: (_state, _title, url) => {
        replaced = url;
      },
    },
    storageObj,
  });
  assert.equal(key, 'sekrit');
  assert.equal(stored.get(FEEDBACK_OWNER_KEY_STORAGE), 'sekrit');
  assert.equal(replaced, '/app?b=2');
});

test('submitFeedbackBundle sends owner key and auth headers', async () => {
  let captured = null;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    };
  };
  await submitFeedbackBundle(
    { kind: 'vellum.feedback', project: 'vellum-ui' },
    { apiUrl: 'https://api.test/', fetchImpl, getToken: async () => 'tok', ownerKey: 'sekrit' },
  );
  assert.equal(captured.url, 'https://api.test/feedback');
  assert.equal(captured.init.headers.Authorization, 'Bearer tok');
  assert.equal(captured.init.headers[FEEDBACK_OWNER_KEY_HEADER], 'sekrit');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.project, 'vellum-ui');
});

test('submitFeedbackBundle requires an apiUrl', async () => {
  await assert.rejects(
    submitFeedbackBundle({ kind: 'vellum.feedback' }, { fetchImpl: async () => ({}) }),
    /apiUrl not configured/,
  );
});
