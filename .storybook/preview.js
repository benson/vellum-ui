import '../src/css/tokens.css';
import '../src/css/base.css';
import '../src/css/primitives.css';
import '../src/css/overlays.css';
import '../src/css/components.css';
import '../src/css/labs.css';
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
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
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
