import { expect, fn, waitFor } from 'storybook/test';

import { floatingMenu } from '../js/floatingMenu.js';
import { popover } from '../js/popover.js';
import { stack, text } from './storyHelpers.js';

let activeController = null;

function renderMenu({ onPick }) {
  const root = stack();
  root.style.position = 'relative';
  const trigger = text('button', 'book actions', 'btn');
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'ui-popover floating-menu';
  menu.hidden = true;
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('role', 'menu');
  const result = text('p', 'No action selected.', 'vui-story-note');
  for (const label of ['edit details', 'move to shelf', 'remove from library']) {
    const item = text('button', label, 'floating-menu-item');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.addEventListener('click', () => {
      result.textContent = `Selected ${label}.`;
      onPick(label);
      activeController.close({ reason: 'selection' });
    });
    menu.append(item);
  }
  activeController = floatingMenu(trigger, menu, {
    keyboard: true,
    onClose: () => trigger.setAttribute('aria-expanded', 'false'),
    onOpen: () => trigger.setAttribute('aria-expanded', 'true'),
  });
  trigger.addEventListener('click', (event) => {
    if (activeController.isOpen()) activeController.close({ reason: 'trigger', event });
    else activeController.open({ focusFirst: true, reason: 'trigger', event });
  });
  root.append(trigger, menu, result);
  return root;
}

function renderDisclosure() {
  const root = stack();
  root.style.position = 'relative';
  const trigger = text('button', 'edition details', 'field-chrome field-disclosure');
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'edition-popover');
  const panel = text('div', 'First published in 1968 by Parnassus Press.', 'ui-popover');
  panel.id = 'edition-popover';
  panel.hidden = true;
  panel.setAttribute('aria-hidden', 'true');
  activeController = popover(trigger, panel);
  root.append(trigger, panel);
  return root;
}

export default {
  title: 'Patterns/Popover & menu',
  tags: ['autodocs'],
  async beforeEach() {
    return () => {
      activeController?.destroy();
      activeController = null;
    };
  },
};

export const Menu = {
  args: { onPick: fn() },
  render: renderMenu,
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'book actions' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('menuitem', { name: 'edit details' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onPick).toHaveBeenCalledWith('move to shelf');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Disclosure = {
  render: renderDisclosure,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'edition details' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByText(/First published/)).toBeVisible());
    canvasElement.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
