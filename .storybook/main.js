

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.js'],
  staticDirs: [{ from: '../src/demo', to: '/demo' }],
  addons: ['@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/html-vite',
  docs: { defaultName: 'Documentation' },
};

export default config;
