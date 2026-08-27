import { expect } from "storybook/test";

import { buttonHtml } from "../js/controlPrimitives.js";
import { chipNode } from "../js/chip.js";
import { renderStatusState } from "../js/statusState.js";
import { nodeFromHtml, row, stack, text } from "./storyHelpers.js";

const editableTokens = {
  background: "--vui-color-bg",
  surface: "--vui-color-surface",
  sunken: "--vui-color-surface-sunken",
  raised: "--vui-color-surface-raised",
  text: "--vui-color-text",
  muted: "--vui-color-text-muted",
  strong: "--vui-color-text-strong",
  accent: "--vui-color-accent",
  accentSoft: "--vui-color-accent-soft",
  accentStrong: "--vui-color-accent-strong",
  line: "--vui-color-line",
  radius: "--vui-radius-card",
};

function cssBlock(args) {
  const declarations = Object.entries(editableTokens)
    .map(([arg, token]) => {
      const override = typeof args[arg] === "string" ? args[arg].trim() : "";
      const inherited = getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim();
      return `  ${token}: ${override || inherited};`;
    })
    .join("\n");
  return `:root {\n${declarations}\n}`;
}

function applyOverrides(root, args) {
  for (const [arg, token] of Object.entries(editableTokens)) {
    const value = typeof args[arg] === "string" ? args[arg].trim() : "";
    if (value) root.style.setProperty(token, value);
  }
}

function metric(label, value, detail) {
  const root = document.createElement("div");
  root.className = "vui-theme-workbench-stat";
  root.append(
    text("span", label, "vui-story-label"),
    text("strong", value),
    text("span", detail, "vui-story-note"),
  );
  return root;
}

function renderWorkbench(args) {
  const root = document.createElement("main");
  root.className = "vui-theme-workbench";
  applyOverrides(root, args);

  const shell = document.createElement("div");
  shell.className = "vui-theme-workbench-shell";
  const heading = document.createElement("header");
  heading.className = "vui-theme-workbench-head";
  const title = stack(
    text("p", "theme playground", "vui-theme-workbench-kicker"),
    text("h1", "The reading room", "vui-theme-workbench-title"),
    text(
      "p",
      "Change the controls to test a visual direction across a representative product surface.",
      "vui-story-note",
    ),
  );
  const addButton = nodeFromHtml(buttonHtml({ label: "add a book" }));
  const importButton = nodeFromHtml(
    buttonHtml({ label: "import", variant: "secondary" }),
  );
  const actions = row(addButton, importButton);
  heading.append(title, actions);
  const actionStatus = text("p", "Workbench ready.", "vui-story-note");
  actionStatus.setAttribute("role", "status");

  const mainPanel = document.createElement("section");
  mainPanel.className = "vui-theme-workbench-panel";
  mainPanel.append(
    nodeFromHtml(
      `<header class="vui-theme-workbench-panel-head"><strong>library</strong><nav class="tab-row" aria-label="library views"><button class="tab-btn active" type="button" aria-current="page">collection</button><button class="tab-btn" type="button">wishlist</button></nav></header>`,
    ),
  );
  const viewTabs = [...mainPanel.querySelectorAll(".tab-btn")];
  for (const tab of viewTabs) {
    tab.addEventListener("click", () => {
      for (const candidate of viewTabs) {
        const active = candidate === tab;
        candidate.classList.toggle("active", active);
        if (active) candidate.setAttribute("aria-current", "page");
        else candidate.removeAttribute("aria-current");
      }
      actionStatus.textContent = `Showing the ${tab.textContent} view.`;
    });
  }
  const mainBody = document.createElement("div");
  mainBody.className = "vui-theme-workbench-panel-body";
  const stats = document.createElement("div");
  stats.className = "vui-theme-workbench-stats";
  stats.append(
    metric("books", "312", "18 unread"),
    metric("authors", "146", "24 countries"),
    metric("on loan", "4", "2 due soon"),
  );

  const filters = row();
  filters.append(
    nodeFromHtml(
      '<label class="field-row">search<input class="input" type="search" value="earthsea"></label>',
    ),
  );
  const filterChip = chipNode({
    text: "fiction",
    remove: { enabled: true, label: "remove fiction filter" },
  });
  filterChip
    .querySelector("button")
    .addEventListener("click", () => filterChip.remove());
  filters.append(filterChip);
  const statusMount = document.createElement("span");
  renderStatusState(statusMount, { label: "synced", tone: "success" });
  filters.append(statusMount);

  const table = nodeFromHtml(
    `<table class="vui-table"><caption>collection preview</caption><thead><tr><th scope="col">title</th><th scope="col">author</th><th scope="col">status</th></tr></thead><tbody><tr><td>A Wizard of Earthsea</td><td>Ursula K. Le Guin</td><td>finished</td></tr><tr><td>Piranesi</td><td>Susanna Clarke</td><td>reading</td></tr><tr><td>Kindred</td><td>Octavia E. Butler</td><td>unread</td></tr></tbody></table>`,
  );
  mainBody.append(stats, filters, table);
  mainPanel.append(mainBody);

  const sidePanel = document.createElement("aside");
  sidePanel.className = "vui-theme-workbench-panel";
  sidePanel.append(
    nodeFromHtml(
      '<header class="vui-theme-workbench-panel-head"><strong>book details</strong><button class="rune-close" type="button" aria-label="close details">×</button></header>',
    ),
  );
  const closeDetails = sidePanel.querySelector(".rune-close");
  const sideBody = document.createElement("div");
  sideBody.className = "vui-theme-workbench-panel-body";
  const saveButton = nodeFromHtml(buttonHtml({ label: "save" }));
  const cancelButton = nodeFromHtml(
    buttonHtml({ label: "cancel", variant: "secondary" }),
  );
  sideBody.append(
    nodeFromHtml(
      '<label class="field-row">title<input class="input" type="text" value="A Wizard of Earthsea"></label>',
    ),
    nodeFromHtml(
      '<label class="field-row">format<select><option>hardcover</option><option>paperback</option></select></label>',
    ),
    nodeFromHtml(
      '<label class="field-row">notes<textarea rows="4">quiet, exact, expansive</textarea></label>',
    ),
    row(saveButton, cancelButton),
  );
  sidePanel.append(sideBody);

  addButton.addEventListener("click", () => {
    sidePanel.hidden = false;
    sideBody.querySelector("input").focus();
    actionStatus.textContent = "Book details opened for a new entry.";
  });
  importButton.addEventListener("click", () => {
    actionStatus.textContent = "Import flow opened in this demo.";
  });
  closeDetails.addEventListener("click", () => {
    sidePanel.hidden = true;
    actionStatus.textContent = "Book details closed.";
  });
  saveButton.addEventListener("click", () => {
    actionStatus.textContent = `Saved ${sideBody.querySelector("input").value}.`;
  });
  cancelButton.addEventListener("click", () => {
    sideBody.querySelector("textarea").value = "quiet, exact, expansive";
    actionStatus.textContent = "Edits cancelled.";
  });

  const grid = document.createElement("div");
  grid.className = "vui-theme-workbench-grid";
  grid.append(mainPanel, sidePanel);

  const exportPanel = stack(text("h2", "CSS token draft"));
  const code = text("pre", cssBlock(args), "vui-theme-css");
  code.tabIndex = 0;
  code.setAttribute("aria-label", "CSS token draft");
  const copy = text("button", "copy CSS", "btn btn-secondary");
  copy.type = "button";
  const copyStatus = text("span", "", "vui-story-note");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copyStatus.textContent = "Copied.";
    } catch {
      copyStatus.textContent = "Select the block and copy it manually.";
    }
  });
  exportPanel.append(code, row(copy, copyStatus));
  shell.append(heading, actionStatus, grid, exportPanel);
  root.append(shell);
  return root;
}

