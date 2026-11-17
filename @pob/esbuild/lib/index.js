import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import esbuild from "esbuild";

/**
 * The build config of the package: the build key of pob.json, or
 * package.json#pob before pob moved it to pob.json (also when pob.json exists
 * without build: a pob version that did not move it yet).
 */
const readPobBuildConfig = (cwd, pkg) => {
  const pobJsonPath = path.join(cwd, "pob.json");
  const build = existsSync(pobJsonPath)
    ? JSON.parse(readFileSync(pobJsonPath, "utf8")).build
    : undefined;
  return build ?? pkg.pob ?? {};
};

export function createEsbuildOptions({
  cwd = process.cwd(),
  outDirectory = "dist",
  pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8")),
  pobConfig = readPobBuildConfig(cwd, pkg),
  entryPoints = pobConfig.entries,
} = {}) {
  return {
    entryPoints: entryPoints.map((entry) => `src/${entry}`),
    bundle: true,
    platform: "node",
    packages: "external",
    format: "esm",
    outdir: outDirectory,
    outExtension: { ".js": ".mjs" },
    sourcemap: true,
    keepNames: true,
    minifySyntax: true,
  };
}

export async function build(options) {
  await esbuild.build(createEsbuildOptions(options));
}

export async function watch(options) {
  const ctx = await esbuild.context(createEsbuildOptions(options));
  await ctx.watch();
  console.log("Watching for changes...");
  process.on("SIGINT", async () => {
    await ctx.dispose();
    process.exit(0);
  });
}
