import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawer,
  drawerOffsetFromTransform,
  projectDrawerOffset,
  resolveDrawerGesture,
  rubberbandDrawerOffset,
} from '../src/js/drawer.js';

test('drawer gesture projection respects distance and velocity', () => {
  assert.equal(resolveDrawerGesture({ offset: 80, velocity: 0.1, size: 400 }), 'open');
  assert.equal(resolveDrawerGesture({ offset: 180, velocity: 0, size: 400 }), 'close');
  assert.equal(resolveDrawerGesture({ offset: 35, velocity: 0.8, size: 400 }), 'close');
  assert.equal(resolveDrawerGesture({ offset: 12, velocity: 0.12, size: 400 }), 'close');
  assert.equal(resolveDrawerGesture({ offset: 300, velocity: 1, size: 400, cancelled: true }), 'open');
  assert.equal(projectDrawerOffset(40, 0.5), 130);
});

test('drawer rubberband keeps overshoot bounded at both ends', () => {
  assert.equal(rubberbandDrawerOffset(120, 400), 120);
  assert.ok(rubberbandDrawerOffset(-100, 400) < 0);
  assert.ok(rubberbandDrawerOffset(-100, 400) > -20);
  assert.ok(rubberbandDrawerOffset(500, 400) > 400);
  assert.ok(rubberbandDrawerOffset(500, 400) < 420);
});

test('drawer transform parsing uses the physical closing direction', () => {
  assert.equal(drawerOffsetFromTransform('matrix(1, 0, 0, 1, 120, 0)', 'right'), 120);
  assert.equal(drawerOffsetFromTransform('matrix(1, 0, 0, 1, -80, 0)', 'left'), 80);
  assert.equal(drawerOffsetFromTransform('matrix(1, 0, 0, 1, 0, 240)', 'bottom'), 240);
  assert.equal(drawerOffsetFromTransform('none', 'right'), 0);
});

test('drawer owns open state, body state, focus entry, and keyboard dismissal', async () => {
  const { doc, layer, panel, firstFocus } = drawerDom();
  const trigger = fakeNode(doc);
  doc.activeElement = trigger;
  const api = drawer(layer);

  api.open({ reason: 'trigger', event: { type: 'click', detail: 1 } });
  assert.equal(api.isOpen(), true);
  assert.equal(layer.hidden, false);
  assert.equal(layer.getAttribute('data-vui-state'), 'open');
  assert.equal(layer.getAttribute('data-vui-motion'), 'auto');
  assert.equal(layer.inert, false);
  assert.equal(doc.body.classList.contains('vui-drawer-open'), true);
  assert.equal(firstFocus.focused, true);
  assert.equal(panel.getAttribute('role'), 'dialog');

  doc.dispatch('keydown', keyEvent('Escape'));
  await Promise.resolve();
  assert.equal(api.isOpen(), false);
  assert.equal(layer.hidden, true);
  assert.equal(layer.getAttribute('data-vui-state'), 'closed');
  assert.equal(layer.getAttribute('data-vui-motion'), 'none');
  assert.equal(layer.inert, true);
  assert.equal(doc.body.classList.contains('vui-drawer-open'), false);
  assert.equal(trigger.focused, true);
});

test('drawer close policy can veto backdrop dismissal', () => {
  const { layer, backdrop } = drawerDom();
  const requests = [];
  const api = drawer(layer, {
    onRequestClose({ reason }) {
      requests.push(reason);
      return false;
    },
  });
  api.open();
  layer.dispatch('click', { target: backdrop });
  assert.equal(api.isOpen(), true);
  assert.deepEqual(requests, ['backdrop']);
});

test('drawer disables spatial gesture tracking when reduced motion is preferred', () => {
  const { doc, layer, panel, handle } = drawerDom();
  doc.defaultView.matchMedia = () => ({ matches: true });
  const api = drawer(layer);
  api.open({ motion: 'none' });
  handle.dispatch('pointerdown', pointerEvent({ clientX: 100, clientY: 20 }));
  handle.dispatch('pointermove', pointerEvent({ clientX: 220, clientY: 20, timeStamp: 20 }));
  assert.equal(panel.style.getPropertyValue('transform'), '');
  assert.equal(api.isOpen(), true);
});

