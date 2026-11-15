import path from "node:path";
import { format } from "oxfmt";
import semver from "semver";
import type { BuildEnv } from "../engine/config.ts";
import type { PackageContext } from "../engine/context.ts";
import type { JsonObject, TrackedJson } from "../engine/model.ts";
import { defineStep } from "../engine/step.ts";
import {
  packageManagerExecWithCwd,
  packageManagerRun,
  quoteArg,
} from "../utils/packageManager.ts";
import { runOxlintOnlyCodemods } from "./lintCodemods.ts";
import {
  getAppIgnorePaths,
  getAppSettings,
  getLibSettings,
  getMonorepoSettings,
  getProjectKind,
  hasReact as pkgHasReact,
} from "./settings.ts";

/** The options the orchestrators gave to pob:common:format-lint */
interface LintOptions {
  monorepo: boolean;
  isApp: boolean;
  /** undefined: detected from the babel envs */
  babel: boolean | undefined;
  documentation: boolean;
  typescript: boolean;
  build: boolean;
  storybook: boolean;
  storybookReactNative: boolean;
  workspacesHaveReact: boolean;
  appTypes: string[] | undefined;
  rootIgnorePaths: string[];
  ignorePaths: string[];
  srcDirectory: string;
  buildDirectory: string;
}

const getLintOptions = (ctx: PackageContext): LintOptions => {
  const defaults = {
    monorepo: false,
    isApp: false,
    babel: undefined,
    storybook: false,
    storybookReactNative: false,
    workspacesHaveReact: false,
    appTypes: undefined,
    rootIgnorePaths: [],
    ignorePaths: [],
    srcDirectory: "src",
    buildDirectory: "dist",
  };
  switch (getProjectKind(ctx)) {
    case "lib": {
      const settings = getLibSettings(ctx.config);
      return {
        ...defaults,
        typescript: settings.withTypescript,
        build: settings.withTypescript,
        documentation: settings.documentation || settings.codecov,
        ignorePaths:
          settings.withBabel || settings.withTypescript ? ["/dist"] : [],
      };
    }
    case "app": {
      const settings = getAppSettings(ctx.config);
      return {
        ...defaults,
        isApp: true,
        babel: settings.babel,
        documentation: false,
        storybookReactNative: !!settings.app.storybook,
        typescript: settings.typescript,
        build: ctx.config.build?.typescript === true || settings.babel,
        rootIgnorePaths: getAppIgnorePaths(
          settings.app,
          ctx.initial.readJson("package.json"),
        ),
        srcDirectory: settings.srcDirectory,
        buildDirectory: settings.app.type === "expo" ? ".expo" : "build",
      };
    }
    case "monorepo": {
      const settings = getMonorepoSettings(ctx);
      const { monorepo, packages } = settings;
      const isLibWithEnvs = (
        config: (typeof packages)[number]["config"],
      ): boolean =>
        config?.project.type === "lib" &&
        ((config.build?.babelEnvs as BuildEnv[] | undefined)?.length ?? 0) +
          (config.build?.envs?.length ?? 0) >
          0;
      const hasAlpNode = packages.some(
        ({ config }) =>
          config?.project.type === "app" && config.app?.type === "alp-node",
      );
      if (
        packages.some(
          ({ pkg }) =>
            !!(pkg.dependencies as JsonObject | undefined)?.tamagui ||
            !!(pkg.dependencies as JsonObject | undefined)?.["@tamagui/core"],
        )
      ) {
        throw new Error(
          "Tamagui is no longer supported. Please migrate to native-wind.",
        );
      }
      return {
        ...defaults,
        monorepo: true,
        documentation: !!monorepo.documentation,
        storybook: !!monorepo.storybook,
        storybookReactNative: !!monorepo.storybookReactNative,
        typescript: !!monorepo.typescript,
        build: settings.hasRootBuild,
        appTypes: settings.appTypes,
        workspacesHaveReact: packages.some(({ pkg }) => pkgHasReact(pkg)),
        ignorePaths: [
          packages.some(({ config }) => isLibWithEnvs(config)) && "/dist",
          hasAlpNode && "/build",
          hasAlpNode && "/data",
        ].filter((value): value is string => !!value),
        rootIgnorePaths: settings.rootIgnorePaths,
      };
    }
    default:
      throw new Error("Unknown project kind");
  }
};

