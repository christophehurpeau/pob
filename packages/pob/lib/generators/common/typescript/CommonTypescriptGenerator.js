import { existsSync } from 'node:fs';
import Generator from 'yeoman-generator';
import inMonorepo from '../../../utils/inMonorepo.js';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonTypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      default: true,
      desc: 'enable typescript',
    });

    this.option('isApp', {
      type: Boolean,
      required: true,
      desc: 'is app',
    });

    this.option('isAppLibrary', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('rootDir', {
      type: String,
      default: 'src',
      desc: 'customize rootDir',
    });

    this.option('srcDirectory', {
      type: String,
      default: 'src',
      desc: 'customize srcDirectory, if different than rootDir',
    });

    this.option('jsx', {
      type: Boolean,
      default: true,
      desc: 'enable jsx with typescript',
    });

    this.option('jsxPreserve', {
      type: Boolean,
      default: false,
      desc: 'force jsx preserve in tsconfig for legacy apps (nextjs, CRA)',
    });

    this.option('forceExcludeNodeModules', {
      type: Boolean,
      default: false,
      desc: 'force exclude node_modules for legacy apps (nextjs, CRA)',
    });

    this.option('forceAllowJs', {
      type: Boolean,
      default: false,
      desc: 'force allow js for legacy apps (nextjs, CRA)',
    });

    this.option('dom', {
      type: Boolean,
      default: true,
      desc: 'enable dom with typescript',
    });

    this.option('baseUrl', {
      type: String,
      default: '',
      desc: 'baseUrl option',
    });

    this.option('resolveJsonModule', {
      type: Boolean,
      default: false,
      desc: 'resolveJsonModule option',
    });

    this.option('builddefs', {
      type: Boolean,
      default: true,
      desc: 'build .d.ts option',
    });
    this.option('plugins', {
      type: String,
      default: '',
      desc: 'typescript plugins',
    });
    this.option('additionalIncludes', {
      type: String,
      default: '',
      desc: 'typescript additional includes',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'only latest lts',
    });
  }

  writing() {
    if (this.fs.exists('flow-typed')) this.fs.delete('flow-typed');
    if (this.fs.exists(this.destinationPath('.flowconfig'))) {
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const presets = (() => {
      const babelEnvs = pkg.pob?.babelEnvs || [];
      const withBabel = babelEnvs.length > 0;
      const withTypescript = withBabel || pkg.pob?.typescript === true;
      const jsx = (withBabel || withTypescript) && pkg.pob.jsx === true;

      if (withBabel) {
        return jsx || this.options.dom
          ? ['@pob/root/tsconfigs/targets/rollup-babel-with-dom.json']
          : ['@pob/root/tsconfigs/targets/rollup-babel.json'];
      }
      if (withTypescript) {
        const nodeVersion = this.options.onlyLatestLTS ? '20' : '18';
        const envs = pkg.pob?.envs;
        if (pkg.pob.rollup === false) {
          return [`@pob/root/tsconfigs/targets/node-${nodeVersion}.json`];
        }
        if (envs && envs.every((env) => env.target === 'node')) {
          return [
            `@pob/root/tsconfigs/targets/rollup-node-${nodeVersion}.json`,
          ];
        }
        return ['@pob/root/tsconfigs/targets/rollup-es2015.json'];
      }
      return [];
    })();

    packageUtils.removeDevDependencies(pkg, ['flow-bin']);

    if (pkg.scripts) {
      delete pkg.scripts.flow;
    }

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.options.enable ||
        this.fs.exists(this.destinationPath('lib/index.d.ts')),
      ['typescript'],
    );

    const tsconfigPath = this.destinationPath('tsconfig.json');
    const tsconfigCheckPath = this.destinationPath('tsconfig.check.json');
    const tsconfigEslintPath = this.destinationPath('tsconfig.eslint.json');
    const tsconfigBuildPath = this.destinationPath('tsconfig.build.json');

    if (this.options.enable) {
      const { jsx, dom } = this.options;
      let composite;
      let monorepoPackageReferences;
      // let monorepoPackageBuildReferences;
      let monorepoPackageSrcPaths;

      if (inMonorepo && !inMonorepo.root) {
        const yoConfig = inMonorepo.rootYoConfig;

        composite =
          yoConfig.pob &&
          yoConfig.pob.monorepo &&
          yoConfig.pob.monorepo.typescript;

        if (composite) {
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            inMonorepo.rootPackageManager === 'yarn',
            ['typescript'],
          );

          const packageLocations = new Map(
            yoConfig.pob.monorepo.packageNames
              .filter(
                (packageName) =>
                  (pkg.dependencies && pkg.dependencies[packageName]) ||
                  (pkg.devDependencies && pkg.devDependencies[packageName]) ||
                  (pkg.peerDependencies && pkg.peerDependencies[packageName]),
              )
              .map((packageName) => [
                packageName,
                `../../${
                  packageName[0] === '@'
                    ? // eslint-disable-next-line unicorn/no-nested-ternary
                      yoConfig.pob.project.type === 'app'
                      ? `packages/${packageName.slice(
                          packageName.indexOf('/') + 1,
                        )}`
                      : packageName
                    : `packages/${packageName}`
                }`,
              ]),
          );

          monorepoPackageSrcPaths = [...packageLocations.entries()].map(
            ([packageName, packageLocation]) => [
              packageName,
              `${packageLocation}/${
                existsSync(`${packageLocations.get(packageName)}/tsconfig.json`)
                  ? 'src'
                  : 'lib'
              }`,
            ],
          );
          monorepoPackageReferences = yoConfig.pob.monorepo.packageNames
            .filter((packageName) =>
              existsSync(`${packageLocations.get(packageName)}/tsconfig.json`),
            )
            .map((packageName) => packageLocations.get(packageName));
          // monorepoPackageBuildReferences = yoConfig.pob.monorepo.packageNames
          //   .filter((packageName) =>
          //     existsSync(
          //       `${packageLocations.get(packageName)}/tsconfig.build.json`,
          //     ),
          //   )
          //   .map((packageName) => packageLocations.get(packageName));
        }
      }

      if (this.fs.exists(tsconfigEslintPath)) {
        this.fs.delete(tsconfigEslintPath);
      }
      if (this.fs.exists(tsconfigCheckPath)) {
        this.fs.delete(tsconfigCheckPath);
      }

      /*
      Only using one file:
      - allows IDE and typedoc to behave correctly
      - generate useless definition files for not excluded tests files. However, it also use them for cache.
      */
      copyAndFormatTpl(
        this.fs,
        this.templatePath('tsconfig.json.ejs'),
        tsconfigPath,
        {
          emitDefinitions: this.options.builddefs,
          build: pkg.pob?.rollup === false,
          cacheEnabled: !this.options.isApp || this.options.isAppLibrary,
          monorepoPackageSrcPaths,
          monorepoPackageReferences,
          rootDir: this.options.rootDir,
          srcDirectory: this.options.srcDirectory || this.options.rootDir,
          jsx,
          jsxPreserve: this.options.jsxPreserve,
          composite,
          dom,
          baseUrl: this.options.baseUrl,
          resolveJsonModule: this.options.resolveJsonModule,
          forceExcludeNodeModules: this.options.forceExcludeNodeModules,
          forceAllowJs: this.options.forceAllowJs,
          plugins: this.options.plugins.split(',').filter(Boolean),
          additionalIncludes: this.options.additionalIncludes
            .split(',')
            .filter(Boolean),
          presets,
        },
      );

      // if (
      //   this.options.builddefs // &&
      //   // (!composite || monorepoPackageNames.length !== 0)
      // ) {
      //   copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.build.json.ejs'),
      //     tsconfigBuildPath,
      //     {
      //       inMonorepo: inMonorepo && !inMonorepo.root,
      //       jsx,
      //       composite,
      //       monorepoPackageSrcPaths,
      //       monorepoPackageBuildReferences,
      //     },
      //   );
      // } else {
      this.fs.delete(tsconfigBuildPath);
      // }
    } else {
      if (pkg.scripts) delete pkg.scripts.tsc;
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigEslintPath);
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
