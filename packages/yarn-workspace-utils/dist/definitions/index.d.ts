import type { AllDependencies as DependencyType, Descriptor, Project, Workspace } from "@yarnpkg/core";
export declare const getWorkspaceName: (workspace: Workspace) => string;
type WorkspacesDependenciesMap = Map<Workspace, [
    Workspace,
    DependencyType,
    Descriptor
][]>;
export declare const buildDependentsMaps: (project: Project) => WorkspacesDependenciesMap;
export declare const buildDependenciesMaps: (project: Project) => WorkspacesDependenciesMap;
export declare const buildTopologicalOrderBatches: (project: Project, dependenciesMap: WorkspacesDependenciesMap) => Workspace[][];
export {};
//# sourceMappingURL=index.d.ts.map