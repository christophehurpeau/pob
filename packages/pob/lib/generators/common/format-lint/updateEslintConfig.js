import sortConfig from '@pob/sort-eslint-config';

function updateOverrides(config, jestOverride) {
  const existingJestOverrideIndex = !config.overrides
    ? -1
    : config.overrides.findIndex(
        (override) => override.env && override.env.jest,
      );
  if (!jestOverride) {
    if (existingJestOverrideIndex !== -1) {
      config.overrides.splice(existingJestOverrideIndex, 1);
      if (config.overrides.length === 0) {
        delete config.overrides;
      }
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (existingJestOverrideIndex !== -1) {
      Object.assign(config.overrides[existingJestOverrideIndex], jestOverride);
    } else {
      if (!config.overrides) config.overrides = [];
      config.overrides.push(jestOverride);
    }
  }
  return config;
}

function updateParserAndPlugins(
  config,
  useTypescript,
  globalEslint,
  relativePath,
) {
  if (useTypescript) {
    // webstorm uses this to detect eslint .ts compat
    config.parser = '@typescript-eslint/parser';
    config.plugins = ['@typescript-eslint'];

    if (!globalEslint) {
      config.parserOptions = {
        project: './tsconfig.json',
        createDefaultProgram: true, // fix for lint-staged
      };
    } else {
      config.parserOptions = {
        project: `${relativePath}/tsconfig.json`,
      };
    }
  } else {
    if (
      config.parser === 'typescript-eslint-parser' ||
      config.parser === '@typescript-eslint/parser'
    ) {
      delete config.parser;
    }
    if (config.parserOptions && config.parserOptions.project) {
      delete config.parserOptions;
    }
    if (
      config.plugins &&
      (config.plugins[0] === 'typescript' ||
        config.plugins[0] === '@typescript-eslint')
    ) {
      config.plugins.splice(0, 1);
    }
    if (config.plugins && config.plugins.length === 0) {
      delete config.plugins;
    }
  }

  return config;
}

function updateSettings(config, settings) {
  Object.entries(settings).forEach(([key, value]) => {
    if (value === false) {
      if (config.settings) {
        delete config.settings[key];
      }
    } else {
      if (!config.settings) config.settings = {};
      config.settings[key] = value;
    }
  });

  if (config.settings && Object.keys(config.settings) === 0) {
    delete config.settings;
  }

  return config;
}

function updateIgnorePatterns(config, ignorePatterns) {
  if (!ignorePatterns) {
    delete config.ignorePatterns;
  } else {
    config.ignorePatterns = ignorePatterns;
  }
  return config;
}

export default function updateEslintConfig(
  config,
  {
    extendsConfig,
    jestOverride,
    useTypescript,
    globalEslint,
    settings,
    ignorePatterns,
    relativePath,
  },
) {
  config.root = true;
  config.extends = extendsConfig;

  config = updateParserAndPlugins(
    config,
    useTypescript,
    globalEslint,
    relativePath,
  );
  config = updateOverrides(config, jestOverride);
  if (settings) {
    config = updateSettings(config, settings);
  }
  config = updateIgnorePatterns(config, ignorePatterns);

  return sortConfig(config);
}
