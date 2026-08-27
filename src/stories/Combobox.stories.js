import { expect, fn } from "storybook/test";

import { combobox } from "../js/combobox.js";
import { withStoryCleanup } from "./storyHelpers.js";

const books = [
  { label: "A Wizard of Earthsea", hint: "Ursula K. Le Guin" },
  { label: "The Left Hand of Darkness", hint: "Ursula K. Le Guin" },
  { label: "The Dispossessed", hint: "Ursula K. Le Guin" },
  { label: "Piranesi", hint: "Susanna Clarke" },
];

function renderCombobox({
  initialValue,
  minLength,
  onSelect,
  openOnFocus,
  placeholder,
}) {
  const wrap = document.createElement("div");
  wrap.className = "vui-story-stack";
  wrap.innerHTML = `
    <label class="vui-story-field">
      <span class="vui-story-label">book</span>
      <span class="combobox"><input class="input" type="search"></span>
    </label>
    <p class="vui-story-note" aria-live="polite">No book selected.</p>
  `;
  const input = wrap.querySelector("input");
  const note = wrap.querySelector(".vui-story-note");
  input.value = initialValue;
  input.placeholder = placeholder;
  const controller = combobox(input, {
    minLength,
    openOnFocus,
    getItems: async (query) => {
      const normalized = query.toLowerCase();
      return books.filter((book) =>
        book.label.toLowerCase().includes(normalized),
      );
    },
    toHint: (book) => book.hint,
    onSelect: (book) => {
      note.textContent = `Selected ${book.label}.`;
      onSelect(book);
    },
  });
  return withStoryCleanup(wrap, () => controller.destroy());
}

export default {
  title: "Components/Combobox",
  tags: ["autodocs"],
  render: renderCombobox,
  argTypes: {
    initialValue: { control: "text" },
    placeholder: { control: "text" },
    minLength: { control: { type: "number", min: 0, max: 5 } },
    openOnFocus: { control: "boolean" },
  },
  args: {
    initialValue: "",
    minLength: 0,
    onSelect: fn(),
    openOnFocus: true,
    placeholder: "search the catalog…",
  },
};

export const SearchAndSelect = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.type(input, "left");
    await canvas.findByRole("option", { name: /The Left Hand of Darkness/ });
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(input).toHaveValue("The Left Hand of Darkness");
    await expect(args.onSelect).toHaveBeenCalledOnce();
    canvasElement.replaceChildren(renderCombobox(args));
  },
};

export const MinimumQuery = { args: { minLength: 2, openOnFocus: false } };
