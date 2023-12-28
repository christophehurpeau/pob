import fs from 'node:fs';
import path from 'node:path';
import Generator from 'yeoman-generator';
import ensureJsonFileFormatted from '../../../utils/ensureJsonFileFormatted.js';
import inMonorepo from '../../../utils/inMonorepo.js';
import * as packageUtils from '../../../utils/package.js';
import { writeAndFormatJson } from '../../../utils/writeAndFormat.js';
import { appIgnorePaths } from '../../app/ignorePaths.js';
import updateEslintConfig from './updateEslintConfig.js';

export default class CommonLintGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('monorepo', {
      type: Boolean,
      required: false,
      default: false,
      description: 'Is root monorepo',
    });

    this.option('isApp', {
      type: Boolean,
      required: false,
      default: false,
      description: 'Is app',
    });

    this.option('babel', {
      type: String,
      required: false,
      default: 'undefined',
      desc: 'Use babel.',
    });

    this.option('documentation', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Documentation enabled',
    });

    this.option('testing', {
      type: Boolean,
      required: true,
      desc: 'Testing enabled',
    });
    this.option('testRunner', {
      type: String,
      required: false,
      default: 'jest',
      desc: 'test runner: jest | node',
    });

    this.option('typescript', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Typescript enabled',
    });

    this.option('enableSrcResolver', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Enable resolving from src directory',
    });

    this.option('rootAsSrc', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'src directory is root',
    });

    this.option('appTypes', {
      type: String,
      required: false,
      desc: 'list of app types',
    });

    this.option('rootIgnorePaths', {
      type: String,
      required: false,
      default: '',
      desc: 'list of ignore paths to add',
    });

    this.option('ignorePaths', {
      type: String,
      required: false,
      default: '',
      desc: 'list of ignore paths to add',
    });

    this.option('packageManager', {
      type: String,
      default: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      default: 'node-modules',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });

    this.option('srcDirectory', {
      type: String,
      default: 'src',
      desc: 'customize src directory. Default to src',
    });

    this.option('buildDirectory', {
      type: String,
      required: false,
      default: 'dist',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    // const typescriptTargets = (pkg.pob && pkg.pob.typescriptTargets) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length > 0;
    const useTypescript = useBabel || pkg.pob?.typescript;
    const hasReact = useTypescript && packageUtils.hasReact(pkg);
    const useNode = !useBabel || babelEnvs.some((env) => env.target === 'node');
    const useNodeOnly =
      (!useBabel && !useTypescript) ||
      (useTypescript &&
        pkg.pob?.envs?.every((env) => env.target === 'node') &&
        pkg.pob?.entries.every(
          (entry) =>
            typeof entry === 'string' ||
            (entry.target && entry.target !== 'node'),
        )) ||
      (babelEnvs.length > 0 && babelEnvs.every((env) => env.target === 'node'));

    if (this.fs.exists(this.destinationPath('.eslintignore'))) {
      this.fs.delete(this.destinationPath('.eslintignore'));
    }

    if (pkg.scripts) {
      delete pkg.scripts.postmerge;
      delete pkg.scripts.postcheckout;
      delete pkg.scripts.postrewrite;
      delete pkg.scripts.precommit;
      delete pkg.scripts.commitmsg;
      delete pkg.scripts.preparecommitmsg;
      delete pkg.scripts.prepublish;
      delete pkg.scripts.postpublish;
      delete pkg.scripts.prepare;
    }

    delete pkg.standard;

    pkg.prettier = '@pob/root/prettier-config';

    if (!inMonorepo || inMonorepo.root || this.options.monorepo) {
      const rootIgnorePatterns = new Set(
        this.options.rootIgnorePaths.split('\n').filter(Boolean),
      );
      const ignorePatterns = new Set(
        this.options.ignorePaths.split('\n').filter(Boolean),
      );

      if (this.options.appTypes) {
        const appTypes = JSON.parse(this.options.appTypes);
        appTypes.forEach((appType) => {
          appIgnorePaths[appType]({})
            .filter(Boolean)
            .forEach((ignorePath) => {
              if (ignorePath.startsWith('#')) return;
              ignorePatterns.add(ignorePath);
            });
        });
      }

      this.fs.copyTpl(
        this.templatePath('prettierignore.ejs'),
        this.destinationPath('.prettierignore'),
        {
          inRoot: !inMonorepo || inMonorepo.root || this.options.monorepo,
          documentation: this.options.documentation,
          packageManager: this.options.packageManager,
          yarnNodeLinker: this.options.yarnNodeLinker,
          workspaces: pkg.workspaces,
          hasApp: this.options.hasApp,
          rootIgnorePatterns: [...rootIgnorePatterns],
          ignorePatterns: [...ignorePatterns],
        },
      );
    } else if (this.fs.exists(this.destinationPath('.prettierignore'))) {
      this.fs.delete(this.destinationPath('.prettierignore'));
    }

    if (pkg.devDependencies) {
      if (pkg.devDependencies['@pob/eslint-config-babel']) {
        packageUtils.addDevDependencies(pkg, ['@pob/eslint-config-typescript']);
      }
    }

    packageUtils.removeDevDependencies(pkg, [
      '@pob/eslint-config-babel',
      '@pob/eslint-config-babel-node',
      '@pob/eslint-config-node',
      '@pob/eslint-config-typescript-node',
      'babel-eslint',
      'eslint-config-pob',
      'typescript-eslint-parser',
      'standard',
      'eslint-import-resolver-node',
    ]);

    if (!pkg.name.startsWith('@pob/eslint-config')) {
      packageUtils.removeDevDependencies(pkg, [
        'eslint-plugin-jsx-a11y',
        'eslint-config-airbnb',
        'eslint-config-airbnb-base',
        'eslint-config-prettier',
        'eslint-plugin-babel',
        'eslint-plugin-flowtype',
        'eslint-plugin-prefer-class-properties',
        'eslint-plugin-prettier',
        'eslint-plugin-react',
        'eslint-plugin-react-hooks',
      ]);
    }

    const yoConfigPobMonorepo = inMonorepo && inMonorepo.pobMonorepoConfig;
    const globalEslint =
      this.options.monorepo ||
      (yoConfigPobMonorepo && yoConfigPobMonorepo.eslint !== false);
    const globalTesting = yoConfigPobMonorepo && yoConfigPobMonorepo.testing;
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;
    const { rootPackageManager, rootYarnNodeLinker } = inMonorepo || {};
    const lernaProjectType =
      inMonorepo.pobConfig &&
      inMonorepo.pobConfig.project &&
      inMonorepo.pobConfig.project.type;

    if (this.options.monorepo && !globalEslint) {
      throw new Error('Please enable global eslint');
    }

    if (
      globalEslint &&
      !((inMonorepo && inMonorepo.root) || this.options.monorepo)
    ) {
      if (!pkg.name.startsWith('@pob/eslint-config')) {
        packageUtils.removeDevDependencies(
          pkg,
          [
            'eslint',
            'prettier',
            '@pob/eslint-config',
            '@pob/eslint-config-typescript',
            '@pob/eslint-config-typescript-react',
            '@pob/eslint-config-react',
            '@typescript-eslint/eslint-plugin',
            '@typescript-eslint/parser',
            'eslint-plugin-node',
            'eslint-plugin-unicorn',
            'eslint-plugin-import',
          ],
          true,
        );
      }
    } else {
      if (pkg.name !== 'pob-monorepo') {
        packageUtils.removeDevDependencies(pkg, ['prettier']);
      }
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        !globalEslint ||
          (inMonorepo && inMonorepo.root) ||
          this.options.monorepo ||
          lernaProjectType === 'app' ||
          (rootPackageManager === 'yarn' &&
            rootYarnNodeLinker !== 'node-modules') ||
          !!(pkg.peerDependencies && pkg.peerDependencies.eslint),
        ['eslint'],
      );
      const shouldHavePluginsDependencies =
        rootPackageManager === 'yarn' && rootYarnNodeLinker !== 'node-modules';

      if (
        !pkg.name.startsWith('eslint-config') &&
        !pkg.name.startsWith('@pob/eslint-config') &&
        pkg.name !== '@pob/use-eslint-plugin'
      ) {
        packageUtils.addDevDependencies(pkg, ['@pob/eslint-config']);
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          shouldHavePluginsDependencies,
          ['eslint-plugin-import', 'eslint-plugin-unicorn'],
        );

        packageUtils.addOrRemoveDevDependencies(
          pkg,
          shouldHavePluginsDependencies,
          ['eslint-plugin-node'],
        );

        if ((inMonorepo && inMonorepo.root) || this.options.monorepo) {
          if (this.options.typescript) {
            packageUtils.updateDevDependenciesIfPresent(pkg, [
              '@pob/eslint-config-typescript',
              '@pob/eslint-config-typescript-react',
            ]);
          } else if (pkg.name !== '@pob/eslint-config-monorepo') {
            packageUtils.removeDevDependencies(pkg, [
              '@pob/eslint-config-typescript',
              '@pob/eslint-config-typescript-react',
            ]);
          }
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            this.options.typescript && shouldHavePluginsDependencies,
            ['@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'],
          );
        } else {
          packageUtils.addOrRemoveDevDependencies(pkg, useTypescript, [
            '@pob/eslint-config-typescript',
          ]);
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            useTypescript && shouldHavePluginsDependencies,
            ['@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'],
          );

          packageUtils.addOrRemoveDevDependencies(pkg, hasReact, [
            '@pob/eslint-config-typescript-react',
          ]);
        }
      }
    }

    const isPobEslintConfig =
      pkg.name === 'eslint-config-pob' ||
      pkg.name.startsWith('@pob/eslint-config') ||
      pkg.name === '@pob/use-eslint-plugin';

    const extendsConfigRoot = (() => {
      if (isPobEslintConfig) {
        if (pkg.name === '@pob/eslint-config-monorepo') {
          return [
            pkg.type === 'commonjs'
              ? './@pob/eslint-config/lib/root-commonjs.js'
              : './@pob/eslint-config/lib/root-module.js',
          ];
        }
        return [
          pkg.type === 'commonjs'
            ? '../eslint-config/lib/root-commonjs.js'
            : '../eslint-config/lib/root-module.js',
        ];
      }

      return [
        pkg.type === 'commonjs'
          ? '@pob/eslint-config/root-commonjs'
          : '@pob/eslint-config/root-module',
      ];
    })();

    const extendsConfigSrc = (() => {
      if (isPobEslintConfig) {
        return [
          pkg.type === 'commonjs'
            ? '../../eslint-config/lib/node-commonjs'
            : '../../eslint-config/lib/node-module',
        ];
      }

      if (useTypescript) {
        return [
          '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-typescript/node',
          // useTypescript &&
          //   pkg.pob?.rollup === false &&
          //   '@pob/eslint-config-typescript/tsc-emit',
          this.options.isApp && '@pob/eslint-config-typescript/app',
          hasReact &&
            `@pob/eslint-config-typescript-react${
              pkg.dependencies?.['react-native-web'] ? '/react-native-web' : ''
            }`,
        ].filter(Boolean);
      }

      return [
        pkg.type === 'commonjs'
          ? '@pob/eslint-config/node-commonjs'
          : '@pob/eslint-config/node-module',
      ];
    })();

    const ext = !useTypescript
      ? `{${pkg.type === 'commonjs' ? 'mjs' : 'cjs'},js}`
      : `${hasReact ? '{ts,tsx}' : 'ts'}`;

    const testsOverride =
      this.options.testing || globalTesting
        ? {
            files: [`**/*.test.${ext}`, `__tests__/**/*.${ext}`],
            ...(this.options.testRunner == null ||
            this.options.testRunner === 'jest'
              ? { env: { jest: true } }
              : {}),
            rules: {
              'import/no-extraneous-dependencies': [
                'error',
                { devDependencies: true },
              ],
            },
          }
        : null;

    if (testsOverride) {
      // if (!useBabel) {
      //   testsOverride.extends = ['pob/babel'];
      // }

      if (useTypescript) {
        testsOverride.extends = ['@pob/eslint-config-typescript/test'];
        delete testsOverride.rules['import/no-extraneous-dependencies'];
      }
    }

    const eslintrcBadPath = this.destinationPath('.eslintrc');
    this.fs.delete(eslintrcBadPath);
    this.fs.delete(`${eslintrcBadPath}.yml`);
    this.fs.delete(`${eslintrcBadPath}.js`);

    const rootEslintrcPath = this.options.rootAsSrc
      ? false
      : this.destinationPath('.eslintrc.json');

    const srcEslintrcPath = this.options.rootAsSrc
      ? this.destinationPath('.eslintrc.json')
      : this.destinationPath(
          `${
            useTypescript ? `${this.options.srcDirectory}/` : 'lib/'
          }.eslintrc.json`,
        );

    const getRootIgnorePatterns = () => {
      const ignorePatterns = new Set();

      if (inMonorepo && !inMonorepo.root && (useTypescript || pkg.types)) {
        ignorePatterns.add('*.d.ts');
      }

      if (inMonorepo && inMonorepo.root && this.options.documentation) {
        ignorePatterns.add('/docs');
      }

      if ((!inMonorepo || !inMonorepo.root) && useTypescript) {
        const buildPath = `/${this.options.buildDirectory}`;
        if (
          !this.options.rootIgnorePaths ||
          !this.options.rootIgnorePaths.includes(buildPath)
        ) {
          ignorePatterns.add(buildPath);
        }
      }
      if (inMonorepo && inMonorepo.root && this.options.typescript) {
        ignorePatterns.add('/rollup.config.mjs');
      }

      if (this.options.rootIgnorePaths) {
        this.options.rootIgnorePaths
          .split('\n')
          .filter(Boolean)
          .forEach((ignorePath) => {
            if (ignorePath.startsWith('#')) return;
            ignorePatterns.add(ignorePath);
          });
      }

      return ignorePatterns;
    };

    if (rootEslintrcPath) {
      try {
        if (this.fs.exists(rootEslintrcPath)) {
          ensureJsonFileFormatted(rootEslintrcPath);
        }

        const rootIgnorePatterns = getRootIgnorePatterns();

        const rootEslintrcConfig = updateEslintConfig(
          this.fs.readJSON(rootEslintrcPath, {}),
          {
            extendsConfig: extendsConfigRoot,
            ignorePatterns:
              rootIgnorePatterns.size === 0
                ? undefined
                : [...rootIgnorePatterns],
          },
        );

        writeAndFormatJson(this.fs, rootEslintrcPath, rootEslintrcConfig);
      } catch (error) {
        console.warn(`Could not parse/edit ${rootEslintrcPath}: `, error);
      }
    }
    // no else: dont delete root eslintrc, src is root

    if ((inMonorepo && inMonorepo.root) || this.options.monorepo) {
      if (this.fs.exists(srcEslintrcPath)) {
        this.fs.delete(srcEslintrcPath);
      }
    } else {
      try {
        if (this.fs.exists(srcEslintrcPath)) {
          ensureJsonFileFormatted(srcEslintrcPath);
        }

        const ignorePatterns = this.options.rootAsSrc
          ? getRootIgnorePatterns()
          : new Set();
        if (useTypescript || pkg.types) {
          ignorePatterns.add('*.d.ts');
        }

        const srcEslintrcConfig = updateEslintConfig(
          this.fs.readJSON(srcEslintrcPath, {}),
          {
            extendsConfig: extendsConfigSrc,
            testsOverride,
            useTypescript,
            globalEslint,
            ignorePatterns:
              ignorePatterns.size === 0 ? undefined : [...ignorePatterns],
            settings: {
              'import/resolver': this.options.enableSrcResolver
                ? {
                    node: {
                      moduleDirectory: [
                        'node_modules',
                        this.options.srcDirectory,
                      ],
                    },
                  }
                : false,
            },
            relativePath: inMonorepo ? inMonorepo.relative : undefined,
          },
        );

        writeAndFormatJson(this.fs, srcEslintrcPath, srcEslintrcConfig);
      } catch (error) {
        console.warn(`Could not parse/edit ${srcEslintrcPath}: `, error);
      }
    }

    // see monorepo/lerna/index.js
    if (!(inMonorepo && inMonorepo.root) && !this.options.monorepo) {
      const srcDirectory = useBabel ? this.options.srcDirectory : 'lib';
      const lintRootJsFiles = (useBabel && useNode) || !inMonorepo;

      const lintPaths = [srcDirectory, 'bin', 'scripts', 'migrations'].filter(
        (dir) => fs.existsSync(this.destinationPath(dir)),
      );

      if (lintRootJsFiles) {
        lintPaths.unshift('*.{js,cjs,mjs}');
      }

      const args =
        '--report-unused-disable-directives --resolve-plugins-relative-to . --quiet';

      packageUtils.addScripts(pkg, {
        'lint:eslint': globalEslint
          ? `yarn ../.. run eslint ${args} ${path
              .relative('../..', '.')
              .replace('\\', '/')}`
          : `eslint ${args} ${lintPaths.join(' ')}`,
        lint: `${useBabel && !composite ? 'tsc && ' : ''}yarn run lint:eslint`,
      });

      if (!inMonorepo) {
        pkg.scripts.lint = `yarn run lint:prettier && ${pkg.scripts.lint}`;
        packageUtils.addScripts(pkg, {
          'lint:prettier': 'pob-root-prettier --check .',
          'lint:prettier:fix': 'pob-root-prettier --write .',
        });
      } else {
        delete pkg.scripts['lint:prettier'];
      }

      delete pkg.scripts['typescript-check'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
