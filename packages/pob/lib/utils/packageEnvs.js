const defaultEnvs = [{ target: "node", version: "22" }];

/**
 * The envs an entry is built for, resolved like @pob/rollup-esbuild does: the
 * entry's own envs, else the package envs, else node.
 */
export const getEntryEnvs = (entry, packageEnvs) =>
  (typeof entry === "object" && entry.envs) || packageEnvs || defaultEnvs;

const envKey = (env) =>
  JSON.stringify([env.target, env.version ?? null, env.formats ?? null]);

/**
 * The envs a package is built for: its envs, or the union of the envs of its
 * entries when only the entries declare them. Undefined when none is declared.
 */
export const getPackageEnvs = (pob) => {
  if (!pob) return undefined;
  if (pob.babelEnvs || pob.envs) return pob.babelEnvs || pob.envs;

  const entriesEnvs = (pob.entries ?? []).flatMap((entry) =>
    typeof entry === "object" && entry.envs ? entry.envs : [],
  );
  if (entriesEnvs.length === 0) return undefined;

  const envsByKey = new Map(entriesEnvs.map((env) => [envKey(env), env]));
  return [...envsByKey.values()];
};
