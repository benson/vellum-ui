import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Vellum UI',
    brandUrl: 'https://bensonperry.com/vellum-ui/design-system/',
    colorPrimary: '#653d78',
    colorSecondary: '#653d78',
    appBg: '#f7f2ea',
    appContentBg: '#fffdf8',
    appBorderColor: 'rgba(67, 50, 41, 0.17)',
    textColor: '#2d2520',
    textMutedColor: '#71665d',
    barBg: '#f1eae0',
    barSelectedColor: '#653d78',
    inputBg: '#fffdf8',
    inputBorder: 'rgba(67, 50, 41, 0.17)',
    inputTextColor: '#2d2520',
    inputBorderRadius: 5,
  }),
});
