import { fileURLToPath } from 'url';

export default [
  {
    entry: './src/index.js',
    output: {
      filename: 'node.js',
      path: fileURLToPath(new URL('./dist/', import.meta.url)),
    },
    target: 'node16',
    mode: 'production',
  },
  {
    entry: './src/index.js',
    output: {
      filename: 'browser.js',
      path: fileURLToPath(new URL('./dist/', import.meta.url)),
    },
    target: 'browserslist',
    mode: 'production',
    resolve: {
      conditionNames: ['browser:modern', 'browser', 'module', 'import'],
    },
  },
];