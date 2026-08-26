import { expect, fn } from 'storybook/test';

import { buttonHtml } from '../js/controlPrimitives.js';
import { nodeFromHtml, row, stack, text } from './storyHelpers.js';

function renderButton({ disabled, label, onClick, shortcut, variant }) {
  const template = document.createElement('template');
  template.innerHTML = buttonHtml({
    label,
    variant,
    attrs: disabled ? { disabled: true } : {},
  });
  const button = template.content.firstElementChild;
  if (shortcut) {
    const hint = document.createElement('span');
    hint.className = 'btn-shortcut';
    hint.textContent = shortcut;
    button.append(hint);
  }
  button.addEventListener('click', onClick);
  return button;
}

function sampleButton({ disabled = false, label, shortcut = '', variant = 'primary' }) {
  const button = nodeFromHtml(buttonHtml({
    label,
    variant,
    attrs: disabled ? { disabled: true } : {},
  }));
  if (shortcut) {
    const hint = text('span', shortcut, 'btn-shortcut');
    hint.setAttribute('aria-hidden', 'true');
    button.append(hint);
  }
  return button;
}

function renderVariantMatrix() {
  const table = document.createElement('table');
  table.className = 'vui-component-matrix';
  table.innerHTML = '<thead><tr><th scope="col">variant</th><th scope="col">default</th><th scope="col">shortcut</th><th scope="col">disabled</th></tr></thead>';
  const body = document.createElement('tbody');
  for (const variant of ['primary', 'secondary', 'danger', 'ink']) {
    const tr = document.createElement('tr');
    tr.append(text('th', variant));
    tr.firstElementChild.setAttribute('scope', 'row');
    for (const button of [
      sampleButton({ label: 'continue', variant }),
      sampleButton({ label: 'continue', shortcut: '↵', variant }),
      sampleButton({ disabled: true, label: 'continue', variant }),
    ]) {
      const td = document.createElement('td');
      td.append(button);
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(body);
  const section = document.createElement('section');
  section.className = 'vui-component-lab-section';
  section.append(text('h3', 'Variant × state matrix'), text('p', 'Compare weight, contrast, geometry, and disabled treatment without changing context.', 'vui-story-note'), table);
  const lab = document.createElement('div');
  lab.className = 'vui-component-lab';
  lab.append(section);
  return lab;
}

function renderContentStress() {
  const section = document.createElement('section');
  section.className = 'vui-component-lab-section';
  section.append(text('h3', 'Content stress'));
  for (const [label, button] of [
    ['short', sampleButton({ label: 'save' })],
    ['typical', sampleButton({ label: 'add to collection' })],
    ['long', sampleButton({ label: 'add all selected books to the reading queue' })],
    ['shortcut', sampleButton({ label: 'open quick search', shortcut: '⌘ K', variant: 'ink' })],
  ]) {
    const line = document.createElement('div');
    line.className = 'vui-component-stress-row';
    line.append(text('code', label), button);
    section.append(line);
  }
  const constrained = stack(text('span', '240px container', 'vui-story-label'), sampleButton({ label: 'save changes to this collection' }));
  constrained.style.width = '240px';
  section.append(constrained);
  const lab = document.createElement('div');
  lab.className = 'vui-component-lab';
  lab.append(section);
  return lab;
}

function renderKeyboardPath() {
  const section = document.createElement('section');
  section.className = 'vui-component-lab-section';
  section.append(
    text('h3', 'Keyboard path'),
    text('p', 'Tab through the real controls to judge focus visibility and ordering.', 'vui-story-note'),
    row(
      sampleButton({ label: 'previous', variant: 'secondary' }),
      sampleButton({ label: 'save draft' }),
      sampleButton({ label: 'delete draft', variant: 'danger' }),
    ),
  );
  return section;
}

export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  render: renderButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ink'],
    },
    label: { control: 'text' },
    shortcut: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    disabled: false,
    label: 'add to shelf',
    onClick: fn(),
    shortcut: '',
    variant: 'primary',
  },
};

export const Primary = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'add to shelf' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary = { args: { label: 'cancel', variant: 'secondary' } };

export const Danger = { args: { label: 'remove book', variant: 'danger' } };

export const WithShortcut = { args: { label: 'search', shortcut: '/', variant: 'ink' } };

export const Disabled = { args: { disabled: true, label: 'saving…' } };

export const VariantMatrix = { name: 'Deep dive: variant matrix', render: renderVariantMatrix };

export const ContentStress = { name: 'Deep dive: content stress', render: renderContentStress };

export const KeyboardPath = {
  name: 'Deep dive: keyboard path',
  render: renderKeyboardPath,
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'previous' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'save draft' })).toHaveFocus();
  },
};
