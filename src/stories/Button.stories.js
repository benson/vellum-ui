import { expect, fn } from 'storybook/test';

import { buttonHtml } from '../js/controlPrimitives.js';

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
