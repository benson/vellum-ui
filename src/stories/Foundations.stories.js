import { stack, text } from './storyHelpers.js';

const colorTokens = [
  '--vui-color-bg',
  '--vui-color-surface',
  '--vui-color-surface-sunken',
  '--vui-color-surface-raised',
  '--vui-color-text',
  '--vui-color-text-muted',
  '--vui-color-accent',
  '--vui-color-success',
  '--vui-color-warn',
  '--vui-color-danger',
  '--vui-color-info',
];

const typeTokens = ['xxxs', 'xxs', 'xs', 'sm', 'md', 'base', 'lg', 'xl', 'heading', 'display', 'jumbo'];

function tokenValue(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderColors() {
  const grid = document.createElement('div');
  grid.className = 'vui-story-grid';
  for (const name of colorTokens) {
    const card = document.createElement('div');
    card.className = 'vui-story-card';
    const swatch = document.createElement('div');
    swatch.className = 'vui-story-swatch';
    swatch.style.background = `var(${name})`;
    swatch.setAttribute('aria-hidden', 'true');
    card.append(
      swatch,
      text('span', name, 'vui-story-token-name'),
      text('span', tokenValue(name), 'vui-story-token-value'),
    );
    grid.append(card);
  }
  return grid;
}

function renderTypography() {
  const root = stack();
  for (const size of typeTokens) {
    const line = document.createElement('div');
    line.className = 'vui-story-type-row';
    const sample = text('span', 'sealed pool generator');
    sample.style.fontSize = `var(--vui-font-size-${size})`;
    line.append(text('code', size), sample);
    root.append(line);
  }
  return root;
}

function renderShapeAndSpace() {
  const root = stack();
  const spaces = document.createElement('div');
  spaces.className = 'vui-story-row';
  for (let step = 1; step <= 6; step += 1) {
    const card = document.createElement('div');
    card.className = 'vui-story-card';
    const bar = document.createElement('div');
    bar.style.cssText = `height: 20px; width: var(--vui-space-${step}); background: var(--vui-color-accent);`;
    card.append(bar, text('code', `space-${step}`));
    spaces.append(card);
  }
  const radii = document.createElement('div');
  radii.className = 'vui-story-row';
  for (const radius of ['sharp', 'soft', 'card', 'pill']) {
    const shape = text('span', radius, 'vui-story-card');
    shape.style.borderRadius = `var(--vui-radius-${radius})`;
    radii.append(shape);
  }
  root.append(spaces, radii);
  return root;
}

export default {
  title: 'Foundations/Tokens',
  tags: ['autodocs'],
};

export const Color = { render: renderColors };
export const Typography = { render: renderTypography };
export const ShapeAndSpace = { name: 'Shape & space', render: renderShapeAndSpace };
