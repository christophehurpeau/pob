export function assertYarnBerry(pm) {
  if (pm.name === "yarn" && pm.version.startsWith("1.")) {
    throw new Error(
      "Yarn v1 is not supported. Please upgrade to Yarn v2 or later.",
    );
  }
}
