import test from 'node:test';
import assert from 'node:assert/strict';
import { chipHtml, chipNode } from '../src/js/chip.js';

test('chipHtml renders variant classes and label', () => {
  const html = chipHtml({ text: 'Synced', variant: 'status' });
  assert.match(html, /class="ui-chip ui-chip-status"/);
  assert.match(html, /<span class="ui-chip-label">Synced<\/span>/);
});

test('chipHtml escapes label, title, and dataset values', () => {
  const html = chipHtml({
    text: '<b>x</b>',
    title: '"quoted"',
    dataset: { tagId: 'a&b' },
  });
  assert.ok(!html.includes('<b>'));
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /title="&quot;quoted&quot;"/);
  assert.match(html, /data-tag-id="a&amp;b"/);
});

test('chipHtml renders a segmented remove control when enabled', () => {
  const html = chipHtml({ text: 'splash', remove: { enabled: true, label: 'remove splash' } });
  assert.match(html, /<button class="ui-chip-remove" type="button" aria-label="remove splash"/);
});

test('chipHtml returns empty for blank text without prefix', () => {
  assert.equal(chipHtml({ text: '   ' }), '');
});

test('chipNode returns null without a usable document', () => {
  assert.equal(chipNode(null, { text: 'x' }), null);
});

test('chipNode accepts a documentRef-first signature', () => {
  const created = [];
  const fakeDocument = {
    createElement(tag) {
      const node = {
        tag,
        className: '',
        textContent: '',
        children: [],
        dataset: {},
        attributes: {},
        append(...nodes) {
          this.children.push(...nodes);
        },
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      };
      created.push(node);
      return node;
    },
  };
  const chip = chipNode(fakeDocument, { text: 'Owner', variant: 'role', dataset: { roleId: '7' } });
  assert.equal(chip.className, 'ui-chip ui-chip-role');
  assert.equal(chip.dataset.roleId, '7');
  assert.equal(chip.children[0].className, 'ui-chip-label');
  assert.equal(chip.children[0].textContent, 'Owner');
});
