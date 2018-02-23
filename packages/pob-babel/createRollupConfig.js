'use strict';

const nodeBuiltinModules = require('module').builtinModules;
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

const createConfigForEnv = (entry, env, production) => {
  const devSuffix = production ? '' : '-dev';
  return {
    input: require.resolve(`./src/${entry}`, { paths: [cwd] }),
    output: env.formats.map(format => ({
      file: `dist/${entry}-${env.target}${env.version || ''}${devSuffix}.${format}.js`,
      format,
      sourcemap: true,
    })),
    external: nodeBuiltinModules
      .concat(Object.keys(pkg.dependencies || {}))
      .concat(Object.keys(pkg.peerDependencies || {})),
    plugins: [
      babel({
        babelrc: false,
        presets: [
          [
            require.resolve('babel-preset-pob-env'),
            {
              modules: false,
              target: env.target,
              version: env.target === 'node' ? nodeVersion(env.version) : env.version,
              production,
              flow: true,
              react: hasReact,
            },
          ],
        ],
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
        pobConfig.entries.map(entry => [
          createConfigForEnv(entry, env, true),
          createConfigForEnv(entry, env, false),
        ])
      )
    )
  );
