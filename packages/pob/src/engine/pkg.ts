import sortObject from "@pob/sort-object";
import sortPkg from "@pob/sort-pkg";
import semver from "semver";
import type { JsonObject, PathInput, TrackedJson } from "./model.ts";
import { createTrackedJson } from "./model.ts";
import type { Tracker } from "./tracker.ts";
import type { DependencyVersions } from "./versions.ts";

type DependencyType =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "dependenciesMeta";

type Name = string | false | null | undefined;

export interface ScriptChain {
  /**
   * @param id unique in the chain, for ordering and provenance
   * @param options.after ids of the commands this one runs after
   */
  add: (
    id: string,
    command: string,
    options?: { after?: readonly string[] },
  ) => void;
}

interface ChainEntry {
  id: string;
  command: string;
  after: readonly string[];
}

const joinChain = (entries: readonly ChainEntry[]): string => {
  const ids = new Set(entries.map((entry) => entry.id));
  const ordered: ChainEntry[] = [];
  const done = new Set<string>();
  while (ordered.length < entries.length) {
    const next = entries.find(
      (entry) =>
        !done.has(entry.id) &&
        entry.after.every((id) => !ids.has(id) || done.has(id)),
    );
    if (!next) throw new Error("Cycle in script chain");
    ordered.push(next);
    done.add(next.id);
  }
  return ordered.map((entry) => entry.command).join(" && ");
};

/**
 * package.json. Same semantics as the helpers of the yeoman generators
 * (`lib/utils/package.js`): a dependency is only upgraded, never downgraded,
 * and a devDependency also listed in dependencies is removed.
 */
export interface PkgModel extends TrackedJson {
  addDependencies: (names: Name[], prefix?: string) => void;
  addDevDependencies: (names: Name[]) => void;
  removeDependencies: (names: Name[]) => void;
  removeDevDependencies: (
    names: Name[],
    forceEvenIfInPeerDep?: boolean,
  ) => void;
  removeDevAndNotDevDependencies: (
    names: Name[],
    forceEvenIfInPeerDep?: boolean,
  ) => void;
  addOrRemoveDependencies: (
    condition: unknown,
    names: Name[],
    prefix?: string,
  ) => void;
  addOrRemoveDevDependencies: (condition: unknown, names: Name[]) => void;
  updateDevDependenciesIfPresent: (names: Name[]) => void;
  addDependenciesMeta: (meta: JsonObject) => void;
  removeDependenciesMeta: (keys: string[]) => void;
  addScripts: (scripts: Record<string, unknown>) => void;
  removeScripts: (keys: Name[]) => void;
  addOrRemoveScripts: (
    condition: unknown,
    scripts: Record<string, unknown>,
  ) => void;
  /**
   * A script made of commands joined with ` && `, contributed by several
   * steps: `chain("build").add("definitions", "tsrs", { after: ["rollup"] })`
   */
  chain: (script: string) => ScriptChain;
  /** package.json content, sorted like pob:core:sort-package */
  render: () => JsonObject;
}

const cleanVersion = (version: string): string =>
  version.replace(/^(\^|~)/, "");

const isWorkspaceRange = (version: string | undefined): boolean =>
  version === "workspace:*" ||
  version === "workspace:^" ||
  version === "workspace:~";

const isName = (name: Name): name is string => Boolean(name);

