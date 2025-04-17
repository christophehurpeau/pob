import { readFileSync } from "node:fs";
import path from "node:path";
import { nodeFormatToExt, resolveEntry } from "@pob/rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import configExternalDependencies from "rollup-config-external-dependencies";
import esbuild from "rollup-plugin-esbuild";

export default function createRollupConfig({
  cwd = process.cwd(),
  outDirectory = "dist",
  pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"))),
  plugins = [],
  getExtensions = (extensions, { target }) => {
    if (target === "browser") {
      return extensions.flatMap((ext) => [`.web${ext}`, `${ext}`]);
    }
    return extensions;
  },
}) {
  const pobConfig = pkg.pob;

  if (pobConfig.babelEnvs) {
    throw new Error(
      "@pob/rollup-esbuild does not supports babel, use `pob-babel` package instead.",
    );
  }

  const jsx = pobConfig.jsx;
  const externalByPackageJson = configExternalDependencies(pkg);

  const createConfigForEnv = (entry, entryPath, env) => {
    const extensions = getExtensions(
      [".ts", jsx && ".tsx", ".json"],
      env,
    ).filter(Boolean);

    return {
      input: entryPath,
      output: (env.formats || ["es"]).map((format) => ({
        file: path.relative(
          process.cwd(),
          path.join(
            cwd,
            `${outDirectory}/${entry}-${env.target}${
              env.omitVersionInFileName ? "" : env.version || ""
            }${
              env.target === "node"
                ? nodeFormatToExt(format, pkg.type)
                : `.${format}.js`
            }`,
          ),
        ),
        format,
        sourcemap: true,
        exports: "named",
        generatedCode: { preset: "es2015" },
        externalLiveBindings: false,
        freeze: false,
      })),
      onwarn(warning, warn) {
        // throw on certain warnings
        if (
          warning.code === "NON_EXISTENT_EXPORT" ||
          warning.code === "UNUSED_EXTERNAL_IMPORT" ||
          warning.code === "UNRESOLVED_IMPORT"
        ) {
          throw new Error(warning.message);
        }

        // Use default for everything else
        warn(warning);
      },

      external: externalByPackageJson,
      plugins: [
        esbuild({
          loaders: {
            // https://github.com/egoist/rollup-plugin-esbuild/issues/384
            js: false,
            jsx: false,
            ts: false,
            tsx: false,
            ...Object.fromEntries(
              extensions.map((ext) => [
                ext,
                path.extname(`filename${ext}`).slice(1),
              ]),
            ),
          },
          sourceMap: true,
          minify: false,
          tsconfig: path.resolve(cwd, env.tsconfig || "tsconfig.json"),
          target: env.target === "node" ? `node${env.version}` : undefined,
        }),

        nodeResolve({
          extensions,
          customResolveOptions: {
            moduleDirectories: ["src"], // don't resolve node_modules, but allow src (see baseUrl in tsconfig)
          },
        }),
        ...(() => {
          if (env.target === "browser") {
            return [
              replace({
                preventAssignment: true,
                delimiters: ['"', '"'],
                "react-native": '"react-native-web"',
              }),
            ];
          }

          return [];
        })(),

        ...(typeof plugins === "function" ? plugins(env) : plugins),
      ].filter(Boolean),
    };
  };

  return pobConfig.entries.flatMap((entry) => {
    const entryName = typeof entry === "string" ? entry : entry.name;
    const envs = entry.envs ||
      pobConfig.envs || [
        {
          target: "node",
          version: "20",
        },
      ];
    const entryPath = resolveEntry(cwd, entryName);
    return envs.map((env) => createConfigForEnv(entryName, entryPath, env));
  });
}
