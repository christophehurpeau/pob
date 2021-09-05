'use strict';

const fs = require('fs');

const addPobRootPostinstallInScript = (pkg, scriptName) => {
  if (!pkg.scripts[scriptName]) {
    pkg.scripts[scriptName] = 'pob-root-postinstall';
  } else if (!pkg.scripts[scriptName].includes('pob-root-postinstall')) {
    pkg.scripts[
      scriptName
    ] = `pob-root-postinstall ; ${pkg.scripts.postinstall}`;
  }
};

module.exports = function installScripts({ pkg, pm }) {
  if (!pkg.scripts) pkg.scripts = {};
  if (pkg.name === 'pob-monorepo') return;

  if (pm.name === 'yarn') {
    if (pkg.private) {
      delete pkg.scripts.postinstallDev;
      addPobRootPostinstallInScript(pkg, 'postinstall');
    } else {
      if (pkg.scripts.postinstall === 'pob-root-postinstall') {
        delete pkg.scripts.postinstall;
      }
      pkg.scripts.postinstallDev = 'pob-root-postinstall';
    }
  } else {
    addPobRootPostinstallInScript(pkg, 'prepare');
  }

  fs.writeFileSync(
    'package.json',
    `${JSON.stringify(pkg, null, 2)}\n`,
    'utf-8',
  );
};
