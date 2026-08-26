import { expect, fn } from 'storybook/test';

import { drawer } from '../js/drawer.js';

let activeController = null;

function renderDrawer({ onClose, onOpen, openOnLoad, side, title }) {
  const wrap = document.createElement('div');
  wrap.className = 'vui-story-stack';
  wrap.innerHTML = `
    <button class="btn" type="button" data-open-drawer>open ${side} drawer</button>
    <p class="vui-story-note">The drawer uses the real Vellum controller. Escape, backdrop click, focus return, and direct dragging are active.</p>
    <div class="ui-drawer-layer" data-vui-drawer-side="${side}" hidden aria-hidden="true">
      <button class="ui-drawer-backdrop" type="button" aria-label="close drawer"></button>
      <div class="ui-drawer" data-vui-drawer-side="${side}" aria-labelledby="vui-story-drawer-title">
        <header class="ui-drawer-head" data-vui-drawer-handle>
          <h3 class="ui-drawer-title" id="vui-story-drawer-title">${title}</h3>
          <button class="rune-close" type="button" aria-label="close" data-drawer-close>×</button>
        </header>
        <div class="ui-drawer-body">
          <label class="field-row">book title<input class="input" type="text" value="Piranesi"></label>
        </div>
        <div class="ui-drawer-actions">
          <button class="btn btn-secondary" type="button" data-drawer-close>cancel</button>
          <button class="btn" type="button">add</button>
        </div>
      </div>
    </div>
  `;
  const trigger = wrap.querySelector('[data-open-drawer]');
  const layer = wrap.querySelector('.ui-drawer-layer');
  activeController = drawer(layer, { side, onClose, onOpen });
  trigger.addEventListener('click', (event) =>
    activeController.open({ reason: 'trigger', event, trigger }),
  );
  if (openOnLoad) queueMicrotask(() => activeController?.open({ motion: 'none', trigger }));
  return wrap;
}

export default {
  title: 'Patterns/Drawer',
  tags: ['autodocs'],
  render: renderDrawer,
  parameters: { layout: 'fullscreen' },
  async beforeEach() {
    return () => {
      activeController?.destroy();
      activeController = null;
    };
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right', 'bottom'] },
    title: { control: 'text' },
    openOnLoad: { control: 'boolean' },
  },
  args: {
    onClose: fn(),
    onOpen: fn(),
    openOnLoad: false,
    side: 'right',
    title: 'add to shelf',
  },
};

export const Right = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'open right drawer' }));
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(args.onOpen).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole('button', { name: 'close' }));
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const BottomSheet = { args: { side: 'bottom', title: 'quick add' } };

export const Open = { args: { openOnLoad: true } };
