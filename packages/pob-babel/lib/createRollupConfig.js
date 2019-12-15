/* eslint-disable camelcase */

'use strict';

const readFileSync = require('fs').readFileSync;
const babel = require('rollup-plugin-babel');
const json = require('rollup-plugin-json');
const resolve = require('rollup-plugin-node-resolve');
const ignoreImport = require('rollup-plugin-ignore-import');
const configExternalDependencies = require('rollup-config-external-dependencies');

module.exports = ({
  cwd = process.cwd(),
  pkg = JSON.parse(readFileSync(`${cwd}/package.json`)),
} = {}) => {
  const pobConfig =
    pkg.pob || JSON.parse(readFileSync(`${cwd}/.yo-rc.json`)).pob['pob-config'];

  const isIndexBrowserEntry =
    pobConfig.entries[0] === 'index' && pobConfig.entries[1] === 'browser';
  const entries = isIndexBrowserEntry
    ? ['index', ...pobConfig.entries.slice(2)]
    : pobConfig.entries;

  const hasReact = Boolean(
    (pkg.dependencies && pkg.dependencies.react) ||
      (pkg.peerDependencies && pkg.peerDependencies.react)
  );

  const nodeVersion = (version) => {
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

  const externalByPackageJson = configExternalDependencies(pkg);
  const browserOnlyExtensions = ['.scss', '.css'];

  const createConfigForEnv = (entry, env, production) => {
    const devSuffix = production ? '' : '-dev';

    const entryName =
      isIndexBrowserEntry && entry === 'index' && env.target === 'browser'
        ? 'browser'
        : entry;
    let entryPath;
    try {
      entryPath = require.resolve(`./src/${entryName}`, { paths: [cwd] });
    } catch (err) {
      throw new Error(`Could not find entry "${entryName}" in path "${cwd}"`);
    }

    const typescript = entryPath.endsWith('.ts') || entryPath.endsWith('.tsx');
    const extensions = (typescript
      ? ['.ts', hasReact && '.tsx']
      : ['.js', hasReact && '.jsx']
    ).filter(Boolean);
    const preferConst = !(env.target === 'browser' && env.version !== 'modern');

    return {
      input: entryPath,
      output: env.formats.map((format) => ({
        file: `dist/${entry}-${env.target}${env.version ||
          ''}${devSuffix}.${format}.js`,
        format,
        sourcemap: true,
        exports: 'named',
        preferConst,
      })),
      external:
        env.target === 'browser'
          ? (path) => {
              if (browserOnlyExtensions.find((ext) => path.endsWith(ext))) {
                return true;
              }
              return externalByPackageJson(path);
            }
          : externalByPackageJson,
      plugins: [
        env.target !== 'browser' &&
          ignoreImport({
            extensions: browserOnlyExtensions,
          }),
        babel({
          extensions,
          babelrc: false,
          presets: [
            !typescript && require.resolve('@babel/preset-flow'), // compatibility
            hasReact && [
              '@babel/preset-react',
              {
                // always disable development: babel-plugin-transform-react-jsx-source compiles with filename full path, resulting in non reproducible builds
                development: false,
                useBuiltIns: true,
              },
            ],
            [
              require.resolve('babel-preset-pob-env'),
              {
                loose: true,
                optimizations: true,
                modules: false,
                typescript,
                target: env.target,
                version:
                  env.target === 'node'
                    ? nodeVersion(env.version)
                    : env.version,
                production,
                exportDefaultName: false, // Rollup does it
              },
            ],
          ].filter(Boolean),
          plugins: [
            [
              require.resolve('babel-plugin-transform-builtins'),
              {
                useESModules: 'auto',
                useHelpers: true,
              },
            ],
            // [
            //   require.resolve('@babel/plugin-transform-runtime'),
            //   {
            //     useESModules: 'auto',
            //   },
            // ],
            // fix issue with babel and this
            require.resolve('./babel-plugin-rewrite-this'),
          ],
          skipPreflightCheck: true,
          babelHelpers: 'runtime',
          exclude: 'node_modules/**',
        }),

        json({
          preferConst,
          compact: true,
          namedExports: true, // allow tree shaking
        }),

        resolve({
          customResolveOptions: {
            extensions,
            moduleDirectory: [], // don't resolve node_modules
          },
        }),
      ].filter(Boolean),
    };
  };

  return Array.prototype.concat.apply(
    [],
    pobConfig.babelEnvs.map((env) =>
      Array.prototype.concat.apply(
        [],
        entries.map((entry) => [
          createConfigForEnv(entry, env, true),
          createConfigForEnv(entry, env, false),
        ])
      )
    )
  );
};
