import test from 'node:test';
import assert from 'node:assert/strict';
import { makeModalInteractive, modal } from '../src/js/modal.js';

test('modal open and close are idempotent and toggle body state', () => {
  const doc = fakeDocument();
  const modalEl = fakeElement(doc);
  const focusTarget = { focused: false, focus() { this.focused = true; } };
  const closes = [];
  const opens = [];
  const controller = modal(modalEl, {
    bodyClass: 'modal-open',
    onClose: (detail) => closes.push(detail),
    onOpen: (detail) => opens.push(detail),
  });

  controller.open({ reason: 'test-open', focusTarget });
  controller.open({ reason: 'duplicate-open' });

  assert.equal(modalEl.hidden, false);
  assert.equal(modalEl.classList.contains('open'), true);
  assert.equal(modalEl.getAttribute('aria-hidden'), 'false');
  assert.equal(modalEl.getAttribute('data-vui-state'), 'open');
  assert.equal(modalEl.getAttribute('data-vui-motion'), 'auto');
  assert.equal(doc.body.classList.contains('modal-open'), true);
  assert.equal(focusTarget.focused, true);
  assert.deepEqual(opens.map((detail) => detail.reason), ['test-open']);

  controller.close({ reason: 'test-close' });
  controller.close({ reason: 'duplicate-close' });

  assert.equal(modalEl.hidden, true);
  assert.equal(modalEl.classList.contains('open'), false);
  assert.equal(modalEl.getAttribute('aria-hidden'), 'true');
  assert.equal(modalEl.getAttribute('data-vui-state'), 'closed');
  assert.equal(doc.body.classList.contains('modal-open'), false);
  assert.deepEqual(closes.map((detail) => detail.reason), ['test-close']);
});

test('modal delegates close controls through request-close policy', () => {
  const doc = fakeDocument();
  const modalEl = fakeElement(doc);
  const closeButton = fakeElement(doc);
  closeButton.classList.add('rune-close');
  modalEl.append(closeButton);
  const requested = [];
  const controller = modal(modalEl, {
    onRequestClose: (detail) => {
      requested.push(detail.reason);
      return requested.length > 1;
    },
  });

  controller.open();
  modalEl.dispatch('click', { target: closeButton });
  assert.equal(controller.isOpen(), true);

  modalEl.dispatch('click', { target: closeButton });
  assert.equal(controller.isOpen(), false);
  assert.deepEqual(requested, ['close-button', 'close-button']);
});

test('modal escape close can be disabled', () => {
  const doc = fakeDocument();
  const modalEl = fakeElement(doc);
  const controller = modal(modalEl, { closeOnEscape: false });

  controller.open();
  doc.dispatch('keydown', keyEvent('Escape'));

  assert.equal(controller.isOpen(), true);
});

test('modal escape dismissal opts out of motion', () => {
  const doc = fakeDocument();
  const modalEl = fakeElement(doc);
  const controller = modal(modalEl);

  controller.open({ reason: 'trigger', event: { type: 'click' } });
  doc.dispatch('keydown', keyEvent('Escape'));

  assert.equal(controller.isOpen(), false);
  assert.equal(modalEl.getAttribute('data-vui-motion'), 'none');
});

function fakeDocument() {
  return {
    body: fakeElement(null),
    defaultView: {
      addEventListener() {},
      removeEventListener() {},
    },
    listeners: new Map(),
    addEventListener(type, listener) {
      addListener(this.listeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(this.listeners, type, listener);
    },
    dispatch(type, event) {
      dispatch(this.listeners, type, event);
    },
  };
}

function fakeElement(ownerDocument) {
  const node = {
    ownerDocument,
    hidden: true,
    parentElement: null,
    children: [],
    attributes: new Map(),
    classList: fakeClassList(),
    listeners: new Map(),
    append(child) {
      child.parentElement = this;
      this.children.push(child);
    },
    addEventListener(type, listener) {
      addListener(this.listeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(this.listeners, type, listener);
    },
    dispatch(type, event) {
      dispatch(this.listeners, type, event);
    },
    contains(target) {
      for (let current = target; current; current = current.parentElement) {
        if (current === this) return true;
      }
      return false;
    },
    closest(selector) {
      if (selector.includes('.rune-close') && this.classList.contains('rune-close')) return this;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) || null;
    },
  };
  if (!node.ownerDocument) node.ownerDocument = { defaultView: globalThis };
  return node;
}

function fakeClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
    toggle(name, force) {
      const shouldAdd = force ?? !values.has(name);
      if (shouldAdd) values.add(name);
      else values.delete(name);
      return shouldAdd;
    },
  };
}

