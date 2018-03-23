'use strict';

// node only > 9.3
// const nodeBuiltinModules = require('module').builtinModules;
const nodeBuiltinModules = Object.keys(process.binding('natives')).filter(
  x => !x.startsWith('internal/')
);
const readFileSync = require('fs').readFileSync;
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(`${cwd}/package.json`));

const pobConfig = JSON.parse(readFileSync(`${cwd}/.yo-rc.json`)).pob['pob-config'];

const hasReact = Boolean(
  (pkg.dependencies && pkg.dependencies.react) ||
    (pkg.peerDependencies && pkg.peerDependencies.react)
);

const isIndexBrowserEntry = pobConfig.entries.length === 2 && pobConfig.entries[0] === 'index' && pobConfig.entries[1] === 'browser';
const entries = isIndexBrowserEntry ? ['index', ...pobConfig.entries.slice(2)] : pobConfig.entries;

const nodeVersion = version => {
  switch (String(version)) {
    case '8':
      return '8.3';
    case '6':
      return '6.5';
    default:
      return version;
  }
};

const externalModules = nodeBuiltinModules
  .concat(Object.keys(pkg.dependencies || {}))
  .concat(Object.keys(pkg.peerDependencies || {}));

if (hasReact) {
  // allow to resolve .jsx entry files
  if (!require.extensions['.jsx']) {
    require.extensions['.jsx'] = require.extensions['.js'];
  }
}

const createConfigForEnv = (entry, env, production) => {
  const devSuffix = production ? '' : '-dev';
  return {
    input: require.resolve(`./src/${isIndexBrowserEntry && entry === 'index' && env.target === 'browser' ? 'browser' : entry}`, { paths: [cwd] }),
    output: env.formats.map(format => ({
      file: `dist/${entry}-${env.target}${env.version || ''}${devSuffix}.${format}.js`,
      format,
      sourcemap: true,
    })),
    external: path => {
      if (path.includes('node_modules')) return true;
      // !path.startsWith('@') &&
      if (/^[a-z].*\//.test(path)) path = path.replace(/^([^/]+)\/.*$/, '$1');
      return externalModules.includes(path);
    },
    plugins: [
      babel({
        babelrc: false,
        presets: [
          hasReact && 'babel-preset-pob-react',
          [
            require.resolve('babel-preset-pob-env'),
            {
              modules: false,
              target: env.target,
              version: env.target === 'node' ? nodeVersion(env.version) : env.version,
              production,
              flow: true,
              exportDefaultName: false, // this breaks the build (https://github.com/rollup/rollup/pull/2001 ?)
            },
          ],
        ].filter(Boolean),
        plugins: [require.resolve('babel-plugin-external-helpers')],
        externalHelpers: false,
        exclude: 'node_modules/**',
      }),

      resolve({
        customResolveOptions: {
          extensions: ['.js', hasReact && '.jsx'].filter(Boolean), // TODO: add json ?
          moduleDirectory: [], // don't resolve node_modules
        },
      }),
    ],
  };
};

module.exports = () =>
  Array.prototype.concat.apply(
    [],
    pobConfig.envs.map(env =>
      Array.prototype.concat.apply(
        [],
        entries.map(entry => [
          createConfigForEnv(entry, env, true),
          createConfigForEnv(entry, env, false),
        ])
      )
    )
  );
