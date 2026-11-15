import { describe, expect, it } from "vitest";
import {
  computeEnginesNode,
  resolveEnginesNode,
  typesNodeDependencyRange,
  typesNodeDevDependencyVersion,
} from "./nodeEngines.ts";

const NODE_22 = "^22.23.4 || ^24.22.1 || >=26.13.0";
const NODE_24 = "^24.22.1 || >=26.13.0";
const PINNED = "24.13.3";

describe("typesNodeDevDependencyVersion", () => {
  it("keeps pinned devDependencies pinned when lower than engines min major", () => {
    expect(typesNodeDevDependencyVersion("22.5.0", NODE_24, PINNED)).toBe(
      PINNED,
    );
  });

  it("uses a range when the pinned version is lower than engines min major", () => {
    expect(typesNodeDevDependencyVersion("22.5.0", ">=99.0.0", PINNED)).toBe(
      ">=99.0.0",
    );
  });

  it("keeps devDependencies with the same major", () => {
    expect(typesNodeDevDependencyVersion("24.1.0", NODE_24, PINNED)).toBe(
      "24.1.0",
    );
  });

  it("never lowers devDependencies", () => {
    expect(typesNodeDevDependencyVersion("24.13.3", ">=22.18.0", PINNED)).toBe(
      "24.13.3",
    );
  });

  it("updates a devDependencies range", () => {
    expect(typesNodeDevDependencyVersion(">=22.0.0", NODE_24, PINNED)).toBe(
      ">=24.0.0",
    );
  });

  it("does nothing without a parseable engines.node", () => {
    expect(typesNodeDevDependencyVersion("22.5.0", "lts/*", PINNED)).toBe(
      "22.5.0",
    );
  });

  it.each(["workspace:*", "catalog:", "npm:types-node@22.5.0"])(
    "keeps unparseable version %s",
    (version) => {
      expect(typesNodeDevDependencyVersion(version, NODE_24, PINNED)).toBe(
        version,
      );
    },
  );
});

describe("typesNodeDependencyRange", () => {
  it("normalizes to the min major of engines.node", () => {
    expect(typesNodeDependencyRange(">=22.18.0")).toBe(">=22.0.0");
  });

  it("is undefined without a parseable engines.node", () => {
    expect(typesNodeDependencyRange("lts/*")).toBeUndefined();
  });
});

describe("resolveEnginesNode", () => {
  it.each([
    ["18", NODE_22],
    ["22", NODE_22],
    ["24", NODE_24],
    ["26", ">=26.13.0"],
  ])("resolves min major %s from envs", (minMajor, expected) => {
    expect(resolveEnginesNode(">=22.18.0", minMajor, true)).toBe(expected);
  });

  it("throws on an unsupported min major", () => {
    expect(() => resolveEnginesNode(">=22.18.0", "25", true)).toThrow(
      "Invalid min node version: 25",
    );
  });

  it("raises a lower engines.node without envs", () => {
    expect(resolveEnginesNode(">=18.0.0", "22", false)).toBe(NODE_22);
  });

  it("keeps a higher engines.node without envs", () => {
    expect(resolveEnginesNode(">=26.0.0", "22", false)).toBe(">=26.0.0");
  });

  it("lets envs lower engines.node", () => {
    expect(resolveEnginesNode(NODE_24, "22", true)).toBe(NODE_22);
  });

  it.each([true, false])(
    "keeps a higher min version of the same major (hasEnvs: %s)",
    (hasEnvs) => {
      expect(resolveEnginesNode(">=24.23.0", "24", hasEnvs)).toBe(">=24.23.0");
    },
  );
});

describe("computeEnginesNode", () => {
  it("uses the maintenance LTS without envs", () => {
    expect(computeEnginesNode(undefined, undefined, false)).toBe(NODE_22);
  });

  it("uses the latest LTS without envs when onlyLatestLTS", () => {
    expect(computeEnginesNode(undefined, undefined, true)).toBe(NODE_24);
  });

  it("uses the min node env", () => {
    expect(
      computeEnginesNode(
        undefined,
        [
          { target: "node", version: "26" },
          { target: "node", version: "24" },
        ],
        false,
      ),
    ).toBe(NODE_24);
  });

  it("migrates >=22.18.0 when there is no node target", () => {
    expect(
      computeEnginesNode(">=22.18.0", [{ target: "browser" }], false),
    ).toBe(NODE_22);
  });

  it("keeps a higher engines.node when there is no node target", () => {
    expect(computeEnginesNode(NODE_24, [{ target: "browser" }], false)).toBe(
      NODE_24,
    );
  });
});
