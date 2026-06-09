import {
  buttonHtml,
  chipNode,
  clearNode,
  el,
  fieldRowHtml,
  renderStatusState,
  statusStateHtml,
} from '../index.js';

const mount = document.getElementById('designSystemMount');

const PLAYGROUND_KEY = 'vellum_ds_token_overrides_v1';

const PLAYGROUND_GROUPS = [
  {
    label: 'surfaces',
    tokens: [
      '--vui-color-bg',
      '--vui-color-surface',
      '--vui-color-surface-sunken',
      '--vui-color-surface-raised',
      '--vui-color-surface-hover',
    ],
  },
  {
    label: 'ink & lines',
    tokens: [
      '--vui-color-text',
      '--vui-color-text-muted',
      '--vui-color-text-strong',
      '--vui-color-text-inverse',
      '--vui-color-line',
      '--vui-color-line-strong',
    ],
  },
  {
    label: 'accents & status',
    tokens: [
      '--vui-color-accent',
      '--vui-color-accent-soft',
      '--vui-color-accent-strong',
      '--vui-color-success',
      '--vui-color-warn',
      '--vui-color-danger',
      '--vui-color-info',
    ],
  },
  {
    label: 'shape & shadow',
    tokens: [
      '--vui-border-width',
      '--vui-radius-sharp',
      '--vui-radius-soft',
      '--vui-radius-round',
      '--vui-color-shadow',
      '--vui-shadow-soft',
      '--vui-shadow-firm',
      '--vui-shadow-hard',
      '--vui-shadow-overlay',
    ],
  },
  {
    label: 'type',
    tokens: [
      '--vui-font-body',
      '--vui-font-heading',
      '--vui-font-mono',
      '--vui-font-size-sm',
      '--vui-font-size-base',
      '--vui-font-size-heading',
      '--vui-font-weight-body',
    ],
  },
  {
    label: 'space & motion',
    tokens: [
      '--vui-space-2',
      '--vui-space-3',
      '--vui-space-4',
      '--vui-control-height',
      '--vui-motion-base',
    ],
  },
];

const PLAYGROUND_TOKENS = PLAYGROUND_GROUPS.flatMap((groupDef) => groupDef.tokens);

// Defaults must be read before stored overrides are applied.
const tokenDefaults = readTokenDefaults();
applyOverrides(readOverrides());

renderDesignSystem(mount);

function readTokenDefaults() {
  const computed = getComputedStyle(document.documentElement);
  const defaults = {};
  for (const token of PLAYGROUND_TOKENS) defaults[token] = computed.getPropertyValue(token).trim();
  return defaults;
}

