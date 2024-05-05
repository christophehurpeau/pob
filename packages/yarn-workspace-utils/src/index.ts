/* eslint-disable complexity */

import type {
  AllDependencies as DependencyType,
  Descriptor,
  Workspace,
  Project,
} from "@yarnpkg/core";
import { Manifest, miscUtils, structUtils } from "@yarnpkg/core";

export const getWorkspaceName = (workspace: Workspace): string => {
  return workspace.manifest.name
    ? structUtils.stringifyIdent(workspace.manifest.name)
    : workspace.computeCandidateName();
};

type WorkspacesDependenciesMap = Map<
  Workspace,
  [Workspace, DependencyType, Descriptor][]
>;

export const buildDependentsMaps = (
  project: Project,
): WorkspacesDependenciesMap => {
  const dependentsMap: WorkspacesDependenciesMap = new Map<
    Workspace,
    [Workspace, DependencyType, Descriptor][]
  >();

  // Note that we need to do this before applying the new versions,
  // otherwise the `findWorkspacesByDescriptor` calls won't be able to
  // resolve the workspaces anymore (because the workspace versions will
  // have changed and won't match the outdated dependencies).

  for (const dependent of project.workspaces) {
    for (const set of Manifest.allDependencies) {
      for (const descriptor of dependent.manifest[set].values()) {
        const workspace = project.tryWorkspaceByDescriptor(descriptor);
        if (workspace === null) {
          continue;
        }

        const dependents = miscUtils.getArrayWithDefault(
          dependentsMap,
          workspace,
        );
        dependents.push([dependent, set, descriptor]);
      }
    }
  }

  return dependentsMap;
};

export const buildDependenciesMaps = (
  project: Project,
): WorkspacesDependenciesMap => {
  const dependenciesMap: WorkspacesDependenciesMap = new Map<
    Workspace,
    [Workspace, DependencyType, Descriptor][]
  >();

  // Note that we need to do this before applying the new versions,
  // otherwise the `findWorkspacesByDescriptor` calls won't be able to
  // resolve the workspaces anymore (because the workspace versions will
  // have changed and won't match the outdated dependencies).

  for (const dependent of project.workspaces) {
    for (const set of Manifest.allDependencies) {
      for (const descriptor of dependent.manifest[set].values()) {
        const workspace = project.tryWorkspaceByDescriptor(descriptor);
        if (workspace === null) {
          continue;
        }

        const dependencies = miscUtils.getArrayWithDefault(
          dependenciesMap,
          dependent,
        );
        dependencies.push([workspace, set, descriptor]);
      }
    }
  }

  return dependenciesMap;
};

export const buildTopologicalOrderBatches = (
  project: Project,
  dependenciesMap: WorkspacesDependenciesMap,
): Workspace[][] => {
  const batches: Workspace[][] = [];

  const added = new Set<Workspace>();
  const toAdd = new Set<Workspace>(project.workspaces);

  while (toAdd.size > 0) {
    const batch = new Set<Workspace>();
    for (const workspace of toAdd) {
      // make sure top level workspace is always in the last batch
      if (workspace === project.topLevelWorkspace && toAdd.size > 1) {
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
