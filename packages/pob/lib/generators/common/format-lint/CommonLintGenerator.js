import fs from 'fs';
import path from 'path';
import Generator from 'yeoman-generator';
import ensureJsonFileFormatted from '../../../utils/ensureJsonFileFormatted.js';
import inLerna from '../../../utils/inLerna.js';
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
      defaults: false,
      description: 'Is root monorepo',
    });

    this.option('babel', {
      type: String,
      required: false,
      defaults: 'undefined',
      desc: 'Use babel.',
    });

    this.option('documentation', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Documentation enabled',
    });

    this.option('typescript', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Typescript enabled',
    });

    this.option('enableSrcResolver', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Enable resolving from src directory',
    });

    this.option('rootAsSrc', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'src directory is root',
    });

    this.option('appTypes', {
      type: String,
      required: false,
      desc: 'list of app types',
    });

    this.option('ignorePaths', {
      type: String,
      required: false,
      desc: 'list of ignore paths to add',
    });

    this.option('packageManager', {
      type: String,
      defaults: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'node-modules',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });

    this.option('buildDirectory', {
      type: String,
      required: false,
      defaults: 'dist',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length > 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNode = !useBabel || babelEnvs.some((env) => env.target === 'node');
    const useNodeOnly =
      !useBabel ||
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

    pkg.prettier = {
      trailingComma: 'all',
      singleQuote: true,
      // https://github.com/airbnb/javascript/pull/1863
      arrowParens: 'always',
    };

    if (!inLerna || inLerna.root || this.options.monorepo) {
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
          inRoot: !inLerna || inLerna.root || this.options.monorepo,
          documentation: this.options.documentation,
          packageManager: this.options.packageManager,
          yarnNodeLinker: this.options.yarnNodeLinker,
          workspaces: pkg.workspaces,
          hasApp: this.options.hasApp,
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
      'eslint-config-prettier',
      'typescript-eslint-parser',
      'standard',
      'eslint-import-resolver-node',
    ]);

    if (!pkg.name.startsWith('@pob/eslint-config')) {
      packageUtils.removeDevDependencies(pkg, [
        'eslint-plugin-jsx-a11y',
        'eslint-config-airbnb',
        'eslint-config-airbnb-base',
        'eslint-plugin-babel',
        'eslint-plugin-flowtype',
        'eslint-plugin-prefer-class-properties',
        'eslint-plugin-prettier',
        'eslint-plugin-react',
        'eslint-plugin-react-hooks',
      ]);
    }

    const yoConfigPobMonorepo = inLerna && inLerna.pobMonorepoConfig;
    const globalEslint =
      yoConfigPobMonorepo && yoConfigPobMonorepo.eslint !== false;
    const globalTesting = yoConfigPobMonorepo && yoConfigPobMonorepo.testing;
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;
    const { rootPackageManager, rootYarnNodeLinker } = inLerna || {};
    const lernaProjectType =
      inLerna.pobConfig &&
      inLerna.pobConfig.project &&
      inLerna.pobConfig.project.type;

    if (this.options.monorepo && !globalEslint) {
      throw new Error('Please enable global eslint');
    }

    if (globalEslint && !((inLerna && inLerna.root) || this.options.monorepo)) {
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
    } else {
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        (inLerna && inLerna.root) || this.options.monorepo || !globalEslint,
        ['prettier'],
      );
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        !globalEslint ||
          (inLerna && inLerna.root) ||
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

        if ((inLerna && inLerna.root) || this.options.monorepo) {
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
          packageUtils.addOrRemoveDevDependencies(pkg, useBabel, [
            '@pob/eslint-config-typescript',
          ]);
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            useBabel && shouldHavePluginsDependencies,
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

      if (useBabel) {
        return [
          '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-typescript/node',
          hasReact && '@pob/eslint-config-typescript-react',
        ].filter(Boolean);
      }

      return [
        pkg.type === 'commonjs'
          ? '@pob/eslint-config/node-commonjs'
          : '@pob/eslint-config/node-module',
      ];
    })();

    const ext = !useBabel
      ? `{${pkg.type === 'commonjs' ? 'mjs' : 'cjs'},js}`
      : `${hasReact ? '{ts,tsx}' : 'ts'}`;

    const jestOverride =
      !pkg.jest && !globalTesting
        ? null
        : {
            files: [`**/*.test.${ext}`, `__tests__/**/*.${ext}`],
            env: { jest: true },
            rules: {
              'import/no-extraneous-dependencies': [
                'error',
                { devDependencies: true },
              ],
            },
          };

    if (jestOverride) {
      // if (!useBabel) {
      //   jestOverride.extends = ['pob/babel'];
      // }

      if (useBabel) {
        jestOverride.extends = ['@pob/eslint-config-typescript/test'];
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
      : this.destinationPath(`${useBabel ? 'src/' : 'lib/'}.eslintrc.json`);

    const useTypescript = useBabel;
    const getRootIgnorePatterns = () => {
      const ignorePatterns = new Set();

      if (inLerna && !inLerna.root && (this.options.typescript || pkg.types)) {
        ignorePatterns.add('*.d.ts');
      }

      if (inLerna && inLerna.root && this.options.documentation) {
        ignorePatterns.add('/docs');
      }

      if ((!inLerna || !inLerna.root) && useBabel) {
        ignorePatterns.add(`/${this.options.buildDirectory}`, '/test');
      }
      if (inLerna && inLerna.root && this.options.typescript) {
        ignorePatterns.add('/rollup.config.mjs');
      }

      if (this.options.ignorePaths) {
        this.options.ignorePaths
          .split('\n')
          .filter((path) => path !== `/${this.options.buildDirectory}` && path)
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
      } catch (err) {
        console.warn(`Could not parse/edit ${rootEslintrcPath}: `, err);
      }
    }
    // no else: dont delete root eslintrc, src is root

    if ((inLerna && inLerna.root) || this.options.monorepo) {
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
            jestOverride,
            useTypescript: useBabel,
            globalEslint,
            ignorePatterns:
              ignorePatterns.size === 0 ? undefined : [...ignorePatterns],
            settings: {
              'import/resolver': this.options.enableSrcResolver
                ? {
                    node: {
                      moduleDirectory: ['node_modules', 'src'],
                    },
                  }
                : false,
            },
            relativePath: inLerna ? inLerna.relative : undefined,
          },
        );

        writeAndFormatJson(this.fs, srcEslintrcPath, srcEslintrcConfig);
      } catch (err) {
        console.warn(`Could not parse/edit ${srcEslintrcPath}: `, err);
      }
    }

    // see monorepo/lerna/index.js
    if (!(inLerna && inLerna.root) && !this.options.monorepo) {
      const srcDirectory = useBabel ? 'src' : 'lib';
      const lintRootJsFiles = (useBabel && useNode) || !inLerna;

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
          ? `cd ../.. && yarn run eslint ${args} ${path.relative('../..', '.')}`
          : `eslint ${args} ${lintPaths.join(' ')}`,
        lint: `${useBabel && !composite ? 'tsc && ' : ''}yarn run lint:eslint`,
      });

      if (!inLerna) {
        pkg.scripts.lint = `yarn run lint:prettier && ${pkg.scripts.lint}`;
        packageUtils.addScripts(pkg, { 'lint:prettier': 'prettier --check .' });
      } else {
        delete pkg.scripts['lint:prettier'];
      }

      delete pkg.scripts['typescript-check'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
