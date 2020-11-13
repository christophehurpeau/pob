/* eslint-disable complexity */

'use strict';

const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const ensureJsonFileFormatted = require('../../../utils/ensureJsonFileFormatted');
const formatJson = require('../../../utils/formatJson');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');
const updateEslintConfig = require('./updateEslintConfig');

module.exports = class LintGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

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
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length !== 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNode =
      !useBabel ||
      (babelEnvs.length !== 0 &&
        babelEnvs.some((env) => env.target === 'node'));
    const useNodeOnly =
      !useBabel ||
      (babelEnvs.length !== 0 &&
        babelEnvs.every((env) => env.target === 'node'));

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

    this.fs.copyTpl(
      this.templatePath('prettierignore.ejs'),
      this.destinationPath('.prettierignore'),
      {},
    );

    if (pkg.devDependencies) {
      if (pkg.devDependencies['@pob/eslint-config-babel']) {
        packageUtils.addDevDependencies(pkg, ['@pob/eslint-config-typescript']);
      }
      if (pkg.devDependencies['@pob/eslint-config-babel-node']) {
        packageUtils.addDevDependencies(pkg, [
          '@pob/eslint-config-typescript-node',
        ]);
      }
    }

    packageUtils.removeDevDependencies(pkg, [
      '@pob/eslint-config-babel',
      '@pob/eslint-config-babel-node',
      'babel-eslint',
      'eslint-config-pob',
      'eslint-config-prettier',
      'eslint-plugin-babel',
      'eslint-plugin-flowtype',
      'eslint-plugin-prefer-class-properties',
      'eslint-plugin-jsx-a11y',
      'eslint-plugin-prettier',
      'typescript-eslint-parser',
      'standard',
    ]);

    if (!pkg.name.startsWith('@pob/eslint-config')) {
      packageUtils.removeDevDependencies(pkg, [
        'eslint-config-airbnb',
        'eslint-config-airbnb-base',
      ]);
    }

    const yoConfigPobMonorepo = inLerna && inLerna.pobMonorepoConfig;
    const globalEslint = yoConfigPobMonorepo && yoConfigPobMonorepo.eslint;
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;
    const isYarn2 =
      inLerna.pobConfig &&
      inLerna.pobConfig.project &&
      inLerna.pobConfig.project.yarn2;
    const lernaProjectType =
      inLerna.pobConfig &&
      inLerna.pobConfig.project &&
      inLerna.pobConfig.project.type;

    if (globalEslint && !(inLerna && inLerna.root) && !isYarn2) {
      packageUtils.removeDevDependencies(
        pkg,
        [
          'eslint',
          'prettier',
          '@pob/eslint-config',
          '@pob/eslint-config-typescript',
          '@pob/eslint-config-typescript-node',
          '@pob/eslint-config-typescript-react',
          '@pob/eslint-config-react',
          '@pob/eslint-config-node',
          '@typescript-eslint/eslint-plugin',
          '@typescript-eslint/parser',
          'eslint-import-resolver-node',
          'eslint-plugin-node',
          'eslint-plugin-unicorn',
          'eslint-plugin-import',
        ],
        true,
      );
    } else {
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        (inLerna && inLerna.root) || !globalEslint,
        ['prettier'],
      );
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        !globalEslint ||
          (inLerna && inLerna.root) ||
          lernaProjectType === 'app',
        ['eslint'],
      );
      const shouldHavePluginsDependencies =
        !globalEslint || !inLerna || (inLerna.root && isYarn2);

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

        packageUtils.addDevDependencies(pkg, ['@pob/eslint-config-node']);
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          shouldHavePluginsDependencies,
          ['eslint-plugin-node', 'eslint-import-resolver-node'],
        );

        if (inLerna && inLerna.root) {
          packageUtils.updateDevDependenciesIfPresent(pkg, [
            '@pob/eslint-config-typescript',
            '@pob/eslint-config-typescript-node',
            '@pob/eslint-config-typescript-react',
          ]);
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            shouldHavePluginsDependencies,
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

          packageUtils.addOrRemoveDevDependencies(
            pkg,
            useBabel && useNodeOnly,
            ['@pob/eslint-config-typescript-node'],
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

    const extendsConfigNoBabel = [
      '@pob/eslint-config',
      '@pob/eslint-config-node',
    ];

    const extendsConfig = (() => {
      if (isPobEslintConfig) {
        if (pkg.name === '@pob/eslint-config-monorepo') {
          return [
            './@pob/eslint-config/lib/index.js',
            './@pob/eslint-config-node/lib/index.js',
          ];
        }
        return [
          '../eslint-config/lib/index.js',
          '../eslint-config-node/lib/index.js',
        ];
      }

      if (useBabel) {
        return [
          '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-typescript-node',
          hasReact && '@pob/eslint-config-typescript-react',
        ].filter(Boolean);
      }

      return extendsConfigNoBabel;
    })();

    // eslint-disable-next-line unicorn/no-nested-ternary
    const ext = !useBabel ? 'js' : hasReact ? '{ts,tsx}' : 'ts';

    const jestOverride = !packageUtils.hasJest(pkg)
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

    if (!useBabel && jestOverride) {
      // see https://github.com/eslint/eslint/pull/9748 + https://github.com/eslint/eslint/issues/8813
      // jestOverride.extends = 'pob/babel';
    }

    const eslintrcBadPath = this.destinationPath('.eslintrc');
    this.fs.delete(eslintrcBadPath);
    this.fs.delete(`${eslintrcBadPath}.yml`);
    this.fs.delete(`${eslintrcBadPath}.js`);

    const rootEslintrcPath = this.destinationPath('.eslintrc.json');

    const srcEslintrcPath = this.destinationPath(
      `${useBabel ? 'src/' : 'lib/'}.eslintrc.json`,
    );

    const useTypescript = useBabel;

    try {
      if (this.fs.exists(rootEslintrcPath)) {
        ensureJsonFileFormatted(rootEslintrcPath);
      }

      const ignorePatterns = [];

      if (!inLerna && useTypescript) {
        ignorePatterns.push('*.d.ts');
      }

      if (inLerna && !inLerna.root && this.options.typescript) {
        ignorePatterns.push('*.d.ts');
      }
      if (inLerna && inLerna.root && this.options.documentation) {
        ignorePatterns.push('/docs');
      }

      if (inLerna && !inLerna.root) {
        ignorePatterns.push('/dist', '/test', '/public', '/build');
      }

      const rootEslintrcConfig = updateEslintConfig(
        this.fs.readJSON(rootEslintrcPath, {}),
        {
          extendsConfig: isPobEslintConfig
            ? extendsConfig
            : extendsConfigNoBabel,
          ignorePatterns:
            ignorePatterns.length === 0 ? undefined : ignorePatterns,
        },
      );

      this.fs.write(
        rootEslintrcPath,
        formatJson(rootEslintrcConfig, '.eslintrc.json'),
      );
    } catch (err) {
      console.warn(`Could not parse/edit ${rootEslintrcPath}: `, err);
    }

    if (
      !useBabel &&
      useNodeOnly &&
      !this.options.enableSrcResolver &&
      !jestOverride
    ) {
      if (this.fs.exists(srcEslintrcPath)) {
        this.fs.delete(srcEslintrcPath);
      }
    } else {
      try {
        if (this.fs.exists(srcEslintrcPath)) {
          ensureJsonFileFormatted(srcEslintrcPath);
        }

        const srcEslintrcConfig = updateEslintConfig(
          this.fs.readJSON(srcEslintrcPath, {}),
          {
            extendsConfig,
            jestOverride,
            useTypescript: useBabel,
            globalEslint,
            ignorePatterns: useTypescript ? ['*.d.ts'] : undefined,
            settings: {
              'import/resolver': this.options.enableSrcResolver
                ? {
                    node: {
                      paths: ['./node_modules', './src'],
                    },
                  }
                : false,
            },
            relativePath: inLerna ? inLerna.relative : undefined,
          },
        );

        this.fs.write(
          srcEslintrcPath,
          formatJson(srcEslintrcConfig, '.eslintrc.json'),
        );
      } catch (err) {
        console.warn(`Could not parse/edit ${srcEslintrcPath}: `, err);
      }
    }

    // see monorepo/lerna/index.js
    if (!(inLerna && inLerna.root)) {
      const srcDirectory = useBabel ? 'src' : 'lib';
      const lintRootJsFiles = (useBabel && useNode) || !inLerna;

      const lintPaths = [
        srcDirectory,
        'bin',
        'scripts',
        'migrations',
      ].filter((dir) => fs.existsSync(this.destinationPath(dir)));

      if (lintRootJsFiles) {
        lintPaths.unshift('*.js');
      }

      const extArg = !useBabel
        ? ''
        : ` --ext .js,.ts${hasReact ? ',.tsx' : ''}`;
      const args = `${extArg} --report-unused-disable-directives --quiet`;

      packageUtils.addScripts(pkg, {
        lint: globalEslint
          ? `yarn --cwd ../.. eslint${args} ${path.relative('../..', '.')}`
          : `${
              useBabel && !composite ? 'tsc && ' : ''
            }eslint${args} ${lintPaths.join(' ')}`,
      });

      delete pkg.scripts['typescript-check'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
