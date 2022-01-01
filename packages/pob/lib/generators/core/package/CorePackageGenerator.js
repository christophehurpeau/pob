import fs from 'fs';
import path from 'path';
import askName from 'inquirer-npm-name';
import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';

export default class CorePackageGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('monorepo', {
      type: Boolean,
      required: true,
      defaults: false,
      desc: 'is monorepo',
    });

    this.option('isRoot', {
      type: Boolean,
      required: true,
      defaults: false,
      desc: 'is root',
    });

    this.option('private', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'private package',
    });
  }

  async initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.engines) pkg.engines = {};

    // dont override engines if set to latest
    if (
      !pkg.engines.node ||
      !(
        pkg.engines.node.startsWith('>=14.') ||
        pkg.engines.node.startsWith('>=16.')
      )
    ) {
      // this might be overridden by babel generator
      pkg.engines.node = '>=14.13.1';
    }

    if (!this.options.updateOnly) {
      if (this.options.monorepo && this.options.isRoot) {
        pkg.private = true;
      } else if (this.options.private) {
        pkg.private = true;
      } else {
        const { isPrivate } = await this.prompt({
          type: 'confirm',
          name: 'isPrivate',
          message: 'Private package ?',
          default: pkg.private === true,
        });
        if (isPrivate) {
          pkg.private = isPrivate;
        } else {
          delete pkg.private;
        }
      }
    }

    if (this.options.monorepo && this.options.isRoot) {
      if (!pkg.name) {
        const { name } = await this.prompt({
          name: 'name',
          message: 'Monorepo Name',
          default: path.basename(process.cwd()),
          validate: (str) => str.length > 0,
        });
        pkg.name = name;
      } else if (pkg.name.endsWith('-lerna')) {
        pkg.name = pkg.name.replace('-lerna', '-monorepo');
      }
    } else if (!pkg.name) {
      const prompt = {
        name: 'name',
        message: 'Module Name',
        default: path.basename(process.cwd()),
        validate: (str) => str.length > 0,
      };

      const { name } = await (pkg.private
        ? this.prompt([prompt])
        : askName(prompt, this));
      pkg.name = name;
    }

    let author = packageUtils.parsePkgAuthor(pkg);

    const props = await this.prompt(
      [
        !this.options.updateOnly &&
          !(this.options.monorepo && this.options.isRoot) && {
            name: 'description',
            message: 'Description',
            default: pkg.description,
          },
        {
          name: 'authorName',
          message: "Author's Name",
          when: !author || !author.name,
          default: this.user.git.name(),
        },
        {
          name: 'authorEmail',
          message: "Author's Email",
          when: !author || !author.email,
          default: this.user.git.email(),
        },
        {
          name: 'authorUrl',
          message: "Author's Homepage",
          when: !author || !author.url,
        },
        {
          name: 'type',
          message: 'Package Type',
          type: 'list',
          choices: ['commonjs', 'module'],
          when: !pkg.type,
        },
        {
          name: 'license',
          message: 'License Type',
          type: 'list',
          choices: ['MIT', 'ISC', 'UNLICENSED'],
          when: !pkg.license,
        },
      ].filter(Boolean),
    );

    if (!pkg.type) pkg.type = props.type;
    if (inLerna && !inLerna.root && inLerna.rootMonorepoPkg.type === 'module') {
      pkg.type = 'module';
    }

    pkg.description = this.options.updateOnly
      ? pkg.description
      : props.description || pkg.description;

    if (this.options.monorepo && !this.options.isRoot) {
      const rootMonorepoPkg = inLerna.rootMonorepoPkg;
      const rootRepositoryUrl =
        typeof rootMonorepoPkg.repository === 'string'
          ? rootMonorepoPkg.repository
          : rootMonorepoPkg.repository.url;
      pkg.repository = {
        type: 'git',
        url: rootRepositoryUrl,
        directory: process.cwd().slice(inLerna.rootPath.length + 1),
      };
      pkg.homepage = rootMonorepoPkg.homepage;

      if (this.fs.exists(this.destinationPath('yarn.lock'))) {
        fs.unlinkSync(this.destinationPath('yarn.lock'));
      }
    }
    if (this.fs.exists(this.destinationPath('yarn-error.log'))) {
      fs.unlinkSync(this.destinationPath('yarn-error.log'));
    }

    if (this.options.monorepo && !this.options.isRoot) {
      packageUtils.removeScripts(pkg, ['checks']);
    } else if (this.options.monorepo && this.options.isRoot) {
      const doesMjsCheckPackagesExists = this.fs.exists(
        this.destinationPath('scripts/check-packages.mjs'),
      );
      let doesJsCheckPackagesExists = this.fs.exists(
        this.destinationPath('scripts/check-packages.js'),
      );

      if (pkg.type === 'module' && !doesJsCheckPackagesExists) {
        doesJsCheckPackagesExists = true;
        this.fs.copyTpl(
          this.templatePath('check-packages.js.ejs'),
          this.destinationPath('scripts/check-packages.js'),
          {},
        );
      }

      packageUtils.addOrRemoveScripts(
        pkg,
        doesMjsCheckPackagesExists || doesJsCheckPackagesExists,
        {
          checks: `node scripts/check-packages.${
            doesMjsCheckPackagesExists ? 'mjs' : 'js'
          }`,
        },
      );
    } else if (inLerna && !inLerna.root) {
      if (this.fs.exists('scripts/check-package.js')) {
        this.fs.delete('scripts/check-package.js');
      }
      if (this.fs.exists('scripts/check-package.mjs')) {
        this.fs.delete('scripts/check-package.mjs');
      }
      packageUtils.removeScripts(pkg, ['checks']);
    } else {
      const doesMjsCheckPackageExists = this.fs.exists(
        this.destinationPath('scripts/check-package.mjs'),
      );
      let doesJsCheckPackageExists = this.fs.exists(
        this.destinationPath('scripts/check-package.js'),
      );

      if (pkg.type === 'module' && !doesJsCheckPackageExists) {
        doesJsCheckPackageExists = true;
        this.fs.copyTpl(
          this.templatePath('check-package.js.ejs'),
          this.destinationPath('scripts/check-package.js'),
          {},
        );
      }

      packageUtils.addOrRemoveScripts(
        pkg,
        doesMjsCheckPackageExists || doesJsCheckPackageExists,
        {
          checks: `node scripts/check-package.${
            doesMjsCheckPackageExists ? 'mjs' : 'js'
          }`,
        },
      );
    }

    author = {
      name: props.authorName || author.name,
      email: props.authorEmail || author.email,
      url: props.authorUrl || (author && author.url),
    };

    pkg.author = `${author.name} <${author.email}>${
      author.url ? ` (${author.url})` : ''
    }`;

    if (!pkg.license) {
      pkg.license = props.license;
      this.fs.copyTpl(
        this.templatePath(`licenses/${props.license}.ejs`),
        this.destinationPath('LICENSE'),
        {
          year: new Date().getFullYear(),
          author: pkg.author,
        },
      );
    }

    if (pkg.private) {
      if (!pkg.description) delete pkg.description;
      if (!pkg.keywords || pkg.keywords.length === 0) delete pkg.keywords;
    } else if (!pkg.keywords) {
      pkg.keywords = [];
    }

    if (!pkg.private && !pkg.version) {
      // lerna root pkg should not have version
      pkg.version = '0.0.0';
    }

    if (!pkg.private && !pkg.publishConfig && pkg.name[0] === '@') {
      pkg.publishConfig = {
        access: 'public',
      };
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    if (!pkg.scripts) pkg.scripts = {};

    const installPostinstallScript = (scriptName) => {
      if (
        !pkg.scripts[scriptName] ||
        !pkg.scripts[scriptName].includes('pob-root-postinstall')
      ) {
        pkg.scripts[scriptName] = 'pob-root-postinstall';
      }
    };

    const uninstallPostinstallScript = (scriptName) => {
      if (pkg.scripts && pkg.scripts[scriptName]) {
        if (pkg.scripts[scriptName] === 'pob-root-postinstall') {
          delete pkg.scripts[scriptName];
        } else if (
          pkg.scripts[scriptName].startsWith('pob-root-postinstall && ')
        ) {
          pkg.scripts[scriptName] = pkg.scripts[scriptName].slice(
            'pob-root-postinstall && '.length - 1,
          );
        } else if (pkg.scripts[scriptName].includes('pob-root-postinstall')) {
          throw new Error('Could not remove pob-root-postinstall');
        }
      }
    };
    if (this.options.monorepo || inLerna || pkg.private) {
      uninstallPostinstallScript('postinstallDev');
      if (this.options.isRoot) {
        installPostinstallScript('postinstall');
      } else {
        uninstallPostinstallScript('postinstall');
      }
    } else {
      uninstallPostinstallScript('postinstall');
      installPostinstallScript('postinstallDev');
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
