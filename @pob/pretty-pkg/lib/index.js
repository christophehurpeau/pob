import fs from 'fs';
import sortPkg from '@pob/sort-pkg';
import prettier from 'prettier';

export default function prettyPkg(pkg, prettierOptions = pkg.prettier) {
  if (typeof pkg === 'string') {
    pkg = JSON.parse(pkg);
    if (typeof pkg !== 'object') {
      throw new TypeError(
        'Invalid package: not an object after parsing string',
      );
    }
  } else if (typeof pkg !== 'object') {
    throw new TypeError('expected pkg to be object or string');
  }

  if (typeof prettierOptions === 'string') {
    throw new TypeError(
      `Please import "${prettierOptions}" and pass it as the second argument of prettyPkg`,
    );
  }

  sortPkg(pkg);
  return prettier.format(JSON.stringify(pkg, undefined, 2), {
    filepath: 'package.json',
    printWidth: 80,
    ...prettierOptions,
  });
}

export function writeSync(pkg, path, prettierOptions) {
  const string = prettyPkg(pkg, prettierOptions);
  fs.writeFileSync(path, string, 'utf8');
}

export function overrideSync(path, prettierOptions) {
  const pkg = fs.readFileSync(path, 'utf8');
  return writeSync(pkg, path, prettierOptions);
}
