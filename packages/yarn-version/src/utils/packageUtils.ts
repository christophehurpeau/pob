/* eslint-disable @typescript-eslint/no-use-before-define */
import fs from "node:fs/promises";
import path from "node:path";
import mapWorkspaces from "@npmcli/map-workspaces";
import prettyPkg from "@pob/pretty-pkg";
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

export const createProjectWorkspace = async (
  root: Workspace,
): Promise<ProjectWorkspace> => {
  const map: Map<string, string> = root.pkg.workspaces
    ? await mapWorkspaces({ cwd: root.cwd, pkg: root.pkg })
    : new Map();

  const children = new Map<string, Workspace>(
    await Promise.all(
      [...map.entries()].map(
        async ([packageName, packagePath]) =>
          [
            packageName,
            {
              ...(await createWorkspace(packagePath)),
              relativeCwd: path.relative(root.cwd, packagePath),
            } satisfies Workspace,
          ] as const,
      ),
    ),
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

export async function writePkg(
  workspace: Workspace,
  prettierOptions = undefined,
): Promise<void> {
  const string = await prettyPkg(workspace.pkg, prettierOptions);
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
