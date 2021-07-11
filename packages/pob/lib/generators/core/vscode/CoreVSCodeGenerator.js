import Generator from 'yeoman-generator';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

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

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'node-modules',
      desc:
        'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });

    this.option('typescript', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Typescript enabled',
    });
  }

  writing() {
    if (this.options.root) {
      copyAndFormatTpl(
        this.fs,
        this.templatePath('extensions.json.ejs'),
        this.destinationPath('.vscode/extensions.json'),
        {
          yarn: this.options.packageManager === 'yarn',
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
        },
      );
      copyAndFormatTpl(
        this.fs,
        this.templatePath('tasks.json.ejs'),
        this.destinationPath('.vscode/tasks.json'),
        {
          typescript: this.options.typescript,
        },
      );
    } else {
      this.fs.delete('.vscode');
    }
  }
}
