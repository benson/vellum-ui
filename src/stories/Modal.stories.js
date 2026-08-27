import { expect, fn, waitFor } from "storybook/test";

import { modal } from "../js/modal.js";
import { nodeFromHtml, withStoryCleanup } from "./storyHelpers.js";

function modalMarkup({ open = false, title }) {
  return nodeFromHtml(`<div class="ui-modal${open ? " open" : ""}" role="dialog" aria-modal="true" aria-labelledby="storybook-modal-title" ${open ? "" : "hidden"} aria-hidden="${open ? "false" : "true"}">
    <section class="ui-modal-card">
      <header class="ui-modal-head">
        <h3 class="ui-modal-title" id="storybook-modal-title"></h3>
        <button class="rune-close" type="button" aria-label="close dialog" data-modal-close>×</button>
      </header>
      <div class="ui-modal-body">
        <label class="field-row">note<input class="input" type="text" value="read this in autumn"></label>
      </div>
      <footer class="ui-modal-actions">
        <button class="btn btn-secondary" type="button" data-modal-close>cancel</button>
        <button class="btn" type="button">save note</button>
      </footer>
    </section>
  </div>`);
}

function renderModal({ onClose, onOpen, openOnLoad, title }) {
  const wrap = document.createElement("div");
  wrap.className = "vui-story-demo-frame";
  const trigger = document.createElement("button");
  trigger.className = "btn";
  trigger.type = "button";
  trigger.textContent = "open dialog";
  const overlay = modalMarkup({ open: openOnLoad, title });
  overlay.querySelector(".ui-modal-title").textContent = title;
  const controller = modal(overlay, {
    focusTarget: () => overlay.querySelector("input"),
    onClose,
    onOpen,
  });
  trigger.addEventListener("click", (event) =>
    controller.open({ reason: "trigger", event }),
  );
  wrap.append(trigger, overlay);
  return withStoryCleanup(wrap, () => controller.destroy());
}

function renderFrame({ title }) {
  const frame = modalMarkup({ open: true, title });
  frame.className = "";
  frame.removeAttribute("role");
  frame.removeAttribute("aria-modal");
  frame.removeAttribute("aria-hidden");
  frame.querySelector(".ui-modal-title").textContent = title;
  frame.querySelector(".rune-close").disabled = true;
  frame.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.disabled = true;
  });
  const card = frame.firstElementChild;
  card.classList.add("vui-story-modal-frame");
  return card;
}

export default {
  title: "Patterns/Modal",
  tags: ["autodocs"],
  render: renderModal,
  parameters: { layout: "fullscreen" },
  args: {
    onClose: fn(),
    onOpen: fn(),
    openOnLoad: false,
    title: "reading note",
  },
  argTypes: {
    openOnLoad: { control: "boolean" },
    title: { control: "text" },
  },
};

export const Interactive = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "open dialog" }));
    const dialog = canvas.getByRole("dialog", { name: "reading note" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(canvas.getByRole("textbox", { name: "note" })).toHaveFocus();
    await expect(args.onOpen).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "close dialog" }));
    await expect(dialog).not.toBeVisible();
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const Open = { args: { openOnLoad: true } };

export const Frame = {
  render: renderFrame,
  parameters: { layout: "padded" },
};
