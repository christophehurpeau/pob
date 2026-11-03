import path from "node:path";
import {
  buildDependentsMaps,
  discoverWorkspaces,
  readPobConfig,
} from "./workspaceUtils.js";

export const appsWithBrowser = ["alp", "next.js", "vite", "vite-with-server"];

const expoTarget = "@pob/root/tsconfigs/targets/expo.json";

// based on the app type from the pob config rather than on the package.json
// dependencies, which can change without pob being run again
export const getAppTsconfigTarget = ({ appType, dom, withBun }) => {
  if (appType === "expo") return expoTarget;
  if (dom) {
    return appType === "vite" || appType === "vite-with-server"
      ? "@pob/root/tsconfigs/targets/vite.json"
      : "@pob/root/tsconfigs/targets/webpack.json";
  }
  if (withBun) return "@pob/root/tsconfigs/targets/bun.json";
  return undefined;
};

/**
 * Target of the apps directly depending on the package, for packages compiled
 * by the bundler of these apps (untranspiled libraries). Expo wins as the
 * widest target, otherwise the apps must agree on a single target.
 */
export const getConsumerAppsTsconfigTarget = async ({
  rootPath,
  packageName,
  withBun,
}) => {
  const workspaces = await discoverWorkspaces(rootPath);
  const workspace = workspaces.find((w) => w.name === packageName);
  if (!workspace) return undefined;

  const dependents = buildDependentsMaps(workspaces).get(workspace) || [];
  const targets = new Set();
  for (const [dependent] of dependents) {
    const pobConfig = readPobConfig(path.join(rootPath, dependent.location));
    if (pobConfig?.project?.type !== "app") continue;
    const appType = pobConfig.app?.type;
    const target = getAppTsconfigTarget({
      appType,
      dom: appsWithBrowser.includes(appType),
      withBun,
    });
    if (target) targets.add(target);
  }

  if (targets.has(expoTarget)) return expoTarget;
  return targets.size === 1 ? [...targets][0] : undefined;
};
