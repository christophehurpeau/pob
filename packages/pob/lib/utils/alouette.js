// alouette styles components with tailwind (nativewind) and tailwind-variants

/** @param {Record<string, any>} pkg */
export const detectAlouette = (pkg) =>
  [pkg.dependencies, pkg.devDependencies].some(
    (dependencies) => dependencies?.alouette !== undefined,
  );

/**
 * Fallback on the dependencies for an app config missing the option.
 *
 * @param {Record<string, any> | undefined} pobConfig
 * @param {Record<string, any>} pkg
 */
export const isAlouetteApp = (pobConfig, pkg) =>
  pobConfig?.project?.type === "app" &&
  pobConfig.app?.type === "expo" &&
  (pobConfig.app.alouette ?? detectAlouette(pkg));
