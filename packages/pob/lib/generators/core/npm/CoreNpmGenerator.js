import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';

export default class CoreNpmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Enable npm',
    });
    this.option('ci', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Enabled ci',
    });
    this.option('testing', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Enabled testing',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.private && this.options.enable) {
      const babelEnvs = pkg.pob.babelEnvs || [];
      const withBabel = babelEnvs.length > 0;

      this.fs.copyTpl(
        this.templatePath('npmignore.ejs'),
        this.destinationPath('.npmignore'),
        {
          inLerna,
          ci: this.options.ci,
          testing: this.options.testing,
          babel: withBabel,
          typedoc: pkg.devDependencies && pkg.devDependencies.typedoc,
          yarn: this.fs.exists('.yarnrc.yml'),
          npm: this.fs.exists('package-lock.json'),
          codeclimate: this.fs.exists('.codeclimate.yml'),
        },
      );
    } else if (this.fs.exists(this.destinationPath('.npmignore'))) {
      this.fs.delete(this.destinationPath('.npmignore'));
    }
  }
}
