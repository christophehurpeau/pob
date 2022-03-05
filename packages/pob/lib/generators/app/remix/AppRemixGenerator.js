import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';

// run "yarn create remix remix" first, then "cd remix ; pob app"
export default class AppRemixGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addScripts(pkg, {
      build: 'cross-env NODE_ENV=production remix build',
      start: 'cross-env NODE_ENV=development remix dev',
      'start:prod': 'cross-env NODE_ENV=production remix-serve build',
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
