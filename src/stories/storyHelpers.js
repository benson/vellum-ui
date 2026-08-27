export function nodeFromHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function stack(...children) {
  const root = document.createElement("div");
  root.className = "vui-story-stack";
  root.append(...children.filter(Boolean));
  return root;
}

export function row(...children) {
  const root = document.createElement("div");
  root.className = "vui-story-row";
  root.append(...children.filter(Boolean));
  return root;
}

export function text(tag, value, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

export function withStoryCleanup(root, cleanup) {
  const Observer = root?.ownerDocument?.defaultView?.MutationObserver;
  const body = root?.ownerDocument?.body;
  if (!Observer || !body || typeof cleanup !== "function") return root;

  let active = true;
  const observer = new Observer(() => {
    if (!active || root.isConnected) return;
    active = false;
    observer.disconnect();
    cleanup();
  });
  observer.observe(body, { childList: true, subtree: true });
  return root;
}
