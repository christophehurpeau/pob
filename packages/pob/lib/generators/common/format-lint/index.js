/* eslint-disable complexity */

'use strict';

const fs = require('fs');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const ensureJsonFileFormatted = require('../../../utils/ensureJsonFileFormatted');
const formatJson = require('../../../utils/formatJson');
const inLerna = require('../../../utils/inLerna');
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
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length !== 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNodeOnly =
      !useBabel ||
      (babelEnvs.length !== 0 &&
        babelEnvs.every((env) => env.target === 'node'));
    const useTypescript = useBabel;

    if (useTypescript) {
      this.fs.copy(
        this.templatePath('eslintignore.txt'),
        this.destinationPath('.eslintignore')
      );
    } else if (inLerna && inLerna.root) {
      this.fs.copy(
        this.templatePath('eslintignore.monorepoEslint.txt'),
        this.destinationPath('.eslintignore')
      );
    } else if (this.fs.exists(this.destinationPath('.eslintignore'))) {
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
      trailingComma: !useBabel ? 'es5' : 'all',
      singleQuote: true,
      // https://github.com/airbnb/javascript/pull/1863
      arrowParens: 'always',
    };

    packageUtils.removeDevDependencies(pkg, [
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'babel-eslint',
      'eslint-config-airbnb',
      'eslint-config-airbnb-base',
      'eslint-config-pob',
      'eslint-config-prettier',
      'eslint-plugin-babel',
      'eslint-plugin-flowtype',
      // 'eslint-plugin-import',
      'eslint-plugin-jsx-a11y',
      'eslint-plugin-node',
      'eslint-plugin-prettier',
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-typescript',
      'eslint-plugin-unicorn',
      'typescript-eslint-parser',
      'standard',
    ]);

    const yoConfigPobMonorepo = inLerna && inLerna.pobMonorepoConfig;
    const globalEslint = yoConfigPobMonorepo && yoConfigPobMonorepo.eslint;
    const isRootYarn2 = inLerna && inLerna.pobConfig.project.yarn2;
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;

    const typescript = true;

    if (globalEslint && !isRootYarn2) {
      packageUtils.removeDevDependencies(
        pkg,
        [
          'eslint',
          'prettier',
          '@pob/eslint-config',
          '@pob/eslint-config-node',
          '@pob/eslint-config-babel',
          '@pob/eslint-config-babel-node',
          '@pob/eslint-config-typescript',
          '@pob/eslint-config-typescript-react',
          '@pob/eslint-config-react',
          '@typescript-eslint/eslint-plugin',
          'eslint-plugin-node',
          'eslint-plugin-prettier',
          'eslint-plugin-unicorn',
          'eslint-plugin-import',
        ],
        true
      );
    } else {
      packageUtils.addOrRemoveDevDependencies(pkg, !globalEslint, ['prettier']);
      packageUtils.addDevDependencies(pkg, ['eslint']);
      if (
        !pkg.name.startsWith('eslint-config') &&
        !pkg.name.startsWith('@pob/eslint-config') &&
        pkg.name !== '@pob/use-eslint-plugin'
      ) {
        packageUtils.addDevDependencies(pkg, [
          '@pob/eslint-config',
          'eslint-plugin-import',
          'eslint-plugin-prettier',
          'eslint-plugin-unicorn',
        ]);

        packageUtils.addDevDependencies(pkg, [
          '@pob/eslint-config-node',
          'eslint-plugin-node',
          'eslint-import-resolver-node',
        ]);

        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && !typescript, [
          '@pob/eslint-config-babel',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && useNodeOnly, [
          '@pob/eslint-config-babel-node',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && typescript, [
          '@pob/eslint-config-typescript',
          '@typescript-eslint/eslint-plugin',
        ]);

        packageUtils.addOrRemoveDevDependencies(pkg, hasReact && !typescript, [
          '@pob/eslint-config-react',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, hasReact && typescript, [
          '@pob/eslint-config-typescript-react',
        ]);
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
        return [
          '../eslint-config/lib/index.js',
          '../eslint-config-node/lib/index.js',
        ];
      }

      if (useBabel) {
        return [
          !typescript && '@pob/eslint-config-babel',
          typescript && '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-babel-node',
          hasReact &&
            `@pob/eslint-config-${typescript ? 'typescript-' : ''}react`,
        ].filter(Boolean);
      }

      return extendsConfigNoBabel;
    })();

    const dir = useBabel ? 'src' : 'lib';
    // eslint-disable-next-line unicorn/no-nested-ternary
    const ext = !useBabel ? 'js' : hasReact ? '{ts,tsx}' : 'ts';

    const jestOverride = !packageUtils.hasJest(pkg)
      ? null
      : {
          files: [`${dir}/**/*.test.${ext}`, `${dir}/__tests__/**/*.${ext}`],
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
    try {
      if (this.fs.exists(rootEslintrcPath)) {
        ensureJsonFileFormatted(rootEslintrcPath);
      }
      const rootEslintrcConfig = updateEslintConfig(
        this.fs.readJSON(rootEslintrcPath, {}),
        {
          extendsConfig: isPobEslintConfig
            ? extendsConfig
            : extendsConfigNoBabel,
        }
      );

      this.fs.write(rootEslintrcPath, formatJson(rootEslintrcConfig));
    } catch (err) {
      console.warn(`Could not parse/edit ${rootEslintrcPath}: `, err);
    }

    const srcEslintrcPath = this.destinationPath(
      `${useBabel ? 'src/' : 'lib/'}.eslintrc.json`
    );

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
        }
      );

      this.fs.write(srcEslintrcPath, formatJson(srcEslintrcConfig));
    } catch (err) {
      console.warn(`Could not parse/edit ${srcEslintrcPath}: `, err);
    }

    const srcDirectory = useBabel ? 'src' : 'lib';

    const lintDirectories = [
      srcDirectory,
      'bin',
      'scripts',
      'migrations',
    ].filter((dir) => fs.existsSync(this.destinationPath(dir)));
    packageUtils.addScripts(pkg, {
      lint: `${useBabel && !composite ? 'tsc && ' : ''}eslint${
        !useBabel ? '' : ` --ext .js,.ts${hasReact ? ',.tsx' : ''}`
      } --quiet *.js ${lintDirectories.join(' ')}`,
    });

    delete pkg.scripts['typescript-check'];

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