/** from this major, eslint no longer runs the rules checked by oxlint */
const OXLINT_ONLY_ESLINT_CONFIG_MAJOR = 68;

const isBeforeOxlintOnlyEslintConfig = (range: unknown): boolean => {
  if (typeof range !== "string" || !semver.validRange(range)) return false;
  const minVersion = semver.minVersion(range);
  return (
    minVersion !== null && minVersion.major < OXLINT_ONLY_ESLINT_CONFIG_MAJOR
  );
};

/**
 * same as the base ignores of @pob/eslint-config: ignorePatterns are not
 * inherited through "extends"
 */
const oxlintBaseIgnorePatterns = [
  ".yarn",
  "**/dist/",
  "**/build/",
  "**/coverage/",
  "**/.next/",
  "**/.tamagui/",
  "**/.expo/",
  "**/*.d.ts",
];

interface EslintConfig {
  imports: string[];
  flatCascade: string[];
}

const renderEslintConfig = async (
  eslintConfigPath: string,
  { imports, flatCascade }: EslintConfig,
): Promise<string> => {
  const { code } = await format(
    eslintConfigPath,
    `${imports.map((value) => `${value};\n`).join("")}
export default [
${flatCascade.map((value) => `  ${value},\n`).join("")}];
`,
    { printWidth: 80 },
  );
  return code;
};

const escapeXml = (value: string): string =>
  value.replaceAll(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&#34;";
      default:
        return "&#39;";
    }
  });

interface OxfmtrcOptions {
  documentation: boolean;
  packageManager: string;
  yarnNodeLinker: string | undefined;
  inRoot: boolean;
  rootIgnorePatterns: string[];
  ignorePatterns: string[];
  workspaces: string[] | undefined;
}

export const renderOxfmtrc = (options: OxfmtrcOptions): string => {
  const patterns = [
    ...(options.documentation ? ["/generated-docs"] : []),
    ...(options.packageManager === "yarn" && options.inRoot
      ? [
          "/.yarnrc.yml",
          "/.yarn/**/*",
          ...(options.yarnNodeLinker === "pnp" ? ["/.pnp.*"] : []),
        ]
      : []),
    ...options.rootIgnorePatterns,
    ...(options.workspaces
      ? options.workspaces.flatMap((workspace) =>
          options.ignorePatterns.map((pattern) =>
            pattern.startsWith("*") ? pattern : `/${workspace}${pattern}`,
          ),
        )
      : options.ignorePatterns),
    "CHANGELOG.md",
  ];
  return `// Generated by pob: do not edit, it is overwritten on each pob run.
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 80,
  "sortPackageJson": { "sortScripts": true },
  "ignorePatterns": [
${patterns.map((pattern) => `    "${escapeXml(pattern)}",\n`).join("")}  ],
}
`;
};

const serializeFormattedJson = (model: TrackedJson): string =>
  JSON.stringify(model.snapshot(), null, 2);

const pobOxlintConfigPath = (name: string): string =>
  `./node_modules/@pob/eslint-config/oxlint/${name}.json`;
const pobReactOxlintConfigPath = (name: string): string =>
  `./node_modules/@pob/eslint-config-typescript-react/oxlint/${name}.json`;

