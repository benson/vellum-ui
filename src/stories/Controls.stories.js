import { expect } from 'storybook/test';

import { row, stack, text } from './storyHelpers.js';

function renderTabs() {
  const root = stack();
  const tabs = document.createElement('div');
  tabs.className = 'tab-row';
  tabs.setAttribute('role', 'tablist');
  const panel = text('div', 'Your saved books.', 'vui-story-card');
  panel.id = 'library-tabpanel';
  panel.setAttribute('role', 'tabpanel');
  const choices = [
    ['library', 'Your saved books.'],
    ['wishlist', 'Books you want to find.'],
    ['loans', 'Books currently on loan.'],
  ];
  for (const [index, [label, content]] of choices.entries()) {
    const button = text('button', label, index === 0 ? 'tab-btn active' : 'tab-btn');
    button.type = 'button';
    button.id = `${label}-tab`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-selected', String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('click', () => {
      tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', button.id);
      panel.textContent = content;
    });
    tabs.append(button);
  }
  panel.setAttribute('aria-labelledby', 'library-tab');
  root.append(tabs, panel);
  return root;
}

function renderSegmented() {
  const group = document.createElement('div');
  group.className = 'segmented';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'collection view');
  for (const [index, label] of ['covers', 'list', 'compact'].entries()) {
    const button = text('button', label, index === 0 ? 'segment-btn active' : 'segment-btn');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    });
    group.append(button);
  }
  return group;
}

function renderCompactActions() {
  const context = text('span', 'A Wizard of Earthsea · hardcover', 'vui-story-note');
  const edit = text('button', '✎', 'icon-btn');
  edit.type = 'button';
  edit.setAttribute('aria-label', 'edit book');
  const more = text('button', '…', 'icon-btn');
  more.type = 'button';
  more.setAttribute('aria-label', 'more actions');
  return row(context, edit, more);
}

export default { title: 'Components/Controls', tags: ['autodocs'] };

export const Tabs = {
  render: renderTabs,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'wishlist' }));
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Books you want to find.');
    await expect(canvas.getByRole('tab', { name: 'wishlist' })).toHaveAttribute('aria-selected', 'true');
  },
};

export const SegmentedControl = {
  render: renderSegmented,
  play: async ({ canvas, userEvent }) => {
    const compact = canvas.getByRole('button', { name: 'compact' });
    await userEvent.click(compact);
    await expect(compact).toHaveAttribute('aria-pressed', 'true');
  },
};

export const CompactActions = { render: renderCompactActions };
