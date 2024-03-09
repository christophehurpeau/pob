import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import configExternalDependencies from 'rollup-config-external-dependencies';

const nodeFormatToExt = (format, pkgType) => {
  if (format === 'cjs' && pkgType === 'module') return '.cjs';
  if (format === 'cjs') return '.cjs.js';
  if (format === 'es') return '.mjs';
  return `.${format}.js`;
};

export default function createRollupConfig({
  cwd = process.cwd(),
  outDirectory = 'dist',
  pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'))),
  plugins = [],
}) {
  const pobConfig = pkg.pob;

  if (pobConfig.babelEnvs) {
    throw new Error(
      '@pob/rollup-typescript does not supports babel, use `pob-babel` package instead.',
    );
  }

  const tslibVersion = pkg.dependencies && pkg.dependencies.tslib;

  if (!tslibVersion) {
    throw new Error(
      `@pob/rollup-typescript: "${pkg.name}" requires "tslib" in dependencies.`,
    );
  }

  const resolveEntry = (entryName, target) => {
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

  const jsx = pobConfig.jsx;
  const externalByPackageJson = configExternalDependencies(pkg);

  const createConfigForEnv = (entry, entryPath, env) => {
    const extensions = ['.ts', jsx && '.tsx', '.json'].filter(Boolean);
    const preferConst = true;

    return {
      input: entryPath,
      output: (env.formats || ['es']).map((format) => ({
        file: path.relative(
          process.cwd(),
          path.join(
            cwd,
            `${outDirectory}/${entry}-${env.target}${
              env.omitVersionInFileName ? '' : env.version || ''
            }${
              env.target === 'node'
                ? nodeFormatToExt(format, pkg.type)
                : `.${format}.js`
            }`,
          ),
        ),
        format,
        sourcemap: true,
        exports: 'named',
        generatedCode: {
          constBindings: preferConst,
        },
        externalLiveBindings: false,
        freeze: false,
      })),
      external: externalByPackageJson,
      plugins: [
        swc({
          swc: {
            env: {
              targets: {
                node: env.version,
              },
            },
            jsc: {
              parser: {
                jsx,
              },
            },
          },
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

  return pobConfig.entries.flatMap((entry) => {
    const entryName = typeof entry === 'string' ? entry : entry.name;
    const envs = entry.envs ||
      pobConfig.envs || [
        {
          target: 'node',
          version: '18',
        },
      ];
    const entryPath = resolveEntry(entryName);
    return envs.map((env) => createConfigForEnv(entryName, entryPath, env));
  });
}
