import { expect } from "storybook/test";

import { fieldRowHtml } from "../js/controlPrimitives.js";
import { nodeFromHtml, stack, text } from "./storyHelpers.js";

function renderFields() {
  const form =
    nodeFromHtml(`<form class="vui-story-stack" style="width: min(420px, 100%)">
    ${fieldRowHtml({ label: "book title", controlHtml: '<input class="input" name="title" value="A Wizard of Earthsea">' })}
    ${fieldRowHtml({ label: "format", controlHtml: '<select name="format"><option>hardcover</option><option>paperback</option></select>' })}
    ${fieldRowHtml({ label: "notes", controlHtml: '<textarea name="notes" rows="3" placeholder="condition, edition, provenance…"></textarea>' })}
    <button class="btn" type="submit">save book</button>
  </form>`);
  const status = text("p", "No changes saved.", "vui-story-note");
  status.setAttribute("role", "status");
  form.append(status);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = `Saved ${form.elements.title.value || "untitled book"}.`;
  });
  return form;
}

function renderValidation() {
  const form =
    nodeFromHtml(`<form class="vui-story-stack" style="width: min(420px, 100%)">
    <label class="field-row">shelf name
      <input class="input" name="shelf" value="" aria-invalid="true" aria-describedby="shelf-error">
      <span class="field-error" id="shelf-error">give this shelf a name</span>
    </label>
    <button class="btn" type="submit">create shelf</button>
  </form>`);
  const input = form.elements.shelf;
  const error = form.querySelector(".field-error");
  const status = text("p", "Shelf name is required.", "vui-story-note");
  status.setAttribute("role", "status");
  form.append(status);
  input.addEventListener("input", () => {
    const valid = Boolean(input.value.trim());
    input.setAttribute("aria-invalid", String(!valid));
    error.hidden = valid;
    status.textContent = valid
      ? "Shelf name is ready."
      : "Shelf name is required.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim()) {
      input.focus();
      status.textContent = "Give this shelf a name before creating it.";
      return;
    }
    status.textContent = `Created ${input.value.trim()}.`;
  });
  return form;
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
  const disclosure = root.querySelector(".field-disclosure");
  const icon = root.querySelector(".field-group-addon");
  const status = text("p", "No field action selected.", "vui-story-note");
  status.setAttribute("role", "status");
  disclosure.addEventListener("click", () => {
    const expanded = disclosure.getAttribute("aria-expanded") !== "true";
    disclosure.setAttribute("aria-expanded", String(expanded));
    status.textContent = expanded
      ? "Publication-year choices opened."
      : "Publication-year choices closed.";
  });
  icon.addEventListener("click", () => {
    icon.textContent = icon.textContent === "📚" ? "✨" : "📚";
    status.textContent = `Collection icon changed to ${icon.textContent}.`;
  });
  root.append(status);
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
  const section = document.createElement("section");
  section.className = "vui-component-lab-section";
  section.append(
    text("h3", "Control × state matrix"),
    text(
      "p",
      "Judge vertical rhythm, label weight, field geometry, and state contrast together.",
      "vui-story-note",
    ),
  );
  const table = document.createElement("table");
  table.className = "vui-component-matrix";
  table.innerHTML = `<thead><tr><th scope="col">state</th><th scope="col">text</th><th scope="col">select</th><th scope="col">textarea</th></tr></thead><tbody>
    <tr><th scope="row">default</th><td><label class="field-row">title<input class="input" value="Piranesi"></label></td><td><label class="field-row">format<select><option>hardcover</option></select></label></td><td><label class="field-row">notes<textarea rows="2">signed copy</textarea></label></td></tr>
    <tr><th scope="row">empty</th><td><label class="field-row">title<input class="input" placeholder="book title"></label></td><td><label class="field-row">format<select><option value="">choose…</option></select></label></td><td><label class="field-row">notes<textarea rows="2" placeholder="optional"></textarea></label></td></tr>
    <tr><th scope="row">invalid</th><td><label class="field-row">title<input class="input" aria-invalid="true" aria-describedby="matrix-error"><span class="field-error" id="matrix-error">title is required</span></label></td><td><label class="field-row">format<select aria-invalid="true"><option>unknown</option></select></label></td><td><label class="field-row">notes<textarea rows="2" aria-invalid="true">too long</textarea></label></td></tr>
    <tr><th scope="row">disabled</th><td><label class="field-row">title<input class="input" value="Piranesi" disabled></label></td><td><label class="field-row">format<select disabled><option>hardcover</option></select></label></td><td><label class="field-row">notes<textarea rows="2" disabled>signed copy</textarea></label></td></tr>
  </tbody>`;
  section.append(table);
  const lab = document.createElement("div");
  lab.className = "vui-component-lab";
  lab.append(section);
  return lab;
}

function renderResponsiveStress() {
  const lab = document.createElement("div");
  lab.className = "vui-component-lab";
  const status = text("p", "No responsive action selected.", "vui-story-note");
  status.setAttribute("role", "status");
  for (const width of [280, 520]) {
    const section = document.createElement("section");
    section.className = "vui-component-lab-section";
    section.style.width = `min(${width}px, 100%)`;
    section.append(
      text("h3", `${width}px surface`),
      nodeFromHtml(
        '<label class="field-row">a deliberately long field label that still needs to read clearly<input class="input" value="The Left Hand of Darkness — signed anniversary edition"></label>',
      ),
      nodeFromHtml(
        '<label class="field-row">notes<textarea rows="3">Purchased from a small shop while traveling; dust jacket has a tiny crease along the upper edge.</textarea></label>',
      ),
      nodeFromHtml(
        '<div class="vui-story-row"><button class="btn" type="button">save changes</button><button class="btn btn-secondary" type="button">cancel</button></div>',
      ),
    );
    lab.append(section);
  }
  lab.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const surface = button
      .closest(".vui-component-lab-section")
      ?.querySelector("h3")?.textContent;
    status.textContent = `${button.textContent.trim()} selected on the ${surface}.`;
  });
  lab.append(status);
  return lab;
}

export default { title: "Components/Forms", tags: ["autodocs"] };

export const Fields = {
  render: renderFields,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const title = canvas.getByRole("textbox", { name: "book title" });
    await userEvent.clear(title);
    await userEvent.type(title, "Piranesi");
    await expect(title).toHaveValue("Piranesi");
    await userEvent.click(canvas.getByRole("button", { name: "save book" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Saved Piranesi",
    );
    canvasElement.replaceChildren(renderFields());
  },
};

export const Validation = {
  render: renderValidation,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: /shelf name/ });
    await userEvent.type(input, "winter reading");
    await userEvent.click(canvas.getByRole("button", { name: "create shelf" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Created winter reading",
    );
    canvasElement.replaceChildren(renderValidation());
  },
};

export const FieldChrome = {
  name: "Triggers & groups",
  render: renderFieldChrome,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole("button", {
      name: "any publication year",
    });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "choose collection icon" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Collection icon changed",
    );
    canvasElement.replaceChildren(renderFieldChrome());
  },
};

export const SelectionControls = { render: renderSelectionControls };

export const ControlMatrix = {
  name: "Deep dive: control matrix",
  render: renderControlMatrix,
};

export const ResponsiveStress = {
  name: "Deep dive: responsive stress",
  render: renderResponsiveStress,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: "save changes" })[0],
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "save changes selected",
    );
    canvasElement.replaceChildren(renderResponsiveStress());
  },
};
