import { expect } from 'storybook/test';

import { fieldRowHtml } from '../js/controlPrimitives.js';
import { nodeFromHtml, stack, text } from './storyHelpers.js';

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

function renderControlMatrix() {
  const section = document.createElement('section');
  section.className = 'vui-component-lab-section';
  section.append(text('h3', 'Control × state matrix'), text('p', 'Judge vertical rhythm, label weight, field geometry, and state contrast together.', 'vui-story-note'));
  const table = document.createElement('table');
  table.className = 'vui-component-matrix';
  table.innerHTML = `<thead><tr><th scope="col">state</th><th scope="col">text</th><th scope="col">select</th><th scope="col">textarea</th></tr></thead><tbody>
    <tr><th scope="row">default</th><td><label class="field-row">title<input class="input" value="Piranesi"></label></td><td><label class="field-row">format<select><option>hardcover</option></select></label></td><td><label class="field-row">notes<textarea rows="2">signed copy</textarea></label></td></tr>
    <tr><th scope="row">empty</th><td><label class="field-row">title<input class="input" placeholder="book title"></label></td><td><label class="field-row">format<select><option value="">choose…</option></select></label></td><td><label class="field-row">notes<textarea rows="2" placeholder="optional"></textarea></label></td></tr>
    <tr><th scope="row">invalid</th><td><label class="field-row">title<input class="input" aria-invalid="true" aria-describedby="matrix-error"><span class="field-error" id="matrix-error">title is required</span></label></td><td><label class="field-row">format<select aria-invalid="true"><option>unknown</option></select></label></td><td><label class="field-row">notes<textarea rows="2" aria-invalid="true">too long</textarea></label></td></tr>
    <tr><th scope="row">disabled</th><td><label class="field-row">title<input class="input" value="Piranesi" disabled></label></td><td><label class="field-row">format<select disabled><option>hardcover</option></select></label></td><td><label class="field-row">notes<textarea rows="2" disabled>signed copy</textarea></label></td></tr>
  </tbody>`;
  section.append(table);
  const lab = document.createElement('div');
  lab.className = 'vui-component-lab';
  lab.append(section);
  return lab;
}

function renderResponsiveStress() {
  const lab = document.createElement('div');
  lab.className = 'vui-component-lab';
  for (const width of [280, 520]) {
    const section = document.createElement('section');
    section.className = 'vui-component-lab-section';
    section.style.width = `min(${width}px, 100%)`;
    section.append(
      text('h3', `${width}px surface`),
      nodeFromHtml('<label class="field-row">a deliberately long field label that still needs to read clearly<input class="input" value="The Left Hand of Darkness — signed anniversary edition"></label>'),
      nodeFromHtml('<label class="field-row">notes<textarea rows="3">Purchased from a small shop while traveling; dust jacket has a tiny crease along the upper edge.</textarea></label>'),
      nodeFromHtml('<div class="vui-story-row"><button class="btn" type="button">save changes</button><button class="btn btn-secondary" type="button">cancel</button></div>'),
    );
    lab.append(section);
  }
  return lab;
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

export const ControlMatrix = { name: 'Deep dive: control matrix', render: renderControlMatrix };

export const ResponsiveStress = { name: 'Deep dive: responsive stress', render: renderResponsiveStress };
