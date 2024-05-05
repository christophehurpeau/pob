import { readFileSync } from "node:fs";
import path from "node:path";
import { nodeFormatToExt, resolveEntry } from "@pob/rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import configExternalDependencies from "rollup-config-external-dependencies";
import esbuild from "rollup-plugin-esbuild";

export default function createRollupConfig({
  cwd = process.cwd(),
  outDirectory = "dist",
  pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"))),
  plugins = [],
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
    const extensions = [".ts", jsx && ".tsx", ".json"].filter(Boolean);
    const preferConst = true;

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
        generatedCode: {
          constBindings: preferConst,
        },
        externalLiveBindings: false,
        freeze: false,
      })),
      external: externalByPackageJson,
      plugins: [
        esbuild({
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

        ...plugins,
      ].filter(Boolean),
    };
  };

  return pobConfig.entries.flatMap((entry) => {
    const entryName = typeof entry === "string" ? entry : entry.name;
    const envs = entry.envs ||
      pobConfig.envs || [
        {
          target: "node",
          version: "18",
        },
      ];
    const entryPath = resolveEntry(cwd, entryName);
    return envs.map((env) => createConfigForEnv(entryName, entryPath, env));
  });
}
