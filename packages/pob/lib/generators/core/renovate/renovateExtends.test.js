import { describe, expect, it } from "vitest";
import { getRenovateExtends } from "./renovateExtends.js";

const presets = "github>christophehurpeau/renovate-presets";

describe("getRenovateExtends", () => {
  it("extends the lib config and the presets for a library", () => {
    expect(
      getRenovateExtends({ app: false, pkgName: "lib", withExpo: false }),
    ).toEqual(["config:js-lib", presets]);
  });

  it("extends the app config and the presets for an app", () => {
    expect(
      getRenovateExtends({ app: true, pkgName: "app", withExpo: false }),
    ).toEqual(["config:js-app", presets]);
  });

  it("does not extend the presets for pob-monorepo", () => {
    expect(
      getRenovateExtends({
        app: false,
        pkgName: "pob-monorepo",
        withExpo: false,
      }),
    ).toEqual(["config:js-lib"]);
  });

  it("extends the expo preset last with an expo app", () => {
    expect(
      getRenovateExtends({ app: true, pkgName: "mobile", withExpo: true }),
    ).toEqual(["config:js-app", presets, `${presets}:expo`]);
    expect(
      getRenovateExtends({ app: false, pkgName: "alouette", withExpo: true }),
    ).toEqual(["config:js-lib", presets, `${presets}:expo`]);
  });
});