export const createPkgModel = (
  initial: JsonObject,
  tracker: Tracker,
  versions: DependencyVersions,
): PkgModel => {
  const model = createTrackedJson("pkg", initial, tracker);
  /** objects added to: sorted when rendering, like internalAddToObject */
  const sortedContainers = new Set<string>();
  // the initial name: whether pob manages a package is not decided by a step
  const packageName = initial.name as string | undefined;

  /**
   * A dependency of the package, read key by key: a checked read, declared in
   * the reads (or writes) of the step, so that the steps writing it run before.
   */
  const getDependency = (key: string, name: string): string | undefined =>
    model.get<string>([key, name]);

  const removeFromObject = (key: string, keys: string[]): void => {
    for (const name of keys) {
      model.delete([key, name]);
    }
  };

  const removeDependencies = (type: DependencyType, names: string[]): void => {
    if (packageName === "pob-dependencies") return;
    removeFromObject(type, names);
  };

  const addToObject = (key: string, values: Record<string, unknown>): void => {
    sortedContainers.add(key);
    for (const [name, value] of Object.entries(values)) {
      model.set([key, name], value);
    }
  };

  const getVersion = (dependency: string): string => {
    const version = versions(dependency);
    if (!version) throw new Error(`Missing pobDependency: ${dependency}`);
    return version;
  };

  const addDependencies = (
    type: "dependencies" | "devDependencies",
    names: Name[],
    cleaned: boolean,
    prefix?: string,
  ): void => {
    const toRemove: string[] = [];
    const toCheck: string[] = [];
    for (const name of names.filter(isName)) {
      if (
        packageName === name ||
        (type === "devDependencies" && getDependency("dependencies", name))
      ) {
        toRemove.push(name);
      } else {
        toCheck.push(name);
      }
    }

    const filtered: Record<string, string> = {};
    for (const dependency of toCheck) {
      const potentialNewVersion = getVersion(dependency);
      const currentVersion = getDependency(type, dependency);
      const potentialNewVersionCleaned = cleanVersion(potentialNewVersion);
      const newVersion = cleaned
        ? `${prefix ?? ""}${potentialNewVersionCleaned}`
        : potentialNewVersion;
      try {
        if (isWorkspaceRange(currentVersion)) {
          // the package is in the monorepo
        } else if (
          !currentVersion ||
          semver.gt(potentialNewVersionCleaned, cleanVersion(currentVersion))
        ) {
          filtered[dependency] = newVersion;
        } else if (
          potentialNewVersionCleaned === cleanVersion(currentVersion)
        ) {
          filtered[dependency] = newVersion;
        } else if (potentialNewVersion !== currentVersion) {
          console.warn(
            `dependency "${dependency}" has a higher version: expected ${potentialNewVersion}, actual: ${currentVersion}.`,
          );
        }
      } catch {
        filtered[dependency] = newVersion;
      }
    }

    if (toRemove.length > 0) removeDependencies(type, toRemove);
    addToObject(type, filtered);
  };

  const removeDevDependencies = (
    names: Name[],
    forceEvenIfInPeerDep?: boolean,
  ): void => {
    const filtered = names.filter(isName);
    removeDependencies(
      "devDependencies",
      forceEvenIfInPeerDep
        ? filtered
        : filtered.filter((name) => !getDependency("peerDependencies", name)),
    );
  };

  const chains = new Map<string, ChainEntry[]>();
  const chain = (script: string): ScriptChain => ({
    add: (id, command, options) => {
      tracker.record(["pkg", "scripts", script, "\0chain", id], command);
      const entries = chains.get(script) ?? [];
      const existing = entries.findIndex((entry) => entry.id === id);
      const entry = { id, command, after: options?.after ?? [] };
      if (existing === -1) entries.push(entry);
      else entries[existing] = entry;
      chains.set(script, entries);
      sortedContainers.add("scripts");
      model.writeComputed(["scripts", script], joinChain(entries));
    },
  });

  const pkg: PkgModel = {
    ...model,
    get name() {
      return model.name;
    },
    get touched() {
      return model.touched;
    },
    get: <T>(path: PathInput) => model.get<T>(path),
    addDependencies: (names, prefix) => {
      addDependencies("dependencies", names, !!prefix, prefix);
    },
    addDevDependencies: (names) => {
      addDependencies("devDependencies", names, true);
    },
    removeDependencies: (names) => {
      removeDependencies("dependencies", names.filter(isName));
    },
    removeDevDependencies,
    removeDevAndNotDevDependencies: (names, forceEvenIfInPeerDep) => {
      removeDevDependencies(names, forceEvenIfInPeerDep);
      removeDependencies("dependencies", names.filter(isName));
    },
    addOrRemoveDependencies: (condition, names, prefix) => {
      if (condition) addDependencies("dependencies", names, !!prefix, prefix);
      else removeDependencies("dependencies", names.filter(isName));
    },
    addOrRemoveDevDependencies: (condition, names) => {
      if (condition) addDependencies("devDependencies", names, true);
      else removeDevDependencies(names);
    },
    updateDevDependenciesIfPresent: (names) => {
      addDependencies(
        "devDependencies",
        names.filter(
          (name) => isName(name) && getDependency("devDependencies", name),
        ),
        true,
      );
    },
    chain,
    addDependenciesMeta: (meta) => {
      addToObject("dependenciesMeta", meta);
    },
    removeDependenciesMeta: (keys) => {
      removeFromObject("dependenciesMeta", keys);
    },
    addScripts: (scripts) => {
      addToObject("scripts", scripts);
    },
    removeScripts: (keys) => {
      removeFromObject("scripts", keys.filter(isName));
    },
    addOrRemoveScripts: (condition, scripts) => {
      if (condition) addToObject("scripts", scripts);
      else removeFromObject("scripts", Object.keys(scripts));
    },
    render: () => {
      const document = model.snapshot();
      for (const key of sortedContainers) {
        const value = document[key];
        if (value && typeof value === "object") sortObject(value);
      }
      return sortPkg(document);
    },
  };
  return pkg;
};
