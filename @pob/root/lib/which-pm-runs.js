import { existsSync } from "node:fs";
import path from "node:path";

function detectFromLockfiles(cwd) {
  if (existsSync(path.join(cwd, "yarn.lock"))) {
    return { name: "yarn", version: "unknown" };
  }
  if (
    existsSync(path.join(cwd, "pnpm-lock.yaml")) ||
    existsSync(path.join(cwd, "pnpm-workspace.yaml"))
  ) {
    return { name: "pnpm", version: "unknown" };
  }
  if (existsSync(path.join(cwd, "bun.lock"))) {
    return { name: "bun", version: "unknown" };
  }
  if (existsSync(path.join(cwd, "package-lock.json"))) {
    return { name: "npm", version: "unknown" };
  }
  return undefined;
}

export function whichPmRuns() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    if (
      process.env.npm_execpath?.endsWith("/bin/pnpm") ||
      process.env.npm_execpath?.endsWith("/bin/pnpm.mjs")
    ) {
      return { name: "pnpm", version: "unknown" };
    }

    return detectFromLockfiles(process.cwd());
  }

  const pmSpec = userAgent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  return {
    name: pmSpec.slice(0, separatorPos),
    version: pmSpec.slice(separatorPos + 1),
  };
}
