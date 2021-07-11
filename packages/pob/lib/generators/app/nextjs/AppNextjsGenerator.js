import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';

export default class AppNextjsGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('export', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Use next export.',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addScripts(pkg, {
      build: 'next build',
      start: 'next',
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
