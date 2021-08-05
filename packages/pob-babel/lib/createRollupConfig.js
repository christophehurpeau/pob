/* eslint-disable complexity */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import babelPluginTransformRuntime from '@babel/plugin-transform-runtime';
import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import babelPresetEnv from 'babel-preset-pob-env';
import configExternalDependencies from 'rollup-config-external-dependencies';
import ignoreImport from './rollup-plugin-ignore-browser-only-imports.js';

const browserOnlyExtensions = ['.scss', '.css'];

const nodeFormatToExt = (format) => {
  if (format === 'cjs') return '.cjs.js';
  if (format === 'es') return '.mjs';
  return `.${format}.js`;
};

export default function createRollupConfig({
  cwd = process.cwd(),
  pkg = JSON.parse(readFileSync(`${cwd}/package.json`)),
  devPlugins = [],
  prodPlugins = [],
  pobConfig = pkg.pob ||
    JSON.parse(readFileSync(`${cwd}/.yo-rc.json`)).pob['pob-config'],
} = {}) {
  const isIndexBrowserEntry =
    pobConfig.entries[0] === 'index' && pobConfig.entries[1] === 'browser';
  const entries = isIndexBrowserEntry
    ? ['index', ...pobConfig.entries.slice(2)]
    : pobConfig.entries;

  const jsx =
    pobConfig.jsx ||
    (pobConfig.jsx !== false &&
      Boolean(
        (pkg.dependencies && pkg.dependencies.react) ||
          (pkg.peerDependencies && pkg.peerDependencies.react),
      ));

  const nodeVersion = (version) => {
    switch (String(version)) {
      case '12':
        return '12.10';
      default:
        return version;
    }
  };

  const externalByPackageJson = configExternalDependencies(pkg);

  const resolveEntry = (entry, target) => {
    const entryName =
      isIndexBrowserEntry && entry === 'index' && target === 'browser'
        ? 'browser'
        : entry;
    let entryPath;
    ['ts', 'tsx', 'js', 'jsx'].some((extension) => {
      const potentialEntryPath = path.resolve(
        cwd,
        'src',
        `${entryName}.${extension}`,
      );

      if (existsSync(potentialEntryPath)) {
        entryPath = potentialEntryPath;
        return true;
      }

      return false;
    });

    if (!entryPath) {
      throw new Error(
        `Could not find entry "src/${entryName}" in path "${cwd}"`,
      );
    }

    return entryPath;
  };

  const createConfigForEnv = (entry, entryPath, env, production, plugins) => {
    const devSuffix = production ? '' : '-dev';

    const typescript = entryPath.endsWith('.ts') || entryPath.endsWith('.tsx');
    const extensions = (
      typescript
        ? ['.ts', jsx && '.tsx', '.json']
        : ['.js', jsx && '.jsx', '.json']
    ).filter(Boolean);
    const preferConst = !(env.target === 'browser' && env.version !== 'modern');

    return {
      input: entryPath,
      output: env.formats.map((format) => ({
        file: `dist/${entry}-${env.target}${env.version || ''}${devSuffix}${
          env.target === 'node' ? nodeFormatToExt(format) : `.${format}.js`
        }`,
        format,
        sourcemap: true,
        exports: 'named',
        preferConst,
        externalLiveBindings: false,
        freeze: false,
      })),
      external:
        env.target === 'browser'
          ? (path) => {
              if (browserOnlyExtensions.some((ext) => path.endsWith(ext))) {
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
            jsx && [
              '@babel/preset-react',
              {
                // always disable development: babel-plugin-transform-react-jsx-source compiles with filename full path, resulting in non reproducible builds
                development: false,
                useBuiltIns: true,
              },
            ],
            [
              babelPresetEnv,
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
              },
            ],
          ].filter(Boolean),
          plugins: [
            [
              babelPluginTransformRuntime,
              {
                corejs: false,
                useESModules: 'auto',
                useHelpers: true,
              },
            ],
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

        nodeResolve({
          extensions,
          customResolveOptions: {
            moduleDirectories: ['src'], // don't resolve node_modules, but allow src (see baseUrl in tsconfig)
          },
        }),
        ...plugins,
      ].filter(Boolean),
    };
  };

  return pobConfig.babelEnvs.flatMap((env) => {
    return entries.flatMap((entry, index) => {
      const entryPath = resolveEntry(entry, env.target);
      return [
        createConfigForEnv(entry, entryPath, env, true, prodPlugins),
        createConfigForEnv(entry, entryPath, env, false, devPlugins),
      ];
    });
  });
}
