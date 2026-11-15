import { describe, expect, test } from "vitest";
import { orderEffects } from "./effects.ts";

const ids = (effects: { id: string; location?: string }[]): string[] =>
  effects.map(({ id, location }) => `${location ?? "."}#${id}`);

describe("orderEffects", () => {
  test("the same id in two packages: both are ordered", () => {
    expect(
      ids(
        orderEffects([
          { id: "git-untrack-build", location: "packages/a" },
          { id: "git-untrack-build", location: "packages/b" },
          { id: "install", location: "." },
        ]),
      ),
    ).toEqual([
      "packages/a#git-untrack-build",
      "packages/b#git-untrack-build",
      ".#install",
    ]);
  });

  test("after resolves in the same package first", () => {
    expect(
      ids(
        orderEffects([
          { id: "build", location: "packages/a", after: ["install"] },
          { id: "build", location: ".", after: ["install"] },
          { id: "install", location: "packages/a" },
          { id: "install", location: "." },
        ]),
      ),
    ).toEqual([
      "packages/a#install",
      "packages/a#build",
      ".#install",
      ".#build",
    ]);
  });

  test("after resolves across packages when the package does not plan it", () => {
    expect(
      ids(
        orderEffects([
          { id: "codemods", location: "packages/a", after: ["install"] },
          { id: "codemods", location: "packages/b", after: ["install"] },
          { id: "install", location: "." },
        ]),
      ),
    ).toEqual([".#install", "packages/a#codemods", "packages/b#codemods"]);
  });

  test("a cycle names its effects", () => {
    expect(() =>
      orderEffects([
        { id: "a", after: ["b"] },
        { id: "b", after: ["a"] },
      ]),
    ).toThrow("Cycle in effect order: .#a, .#b");
  });
});
