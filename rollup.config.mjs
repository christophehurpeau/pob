import configs1 from './pob-examples/typescript-lib-rollup-esbuild/rollup.config.mjs';
import configs2 from './pob-examples/typescript-lib-with-rollup-typescript/rollup.config.mjs';
import configs3 from './pob-examples/typescript-lib/rollup.config.mjs';
import configs4 from './packages/yarn-workspace-utils/rollup.config.mjs';

export default [...configs1, ...configs2, ...configs3, ...configs4];
