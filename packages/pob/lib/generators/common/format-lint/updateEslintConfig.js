import sortConfig from '@pob/sort-eslint-config';

function updateOverrides(config, testsOverride) {
  const existingTestsOverrideIndex = !config.overrides
    ? -1
    : config.overrides.findIndex(
        testsOverride.env?.jest
          ? (override) => override.env && override.env.jest
          : (override) =>
              override?.env.jest ||
              override.extends?.includes(testsOverride.extends[0]),
      );
  if (!testsOverride) {
    if (existingTestsOverrideIndex !== -1) {
      config.overrides.splice(existingTestsOverrideIndex, 1);
      if (config.overrides.length === 0) {
        delete config.overrides;
      }
    }
  } else {
    if (testsOverride.rules && Object.keys(testsOverride.rules).length === 0) {
      delete testsOverride.rules;
    }

    if (existingTestsOverrideIndex !== -1) {
      const existingTestsOverride =
        config.overrides[existingTestsOverrideIndex];
      Object.assign(existingTestsOverride, testsOverride);

      if (
        existingTestsOverride.rules &&
        Object.keys(existingTestsOverride.rules).length === 0
      ) {
        delete existingTestsOverride.rules;
      }
    } else {
      if (!config.overrides) config.overrides = [];
      config.overrides.push(testsOverride);
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
        // eslint-disable-next-line camelcase
        EXPERIMENTAL_useProjectService: true,
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
    testsOverride,
    useTypescript,
    globalEslint,
    settings,
    ignorePatterns,
    relativePath,
  },
) {
  config.root = true;
  config.extends = [
    ...extendsConfig,
    ...(config?.extends
      ? config.extends.filter(
          (extendsValue) =>
            extendsValue === '@pob/eslint-config-typescript/allow-unsafe',
        )
      : []),
  ];

  config = updateParserAndPlugins(
    config,
    useTypescript,
    globalEslint,
    relativePath,
  );
  config = updateOverrides(config, testsOverride);
  if (settings) {
    config = updateSettings(config, settings);
  }
  config = updateIgnorePatterns(config, ignorePatterns);

  return sortConfig(config);
}
