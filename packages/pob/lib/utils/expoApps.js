import path from "node:path";
import { discoverWorkspaces, readPobConfig } from "./workspaceUtils.js";

/** @param {Record<string, any> | undefined} pobConfig */
export const isExpoApp = (pobConfig) =>
  pobConfig?.project?.type === "app" && pobConfig.app?.type === "expo";

/**
 * Based on the pob config of the project and of its workspaces, like
 * getAppTsconfigTarget, rather than on the package.json dependencies.
 *
 * @param {{ rootPath: string, pobConfig: Record<string, any> | undefined }} options
 */
export const hasExpoApp = async ({ rootPath, pobConfig }) => {
  if (isExpoApp(pobConfig)) return true;
  const workspaces = await discoverWorkspaces(rootPath);
  return workspaces.some(
    (workspace) =>
      !workspace.isRoot &&
      isExpoApp(readPobConfig(path.join(rootPath, workspace.location))),
  );
};
