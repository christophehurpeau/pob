import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { writeAndFormatJson } from '../../../utils/writeAndFormat.js';

export default class CoreSortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    writeAndFormatJson(
      this.fs,
      this.destinationPath('package.json'),
      packageUtils.sort(pkg),
    );
  }

  end() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    writeAndFormatJson(
      this.fs,
      this.destinationPath('package.json'),
      packageUtils.sort(pkg),
    );
  }
}
