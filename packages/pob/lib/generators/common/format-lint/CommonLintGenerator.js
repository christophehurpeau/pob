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
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length > 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNode =
      !useBabel ||
      (babelEnvs.length > 0 && babelEnvs.some((env) => env.target === 'node'));
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

    if (!inLerna || inLerna.root) {
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
          inRoot: !inLerna || inLerna.root,
          documentation: this.options.documentation,
          useYarn2: this.options.useYarn2,
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
      if (pkg.devDependencies['@pob/eslint-config-babel-node']) {
        packageUtils.addDevDependencies(pkg, [
          '@pob/eslint-config-typescript-node',
        ]);
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
          '@pob/eslint-config-typescript-react',
          '@pob/eslint-config-react',
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
          lernaProjectType === 'app' ||
          isYarn2,
        ['eslint'],
      );
      const shouldHavePluginsDependencies =
        !globalEslint || !inLerna || isYarn2;

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
          ['eslint-plugin-node', 'eslint-import-resolver-node'],
        );

        if (inLerna && inLerna.root) {
          packageUtils.updateDevDependenciesIfPresent(pkg, [
            '@pob/eslint-config-typescript',
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
            ? '../../eslint-config/node-commonjs'
            : '../../eslint-config/node-module',
        ];
      }

      if (useBabel) {
        return [
          '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-typescript-node',
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

    const rootEslintrcPath = this.destinationPath('.eslintrc.json');

    const srcEslintrcPath = this.destinationPath(
      `${useBabel ? 'src/' : 'lib/'}.eslintrc.json`,
    );

    const useTypescript = useBabel;

    try {
      if (this.fs.exists(rootEslintrcPath)) {
        ensureJsonFileFormatted(rootEslintrcPath);
      }

      const ignorePatterns = new Set();

      if (inLerna && !inLerna.root && (this.options.typescript || pkg.types)) {
        ignorePatterns.add('*.d.ts');
      }

      if (inLerna && inLerna.root && this.options.documentation) {
        ignorePatterns.add('/docs');
      }

      if (inLerna && !inLerna.root && useBabel) {
        ignorePatterns.add('/dist', '/test');
      }

      if (this.options.ignorePaths) {
        this.options.ignorePaths
          .split('\n')
          .filter(Boolean)
          .forEach((ignorePath) => {
            if (ignorePath.startsWith('#')) return;
            ignorePatterns.add(ignorePath);
          });
      }

      const rootEslintrcConfig = updateEslintConfig(
        this.fs.readJSON(rootEslintrcPath, {}),
        {
          extendsConfig: extendsConfigRoot,
          ignorePatterns:
            ignorePatterns.size === 0 ? undefined : [...ignorePatterns],
        },
      );

      writeAndFormatJson(this.fs, rootEslintrcPath, rootEslintrcConfig);
    } catch (err) {
      console.warn(`Could not parse/edit ${rootEslintrcPath}: `, err);
    }

    if (inLerna && inLerna.root) {
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
            extendsConfig: extendsConfigSrc,
            jestOverride,
            useTypescript: useBabel,
            globalEslint,
            ignorePatterns: useTypescript || pkg.types ? ['*.d.ts'] : undefined,
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

        writeAndFormatJson(this.fs, srcEslintrcPath, srcEslintrcConfig);
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
        : ` --ext .js,.mjs,.ts${hasReact ? ',.tsx' : ''}`;
      const args = `${extArg} --report-unused-disable-directives --quiet`;

      packageUtils.addScripts(pkg, {
        'lint:eslint': globalEslint
          ? `yarn --cwd ../.. run eslint${args} ${path.relative('../..', '.')}`
          : `eslint${args} ${lintPaths.join(' ')}`,
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