function keyEvent(key) {
  return {
    key,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

function addListener(listeners, type, listener) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(listener);
}

function removeListener(listeners, type, listener) {
  listeners.get(type)?.delete(listener);
}

function dispatch(listeners, type, event) {
  for (const listener of listeners.get(type) || []) listener(event);
}

// ---- interactive-by-default + close injection ----
// These use a richer fake that supports the selector queries modal() makes.

test('modal is interactive by default when a card exists', () => {
  const { modalEl, card } = domModal();
  modal(modalEl);
  assert.equal(card.dataset.vuiModalInteractive, 'true');
  assert.ok(card.children.some((c) => 'vuiModalResizeHandle' in c.dataset));
  assert.deepEqual(
    card.querySelectorAll('[data-vui-modal-resize-handle]').map((handle) => handle.dataset.vuiModalResizeEdge),
    ['right', 'bottom', 'bottom-right'],
  );
});

const resizeCases = [
  { edge: 'left', dx: -80, dy: 0, width: 480, height: 260, x: -80, y: 0 },
  { edge: 'right', dx: 80, dy: 0, width: 480, height: 260, x: 0, y: 0 },
  { edge: 'top', dx: 0, dy: -60, width: 400, height: 320, x: 0, y: -60 },
  { edge: 'bottom', dx: 0, dy: 60, width: 400, height: 320, x: 0, y: 0 },
  { edge: 'bottom-left', dx: -80, dy: 60, width: 480, height: 320, x: -80, y: 0 },
  { edge: 'bottom-right', dx: 80, dy: 60, width: 480, height: 320, x: 0, y: 0 },
  { edge: 'top-left', dx: -80, dy: -60, width: 480, height: 320, x: -80, y: -60 },
  { edge: 'top-right', dx: 80, dy: -60, width: 480, height: 320, x: 0, y: -60 },
];

for (const centeredX of [false, true]) {
  for (const centeredY of [false, true]) {
    for (const spec of resizeCases) {
      test(`${spec.edge} pointer resize (centeredX=${centeredX}, centeredY=${centeredY}) grows and clamps`, () => {
        const grow = resizeFixture(spec.edge, centeredX, centeredY);
        dragResize(grow, spec.dx, spec.dy);
        assert.deepEqual(readSize(grow.card), {
          width: spec.width,
          height: spec.height,
          x: 20 + spec.x + (centeredX ? (spec.width - 400) / 2 : 0),
          y: -10 + spec.y + (centeredY ? (spec.height - 260) / 2 : 0),
        });

        const shrink = resizeFixture(spec.edge, centeredX, centeredY);
        dragResize(shrink, -Math.sign(spec.dx) * 2000, -Math.sign(spec.dy) * 2000);
        assert.deepEqual(readSize(shrink.card), {
          width: spec.dx ? 240 : 400,
          height: spec.dy ? 180 : 260,
          x: 20 + (spec.dx < 0 ? 160 : 0) - (centeredX && spec.dx ? 80 : 0),
          y: -10 + (spec.dy < 0 ? 80 : 0) - (centeredY && spec.dy ? 40 : 0),
        });

        const limit = resizeFixture(spec.edge, centeredX, centeredY);
        dragResize(limit, Math.sign(spec.dx) * 2000, Math.sign(spec.dy) * 2000);
        // The original left/bottom edges retain their viewport-wide clamping.
        // New right/top edges stop at the margin without moving the opposite edge.
        assert.deepEqual(readSize(limit.card), {
          width: spec.dx < 0 ? 1232 : spec.dx > 0 ? (centeredX ? 796 : 1036) : 400,
          height: spec.dy > 0 ? 752 : spec.dy < 0 ? (centeredY ? 496 : 406) : 260,
          x: spec.dx < 0 ? (centeredX ? 0 : -176) : spec.dx > 0 && centeredX ? 218 : 20,
          y: spec.dy > 0 ? (centeredY ? 0 : -156) : spec.dy < 0 ? (centeredY ? -128 : -156) : -10,
        });
        const rect = limit.card.getBoundingClientRect();
        assert.ok(rect.left >= 24 && rect.left + rect.width <= 1256);
        assert.ok(rect.top >= 24 && rect.top + rect.height <= 776);
      });
    }
  }
}

test('resize handles expose their edge, reuse existing handles, and remove generated handles on destroy', () => {
  const { doc, card } = domModal();
  const existing = domNode(doc);
  existing.dataset.vuiModalResizeHandle = 'top-right';
  card.append(existing);
  const controller = makeModalInteractive(card, { resizeEdges: resizeCases.map(({ edge }) => edge) });
  const handles = card.querySelectorAll('[data-vui-modal-resize-handle]');
  assert.equal(handles.length, 8);
  for (const handle of handles) {
    assert.equal(handle.dataset.vuiModalResizeEdge, handle.dataset.vuiModalResizeHandle);
  }
  assert.equal(existing.dataset.vuiModalResizeEdge, 'top-right');
  controller.destroy();
  assert.deepEqual(card.querySelectorAll('[data-vui-modal-resize-handle]'), [existing]);
  assert.equal(existing.listeners.get('pointerdown').size, 0);
});

test('resizing uses the updated rectangle on subsequent pointer drags', () => {
  const fixture = resizeFixture('top-right', true, false);
  dragResize(fixture, 80, -60);
  dragResize(fixture, 40, -20);
  assert.deepEqual(readSize(fixture.card), { width: 520, height: 340, x: 80, y: -90 });
});

function resizeFixture(edge, centeredX, centeredY) {
  const { doc, card, modalEl } = domModal();
  card.style.setProperty('--vui-modal-x', '20px');
  card.style.setProperty('--vui-modal-y', '-10px');
  card.getBoundingClientRect = () => {
    const width = Number.parseFloat(card.style.width) || 400;
    const height = Number.parseFloat(card.style.height) || 260;
    return {
      width,
      height,
      left: (centeredX ? (1280 - width) / 2 : 200) + Number.parseFloat(card.style.getPropertyValue('--vui-modal-x')),
      top: (centeredY ? (800 - height) / 2 : 180) + Number.parseFloat(card.style.getPropertyValue('--vui-modal-y')),
    };
  };
  modal(modalEl, { resizeEdges: [edge], centeredX, centeredY, minWidth: 240, minHeight: 180, margin: 24 });
  return { doc, card, handle: card.querySelector('[data-vui-modal-resize-handle]') };
}

function readSize(card) {
  return {
    width: Number.parseFloat(card.style.width),
    height: Number.parseFloat(card.style.height),
    x: Number.parseFloat(card.style.getPropertyValue('--vui-modal-x')),
    y: Number.parseFloat(card.style.getPropertyValue('--vui-modal-y')),
  };
}

function dragResize({ doc, card, handle }, dx, dy) {
  const event = { button: 0, pointerId: 7, clientX: 500, clientY: 400, preventDefault() {} };
  handle.dispatch('pointerdown', { ...event, currentTarget: handle });
  assert.equal(card.classList.contains('is-vui-modal-resizing'), true);
  const before = readSize(card);
  dispatch(doc.listeners, 'pointermove', { ...event, pointerId: 8, clientX: 900, clientY: 700 });
  assert.deepEqual(readSize(card), before, 'unrelated pointers must not resize');
  dispatch(doc.listeners, 'pointermove', { ...event, clientX: 500 + dx, clientY: 400 + dy });
  dispatch(doc.listeners, 'pointerup', event);
  assert.equal(card.classList.contains('is-vui-modal-resizing'), false);
  assert.equal(doc.listeners.get('pointermove').size, 0);
  assert.equal(doc.listeners.get('pointerup').size, 0);
  assert.equal(doc.listeners.get('pointercancel').size, 0);
}

test('interactive: false opts out of drag/resize', () => {
  const { modalEl, card } = domModal();
  modal(modalEl, { interactive: false });
  assert.equal('vuiModalInteractive' in card.dataset, false);
  assert.equal(card.children.filter((c) => 'vuiModalResizeHandle' in c.dataset).length, 0);
});

test('a headed modal without a close control gets a rune-close injected, and it closes', () => {
  const { modalEl, head } = domModal();
  const controller = modal(modalEl);
  const injected = head.children.filter((c) => c.classList.contains('rune-close'));
  assert.equal(injected.length, 1);
  assert.equal(injected[0].getAttribute('aria-label'), 'close');
  controller.open();
  modalEl.dispatch('click', { target: injected[0] });
  assert.equal(controller.isOpen(), false);
});

test('close injection is idempotent and skips modals with an existing close control', () => {
  const withExisting = domModal();
  const ownClose = domNode(withExisting.doc, { classes: ['rune-close'] });
  withExisting.head.append(ownClose);
  modal(withExisting.modalEl);
  assert.equal(
    withExisting.head.children.filter((c) => c.classList.contains('rune-close')).length,
    1,
  );

  const reinit = domModal();
  modal(reinit.modalEl);
  modal(reinit.modalEl);
  assert.equal(reinit.head.children.filter((c) => c.classList.contains('rune-close')).length, 1);
});

test('headless modals get no injected close button', () => {
  const doc = domDocument();
  const modalEl = domNode(doc, { classes: ['ui-modal'] });
  const card = domNode(doc, { classes: ['ui-modal-card'] });
  modalEl.append(card);
  modal(modalEl);
  assert.equal(card.children.filter((c) => c.classList.contains('rune-close')).length, 0);
});

function domModal() {
  const doc = domDocument();
  const modalEl = domNode(doc, { classes: ['ui-modal'] });
  const card = domNode(doc, { classes: ['ui-modal-card'] });
  const head = domNode(doc, { classes: ['ui-modal-head'] });
  card.append(head);
  modalEl.append(card);
  return { doc, modalEl, card, head };
}

function domDocument() {
  const doc = {
    body: null,
    listeners: new Map(),
    defaultView: {
      addEventListener() {},
      removeEventListener() {},
      innerWidth: 1280,
      innerHeight: 800,
      getComputedStyle: () => ({ getPropertyValue: () => '' }),
    },
    createElement(tag) {
      return domNode(doc, { tag });
    },
    addEventListener(type, listener) {
      addListener(this.listeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(this.listeners, type, listener);
    },
  };
  doc.body = domNode(doc);
  return doc;
}

function domNode(ownerDocument, { tag = 'div', classes = [] } = {}) {
  const node = {
    tag,
    ownerDocument,
    hidden: true,
    parentElement: null,
    children: [],
    attributes: new Map(),
    dataset: {},
    listeners: new Map(),
    classList: fakeClassList(),
    style: {
      properties: new Map(),
      getPropertyValue(name) {
        return this.properties.get(name) || '';
      },
      setProperty(name, value) {
        this.properties.set(name, String(value));
      },
      removeProperty(name) {
        this.properties.delete(name);
      },
    },
    textContent: '',
    get className() {
      return this.attributes.get('class') || '';
    },
    set className(value) {
      this.attributes.set('class', String(value));
      String(value)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((name) => this.classList.add(name));
    },
    append(child) {
      child.parentElement = this;
      this.children.push(child);
    },
    appendChild(child) {
      this.append(child);
      return child;
    },
    remove() {
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
      this.parentElement = null;
    },
    contains(target) {
      for (let current = target; current; current = current.parentElement) {
        if (current === this) return true;
      }
      return false;
    },
    matches(selector) {
      return selectorMatches(this, selector);
    },
    closest(selector) {
      for (let current = this; current; current = current.parentElement) {
        if (selectorMatches(current, selector)) return current;
      }
      return null;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const out = [];
      const walk = (el) => {
        for (const child of el.children) {
          if (selectorMatches(child, selector)) out.push(child);
          walk(child);
        }
      };
      walk(this);
      return out;
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
    getBoundingClientRect() {
      return { width: 300, height: 200, left: 0, top: 0 };
    },
    addEventListener(type, listener) {
      addListener(this.listeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(this.listeners, type, listener);
    },
    dispatch(type, event) {
      dispatch(this.listeners, type, event);
    },
  };
  classes.forEach((name) => node.classList.add(name));
  return node;
}

function selectorMatches(el, selector) {
  return String(selector)
    .split(',')
    .map((part) => part.trim())
    .some((part) => {
      if (!part) return false;
      if (part.startsWith('.')) return el.classList.contains(part.slice(1));
      if (part.startsWith('[') && part.endsWith(']')) {
        const attr = part.slice(1, -1);
        if (attr.startsWith('data-')) {
          const camel = attr.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          if (camel in el.dataset) return true;
        }
        return el.attributes.has(attr);
      }
      return el.tag === part;
    });
}
