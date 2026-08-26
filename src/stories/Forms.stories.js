import { expect } from 'storybook/test';

import { fieldRowHtml } from '../js/controlPrimitives.js';
import { nodeFromHtml, stack } from './storyHelpers.js';

function renderFields() {
  return nodeFromHtml(`<form class="vui-story-stack" style="width: min(420px, 100%)">
    ${fieldRowHtml({ label: 'book title', controlHtml: '<input class="input" name="title" value="A Wizard of Earthsea">' })}
    ${fieldRowHtml({ label: 'format', controlHtml: '<select name="format"><option>hardcover</option><option>paperback</option></select>' })}
    ${fieldRowHtml({ label: 'notes', controlHtml: '<textarea name="notes" rows="3" placeholder="condition, edition, provenance…"></textarea>' })}
    <button class="btn" type="submit">save book</button>
  </form>`);
}

function renderValidation() {
  return nodeFromHtml(`<form class="vui-story-stack" style="width: min(420px, 100%)">
    <label class="field-row">shelf name
      <input class="input" name="shelf" value="" aria-invalid="true" aria-describedby="shelf-error">
      <span class="field-error" id="shelf-error">give this shelf a name</span>
    </label>
    <button class="btn" type="submit">create shelf</button>
  </form>`);
}

function renderFieldChrome() {
  const root = stack();
  root.innerHTML = `
    <button type="button" class="field-chrome field-disclosure" aria-expanded="false">any publication year</button>
    <label class="field-row">collection name
      <span class="field-group">
        <button type="button" class="field-group-addon" aria-label="choose collection icon">📚</button>
        <input class="field-group-control" type="text" value="reading room">
      </span>
    </label>`;
  const disclosure = root.querySelector('.field-disclosure');
  disclosure.addEventListener('click', () => {
    disclosure.setAttribute('aria-expanded', String(disclosure.getAttribute('aria-expanded') !== 'true'));
  });
  return root;
}

function renderSelectionControls() {
  return nodeFromHtml(`<fieldset class="vui-story-stack" style="border: 0; padding: 0">
    <legend class="vui-story-label">catalog filters</legend>
    <label><input type="checkbox" checked> first editions only</label>
    <label><input type="checkbox"> signed copies</label>
    <label><input type="radio" name="binding" checked> any binding</label>
    <label><input type="radio" name="binding"> hardcover</label>
    <label class="switch"><input type="checkbox" class="switch-input" checked><span class="switch-track"></span>available now</label>
    <label class="field-row">minimum rating<input type="range" min="0" max="5" value="4"></label>
  </fieldset>`);
}

export default { title: 'Components/Forms', tags: ['autodocs'] };

export const Fields = {
  render: renderFields,
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'book title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Piranesi');
    await expect(title).toHaveValue('Piranesi');
  },
};

export const Validation = { render: renderValidation };

export const FieldChrome = {
  name: 'Triggers & groups',
  render: renderFieldChrome,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'any publication year' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const SelectionControls = { render: renderSelectionControls };