function overrideStyleEl() {
  let styleEl = document.getElementById('ds-token-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ds-token-overrides';
    document.head.append(styleEl);
  }
  return styleEl;
}

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PLAYGROUND_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides) {
  try {
    localStorage.setItem(PLAYGROUND_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

function overridesToCss(overrides) {
  const entries = Object.entries(overrides);
  if (!entries.length) return '';
  return `:root {\n${entries.map(([token, value]) => `  ${token}: ${value};`).join('\n')}\n}`;
}

function applyOverrides(overrides) {
  overrideStyleEl().textContent = overridesToCss(overrides);
}

export function renderDesignSystem(target) {
  if (!target) return;
  clearNode(target);
  const content = el('div', { className: 'ds-page-body' });
  const groups = [
    tokensGroup(),
    buttonsGroup(),
    formsGroup(),
    statusGroup(),
    overlaysGroup(),
  ];
  for (const groupNode of groups) content.append(groupNode);
  target.append(
    pageHeader(),
    el(
      'div',
      { className: 'ds-page-layout' },
      toc(groups.map((groupNode) => ({ id: groupNode.id, title: groupNode.dataset.title }))),
      content,
    ),
  );
  wireToc(target);
}

function pageHeader() {
  return el(
    'header',
    { className: 'ds-page-head' },
    el('h1', { className: 'ds-page-title', text: 'Vellum UI' }),
    el('p', {
      className: 'ds-page-sub',
      text:
        'Shared tokens, hard-shadow primitives, and small browser-native helpers for Biblioplex, PoolBuilder, and future apps.',
    }),
    el(
      'nav',
      { className: 'ds-page-actions', ariaLabel: 'Vellum UI pages' },
      el('a', { className: 'ds-page-back', href: '/vellum-ui/design-system/', text: 'home' }),
      el('a', { className: 'ds-page-back', href: '/vellum-ui/labs/modal/', text: 'modal lab' }),
    ),
  );
}

function toc(groups) {
  const wrap = el('aside', { className: 'ds-toc' });
  wrap.append(
    el('div', { className: 'ds-toc-title', text: 'states' }),
    el(
      'div',
      { className: 'ds-toc-states' },
      el(
        'div',
        { className: 'ds-toc-state-row' },
        stateButton('rest', () => setDemoState('rest')),
        stateButton('hover', () => setDemoState('hover')),
        stateButton('active', () => setDemoState('active')),
        stateButton('focus', () => setDemoState('focus')),
      ),
    ),
    el('div', { className: 'ds-toc-title', text: 'catalog' }),
  );
  for (const group of groups) wrap.append(el('a', { className: 'ds-toc-link', href: `#${group.id}`, text: group.title }));
  return wrap;
}

function stateButton(label, onClick) {
  return el('button', { className: label === 'rest' ? 'ds-toc-state-btn active' : 'ds-toc-state-btn', type: 'button', text: label, onClick });
}

function setDemoState(state) {
  document.querySelectorAll('.ds-toc-state-btn').forEach((btn) => btn.classList.toggle('active', btn.textContent === state));
  document.body.classList.toggle('ds-force-hover', state === 'hover');
  document.body.classList.toggle('ds-force-active', state === 'active');
  document.body.classList.toggle('ds-force-focus', state === 'focus');
}

function wireToc(target) {
  const links = [...target.querySelectorAll('.ds-toc-link')];
  const groups = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const setActive = () => {
    const current = groups.findLast((group) => group.getBoundingClientRect().top <= 96) || groups[0];
    links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current?.id}`));
  };
  document.addEventListener('scroll', setActive, { passive: true });
  setActive();
}

function group(id, title, ...entries) {
  const wrap = el('section', { id, className: 'ds-group', dataset: { title } });
  wrap.append(el('h2', { className: 'ds-group-title', text: title }), ...entries);
  return wrap;
}

function entry(name, selectors, description, demoFactory) {
  const demo = el('div', { className: 'ds-entry-demo' });
  const stage = el('div', { className: 'ds-zoom-stage' });
  const built = demoFactory();
  if (built) stage.append(built);
  demo.append(zoomBar(stage), stage);
  return el(
    'section',
    { className: 'ds-entry' },
    el(
      'header',
      { className: 'ds-entry-head' },
      el('h3', { className: 'ds-entry-name', text: name }),
      el('div', { className: 'ds-entry-selectors' }, selectors.map((selector) => el('code', { text: selector }))),
    ),
    el('p', { className: 'ds-entry-desc', text: description }),
    demo,
  );
}

function zoomBar(stage) {
  const bar = el('div', { className: 'ds-zoom-bar' });
  for (const zoom of [1, 2, 3]) {
    const btn = el('button', {
      className: zoom === 1 ? 'ds-zoom-btn active' : 'ds-zoom-btn',
      type: 'button',
      text: `${zoom}x`,
      onClick: () => {
        stage.style.zoom = zoom === 1 ? '' : String(zoom);
        bar.querySelectorAll('.ds-zoom-btn').forEach((other) => other.classList.toggle('active', other === btn));
      },
    });
    bar.append(btn);
  }
  return bar;
}

function tokensGroup() {
  return group(
    'tokens',
    'Tokens',
    entry(
      'Token playground',
      [':root', '--vui-color-*', '--vui-radius-*', '--vui-shadow-*'],
      'Tune core CSS variables live — the whole catalog re-tints instantly. The override panel shows only what changed; copy it straight into src/css/tokens.css. Saved to this browser until reset.',
      tokenPlayground,
    ),
  );
}

function tokenPlayground() {
  const output = el('pre', { className: 'ds-token-output' });
  const playground = el('div', { className: 'ds-playground' });

  const updateOutput = () => {
    const css = overridesToCss(readOverrides());
    output.textContent = css || '/* no token changes */';
  };

  const setToken = (token, value) => {
    const overrides = readOverrides();
    if (value.trim() === tokenDefaults[token]) delete overrides[token];
    else overrides[token] = value;
    writeOverrides(overrides);
    applyOverrides(overrides);
    updateOutput();
  };

  const storedOverrides = readOverrides();
  for (const groupDef of PLAYGROUND_GROUPS) {
    const col = el('div', { className: 'ds-playground-col' }, el('div', { className: 'ds-playground-col-label', text: groupDef.label }));
    for (const token of groupDef.tokens) {
      const value = storedOverrides[token] ?? tokenDefaults[token];
      const useColor = token.includes('-color-') && !value.includes('(') && !value.includes(',');
      const input = el('input', {
        className: useColor ? '' : 'ds-playground-text',
        type: useColor ? 'color' : 'text',
        value: useColor ? normalizeColor(value) : value,
        dataset: { token },
      });
      input.addEventListener('input', () => setToken(token, input.value));
      col.append(el('label', { className: 'ds-playground-row' }, el('span', { className: 'ds-playground-token', text: token.replace('--vui-', '') }), input));
    }
    playground.append(col);
  }

  const copyBtn = el('button', { className: 'btn', type: 'button', text: 'copy css' });
  copyBtn.addEventListener('click', async () => {
    const css = overridesToCss(readOverrides()) || '/* no token changes */';
    try {
      await navigator.clipboard.writeText(css);
      copyBtn.textContent = 'copied!';
    } catch {
      copyBtn.textContent = 'copy failed';
    }
    setTimeout(() => {
      copyBtn.textContent = 'copy css';
    }, 1200);
  });
  const resetBtn = el('button', { className: 'btn btn-secondary', type: 'button', text: 'reset' });
  resetBtn.addEventListener('click', () => {
    writeOverrides({});
    applyOverrides({});
    location.reload();
  });

  playground.append(
    el(
      'div',
      { className: 'ds-playground-col' },
      el('div', { className: 'ds-playground-col-label', text: 'override' }),
      output,
      el('div', { className: 'ds-row' }, copyBtn, resetBtn),
    ),
  );
  updateOutput();
  return playground;
}

function normalizeColor(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+/g)?.slice(0, 3).map(Number) || [0, 0, 0];
  probe.remove();
  return '#' + rgb.map((part) => part.toString(16).padStart(2, '0')).join('');
}

function buttonsGroup() {
  return group(
    'buttons',
    'Buttons',
    entry('Buttons', ['.btn', '.btn-secondary', '.btn-danger', '.btn-ink', '.btn-link'], 'Primary gold, secondary blue, danger red, ink, disabled, and bare text actions.', () =>
      demoHtml(
        buttonHtml({ label: 'reload' }) +
          buttonHtml({ label: 'save' }) +
          buttonHtml({ label: 'cancel', variant: 'secondary' }) +
          buttonHtml({ label: 'delete', variant: 'danger' }) +
          buttonHtml({ label: 'generate', variant: 'ink' }) +
          buttonHtml({ label: 'disabled', attrs: { disabled: true } }) +
          '<button class="btn-link" type="button">inline action</button>',
      ),
    ),
    entry('Segmented control', ['.segmented', '.segment-btn'], 'Hard-shadow abutting segments. Active segments press into the canvas.', segmentedDemo),
    entry('Icon buttons', ['.icon-btn'], 'Bare glyph buttons for compact table/card actions.', () =>
      demoHtml(
        '<button class="icon-btn" type="button" aria-label="close">x</button>' +
          '<button class="icon-btn" type="button" aria-label="more">...</button>' +
          '<button class="icon-btn" type="button" aria-label="refresh">r</button>',
      ),
    ),
  );
}

function segmentedDemo() {
  const wrap = el('div', { className: 'segmented', role: 'group' });
  for (const [i, label] of ['daily', 'sealed', 'archive'].entries()) {
    wrap.append(
      el('button', {
        className: i === 0 ? 'segment-btn active' : 'segment-btn',
        type: 'button',
        text: label,
        ariaPressed: i === 0 ? 'true' : 'false',
        onClick: () => {
          wrap.querySelectorAll('.segment-btn').forEach((btn) => {
            const active = btn.textContent === label;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
          });
        },
      }),
    );
  }
  return wrap;
}

function formsGroup() {
  return group(
    'forms',
    'Forms',
    entry('Fields', ['input', 'select', 'textarea', '.field-row'], 'Carved vellum fields with mono type and inset shadow.', () =>
      demoHtml(
        fieldRowHtml({
          label: 'card name',
          controlHtml: '<input type="text" value="Lightning Bolt" />',
        }) +
          fieldRowHtml({
            label: 'format',
            controlHtml: '<select><option>sealed</option><option>draft</option></select>',
          }) +
          fieldRowHtml({
            label: 'notes',
            controlHtml: '<textarea rows="3" placeholder="notes"></textarea>',
          }),
      ),
    ),
  );
}

function statusGroup() {
  return group(
    'status',
    'Status',
    entry('Status states', ['.status-state'], 'Compact feedback chips for neutral, success, warning, and danger states.', () => {
      const row = demoHtml(
        statusStateHtml({ label: 'ready', tone: 'success' }) +
          statusStateHtml({ label: 'waiting', tone: 'warn' }) +
          statusStateHtml({ label: 'error', tone: 'danger' }) +
          statusStateHtml({ label: 'idle' }),
      );
      const mount = el('span');
      renderStatusState(mount, { label: 'rendered by JS', tone: 'success' });
      row.append(mount);
      return row;
    }),
    entry('Banner', ['.banner', '.banner-message', '.banner-actions', '.banner-dismiss'], 'Full-width inline banner with a message, CTA, and right-aligned dismiss control.', () => {
      const banner = el('div', { className: 'banner', role: 'status' });
      banner.append(
        el('span', { className: 'banner-message', text: 'site updated \u00b7 reload to see the latest' }),
        el('div', { className: 'banner-actions' }, el('button', { className: 'btn', type: 'button', text: 'reload' })),
        el('button', { className: 'icon-btn banner-dismiss', type: 'button', ariaLabel: 'dismiss', text: 'x' }),
      );
      return banner;
    }),
    entry('Chips', ['.chip'], 'Small labeled objects for filters, tags, and state markers.', () => {
      const row = el('div', { className: 'ds-row' });
      row.append(
        chipNode({ label: 'Boros', icon: 'WR' }),
        chipNode({ label: 'submitted', icon: '*' }),
        chipNode({ label: 'splash', removeLabel: 'remove splash' }),
      );
      return row;
    }),
  );
}

function overlaysGroup() {
  return group(
    'overlays',
    'Overlays',
    entry('Modal frame', ['.ui-modal-card', '.ui-modal-head', '.ui-modal-body', '.rune-close'], 'Canonical modal card with floating rune close button. Use the modal lab to compare new treatments.', () =>
      el(
        'section',
        { className: 'ui-modal-card', style: { width: 'min(520px, 100%)' } },
        el(
          'header',
          { className: 'ui-modal-head' },
          el('h3', { className: 'ui-modal-title', text: 'reference build' }),
          el('button', { className: 'rune-close', type: 'button', ariaLabel: 'close', text: 'x' }),
        ),
        el('div', { className: 'ui-modal-body', text: 'A framed modal body for app-specific content.' }),
        el('footer', { className: 'ui-modal-actions' }, el('button', { className: 'btn', type: 'button', text: 'done' })),
      ),
    ),
    entry('Popover frame', ['.ui-popover', '.floating-menu'], 'Anchored floating surface and menu item vocabulary.', () =>
      el(
        'div',
        { className: 'ds-static-popover' },
        el(
          'div',
          { className: 'ds-static-popover-body floating-menu' },
          el('button', { className: 'floating-menu-item', type: 'button', text: 'move to deck' }),
          el('button', { className: 'floating-menu-item is-active', type: 'button', text: 'compare build' }),
          el('button', { className: 'floating-menu-item', type: 'button', text: 'remove' }),
        ),
      ),
    ),
  );
}

function demoHtml(html) {
  const row = el('div', { className: 'ds-row' });
  const template = document.createElement('template');
  template.innerHTML = html;
  row.append(template.content);
  return row;
}
