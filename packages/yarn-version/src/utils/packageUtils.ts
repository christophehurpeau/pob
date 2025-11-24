/* eslint-disable @typescript-eslint/no-use-before-define */
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import fs, { glob } from "node:fs/promises";
import path from "node:path";
import type { PackageJson } from "type-fest";

export interface Workspace {
  readonly cwd: string;
  readonly relativeCwd?: string;
  readonly pkg: PackageJson;
}

export interface ProjectWorkspace {
  readonly root: Workspace;
  readonly children: Map<string, Workspace>;
}

async function mapWorkspacesFromPkg({
  cwd,
  pkg,
}: {
  cwd: string;
  pkg: PackageJson;
}): Promise<Map<string, Workspace>> {
  const workspacesPatterns: string[] = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : pkg.workspaces?.packages || [];

  const map = new Map<string, Workspace>();

  for (const pattern of workspacesPatterns) {
    const normalized = pattern.endsWith("package.json")
      ? pattern
      : `${pattern.replace(/\/*$/, "")}/package.json`;

    const files = glob(normalized, { cwd });
    for await (const file of files) {
      const packageDir = path.join(cwd, path.dirname(file));
      const packageJson: PackageJson = await readPkg(packageDir);
      const workspaceName = packageJson.name || path.basename(packageDir);
      if (map.has(workspaceName)) {
        const existingWorkspace = map.get(workspaceName);
        if (existingWorkspace && existingWorkspace.cwd !== packageDir) {
          throw new Error(
            `must not have multiple workspaces with the same name\npackage '${workspaceName}' has conflicts in the following paths:\n    ${existingWorkspace.cwd}\n    ${packageDir}`,
          );
        }
        // if it's the same package dir, ignore duplicate match
        if (existingWorkspace && existingWorkspace.cwd === packageDir) continue;
      }
      map.set(workspaceName, { cwd: packageDir, pkg: packageJson });
    }
  }
  return map;
}

export const createProjectWorkspace = async (
  root: Workspace,
): Promise<ProjectWorkspace> => {
  const map: Map<string, Workspace> = root.pkg.workspaces
    ? await mapWorkspacesFromPkg({ cwd: root.cwd, pkg: root.pkg })
    : new Map();

  const children = new Map<string, Workspace>(
    [...map.entries()].map(([packageName, workspace]) => {
      const w: Workspace = {
        ...workspace,
        relativeCwd: path.relative(root.cwd, workspace.cwd),
      };
      return [packageName, w] as const;
    }),
  );
  return { root, children };
};

const isAccessible = (path: string): Promise<boolean> =>
  fs.access(path).then(
    () => true,
    () => false,
  );

export const findRootWorkspace = async (
  cwd: string,
): Promise<Workspace | null> => {
  let currentPath = cwd;
  do {
    const isRootIfOneOfThesePathsExists = await Promise.all([
      isAccessible(path.join(currentPath, ".yarnrc.yml")),
      isAccessible(path.join(currentPath, "yarn.lock")),
    ]);
    if (isRootIfOneOfThesePathsExists.some(Boolean)) {
      return createWorkspace(currentPath);
    }
    currentPath = path.dirname(currentPath);
  } while (currentPath && currentPath !== "/");
  return null;
};

const getPackageJsonPath = (cwd: string): string =>
  path.join(cwd, "package.json");

export const createWorkspace = async (path: string): Promise<Workspace> => {
  const pkg = await readPkg(path);
  return { cwd: path, pkg };
};

export async function writePkg(workspace: Workspace): Promise<void> {
  const string = `${JSON.stringify(workspace.pkg, null, 2)}\n`;
  await fs.writeFile(getPackageJsonPath(workspace.cwd), string, "utf8");
}

export async function readPkg(cwd: string): Promise<PackageJson> {
  const packagePath = getPackageJsonPath(cwd);
  // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
  const pkg = await fs.readFile(packagePath, "utf8").catch((error: Error) => {
    throw new Error(
      `Failed to read package.json in "${cwd}": ${error instanceof Error ? error.message : String(error)}`,
    );
  });
  try {
    return JSON.parse(pkg);
  } catch (error: unknown) {
    throw new Error(
      `Failed to parse package.json in "${cwd}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
