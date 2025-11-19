import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDependenciesMaps,
  buildTopologicalOrderBatches,
  discoverWorkspaces,
} from "./workspaceUtils.js";

async function prepareMonorepo(tmpDir) {
  await fs.mkdir(path.join(tmpDir, "packages"), { recursive: true });
  const rootPkg = {
    name: "root",
    workspaces: ["packages/*"],
  };
  await fs.writeFile(
    path.join(tmpDir, "package.json"),
    JSON.stringify(rootPkg, null, 2),
  );

  // package c
  const cDir = path.join(tmpDir, "packages/c");
  await fs.mkdir(cDir, { recursive: true });
  await fs.writeFile(
    path.join(cDir, "package.json"),
    JSON.stringify({ name: "@ex/c" }, null, 2),
  );

  // package b depends on c
  const bDir = path.join(tmpDir, "packages/b");
  await fs.mkdir(bDir, { recursive: true });
  await fs.writeFile(
    path.join(bDir, "package.json"),
    JSON.stringify(
      { name: "@ex/b", dependencies: { "@ex/c": "1.0.0" } },
      null,
      2,
    ),
  );

  // package a depends on b
  const aDir = path.join(tmpDir, "packages/a");
  await fs.mkdir(aDir, { recursive: true });
  await fs.writeFile(
    path.join(aDir, "package.json"),
    JSON.stringify(
      { name: "@ex/a", dependencies: { "@ex/b": "1.0.0" } },
      null,
      2,
    ),
  );

  return tmpDir;
}

describe("workspaceUtils", () => {
  it("should discover workspaces", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
    await prepareMonorepo(tmp);
    const workspaces = await discoverWorkspaces(tmp);
    // root + a + b + c
    expect(workspaces.length).toBeGreaterThanOrEqual(4);
    const names = workspaces.map((w) => w.name).toSorted();
    expect(names).toEqual(["@ex/a", "@ex/b", "@ex/c", "root"].toSorted());
  });

  it("should build dependencies maps and topological batches", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
    await prepareMonorepo(tmp);
    const workspaces = await discoverWorkspaces(tmp);
    const dependenciesMap = buildDependenciesMaps(workspaces);
    // find workspace by name
    const byName = new Map(workspaces.map((w) => [w.name, w]));
    const a = byName.get("@ex/a");
    const b = byName.get("@ex/b");
    // const c = byName.get("@ex/c");
    expect(dependenciesMap.get(a)).toBeDefined();
    expect(dependenciesMap.get(b)).toBeDefined();
    // topological batches
    const batches = buildTopologicalOrderBatches(workspaces, dependenciesMap);
    // flatten names excluding root
    const nonRoot = batches
      .flat()
      .filter((w) => !w.isRoot)
      .map((w) => w.name);
    // c should come before b which comes before a
    expect(nonRoot.indexOf("@ex/c")).toBeLessThan(nonRoot.indexOf("@ex/b"));
    expect(nonRoot.indexOf("@ex/b")).toBeLessThan(nonRoot.indexOf("@ex/a"));
  });

  it("throws on circular dependency", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
    await fs.mkdir(path.join(tmp, "packages"), { recursive: true });
    const rootPkg = {
      name: "root",
      workspaces: ["packages/*"],
    };
    await fs.writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify(rootPkg, null, 2),
    );

    // package x depends on y
    const xDir = path.join(tmp, "packages/x");
    await fs.mkdir(xDir, { recursive: true });
    await fs.writeFile(
      path.join(xDir, "package.json"),
      JSON.stringify(
        { name: "@ex/x", dependencies: { "@ex/y": "1.0.0" } },
        null,
        2,
      ),
    );

    // package y depends on x
    const yDir = path.join(tmp, "packages/y");
    await fs.mkdir(yDir, { recursive: true });
    await fs.writeFile(
      path.join(yDir, "package.json"),
      JSON.stringify(
        { name: "@ex/y", dependencies: { "@ex/x": "1.0.0" } },
        null,
        2,
      ),
    );

    const workspaces = await discoverWorkspaces(tmp);
    const dependenciesMap = buildDependenciesMaps(workspaces);
    expect(() =>
      buildTopologicalOrderBatches(workspaces, dependenciesMap),
    ).toThrow();
  });
});
