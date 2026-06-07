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
