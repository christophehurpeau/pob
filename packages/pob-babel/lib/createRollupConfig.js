'use strict';

const readFileSync = require('fs').readFileSync;
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const configExternalDependencies = require('rollup-config-external-dependencies');

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(`${cwd}/package.json`));

const pobConfig = JSON.parse(readFileSync(`${cwd}/.yo-rc.json`)).pob['pob-config'];

const hasReact = Boolean(
  (pkg.dependencies && pkg.dependencies.react) ||
    (pkg.peerDependencies && pkg.peerDependencies.react)
);

const isIndexBrowserEntry =
  pobConfig.entries.length === 2 &&
  pobConfig.entries[0] === 'index' &&
  pobConfig.entries[1] === 'browser';
const entries = isIndexBrowserEntry ? ['index', ...pobConfig.entries.slice(2)] : pobConfig.entries;

const nodeVersion = version => {
  switch (String(version)) {
    case '10':
      return '10.13';
    case '8':
      return '8.3';
    default:
      return version;
  }
};

// allow to resolve .ts entry files
/* eslint-disable node/no-deprecated-api */
if (!require.extensions['.ts']) {
  require.extensions['.ts'] = require.extensions['.js'];
}

if (hasReact) {
  // allow to resolve .tsx entry files
  if (!require.extensions['.tsx']) {
    require.extensions['.tsx'] = require.extensions['.js'];
  }
}
/* eslint-enable node/no-deprecated-api */

const external = configExternalDependencies(pkg);

const createConfigForEnv = (entry, env, production) => {
  const devSuffix = production ? '' : '-dev';
  let entryPath;
  try {
    entryPath = require.resolve(
      `./src/${
        isIndexBrowserEntry && entry === 'index' && env.target === 'browser' ? 'browser' : entry
      }`,
      { paths: [cwd] }
    );
  } catch (err) {
    throw new Error(
      `Could not find entry "${
        entry === 'index' && env.target === 'browser' ? 'browser' : entry
      }" in path "${cwd}"`
    );
  }

  const typescript = entryPath.endsWith('.ts') || entryPath.endsWith('.tsx');
  const extensions = (typescript
    ? ['.ts', hasReact && '.tsx']
    : ['.js', hasReact && '.jsx']
  ).filter(Boolean);

  return {
    input: entryPath,
    output: env.formats.map(format => ({
      file: `dist/${entry}-${env.target}${env.version || ''}${devSuffix}.${format}.js`,
      format,
      sourcemap: true,
      exports: 'named',
    })),
    external,
    plugins: [
      babel({
        extensions,
        babelrc: false,
        presets: [
          !typescript && require.resolve('@babel/preset-flow'), // compatibility
          hasReact && ['@babel/preset-react', { development: !production, useBuiltIns: true }],
          [
            require.resolve('babel-preset-pob-env'),
            {
              loose: true,
              modules: false,
              typescript,
              target: env.target,
              version: env.target === 'node' ? nodeVersion(env.version) : env.version,
              production,
              exportDefaultName: false, // Rollup does it
            },
          ],
        ].filter(Boolean),
        plugins: [
          require.resolve('./babel-plugin-rewrite-this'),
          // require.resolve('babel-plugin-external-helpers'),
        ].filter(Boolean),
        externalHelpers: false,
        exclude: 'node_modules/**',
      }),

      resolve({
        customResolveOptions: {
          extensions,
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
