import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// eslint-disable-next-line import/no-commonjs
export default require('./createLintStagedConfig.cjs');
