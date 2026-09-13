import { describe, expect, it } from "vitest";
import {
  resolveEnginesNode,
  updateNodeEngines,
  updateTypesNodeFromEngines,
} from "./nodeEngines.js";

describe("updateTypesNodeFromEngines", () => {
  it("updates devDependencies when lower than engines min major", () => {
    const pkg = {
      engines: { node: ">=24.14.1" },
      devDependencies: { "@types/node": "22.5.0" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBe(">=24.0.0");
  });

  it("keeps devDependencies with the same major", () => {
    const pkg = {
      engines: { node: ">=24.14.1" },
      devDependencies: { "@types/node": "24.13.3" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBe("24.13.3");
  });

  it("never lowers devDependencies", () => {
    const pkg = {
      engines: { node: ">=22.18.0" },
      devDependencies: { "@types/node": "24.13.3" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBe("24.13.3");
  });

  it("updates a devDependencies range", () => {
    const pkg = {
      engines: { node: ">=24.14.1" },
      devDependencies: { "@types/node": ">=22.0.0" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBe(">=24.0.0");
  });

  it("normalizes dependencies", () => {
    const pkg = {
      engines: { node: ">=22.18.0" },
      dependencies: { "@types/node": ">=24.0.0" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.dependencies["@types/node"]).toBe(">=22.0.0");
  });

  it("does not add @types/node", () => {
    const pkg = { engines: { node: ">=24.14.1" }, devDependencies: {} };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBeUndefined();
  });

  it("does nothing without a parseable engines.node", () => {
    const pkg = {
      engines: { node: "lts/*" },
      devDependencies: { "@types/node": "22.5.0" },
    };
    updateTypesNodeFromEngines(pkg);
    expect(pkg.devDependencies["@types/node"]).toBe("22.5.0");

    const pkgWithoutEngines = { devDependencies: { "@types/node": "22.5.0" } };
    updateTypesNodeFromEngines(pkgWithoutEngines);
    expect(pkgWithoutEngines.devDependencies["@types/node"]).toBe("22.5.0");
  });

  it.each(["workspace:*", "catalog:", "npm:types-node@22.5.0"])(
    "keeps unparseable version %s",
    (version) => {
      const pkg = {
        engines: { node: ">=24.14.1" },
        devDependencies: { "@types/node": version },
      };
      updateTypesNodeFromEngines(pkg);
      expect(pkg.devDependencies["@types/node"]).toBe(version);
    },
  );
});

describe("resolveEnginesNode", () => {
  it.each([
    ["18", ">=22.18.0"],
    ["22", ">=22.18.0"],
    ["24", ">=24.14.1"],
    ["26", ">=26.0.0"],
  ])("resolves min major %s from envs", (minMajor, expected) => {
    expect(resolveEnginesNode(">=22.18.0", minMajor, true)).toBe(expected);
  });

  it("throws on an unsupported min major", () => {
    expect(() => resolveEnginesNode(">=22.18.0", "25", true)).toThrow(
      "Invalid min node version: 25",
    );
  });

  it("migrates >=22.11.x", () => {
    expect(resolveEnginesNode(">=22.11.0", "22", false)).toBe(">=22.18.0");
  });

  it("raises a lower engines.node without envs", () => {
    expect(resolveEnginesNode(">=18.0.0", "22", false)).toBe(">=22.18.0");
  });

  it("keeps a higher engines.node without envs", () => {
    expect(resolveEnginesNode(">=26.0.0", "22", false)).toBe(">=26.0.0");
  });

  it("lets envs lower engines.node", () => {
    expect(resolveEnginesNode(">=24.14.1", "22", true)).toBe(">=22.18.0");
  });
});

describe("updateNodeEngines", () => {
  it("sets engines.node and @types/node from envs", () => {
    const pkg = {
      pob: { envs: [{ target: "node", version: "24" }] },
      devDependencies: { "@types/node": "22.5.0" },
    };
    updateNodeEngines(pkg, {});
    expect(pkg.engines.node).toBe(">=24.14.1");
    expect(pkg.devDependencies["@types/node"]).toBe(">=24.0.0");
  });

  it("supports babelEnvs", () => {
    const pkg = { pob: { babelEnvs: [{ target: "node", version: "24" }] } };
    updateNodeEngines(pkg, {});
    expect(pkg.engines.node).toBe(">=24.14.1");
  });

  it("uses the maintenance LTS without envs", () => {
    const pkg = {};
    updateNodeEngines(pkg, {});
    expect(pkg.engines.node).toBe(">=22.18.0");
  });

  it("uses the latest LTS without envs when onlyLatestLTS", () => {
    const pkg = {};
    updateNodeEngines(pkg, { onlyLatestLTS: true });
    expect(pkg.engines.node).toBe(">=24.14.1");
  });

  it("removes @types/node when there is no node target", () => {
    const pkg = {
      pob: { envs: [{ target: "browser" }] },
      dependencies: { "@types/node": ">=22.0.0" },
      devDependencies: { "@types/node": "24.13.3", typescript: "6.0.0" },
    };
    updateNodeEngines(pkg, {});
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.devDependencies["@types/node"]).toBeUndefined();
    expect(pkg.engines.node).toBe(">=22.18.0");
  });

  it("keeps a higher engines.node when there is no node target", () => {
    const pkg = {
      pob: { envs: [{ target: "browser" }] },
      engines: { node: ">=24.14.1" },
    };
    updateNodeEngines(pkg, {});
    expect(pkg.engines.node).toBe(">=24.14.1");
  });
});
