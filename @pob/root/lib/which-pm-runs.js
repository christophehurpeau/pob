export function whichPmRuns() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return undefined;
  }

  const pmSpec = userAgent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  return {
    name: pmSpec.slice(0, separatorPos),
    version: pmSpec.slice(separatorPos + 1),
  };
}
