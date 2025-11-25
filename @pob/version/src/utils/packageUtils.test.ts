import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createProjectWorkspace,
  createWorkspace,
  findRootWorkspace,
} from "./packageUtils.ts";

const fixturesRoot = path.resolve(
  new URL("../__fixtures__", import.meta.url).pathname,
);

describe("packageUtils integration", () => {
  it("findRootWorkspace finds root from subpackage path", async () => {
    const subPath = path.join(fixturesRoot, "yarn-monorepo/packages/package-1");
    const root = await findRootWorkspace(subPath);
    expect(root).toBeTruthy();
    expect(root!.pkg.name).toBe("yarn-monorepo");
  });

  it("createProjectWorkspace returns children and correct relativeCwd", async () => {
    const rootPath = path.join(fixturesRoot, "yarn-monorepo");
    const rootWorkspace = await createWorkspace(rootPath);
    const project = await createProjectWorkspace(rootWorkspace);
    const children = [...project.children.values()];
    expect(children.length).toBe(5);
    // Check a sample relativeCwd
    const pkg1 = project.children.get("package-1");
    expect(pkg1).toBeTruthy();
    expect(pkg1!.relativeCwd).toBe("packages/package-1");
  });
});
