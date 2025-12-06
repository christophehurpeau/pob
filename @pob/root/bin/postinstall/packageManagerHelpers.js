export const getPackageManagerCommands = (pm, isYarnBerry) => {
  if (pm.name === "yarn") {
    return {
      lockfile: "yarn.lock",
      pmExec: "yarn",
      ciPreStep: `name: Enable Corepack
        run: corepack enable`,
      installOnCICommand: "yarn install --immutable",
      installMutableCommand: "yarn install",
      installOnDiffCommand: `yarn install ${
        isYarnBerry
          ? "--immutable"
          : "--prefer-offline --pure-lockfile --ignore-optional"
      }`,
      beforeDiffCommand: isYarnBerry
        ? `yarn config set logFilters --json '[
    {"code": "YN0002","level": "discard"},
    {"code": "YN0007","level": "discard"},
    {"code": "YN0008","level": "discard"},
    {"code": "YN0013","level": "discard"},
    {"code": "YN0018","level": "discard"},
    {"code": "YN0060","level": "discard"},
    {"code": "YN0061","level": "discard"}
  ]' > /dev/null`
        : "",
      afterDiffCommand: isYarnBerry
        ? "yarn config unset logFilters > /dev/null"
        : "",
    };
  }
  if (pm.name === "npm") {
    return {
      lockfile: "package-lock.json",
      pmExec: "npx --no-install",
      ciPreStep: "",
      installOnCICommand: "npm i",
      installMutableCommand: "npm i",
      installOnDiffCommand: "npm i",
    };
  }
  if (pm.name === "bun") {
    return {
      lockfile: "bun.lock",
      pmExec: "bun run",
      ciPreStep: `name: Install bun
        uses: oven-sh/setup-bun@v2`,
      installOnCICommand: "bun i --frozen-lockfile",
      installMutableCommand: "bun i",
      installOnDiffCommand: "bun i --frozen-lockfile",
    };
  }

  throw new Error(
    `Package manager not supported: ${pm.name}. Please run with yarn, npm or bun !`,
  );
};
