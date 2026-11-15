import fs, { globSync } from "node:fs";
import path from "node:path";

export interface WorkspacePackage {
  /** relative to the monorepo root, posix */
  location: string;
  name: string | undefined;
  pkg: Record<string, unknown>;
}

const dependencyTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;

const npmNameFromDependency = (key: string, value: string): string => {
  if (!value.startsWith("npm:")) return key;
  const target = value.slice("npm:".length);
  if (!target.startsWith("@")) return target.split("@", 1)[0] ?? key;
  const [name = ""] = target.slice(1).split("@", 1);
  return `@${name}`;
};

export const getWorkspaceGlobs = (
  rootPkg: Record<string, unknown>,
): string[] => {
  const workspaces = rootPkg.workspaces;
  if (Array.isArray(workspaces)) return workspaces as string[];
  if (workspaces && typeof workspaces === "object") {
    return (workspaces as { packages?: string[] }).packages ?? [];
  }
  return [];
};

/**
 * Packages of a monorepo, in topological order of their dependencies, sorted
 * by name inside each batch: the order of the yeoman monorepo generator.
 */
export const discoverWorkspacePackages = (
  rootDir: string,
  rootPkg: Record<string, unknown>,
): WorkspacePackage[] => {
  const found = new Set<string>();
  const packages: WorkspacePackage[] = [];
  for (const workspaceGlob of getWorkspaceGlobs(rootPkg)) {
    for (const match of globSync(
      path.posix.join(workspaceGlob, "package.json"),
      {
        cwd: rootDir,
      },
    )) {
      if (found.has(match)) continue;
      found.add(match);
      const pkg = JSON.parse(
        fs.readFileSync(path.join(rootDir, match), "utf8"),
      ) as Record<string, unknown>;
      packages.push({
        location: path.posix.dirname(match.split(path.sep).join("/")),
        name: pkg.name as string | undefined,
        pkg,
      });
    }
  }

  const byName = new Map(
    packages
      .filter((workspacePackage) => workspacePackage.name)
      .map((workspacePackage) => [workspacePackage.name, workspacePackage]),
  );
  const dependencies = new Map(
    packages.map((workspacePackage) => {
      const names = new Set<WorkspacePackage>();
      for (const type of dependencyTypes) {
        const deps = (workspacePackage.pkg[type] ?? {}) as Record<
          string,
          unknown
        >;
        for (const [key, value] of Object.entries(deps)) {
          if (!value) continue;
          const dependency = byName.get(
            npmNameFromDependency(key, typeof value === "string" ? value : ""),
          );
          if (dependency) names.add(dependency);
        }
      }
      return [workspacePackage, names];
    }),
  );

  const ordered: WorkspacePackage[] = [];
  const added = new Set<WorkspacePackage>();
  const toAdd = new Set(packages);
  while (toAdd.size > 0) {
    const batch = [...toAdd].filter((workspacePackage) =>
      [...(dependencies.get(workspacePackage) ?? [])].every((dependency) =>
        added.has(dependency),
      ),
    );
    if (batch.length === 0) throw new Error("Circular dependency detected");
    batch.sort((a, b) =>
      (a.name ?? path.posix.basename(a.location)).localeCompare(
        b.name ?? path.posix.basename(b.location),
        "en",
      ),
    );
    for (const workspacePackage of batch) {
      added.add(workspacePackage);
      toAdd.delete(workspacePackage);
      ordered.push(workspacePackage);
    }
  }
  return ordered;
};
