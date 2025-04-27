/* eslint-disable complexity */
import path from "node:path";
import { getMapArrayItemForKey } from "./mapUtils.ts";
import type { PackageDependencyDescriptor } from "./packageDependenciesUtils.ts";
import {
  PackageDependencyDescriptorUtils,
  PackageDescriptorNameUtils,
} from "./packageDependenciesUtils.ts";
import type { ProjectWorkspace, Workspace } from "./packageUtils.ts";

const allDependenciesTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;
export type DependencyType = (typeof allDependenciesTypes)[number];

export const getWorkspaceName = (workspace: Workspace): string => {
  return (
    workspace.pkg.name ?? (path.basename(workspace.cwd) || "unnamed-workspace")
  );
};

type WorkspacesDependenciesMap = Map<
  Workspace,
  [Workspace, DependencyType, PackageDependencyDescriptor][]
>;

export const buildDependentsMaps = (
  project: ProjectWorkspace,
): WorkspacesDependenciesMap => {
  const dependentsMap: WorkspacesDependenciesMap = new Map<
    Workspace,
    [Workspace, DependencyType, PackageDependencyDescriptor][]
  >();

  // Note that we need to do this before applying the new versions,
  // otherwise the `findWorkspacesByDescriptor` calls won't be able to
  // resolve the workspaces anymore (because the workspace versions will
  // have changed and won't match the outdated dependencies).

  for (const [, dependent] of project.children) {
    for (const set of allDependenciesTypes) {
      for (const [dependencyKey, dependencyValue] of Object.entries(
        dependent.pkg[set] || {},
      )) {
        if (!dependencyValue) continue;
        const descriptor = PackageDependencyDescriptorUtils.parse(
          dependencyKey,
          dependencyValue,
        );
        const workspace = project.children.get(
          PackageDescriptorNameUtils.stringify(descriptor.name),
        );
        if (!workspace) continue;

        const dependents = getMapArrayItemForKey(dependentsMap, workspace);
        dependents.push([dependent, set, descriptor]);
      }
    }
  }

  return dependentsMap;
};

export const buildDependenciesMaps = (
  project: ProjectWorkspace,
): WorkspacesDependenciesMap => {
  const dependenciesMap: WorkspacesDependenciesMap = new Map<
    Workspace,
    [Workspace, DependencyType, PackageDependencyDescriptor][]
  >();

  // Note that we need to do this before applying the new versions,
  // otherwise the `findWorkspacesByDescriptor` calls won't be able to
  // resolve the workspaces anymore (because the workspace versions will
  // have changed and won't match the outdated dependencies).

  for (const dependent of project.children.values()) {
    for (const set of allDependenciesTypes) {
      for (const [dependencyKey, dependencyValue] of Object.entries(
        dependent.pkg[set] || {},
      )) {
        if (!dependencyValue) continue;
        const descriptor = PackageDependencyDescriptorUtils.parse(
          dependencyKey,
          dependencyValue,
        );

        const workspace = project.children.get(
          PackageDescriptorNameUtils.stringify(descriptor.name),
        );
        if (!workspace) continue;

        const dependencies = getMapArrayItemForKey(dependenciesMap, dependent);
        dependencies.push([workspace, set, descriptor]);
      }
    }
  }

  return dependenciesMap;
};

export const buildTopologicalOrderBatches = (
  project: ProjectWorkspace,
  dependenciesMap: WorkspacesDependenciesMap,
): Workspace[][] => {
  const batches: Workspace[][] = [];

  const added = new Set<Workspace>();
  const toAdd = new Set<Workspace>([
    project.root,
    ...project.children.values(),
  ]);

  while (toAdd.size > 0) {
    const batch = new Set<Workspace>();
    for (const workspace of toAdd) {
      // make sure top level workspace is always in the last batch
      if (workspace === project.root && toAdd.size > 1) {
        continue;
      }

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
