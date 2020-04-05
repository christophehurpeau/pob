'use strict';

const fs = require('fs');
const { types: t } = require('@babel/core');
const { addDefault, isModule } = require('@babel/helper-module-imports');
const builtInsHelpers = require('./buildInsHelpers');

function supportsStaticESM(caller) {
  return !!(caller && caller.supportsStaticESM);
}

const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
const HEADER_HELPERS = ['interopRequireWildcard', 'interopRequireDefault'];

module.exports = function (api, options, dirname) {
  api.assertVersion(7);

  const {
    useESModules = 'auto',
    useHelpers = true,
    useRuntimeRegenerator = true,
  } = options;

  if (typeof useESModules !== 'boolean' && useESModules !== 'auto') {
    throw new Error(
      "The 'useESModules' option must be undefined, or a boolean, or 'auto'."
    );
  }

  const esModules =
    useESModules === 'auto' ? api.caller(supportsStaticESM) : useESModules;

  const moduleName = '@babel/runtime';
  const modulePath = moduleName;

  const assertHasDependency = () => {
    if (!pkg.dependencies[moduleName]) {
      throw new Error(`Dependency missing: ${moduleName}`);
    }

    return pkg.dependencies[moduleName].replace(/^\^/, '');
  };

  return {
    name: 'babel-plugin-transform-builtins',

    pre(file) {
      file.set('helperGenerator', (name) => {
        // This is where this module is useful
        if (builtInsHelpers[name]) {
          return builtInsHelpers[name]();
        }

        if (!useHelpers) return;

        const runtimeVersion = assertHasDependency();

        // If the helper didn't exist yet at the version given, we bail
        // out and let Babel either insert it directly, or throw an error
        // so that plugins can handle that case properly.
        if (
          file.availableHelper &&
          !file.availableHelper(name, runtimeVersion)
        ) {
          return;
        }

        const isInteropHelper = HEADER_HELPERS.includes(name);

        // Explicitly set the CommonJS interop helpers to their reserve
        // blockHoist of 4 so they are guaranteed to exist
        // when other things used them to import.
        const blockHoist =
          isInteropHelper && !isModule(file.path) ? 4 : undefined;

        const helpersDir =
          esModules && file.path.node.sourceType === 'module'
            ? 'helpers/esm'
            : 'helpers';

        return this.addDefaultImport(
          `${modulePath}/${helpersDir}/${name}`,
          name,
          blockHoist
        );
      });

      const cache = new Map();

      this.addDefaultImport = (source, nameHint, blockHoist) => {
        // If something on the page adds a helper when the file is an ES6
        // file, we can't reused the cached helper name after things have been
        // transformed because it has almost certainly been renamed.
        const cacheKey = isModule(file.path);
        const key = `${source}:${nameHint}:${cacheKey || ''}`;

        let cached = cache.get(key);
        if (cached) {
          cached = t.cloneNode(cached);
        } else {
          cached = addDefault(file.path, source, {
            importedInterop: 'uncompiled',
            nameHint,
            blockHoist,
          });

          cache.set(key, cached);
        }
        return cached;
      };
    },

    visitor: {
      ReferencedIdentifier(path) {
        const { node } = path;

        if (node.name === 'regeneratorRuntime' && useRuntimeRegenerator) {
          assertHasDependency();

          path.replaceWith(
            this.addDefaultImport(
              `${modulePath}/regenerator`,
              'regeneratorRuntime'
            )
          );
        }
      },
    },
  };
};
