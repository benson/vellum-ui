import { expect } from "storybook/test";

import { row, stack, text } from "./storyHelpers.js";

function renderTabs() {
  const root = stack();
  const tabs = document.createElement("div");
  tabs.className = "tab-row";
  tabs.setAttribute("role", "tablist");
  const panel = text("div", "Your saved books.", "vui-story-card");
  panel.id = "library-tabpanel";
  panel.setAttribute("role", "tabpanel");
  const choices = [
    ["library", "Your saved books."],
    ["wishlist", "Books you want to find."],
    ["loans", "Books currently on loan."],
  ];
  for (const [index, [label, content]] of choices.entries()) {
    const button = text(
      "button",
      label,
      index === 0 ? "tab-btn active" : "tab-btn",
    );
    button.type = "button";
    button.id = `${label}-tab`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-selected", String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener("click", () => {
      tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", button.id);
      panel.textContent = content;
    });
    tabs.append(button);
  }
  panel.setAttribute("aria-labelledby", "library-tab");
  root.append(tabs, panel);
  return root;
}

function renderSegmented() {
  const group = document.createElement("div");
  group.className = "segmented";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "collection view");
  for (const [index, label] of ["covers", "list", "compact"].entries()) {
    const button = text(
      "button",
      label,
      index === 0 ? "segment-btn active" : "segment-btn",
    );
    button.type = "button";
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      group.querySelectorAll("button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
    });
    group.append(button);
  }
  return group;
}

function renderCompactActions() {
  const context = text(
    "span",
    "A Wizard of Earthsea · hardcover",
    "vui-story-note",
  );
  const edit = text("button", "✎", "icon-btn");
  edit.type = "button";
  edit.setAttribute("aria-label", "edit book");
  const more = text("button", "…", "icon-btn");
  more.type = "button";
  more.setAttribute("aria-label", "more actions");
  more.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "ui-popover floating-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  const duplicate = text("button", "duplicate", "floating-menu-item");
  duplicate.type = "button";
  duplicate.setAttribute("role", "menuitem");
  const archive = text("button", "archive", "floating-menu-item");
  archive.type = "button";
  archive.setAttribute("role", "menuitem");
  menu.append(duplicate, archive);
  const status = text("p", "No compact action selected.", "vui-story-note");
  status.setAttribute("role", "status");

  edit.addEventListener("click", () => {
    edit.setAttribute("aria-pressed", "true");
    status.textContent = "Editing A Wizard of Earthsea.";
  });
  more.addEventListener("click", () => {
    const expanded = more.getAttribute("aria-expanded") === "true";
    more.setAttribute("aria-expanded", String(!expanded));
    menu.hidden = expanded;
    status.textContent = expanded
      ? "More actions closed."
      : "More actions opened.";
  });
  for (const item of [duplicate, archive]) {
    item.addEventListener("click", () => {
      status.textContent = `${item.textContent} selected for A Wizard of Earthsea.`;
      menu.hidden = true;
      more.setAttribute("aria-expanded", "false");
    });
  }
  return stack(row(context, edit, more), menu, status);
}

export default { title: "Components/Controls", tags: ["autodocs"] };

export const Tabs = {
  render: renderTabs,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "wishlist" }));
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
      "Books you want to find.",
    );
    await expect(canvas.getByRole("tab", { name: "wishlist" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    canvasElement.replaceChildren(renderTabs());
  },
};

export const SegmentedControl = {
  render: renderSegmented,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const compact = canvas.getByRole("button", { name: "compact" });
    await userEvent.click(compact);
    await expect(compact).toHaveAttribute("aria-pressed", "true");
    canvasElement.replaceChildren(renderSegmented());
  },
};

export const CompactActions = {
  render: renderCompactActions,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "edit book" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Editing");
    await userEvent.click(canvas.getByRole("button", { name: "more actions" }));
    await expect(canvas.getByRole("menu")).toBeVisible();
    await userEvent.click(canvas.getByRole("menuitem", { name: "duplicate" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "duplicate selected",
    );
    canvasElement.replaceChildren(renderCompactActions());
  },
};
