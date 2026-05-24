export function whichPmRuns() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    if (process.env.npm_execpath?.endsWith("/bin/pnpm.mjs")) {
      const version = process.env.npm_execpath.split("/").slice(-3)[0];
      console.log("Detected pnpm via npm_execpath with version", version);
      return { name: "pnpm", version };
    }
    return undefined;
  }

  const pmSpec = userAgent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  return {
    name: pmSpec.slice(0, separatorPos),
    version: pmSpec.slice(separatorPos + 1),
  };
}
