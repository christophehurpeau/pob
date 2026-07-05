import { describe, expect, it } from "vitest";
import { calcBumpRange } from "./bumpTypeUtils.ts";
import type { Workspace } from "./packageUtils.ts";

const workspace: Workspace = {
  cwd: "/repo/packages/foo",
  relativeCwd: "packages/foo",
  pkg: { name: "foo", version: "1.0.0" },
};

describe("calcBumpRange", () => {
  it("keeps bare * unchanged", () => {
    expect(calcBumpRange(workspace, "*", "2.0.0")).toBe("*");
  });

  it("keeps workspace:* unchanged", () => {
    expect(calcBumpRange(workspace, "workspace:*", "2.0.0")).toBe(
      "workspace:*",
    );
  });

  it("keeps workspace:^ unchanged", () => {
    expect(calcBumpRange(workspace, "workspace:^", "2.0.0")).toBe(
      "workspace:^",
    );
  });

  it("keeps workspace:~ unchanged", () => {
    expect(calcBumpRange(workspace, "workspace:~", "2.0.0")).toBe(
      "workspace:~",
    );
  });

  it("keeps workspace:<relative path> unchanged", () => {
    expect(calcBumpRange(workspace, "workspace:packages/foo", "2.0.0")).toBe(
      "workspace:packages/foo",
    );
  });

  it("bumps workspace:^x.y.z ranges", () => {
    expect(calcBumpRange(workspace, "workspace:^1.0.0", "2.0.0")).toBe(
      "workspace:^2.0.0",
    );
  });

  it("bumps workspace:~x.y.z ranges", () => {
    expect(calcBumpRange(workspace, "workspace:~1.0.0", "2.0.0")).toBe(
      "workspace:~2.0.0",
    );
  });

  it("bumps plain ^x.y.z ranges", () => {
    expect(calcBumpRange(workspace, "^1.0.0", "2.0.0")).toBe("^2.0.0");
  });

  it("bumps exact x.y.z versions", () => {
    expect(calcBumpRange(workspace, "1.0.0", "2.0.0")).toBe("2.0.0");
  });

  it("throws on an unsupported range", () => {
    expect(() => calcBumpRange(workspace, "1.x", "2.0.0")).toThrow(
      /Couldn't bump range/,
    );
  });
});
