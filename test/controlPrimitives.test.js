import test from 'node:test';
import assert from 'node:assert/strict';
import { attrs, buttonHtml, cardPreviewDatasetAttrs, esc, fieldRowHtml, statusStateHtml } from '../src/js/index.js';

test('esc escapes html-sensitive characters', () => {
  assert.equal(esc('<button title="a&b">x</button>'), '&lt;button title=&quot;a&amp;b&quot;&gt;x&lt;/button&gt;');
});

test('attrs omits null and false values and renders boolean attributes', () => {
  assert.equal(attrs({ disabled: true, title: 'save & close', hidden: false, empty: null }), ' disabled title="save &amp; close"');
});

test('buttonHtml renders variants and attributes', () => {
  assert.equal(
    buttonHtml({ label: 'delete', variant: 'danger', attrs: { 'aria-label': 'delete card' } }),
    '<button class="btn btn-danger" type="button" aria-label="delete card">delete</button>',
  );
  assert.equal(buttonHtml({ label: 'reload', variant: 'ink' }), '<button class="btn btn-ink" type="button">reload</button>');
});

test('fieldRowHtml wraps a control without escaping trusted control html', () => {
  assert.equal(
    fieldRowHtml({ label: 'name', controlHtml: '<input type="text" />' }),
    '<label class="field-row">name<input type="text" /></label>',
  );
});

test('statusStateHtml falls back to neutral for unknown tones', () => {
  assert.equal(
    statusStateHtml({ label: 'mystery', tone: 'weird' }),
    '<span class="status-state status-state-neutral"><span class="status-state-label">mystery</span></span>',
  );
});

test('cardPreviewDatasetAttrs emits dashed data attributes', () => {
  assert.equal(
    cardPreviewDatasetAttrs({ name: 'Opt', imageUrl: 'front.jpg', backImageUrl: 'back.jpg' }, esc),
    ' data-card-image="front.jpg" data-card-back-image="back.jpg" data-card-title="Opt"',
  );
});
