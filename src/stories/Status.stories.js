import { expect } from "storybook/test";

import { chipNode } from "../js/chip.js";
import { renderStatusState } from "../js/statusState.js";
import { toast } from "../js/toast.js";
import {
  nodeFromHtml,
  row,
  stack,
  text,
  withStoryCleanup,
} from "./storyHelpers.js";

function renderTones() {
  const root = row();
  for (const [tone, label] of [
    ["neutral", "idle"],
    ["success", "synced"],
    ["warn", "needs review"],
    ["danger", "failed"],
  ]) {
    const mount = document.createElement("span");
    renderStatusState(mount, { label, tone });
    root.append(mount);
  }
  return root;
}

function renderStates() {
  const lab = document.createElement("div");
  lab.className = "vui-component-lab";
  const section = document.createElement("section");
  section.className = "vui-component-lab-section";
  section.append(
    text("h3", "Application states"),
    text(
      "p",
      "Compare hierarchy, recovery language, and action treatment across the complete state family.",
      "vui-story-note",
    ),
  );
  const states = [
    ["loading", { kind: "loading", message: "syncing your library…" }],
    ["empty", { kind: "empty", message: "nothing on this shelf yet" }],
    [
      "inline error",
      { kind: "inline-error", message: "that ISBN does not look right" },
    ],
    [
      "retryable",
      {
        kind: "retryable-error",
        message: "sync failed",
        detail: "the server did not respond",
        retryAction: "sync",
      },
    ],
    [
      "blocking",
      {
        kind: "blocking-error",
        message: "library unavailable",
        detail: "try again after reconnecting",
      },
    ],
  ];
  for (const [label, state] of states) {
    const line = document.createElement("div");
    line.className = "vui-component-stress-row";
    const mount = document.createElement("div");
    renderStatusState(mount, state);
    line.append(text("code", label), mount);
    section.append(line);
  }
  const retry = section.querySelector('[data-status-action="sync"]');
  retry?.addEventListener("click", () => {
    const mount = retry.parentElement.parentElement;
    renderStatusState(mount, { kind: "loading", message: "trying again…" });
  });
  lab.append(section);
  return lab;
}

function renderChips() {
  const root = row();
  const sparkle = text("span", "✨", "ui-chip-emoji");
  sparkle.setAttribute("aria-hidden", "true");
  root.append(
    chipNode({ text: "fiction" }),
    chipNode({ text: "favorite", prefixNode: sparkle }),
    chipNode({ text: "borrowed", variant: "quiet" }),
    chipNode({
      text: "hardcover",
      remove: { enabled: true, label: "remove hardcover filter" },
    }),
  );
  root
    .querySelector(".ui-chip-remove")
    ?.addEventListener("click", (event) =>
      event.currentTarget.parentElement.remove(),
    );
  return root;
}

function renderBanner() {
  const banner = nodeFromHtml(`<aside class="banner" aria-label="site update">
    <span class="banner-message">the catalog has been updated</span>
    <div class="banner-actions"><button class="btn" type="button">reload</button></div>
    <button class="icon-btn banner-dismiss" type="button" aria-label="dismiss update">×</button>
  </aside>`);
  banner
    .querySelector(".banner-dismiss")
    .addEventListener("click", () => banner.remove());
  banner
    .querySelector(".banner-actions .btn")
    .addEventListener("click", (event) => {
      banner.querySelector(".banner-message").textContent =
        "the catalog is current";
      event.currentTarget.textContent = "reloaded";
      event.currentTarget.disabled = true;
    });
  return banner;
}

function renderToast() {
  const root = stack();
  const button = text("button", "save book", "btn");
  let activeToast = null;
  button.type = "button";
  button.addEventListener("click", (event) => {
    activeToast?.dismiss({ motion: "none" });
    activeToast = toast("book saved to your library", {
      documentRef: root.ownerDocument,
      duration: 30_000,
      event,
      reason: "trigger",
      tone: "success",
    });
  });
  root.append(
    button,
    text(
      "p",
      "Toasts pause while hovered or focused and dismiss themselves.",
      "vui-story-note",
    ),
  );
  return withStoryCleanup(root, () => activeToast?.dismiss({ motion: "none" }));
}

function renderBadges() {
  const root = nodeFromHtml(`<div class="vui-story-row">
    <span class="badge">3</span>
    <span class="badge badge-quiet">12</span>
    <span class="badge badge-accent">99+</span>
    <button class="btn btn-secondary" type="button" aria-pressed="false">loans <span class="badge badge-quiet">4</span></button>
  </div>`);
  const loans = root.querySelector("button");
  loans.addEventListener("click", () => {
    const pressed = loans.getAttribute("aria-pressed") !== "true";
    loans.setAttribute("aria-pressed", String(pressed));
    loans.querySelector(".badge").textContent = pressed ? "3" : "4";
  });
  return root;
}

export default {
  title: "Components/Status & feedback",
  tags: ["autodocs"],
};

export const Tones = { render: renderTones };

export const ApplicationStates = {
  render: renderStates,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "retry" }));
    await expect(canvas.getByText("trying again…")).toBeVisible();
    canvasElement.replaceChildren(renderStates());
  },
};

export const Chips = {
  render: renderChips,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "remove hardcover filter" }),
    );
    await expect(canvas.queryByText("hardcover")).not.toBeInTheDocument();
    canvasElement.replaceChildren(renderChips());
  },
};

export const Banner = {
  render: renderBanner,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "reload" }));
    await expect(canvas.getByText("the catalog is current")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "dismiss update" }),
    );
    await expect(
      canvas.queryByLabelText("site update"),
    ).not.toBeInTheDocument();
    canvasElement.replaceChildren(renderBanner());
  },
};

export const Toast = {
  render: renderToast,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "save book" }));
    const notification = canvasElement.ownerDocument.querySelector(
      '[role="status"].toast',
    );
    await expect(notification).toHaveTextContent("book saved to your library");
    canvasElement.replaceChildren(renderToast());
  },
};

export const Badges = {
  render: renderBadges,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const loans = canvas.getByRole("button", { name: /loans/ });
    await userEvent.click(loans);
    await expect(loans).toHaveAttribute("aria-pressed", "true");
    await expect(loans).toHaveTextContent("3");
    canvasElement.replaceChildren(renderBadges());
  },
};