/** format, oxlint and eslint: configs, scripts and dependencies */
export const lintStep = defineStep<PackageContext>({
  name: "lint",
  reads: [
    "pkg.name",
    "pkg.type",
    "pkg.dependencies",
    "pkg.peerDependencies",
    "pkg.workspaces",
  ],
  writes: [
    "pkg.devDependencies",
    "pkg.scripts.lint",
    "pkg.scripts.lint:eslint",
    "pkg.scripts.lint:oxlint",
    "pkg.scripts.format",
    "pkg.scripts.format:check",
    "oxlintrc.extends",
    "oxlintrc.ignorePatterns",
    "files:.oxfmtrc.jsonc",
    "files:.oxlintrc.json",
    "files:eslint.config.js",
    "files:eslint.config.mjs",
  ],
  async run(ctx) {
    const options = getLintOptions(ctx);
    const { pkg, facts } = ctx;
    const packageManager = facts.packageManager;
    const name = pkg.get<string>("name") ?? "";
    const type = pkg.get<string>("type");
    const dependencies = pkg.get<JsonObject>("dependencies");
    const peerDependencies = pkg.get<JsonObject>("peerDependencies");
    const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};

    const isMonorepoRoot = facts.isMonorepoRoot;
    const inMonorepoPackage = !!facts.inMonorepo;
    const inRootOrStandalone = !inMonorepoPackage;
    const rootConfig = isMonorepoRoot
      ? ctx.config
      : facts.inMonorepo?.rootConfig;
    const monorepoConfig = rootConfig?.monorepo;
    // the yeoman generator only knew the root project config in a monorepo
    const rootPackageManager = rootConfig?.project.packageManager;
    const rootYarnNodeLinker = rootConfig?.project.yarnNodeLinker;
    const rootProjectType = rootConfig?.project.type;

    if (
      inRootOrStandalone &&
      isBeforeOxlintOnlyEslintConfig(
        (initialPkg.devDependencies as JsonObject | undefined)?.[
          "@pob/eslint-config"
        ],
      )
    ) {
      ctx.effects.add({
        id: "codemods:oxlint-only",
        reason:
          "@pob/eslint-config 68: eslint-disable comments of rules checked by oxlint are rewritten",
        after: ["install"],
        mayModify: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "eslint.config.js"],
        run: ({ cwd }) => runOxlintOnlyCodemods(cwd),
      });
    }

    const babelEnvs = getLibSettings(ctx.config).babelEnvs;
    const useBabel =
      options.babel !== undefined ? options.babel : babelEnvs.length > 0;
    const useTypescript = options.typescript;
    const hasReact =
      useTypescript &&
      (!!dependencies?.react ||
        !!peerDependencies?.react ||
        (isMonorepoRoot && options.workspacesHaveReact));
    const useAppConfig = hasReact && options.isApp;
    const useNode = !useBabel || babelEnvs.some((env) => env.target === "node");

    if (inRootOrStandalone) {
      const rootIgnorePatterns = new Set(options.rootIgnorePaths);
      if (options.storybookReactNative) {
        // regenerated by metro on each start (sb-rn-get-stories)
        rootIgnorePatterns.add("**/storybook.requires.ts");
      }
      const ignorePatterns = new Set(options.ignorePaths);
      for (const appType of options.appTypes ?? []) {
        for (const ignorePath of getAppIgnorePaths(
          { type: appType as never },
          undefined,
        )) {
          if (!ignorePath.startsWith("#")) ignorePatterns.add(ignorePath);
        }
      }
      ctx.output.owned(
        ".oxfmtrc.jsonc",
        renderOxfmtrc({
          inRoot: true,
          documentation: options.documentation,
          packageManager,
          yarnNodeLinker: facts.yarnNodeLinker,
          workspaces: pkg.get<string[]>("workspaces"),
          rootIgnorePatterns: [...rootIgnorePatterns],
          ignorePatterns: [...ignorePatterns],
        }),
        { format: "oxfmt" },
      );
    } else {
      ctx.output.removed(".oxfmtrc.jsonc");
    }

    const globalEslint =
      options.monorepo || (!!monorepoConfig && monorepoConfig.eslint !== false);
    const composite = !!monorepoConfig?.typescript;
    const shouldHavePluginsDependencies =
      rootPackageManager === "yarn" && rootYarnNodeLinker !== "node-modules";

    if (options.monorepo && !globalEslint) {
      throw new Error("Please enable global eslint");
    }

    if (globalEslint && !isMonorepoRoot) {
      if (
        !name.startsWith("@pob/eslint-config") &&
        !name.startsWith("@pob/eslint-plugin")
      ) {
        pkg.removeDevDependencies(
          [
            "eslint",
            "prettier",
            "@pob/eslint-config",
            "@pob/eslint-config-typescript",
            "@pob/eslint-config-typescript-react",
            "@pob/eslint-config-react",
            "@typescript-eslint/eslint-plugin",
            "@typescript-eslint/parser",
            "eslint-plugin-node",
            "eslint-plugin-unicorn",
            "eslint-plugin-import",
          ],
          true,
        );
      }
    } else {
      if (name !== "pob-monorepo" && name !== "pob") {
        pkg.removeDevDependencies(["oxfmt"]);
      }
      pkg.addOrRemoveDevDependencies(
        !globalEslint ||
          isMonorepoRoot ||
          rootProjectType === "app" ||
          shouldHavePluginsDependencies ||
          !!peerDependencies?.eslint,
        ["eslint"],
      );

      if (
        !name.startsWith("eslint-config") &&
        !name.startsWith("@pob/eslint-config") &&
        name !== "@pob/use-eslint-plugin"
      ) {
        pkg.addDevDependencies(["@pob/eslint-config"]);
        // eslint plugins are dependencies of @pob/eslint-config, loaded by
        // the flat config
        pkg.removeDevDependencies([
          "eslint-plugin-import",
          "eslint-plugin-node",
          "eslint-plugin-unicorn",
          "@typescript-eslint/eslint-plugin",
        ]);

        if (isMonorepoRoot) {
          if (hasReact) {
            pkg.addDevDependencies(["@pob/eslint-config-typescript-react"]);
          } else if (options.typescript) {
            pkg.updateDevDependenciesIfPresent([
              "@pob/eslint-config-typescript-react",
            ]);
          } else if (name !== "@pob/eslint-config-monorepo") {
            pkg.removeDevDependencies(["@pob/eslint-config-typescript-react"]);
          }
          // import-x loads the TypeScript parser by name, from the project
          // with yarn PnP
          pkg.addOrRemoveDevDependencies(
            options.typescript && shouldHavePluginsDependencies,
            ["@typescript-eslint/parser"],
          );
        } else {
          pkg.addOrRemoveDevDependencies(
            useTypescript && shouldHavePluginsDependencies,
            ["@typescript-eslint/parser"],
          );
          pkg.addOrRemoveDevDependencies(hasReact, [
            "@pob/eslint-config-typescript-react",
          ]);
        }
      }
    }

    /**
     * @param legacy the output of pob before @pob/eslint-config 68, to
     *   update it
     */
    const getEslintConfig = (
      withReact: boolean,
      legacy = false,
    ): EslintConfig => {
      if (name === "@pob/eslint-config-monorepo") {
        return {
          imports: [
            'import pobConfig from "@pob/eslint-config"',
            'import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react"',
          ],
          flatCascade: [],
        };
      }
      const commonjsSuffix = type === "commonjs" ? "Commonjs" : "Module";
      const flatCascade = ((): (string | false | undefined)[] => {
        if (!useTypescript && legacy) {
          return [
            useNode
              ? `...pobConfig.configs.node${commonjsSuffix}`
              : `...pobConfig.configs.base${commonjsSuffix}`,
          ];
        }
        // configs.node and configs.baseModule handle "type": "commonjs"
        if (!useTypescript || !withReact) {
          return [
            useNode
              ? "...pobConfig.configs.node"
              : `...pobConfig.configs.${legacy ? "base" : "baseModule"}`,
          ];
        }
        return [
          useNode
            ? "...pobTypescriptConfigReact.configs.node"
            : "...pobTypescriptConfigReact.configs.base",
          legacy && options.isApp && "...pobConfig.configs.app",
          !!dependencies?.["react-native-web"] &&
            '...pobTypescriptConfigReact.configs["react-native-web"]',
        ];
      })().filter((value): value is string => !!value);

      // non-published typescript is type-checked against tsconfig.tools.json:
      // the monorepo root and single repos own it
      if ((isMonorepoRoot || !inMonorepoPackage) && useTypescript) {
        flatCascade.push("...pobConfig.configs.toolsProject");
      }

      return {
        imports: [
          'import pobConfig from "@pob/eslint-config"',
          useTypescript &&
            withReact &&
            'import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react"',
        ].filter((value): value is string => !!value),
        flatCascade,
      };
    };

    const eslintConfigFile =
      type === "commonjs" ? "eslint.config.mjs" : "eslint.config.js";
    const invalidEslintConfigFile =
      type === "commonjs" ? "eslint.config.js" : "eslint.config.mjs";
    ctx.output.removed(invalidEslintConfigFile);

    if (inRootOrStandalone) {
      const getRootIgnorePatterns = (): Set<string> => {
        const ignorePatterns = new Set<string>();
        if (isMonorepoRoot && options.documentation) {
          ignorePatterns.add("/generated-docs");
        }
        if (!isMonorepoRoot && useTypescript) {
          const buildPath = `/${options.buildDirectory}`;
          if (!options.rootIgnorePaths.includes(buildPath)) {
            ignorePatterns.add(buildPath);
          }
        }
        if (isMonorepoRoot && options.build) {
          ignorePatterns.add("/rollup.config.mjs");
        }
        if (options.storybook) ignorePatterns.add("**/storybook-static/");
        if (options.storybookReactNative) {
          ignorePatterns.add("**/.rnstorybook/");
          // generated in .storybook/ by sb-rn-get-stories
          ignorePatterns.add("**/storybook.requires.ts");
        }
        if (ctx.initial.exists(".design-sync/config.json")) {
          ignorePatterns.add("/.design-sync/");
          ignorePatterns.add("/.ds-sync/");
          ignorePatterns.add("/ds-bundle/");
        }
        for (const ignorePath of options.rootIgnorePaths) {
          if (!ignorePath.startsWith("#")) ignorePatterns.add(ignorePath);
        }
        return ignorePatterns;
      };

      const eslintConfigPath = path.join(ctx.dir, eslintConfigFile);
      const eslintConfigContent = await renderEslintConfig(
        eslintConfigPath,
        getEslintConfig(hasReact),
      );
      const previousConfigs = [false, true].flatMap((legacy) => {
        const configs: EslintConfig[] = [getEslintConfig(!hasReact, legacy)];
        if (legacy) configs.push(getEslintConfig(hasReact, legacy));
        // before the react configs were used when react is detected
        if (hasReact) {
          const config = getEslintConfig(hasReact, legacy);
          configs.push({
            ...config,
            flatCascade: config.flatCascade.map((value) =>
              value.replace(
                /^\.\.\.pobTypescriptConfigReact\.configs\.(node|base)$/,
                "...pobConfig.configs.$1",
              ),
            ),
          });
        }
        return configs;
      });
      const previousContents = await Promise.all(
        previousConfigs.map((config) =>
          renderEslintConfig(eslintConfigPath, config),
        ),
      );
      const currentEslintConfig = ctx.initial.read(eslintConfigFile);
      ctx.output.ownedIfPristine(
        eslintConfigFile,
        eslintConfigContent,
        previousContents,
        {
          warning:
            hasReact &&
            currentEslintConfig !== undefined &&
            !currentEslintConfig.includes("@pob/eslint-config-typescript-react")
              ? `${eslintConfigFile} was edited by hand and is not updated: use the configs of @pob/eslint-config-typescript-react to lint react`
              : undefined,
        },
      );

      // keeps existing options, only enforces the shared config and ignores.
      // ignorePatterns are fully owned: merging with existing ones would never
      // remove stale patterns
      const oxlintrc = ctx.model("oxlintrc", ".oxlintrc.json");
      const oxlintExtends = oxlintrc.get<string[]>("extends") ?? [];
      oxlintrc.set(
        "extends",
        [
          pobOxlintConfigPath("base"),
          // ES module rules, not for .js files of "type": "commonjs" packages
          (useTypescript || type !== "commonjs") &&
            pobOxlintConfigPath("module"),
          useNode && pobOxlintConfigPath("node"),
          // .js files of "type": "commonjs" packages, after node.json
          useNode &&
            !useTypescript &&
            type === "commonjs" &&
            pobOxlintConfigPath("commonjs"),
          // type-aware rules: oxlint fails without tsgolint, even in a
          // project without TypeScript files
          useTypescript && pobOxlintConfigPath("typescript"),
          // overrides of typescript.json. Only app is known here: the others
          // are kept when added by hand.
          ...(useTypescript
            ? [
                "app",
                "allow-implicit-return-type",
                "allow-unsafe",
                "allow-unsafe-as-warn",
              ]
                .filter(
                  (configName) =>
                    (configName === "app" && useAppConfig) ||
                    oxlintExtends.includes(pobOxlintConfigPath(configName)),
                )
                .map(pobOxlintConfigPath)
            : []),
          // after module.json and node.json: they override import/extensions.
          // react-native.json is kept when added by hand.
          ...(hasReact
            ? ["react", "react-native", "react-native-web"]
                .filter(
                  (configName) =>
                    configName === "react" ||
                    (configName === "react-native-web" &&
                      !!dependencies?.["react-native-web"]) ||
                    oxlintExtends.includes(
                      pobReactOxlintConfigPath(configName),
                    ),
                )
                .map(pobReactOxlintConfigPath)
            : []),
          ...oxlintExtends.filter(
            (value) =>
              !value.includes("@pob/eslint-config/") &&
              !value.includes("@pob/eslint-config-typescript-react/"),
          ),
        ].filter((value): value is string => !!value),
      );
      oxlintrc.set("ignorePatterns", [
        ...new Set([...oxlintBaseIgnorePatterns, ...getRootIgnorePatterns()]),
      ]);
      ctx.output.merged(".oxlintrc.json", oxlintrc, serializeFormattedJson, {
        format: "oxfmt",
        always: true,
      });
    } else {
      ctx.output.removed(eslintConfigFile);
      ctx.output.removed(".oxlintrc.json");
    }

    if (!isMonorepoRoot) {
      const args = "--quiet";
      const relativeFromRoot = path.relative(
        path.resolve(ctx.dir, "../.."),
        ctx.dir,
      );
      const lint = `${packageManagerRun(packageManager, "lint:oxlint")} && ${
        useTypescript && !composite ? "tsrs && " : ""
      }${packageManagerRun(packageManager, "lint:eslint")}`;
      pkg.addScripts({
        "lint:eslint": globalEslint
          ? `${packageManagerExecWithCwd(packageManager, "../..", "eslint")} ${args} ${quoteArg(relativeFromRoot)}`
          : `eslint ${args} .`,
        "lint:oxlint": globalEslint
          ? `${packageManagerExecWithCwd(packageManager, "../..", "oxlint")} ${args} ${quoteArg(relativeFromRoot)}`
          : `oxlint ${args}`,
        lint: inMonorepoPackage
          ? lint
          : `${packageManager} run format && ${lint}`,
      });

      if (inMonorepoPackage) {
        pkg.removeScripts(["format", "format:check"]);
      } else {
        pkg.addScripts({ format: "oxfmt", "format:check": "oxfmt --check ." });
      }
    }
  },
});
