import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class MonorepoTypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
    });

    this.option('isAppProject', {
      type: Boolean,
      defaults: true,
      desc: 'app project, no building definitions',
    });

    this.option('packageNames', {
      type: String,
      required: true,
    });

    this.option('packagePaths', {
      type: String,
      required: true,
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

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enable, [
      'typescript',
    ]);

    if (this.options.enable) {
      packageUtils.addScripts(pkg, {
        tsc: 'tsc -b',
      });
      packageUtils.addOrRemoveScripts(pkg, !this.options.isAppProject, {
        'build:definitions': 'tsc -b',
      });

      delete pkg.scripts.postbuild;

      if (!this.options.isAppProject) {
        pkg.scripts.build += ' && yarn run build:definitions';
      }
    } else if (pkg.scripts) {
      delete pkg.scripts.tsc;
      if (
        pkg.scripts.postbuild === 'tsc -b tsconfig.build.json' ||
        pkg.scripts.postbuild === 'tsc -b'
      ) {
        delete pkg.scripts.postbuild;
      }
      delete pkg.scripts['build:definitions'];
    }

    if (pkg.scripts) {
      delete pkg.scripts['typescript-check'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  // after pob ran in workspaces
  end() {
    const tsconfigPath = this.destinationPath('tsconfig.json');
    const tsconfigCheckPath = this.destinationPath('tsconfig.check.json');
    const tsconfigBuildPath = this.destinationPath('tsconfig.build.json');

    if (!this.options.enable) {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
    } else {
      const packagePaths = JSON.parse(this.options.packagePaths);

      copyAndFormatTpl(
        this.fs,
        this.templatePath('tsconfig.json.ejs'),
        tsconfigPath,
        {
          packagePaths,
        },
      );

      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
      // if (this.options.isAppProject) {
      // } else {
      //   copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.check.json.ejs'),
      //     tsconfigCheckPath,
      //     {
      //       packagePaths: packagePaths.filter((packagePath) =>
      //         existsSync(`${packagePath}/tsconfig.check.json`),
      //       ),
      //     },
      //   );

      //   copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.build.json.ejs'),
      //     tsconfigBuildPath,
      //     {
      //       packagePaths: packagePaths.filter((packagePath) =>
      //         existsSync(`${packagePath}/tsconfig.build.json`),
      //       ),
      //     },
      //   );
      // }
    }
  }
}
