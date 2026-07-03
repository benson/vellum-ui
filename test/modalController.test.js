import test from 'node:test';
import assert from 'node:assert/strict';
import { modal } from '../src/js/modal.js';

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
  assert.equal(doc.body.classList.contains('modal-open'), true);
  assert.equal(focusTarget.focused, true);
  assert.deepEqual(opens.map((detail) => detail.reason), ['test-open']);

  controller.close({ reason: 'test-close' });
  controller.close({ reason: 'duplicate-close' });

  assert.equal(modalEl.hidden, true);
  assert.equal(modalEl.classList.contains('open'), false);
  assert.equal(modalEl.getAttribute('aria-hidden'), 'true');
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
});

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
