import { expect } from 'storybook/test';

import { paginationRange } from '../js/pagination.js';
import { priceStickerNode } from '../js/priceSticker.js';
import { nodeFromHtml, row, stack, text } from './storyHelpers.js';

function renderTable() {
  return nodeFromHtml(`<table class="vui-table">
    <caption>library inventory</caption>
    <thead><tr><th scope="col">book</th><th scope="col">author</th><th scope="col">format</th></tr></thead>
    <tbody>
      <tr><td>A Wizard of Earthsea</td><td>Ursula K. Le Guin</td><td>hardcover</td></tr>
      <tr><td>Piranesi</td><td>Susanna Clarke</td><td>paperback</td></tr>
      <tr><td>Kindred</td><td>Octavia E. Butler</td><td>hardcover</td></tr>
    </tbody>
  </table>`);
}

function renderPagination() {
  const state = { page: 7, pageCount: 20 };
  const pager = document.createElement('nav');
  pager.className = 'pager';
  pager.setAttribute('aria-label', 'pagination');
  const render = () => {
    pager.replaceChildren();
    const previous = text('button', '‹', 'pager-btn');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'previous page');
    previous.disabled = state.page <= 1;
    previous.addEventListener('click', () => { state.page -= 1; render(); });
    pager.append(previous);
    for (const item of paginationRange(state)) {
      if (item === 'gap') {
        const gap = text('span', '…', 'pager-gap');
        gap.setAttribute('aria-hidden', 'true');
        pager.append(gap);
        continue;
      }
      const button = text('button', String(item), 'pager-btn');
      button.type = 'button';
      button.setAttribute('aria-label', `page ${item}`);
      if (item === state.page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => { state.page = item; render(); });
      pager.append(button);
    }
    const next = text('button', '›', 'pager-btn');
    next.type = 'button';
    next.setAttribute('aria-label', 'next page');
    next.disabled = state.page >= state.pageCount;
    next.addEventListener('click', () => { state.page += 1; render(); });
    pager.append(next);
  };
  render();
  return pager;
}

function sleeve(label, amount, seed) {
  const slot = text('div', label, 'card-sleeve-slot');
  const root = document.createElement('div');
  root.className = 'card-sleeve';
  root.style.setProperty('--card-sleeve-width', 'clamp(128px, 32vw, 180px)');
  root.append(slot, priceStickerNode({ amount, jitter: seed }));
  return root;
}

function renderCardSleeves() {
  return row(
    sleeve('Earthsea', 4.2, 'earthsea'),
    sleeve('Piranesi', 12, 'piranesi'),
    sleeve('Kindred', 8.5, 'kindred'),
  );
}

function renderLoadingAndEmpty() {
  const skeleton = nodeFromHtml(`<div class="vui-story-card">
    <span class="vui-story-note">loading book details…</span>
    <div aria-hidden="true">
      <div class="skeleton skeleton-line" style="width: 60%"></div>
      <div class="skeleton skeleton-line" style="width: 100%"></div>
      <div class="skeleton skeleton-line" style="width: 82%"></div>
    </div>
  </div>`);
  const empty = nodeFromHtml(`<div class="empty-state"><span class="empty-state-glyph" aria-hidden="true">📚</span><span>no books match these filters</span></div>`);
  return row(skeleton, empty);
}

function renderProgress() {
  const root = stack();
  for (const value of [8, 62, 100]) {
    const line = nodeFromHtml(`<div class="vui-story-field">
      <span class="vui-story-label">${value}% imported</span>
      <div class="progress" role="progressbar" aria-label="import progress" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" style="--progress: ${value}%"><span class="progress-fill"></span></div>
    </div>`);
    root.append(line);
  }
  return root;
}

export default { title: 'Components/Data display', tags: ['autodocs'] };

export const Table = { render: renderTable };

export const Pagination = {
  render: renderPagination,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'next page' }));
    await expect(canvas.getByRole('button', { name: 'page 8' })).toHaveAttribute('aria-current', 'page');
  },
};

export const CardSleeves = { name: 'Card sleeves & price stickers', render: renderCardSleeves };
export const LoadingAndEmpty = { name: 'Loading & empty', render: renderLoadingAndEmpty };
export const Progress = { render: renderProgress };
