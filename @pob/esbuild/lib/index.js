import { readFileSync } from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

export function createEsbuildOptions({
  cwd = process.cwd(),
  outDirectory = 'dist',
  pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'))),
  pobConfig = pkg.pob,
  entryPoints = pobConfig.entries,
} = {}) {
  return {
    entryPoints: entryPoints.map((entry) => `src/${entry}`),
    bundle: true,
    platform: 'node',
    packages: 'external',
    format: 'esm',
    outdir: outDirectory,
    outExtension: { '.js': '.mjs' },
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
  console.log('Watching for changes...');
  process.on('SIGINT', async () => {
    await ctx.dispose();
    process.exit(0);
  });
}
