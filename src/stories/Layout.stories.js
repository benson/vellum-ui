import { expect } from "storybook/test";

import { edgeResize } from "../js/edgeResize.js";
import { nodeFromHtml, text, withStoryCleanup } from "./storyHelpers.js";

function renderBreadcrumb() {
  return nodeFromHtml(`<nav class="breadcrumb" aria-label="breadcrumb">
    <a href="#collection">collection</a>
    <span class="breadcrumb-sep" aria-hidden="true">›</span>
    <a href="#fiction">fiction</a>
    <span class="breadcrumb-sep" aria-hidden="true">›</span>
    <span aria-current="page">Earthsea</span>
  </nav>`);
}

function renderAccordion() {
  return nodeFromHtml(`<div class="accordion" style="width: min(420px, 100%)">
    <details class="accordion-item" open><summary>edition details</summary><div class="accordion-body">first edition · hardcover · very good</div></details>
    <details class="accordion-item"><summary>reading history</summary><div class="accordion-body">finished October 2025</div></details>
    <details class="accordion-item"><summary>notes</summary><div class="accordion-body">a slim book with a world inside it</div></details>
  </div>`);
}

function renderEdgeResize() {
  const root = document.createElement("div");
  root.className = "vui-story-demo-frame";
  root.style.cssText += "display:flex;height:240px;padding:0;overflow:hidden;";
  const pane = text("aside", "filters", "vui-story-card");
  pane.id = "resizable-filter-pane";
  pane.style.cssText =
    "border-width:0 1px 0 0;border-radius:0;width:180px;min-width:0;flex:none;";
  const content = text("main", "collection results");
  content.style.cssText =
    "align-items:center;display:flex;flex:1;justify-content:center;";
  const handle = document.createElement("div");
  handle.className = "vui-resize-divider vui-resize-divider-x";
  handle.tabIndex = 0;
  handle.setAttribute("role", "separator");
  handle.setAttribute("aria-label", "resize filters");
  handle.setAttribute("aria-controls", pane.id);
  handle.setAttribute("aria-orientation", "vertical");
  handle.append(text("span", "", "vui-resize-grip vui-resize-grip-x"));
  let collapsed = false;
  const setCollapsed = (next) => {
    collapsed = next;
    pane.hidden = next;
  };
  const cleanupResize = edgeResize(handle, {
    axis: "x",
    min: 120,
    max: 320,
    getSize: () => Number.parseFloat(pane.style.width),
    isCollapsed: () => collapsed,
    setCollapsed,
    applySize: (size) => {
      pane.style.width = `${size}px`;
    },
  });
  root.append(pane, handle, content);
  return withStoryCleanup(root, cleanupResize);
}

export default {
  title: "Patterns/Layout",
  tags: ["autodocs"],
};

export const Breadcrumb = { render: renderBreadcrumb };
export const Accordion = { render: renderAccordion };
export const EdgeResize = {
  name: "Edge resize",
  render: renderEdgeResize,
  play: async ({ canvas, userEvent }) => {
    const separator = canvas.getByRole("separator", { name: "resize filters" });
    separator.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(separator).toHaveAttribute("aria-valuenow", "196");
    await userEvent.keyboard("{End}");
    await expect(separator).toHaveAttribute("aria-valuenow", "320");
  },
};
