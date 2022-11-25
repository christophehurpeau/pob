import Generator from 'yeoman-generator';
import { readJSON5 } from '../../../utils/json5.js';
import {
  copyAndFormatTpl,
  writeAndFormatJson,
} from '../../../utils/writeAndFormat.js';

export default class CoreVSCodeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('root', {
      type: Boolean,
      required: false,
      defaults: '',
      desc: 'Is root',
    });

    this.option('packageManager', {
      type: String,
      required: false,
      defaults: 'yarn',
      desc: 'yarn|npm.',
    });

    this.option('monorepo', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'is monorepo',
    });

    this.option('testing', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Testing enabled',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'node-modules',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });

    this.option('typescript', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Typescript enabled',
    });

    this.option('packageNames', {
      type: String,
      required: false,
    });

    this.option('packageLocations', {
      type: String,
      required: false,
    });
  }

  writing() {
    if (this.options.root) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'));
      copyAndFormatTpl(
        this.fs,
        this.templatePath('extensions.json.ejs'),
        this.destinationPath('.vscode/extensions.json'),
        {
          yarn: this.options.packageManager === 'yarn',
          pnp: this.options.yarnNodeLinker === 'pnp',
        },
      );
      copyAndFormatTpl(
        this.fs,
        this.templatePath('settings.json.ejs'),
        this.destinationPath('.vscode/settings.json'),
        {
          yarn: this.options.packageManager === 'yarn',
          pnp: this.options.yarnNodeLinker === 'pnp',
          npm: this.options.packageManager === 'npm',
          typescript: this.options.typescript,
          testing: this.options.testing,
          module: pkg.type === 'module',
        },
      );

      const tasksConfig = readJSON5(
        this.fs,
        this.destinationPath('.vscode/tasks.json'),
        {},
      );
      const tasks = tasksConfig.tasks || [];

      copyAndFormatTpl(
        this.fs,
        this.templatePath('tasks.json.ejs'),
        this.destinationPath('.vscode/tasks.json'),
        {
          typescript: this.options.typescript,
          tasks: JSON.stringify(tasks, null, 2),
        },
      );

      if (this.options.monorepo) {
        const packageNames = JSON.parse(this.options.packageNames);
        const packageLocations = JSON.parse(this.options.packageLocations);
        const folders = packageLocations.map((location, i) => ({
          name: packageNames[i],
          path: `../${location}`,
        }));
        folders.sort((a, b) => a.name.localeCompare(b.name, 'en'));

        packageLocations.forEach((location) => {
          writeAndFormatJson(
            this.fs,
            this.destinationPath(`${location}/.vscode/settings.json`),
            {
              'eslint.workingDirectories': ['../../'],
            },
          );
        });

        const extensions = readJSON5(
          this.fs,
          this.destinationPath('.vscode/extensions.json'),
          {},
        );
        const settings = readJSON5(
          this.fs,
          this.destinationPath('.vscode/settings.json'),
          {},
        );

        const projectName = pkg.name.replace('/', '-');
        writeAndFormatJson(
          this.fs,
          this.destinationPath(`.vscode/${projectName}.code-workspace`),
          {
            extensions,
            settings: {
              ...settings,
              ...(settings['typescript.tsdk']
                ? { 'typescript.tsdk': '✨ root/node_modules/typescript/lib' }
                : {}),
              ...(this.options.testing
                ? {
                    'jest.jestCommandLine':
                      'NODE_OPTIONS=--experimental-vm-modules node_modules/.bin/jest',
                    // disable all folders to enable only root.
                    'jest.disabledWorkspaceFolders': folders.map(
                      (folder) => folder.name,
                    ),
                  }
                : {}),
            },
            folders: [
              {
                name: '✨ root',
                path: '..',
              },
              ...folders,
            ],
          },
        );
      }
    } else {
      // this.fs.delete('.vscode');
    }
  }
}