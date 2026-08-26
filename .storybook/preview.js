import '../src/css/tokens.css';
import '../src/css/base.css';
import '../src/css/primitives.css';
import '../src/css/overlays.css';
import '../src/css/components.css';
import '../src/css/labs.css';
import { applyThemePreset, themePresets } from '../src/stories/themePresets.js';
import './preview.css';

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  globalTypes: {
    theme: {
      description: 'Vellum color theme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    palette: {
      description: 'Experimental Vellum palette',
      toolbar: {
        icon: 'contrast',
        items: Object.entries(themePresets).map(([value, preset]) => ({
          value,
          title: preset.label,
        })),
      },
    },
    motionScale: {
      description: 'Motion inspection speed',
      toolbar: {
        icon: 'timer',
        items: [
          { value: '1', title: 'Motion · 1×' },
          { value: '3', title: 'Motion · 3×' },
          { value: '0', title: 'Motion · instant' },
        ],
      },
    },
  },
  initialGlobals: { motionScale: '1', palette: 'vellum', theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      applyThemePreset(document.documentElement, context.globals.palette, context.globals.theme);
      document.documentElement.style.setProperty('--vui-motion-scale', context.globals.motionScale);
      document.body.classList.add('vui-app');
      return Story();
    },
  ],
  parameters: {
    backgrounds: { disable: true },
    controls: {
      expanded: true,
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    options: { storySort: { order: ['Vellum UI', 'Foundations', 'Components', 'Patterns'] } },
    a11y: { test: 'error' },
  },
};

export default preview;
