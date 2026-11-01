// node backend apps: their scripts run in the same environment as their
// sources, so the package tsconfig.json type-checks them too instead of a
// separate tsconfig.tools.json
export const nodeAppTypes = ["node", "node-library", "alp-node"];

export const isNodeApp = (pobConfig) =>
  pobConfig?.project?.type === "app" &&
  nodeAppTypes.includes(pobConfig.app?.type);