const colorControl = {
  control: "color",
  description:
    "Optional override. Reset the control to follow the theme toolbar.",
};

export default {
  title: "Foundations/Theme playground",
  tags: ["autodocs"],
  render: renderWorkbench,
  parameters: { layout: "fullscreen" },
  argTypes: {
    background: colorControl,
    surface: colorControl,
    sunken: colorControl,
    raised: colorControl,
    text: colorControl,
    muted: colorControl,
    strong: colorControl,
    accent: colorControl,
    accentSoft: colorControl,
    accentStrong: colorControl,
    line: { control: "text" },
    radius: { control: "text" },
  },
  args: {
    background: "",
    surface: "",
    sunken: "",
    raised: "",
    text: "",
    muted: "",
    strong: "",
    accent: "",
    accentSoft: "",
    accentStrong: "",
    line: "",
    radius: "",
  },
};

export const Studio = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const workbench = canvasElement.querySelector(".vui-theme-workbench");
    const inheritedBackground = getComputedStyle(document.documentElement)
      .getPropertyValue("--vui-color-bg")
      .trim();
    await expect(
      getComputedStyle(workbench).getPropertyValue("--vui-color-bg").trim(),
    ).toBe(inheritedBackground);
    const remove = canvas.getByRole("button", {
      name: "remove fiction filter",
    });
    await userEvent.click(remove);
    await expect(canvas.queryByText("fiction")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "wishlist" }));
    await expect(
      canvas.getByRole("button", { name: "wishlist" }),
    ).toHaveAttribute("aria-current", "page");
    await userEvent.click(canvas.getByRole("button", { name: "import" }));
    await expect(
      canvas.getByText("Import flow opened in this demo."),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "close details" }),
    );
    await expect(
      canvas.getByText("book details").closest("aside"),
    ).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "add a book" }));
    await expect(
      canvas.getByText("book details").closest("aside"),
    ).toBeVisible();
    canvasElement.replaceChildren(renderWorkbench(args));
  },
};