function drawerDom() {
  const doc = fakeDocument();
  const layer = fakeNode(doc);
  const panel = fakeNode(doc);
  const backdrop = fakeNode(doc);
  const handle = fakeNode(doc);
  const firstFocus = fakeNode(doc);
  layer.hidden = true;
  panel.dataset.vuiDrawerSide = 'right';
  layer.selectors.set('.ui-drawer', panel);
  layer.selectors.set('.ui-drawer-backdrop', backdrop);
  layer.selectors.set('[data-vui-drawer-handle]', handle);
  panel.selectorLists.set(focusableSelector(), [firstFocus]);
  layer.append(backdrop, panel);
  panel.append(handle, firstFocus);
  return { doc, layer, panel, backdrop, handle, firstFocus };
}

function fakeDocument() {
  const timers = new Map();
  let timerId = 0;
  const doc = {
    activeElement: null,
    listeners: new Map(),
    addEventListener(type, listener) { addListener(this.listeners, type, listener); },
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); },
    dispatch(type, event) { dispatch(this.listeners, type, event); },
  };
  doc.defaultView = {
    getComputedStyle(node) {
      return {
        transform: node.style.getPropertyValue('transform') || 'none',
        transitionDuration: '0s',
        transitionDelay: '0s',
      };
    },
    requestAnimationFrame(callback) { callback(); return 1; },
    cancelAnimationFrame() {},
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    matchMedia() { return { matches: false }; },
  };
  doc.body = fakeNode(doc);
  return doc;
}

function fakeNode(ownerDocument) {
  const attributes = new Map();
  const properties = new Map();
  const node = {
    ownerDocument,
    parentElement: null,
    children: [],
    hidden: false,
    focused: false,
    dataset: {},
    listeners: new Map(),
    selectors: new Map(),
    selectorLists: new Map(),
    classList: fakeClassList(),
    style: {
      setProperty(name, value) { properties.set(name, String(value)); },
      removeProperty(name) { properties.delete(name); },
      getPropertyValue(name) { return properties.get(name) || ''; },
      get transform() { return properties.get('transform') || ''; },
      set transform(value) { properties.set('transform', value); },
    },
    append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } },
    addEventListener(type, listener) { addListener(this.listeners, type, listener); },
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); },
    dispatch(type, event) { dispatch(this.listeners, type, event); },
    querySelector(selector) { return this.selectors.get(selector) || null; },
    querySelectorAll(selector) { return this.selectorLists.get(selector) || []; },
    contains(target) { for (let current = target; current; current = current.parentElement) if (current === this) return true; return false; },
    closest(selector) { return selector === '.ui-drawer-layer' ? this.parentElement?.parentElement || null : null; },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) || null; },
    hasAttribute(name) { return attributes.has(name); },
    focus() { this.focused = true; ownerDocument.activeElement = this; },
    select() {},
    getBoundingClientRect() { return { width: 400, height: 500 }; },
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture() { return true; },
  };
  return node;
}

function fakeClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
    toggle(name, force) {
      const next = force ?? !values.has(name);
      if (next) values.add(name); else values.delete(name);
      return next;
    },
  };
}

function keyEvent(key) {
  return { key, type: 'keydown', preventDefault() { this.defaultPrevented = true; } };
}

function pointerEvent(overrides = {}) {
  return {
    pointerId: 1,
    button: 0,
    clientX: 0,
    clientY: 0,
    timeStamp: 1,
    preventDefault() {},
    ...overrides,
  };
}

function addListener(listeners, type, listener) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(listener);
}

function dispatch(listeners, type, event) {
  for (const listener of listeners.get(type) || []) listener(event);
}

function focusableSelector() {
  return 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
}
