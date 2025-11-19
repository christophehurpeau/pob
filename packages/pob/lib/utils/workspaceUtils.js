import fs from "node:fs";
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { glob } from "node:fs/promises";
import path from "node:path";
import { PackageDependencyDescriptorUtils } from "./packageDependencyDescriptorUtils.js";

export const getWorkspaceName = (workspace) => {
  if (workspace?.manifest?.raw?.name) return workspace.manifest.raw.name;
  return path.basename(workspace.location) || "unnamed-workspace";
};

export const discoverWorkspaces = async (rootPath) => {
  const rootPackageJSONPath = path.join(rootPath, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPackageJSONPath));

  let workspaceGlobs = [];
  if (Array.isArray(rootPkg.workspaces)) {
    workspaceGlobs = rootPkg.workspaces;
  } else if (typeof rootPkg.workspaces === "object") {
    workspaceGlobs = (rootPkg.workspaces && rootPkg.workspaces.packages) || [];
  }

  const workspaces = [
    {
      name: rootPkg.name,
      location: ".",
      manifest: { raw: rootPkg },
      relativeCwd: { toString: () => "." },
      isRoot: true,
    },
  ];

  const patternPackageJsons = workspaceGlobs.map((g) =>
    path.join(g, "package.json"),
  );
  const found = new Set();
  for (const pattern of patternPackageJsons) {
    for await (const match of glob(pattern, { cwd: rootPath, nodir: true })) {
      if (found.has(match)) continue;
      found.add(match);
      const filePath = path.join(rootPath, match);
      const content = JSON.parse(fs.readFileSync(filePath));
      const dir = path.dirname(match);
      workspaces.push({
        name: content.name,
        location: dir || ".",
        manifest: { raw: content },
        relativeCwd: { toString: () => dir || "." },
      });
    }
  }

  return workspaces;
};

export const buildDependenciesMaps = (workspaces) => {
  const dependenciesMap = new Map();

  const workspacesByName = new Map(
    workspaces.filter((w) => !!w.name).map((w) => [w.name, w]),
  );
  const dependencyTypes = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ];

  for (const dependent of workspaces) {
    for (const set of dependencyTypes) {
      const deps =
        (dependent.manifest.raw && dependent.manifest.raw[set]) || {};
      for (const [dependencyKey, dependencyValue] of Object.entries(deps)) {
        if (!dependencyValue) continue;
        const descriptor = PackageDependencyDescriptorUtils.parse(
          dependencyKey,
          String(dependencyValue),
        );
        const workspace = workspacesByName.get(descriptor.npmName);
        if (!workspace) continue;

        const entries = dependenciesMap.get(dependent) || [];
        entries.push([workspace, set, descriptor]);
        dependenciesMap.set(dependent, entries);
      }
    }
  }

  return dependenciesMap;
};

export const buildTopologicalOrderBatches = (workspaces, dependenciesMap) => {
  const batches = [];
  const added = new Set();
  const toAdd = new Set(workspaces);

  while (toAdd.size > 0) {
    const batch = new Set();
    for (const workspace of toAdd) {
      if (workspace.isRoot && toAdd.size > 1) continue;
      const dependencies = dependenciesMap.get(workspace);
      if (!dependencies || dependencies.every((w) => added.has(w[0]))) {
        batch.add(workspace);
      }
    }

    for (const workspace of batch) {
      added.add(workspace);
      toAdd.delete(workspace);
    }

    if (batch.size === 0) {
      throw new Error("Circular dependency detected");
    }
    batches.push([...batch]);
  }

  return batches;
};

export const buildDependentsMaps = (workspaces) => {
  const dependentsMap = new Map();
  const dependenciesMap = buildDependenciesMaps(workspaces);
  for (const [dependent, relations] of dependenciesMap) {
    for (const [workspace, set, descriptor] of relations) {
      const cmd = dependentsMap.get(workspace) || [];
      cmd.push([dependent, set, descriptor]);
      dependentsMap.set(workspace, cmd);
    }
  }
  return dependentsMap;
};
