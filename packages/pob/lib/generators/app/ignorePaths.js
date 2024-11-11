export const appIgnorePaths = {
  alp: (config) => ["# alp paths", "/build", "/public", "/data"],
  "next.js": (config, pkg) =>
    [
      "# next.js paths",
      "/.next",
      "/out",
      "/build",
      "/.env.local",
      pkg?.dependencies?.tamagui ? "# tamagui" : undefined,
      pkg?.dependencies?.tamagui ? "/.tamagui" : undefined,
    ].filter(Boolean),
  remix: (config) => ["# remix paths", "/.cache", "/build", "/public/build"],
  pobpack: (config) => ["/build", "/public"],
  node: (config) => (config.distribute ? [] : ["/build"]),
  "node-library": (config) => ["/build"],
  "untranspiled-library": (config) => [],
  "alp-node": (config) => ["/build"],
  other: (config) => [],
  storybook: (config) => [],
  expo: (config) => [
    "/.expo/",
    "*.jks",
    "*.p8",
    "*.p12",
    "*.key",
    "*.mobileprovision",
    "*.orig.*",
    "/web-build/",

    // only if option is enabled which is not by default
    // '# Temporary files created by Metro to check the health of the file watcher',
    // '/.metro-health-check*',
  ],
  "yarn-plugin": (config) => [],
};
