import { existsSync } from 'fs';
import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonTypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
    });

    this.option('rootDir', {
      type: String,
      defaults: 'src',
      desc: 'customize rootDir',
    });

    this.option('jsx', {
      type: Boolean,
      defaults: true,
      desc: 'enable jsx with typescript',
    });

    this.option('dom', {
      type: Boolean,
      defaults: true,
      desc: 'enable dom with typescript',
    });

    this.option('baseUrl', {
      type: String,
      defaults: '',
      desc: 'baseUrl option',
    });

    this.option('resolveJsonModule', {
      type: Boolean,
      defaults: false,
      desc: 'resolveJsonModule option',
    });

    this.option('builddefs', {
      type: Boolean,
      defaults: true,
      desc: 'build .d.ts option',
    });
  }

  writing() {
    if (this.fs.exists('flow-typed')) this.fs.delete('flow-typed');
    if (this.fs.exists(this.destinationPath('.flowconfig'))) {
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

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
    const tsconfigBuildPath = this.destinationPath('tsconfig.build.json');
    if (this.options.enable) {
      const { jsx, dom } = this.options;
      let composite;
      let monorepoPackageBuildReferences;
      let monorepoPackageSrcPaths;

      if (inLerna && !inLerna.root) {
        const yoConfig = inLerna.rootYoConfig;

        composite =
          yoConfig.pob &&
          yoConfig.pob.monorepo &&
          yoConfig.pob.monorepo.typescript;

        if (composite) {
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            inLerna.rootPackageManager === 'yarn',
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
                    ? packageName
                    : `packages/${packageName}`
                }`,
              ]),
          );

          monorepoPackageSrcPaths = [...packageLocations.entries()].map(
            ([packageName, packageLocation]) => [
              packageName,
              `${packageLocation}/${
                existsSync(`${packageLocation}/src`) ? 'src' : 'lib'
              }`,
            ],
          );
          monorepoPackageBuildReferences = yoConfig.pob.monorepo.packageNames
            .filter((packageName) =>
              existsSync(
                `${packageLocations.get(packageName)}/tsconfig.build.json`,
              ),
            )
            .map((packageName) => packageLocations.get(packageName));
        }
      }

      copyAndFormatTpl(
        this.fs,
        this.templatePath('tsconfig.json.ejs'),
        tsconfigPath,
        {
          monorepoPackageSrcPaths,
          monorepoPackageBuildReferences,
          rootDir: this.options.rootDir,
          jsx,
          composite,
          dom,
          baseUrl: this.options.baseUrl,
          resolveJsonModule: this.options.resolveJsonModule,
        },
      );
      if (
        this.options.builddefs // &&
        // (!composite || monorepoPackageNames.length !== 0)
      ) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('tsconfig.build.json.ejs'),
          tsconfigBuildPath,
          {
            inMonorepo: inLerna && !inLerna.root,
            jsx,
            composite,
            monorepoPackageSrcPaths,
            monorepoPackageBuildReferences,
          },
        );
      } else {
        this.fs.delete(tsconfigBuildPath);
      }
    } else {
      if (pkg.scripts) delete pkg.scripts.tsc;
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
