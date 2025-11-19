import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectWorkspace, createWorkspace } from "./packageUtils.ts";

const toAbs = (p: string) => path.resolve(p);

const fixturesRoot = path.resolve(
  new URL("../__fixtures__", import.meta.url).pathname,
);

describe("mapWorkspaces - baseline checks", () => {
  it("should map packages for array workspaces (monorepo)", async () => {
    const root = path.join(fixturesRoot, "monorepo");

    const rootWorkspace = await createWorkspace(root);
    const project = await createProjectWorkspace(rootWorkspace);
    const keys = [...project.children.keys()].toSorted();

    expect(keys.length).toBe(5);
    expect(keys).toContain("package-1");
    expect(keys).toContain("package-2");
    expect(project.children.get("package-1")!.cwd).toBe(
      toAbs(path.join(root, "packages/package-1")),
    );
  });

  it("should map packages for object workspaces (monorepo-object-form)", async () => {
    const root = path.join(fixturesRoot, "monorepo-object-form");
    const rootWorkspace = await createWorkspace(root);
    const project = await createProjectWorkspace(rootWorkspace);
    const keys = [...project.children.keys()].toSorted();
    expect(keys.length).toBe(5);
  });

  it("should map nested patterns and double star patterns", async () => {
    const root = path.join(fixturesRoot, "monorepo-nested");
    const rootWorkspace = await createWorkspace(root);
    const project = await createProjectWorkspace(rootWorkspace);
    const keys = [...project.children.keys()];
    expect(keys).toContain("nested-package-1");
    expect(keys).toContain("nested-package-2");
    expect(keys).toContain("deep-nested-package");
  });

  it("should fallback to folder name when package.json has no name", async () => {
    const root = path.join(fixturesRoot, "monorepo-no-name");
    const rootWorkspace = await createWorkspace(root);
    const project = await createProjectWorkspace(rootWorkspace);
    const keys = [...project.children.keys()];
    expect(keys).toContain("no-name-package");
  });

  it("should throw when duplicate workspace names exist (baseline behavior)", async () => {
    const root = path.join(fixturesRoot, "monorepo-duplicate-names");
    const rootWorkspace = await createWorkspace(root);
    let thrown = false;
    try {
      await createProjectWorkspace(rootWorkspace);
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it("should expose an error or skip invalid package.json (baseline behavior)", async () => {
    const root = path.join(fixturesRoot, "monorepo-invalid-package-json");
    const rootWorkspace = await createWorkspace(root);
    // Ensure it throws or skips: we'll try to call createProjectWorkspace and assert throw
    let thrown = false;
    try {
      await createProjectWorkspace(rootWorkspace);
    } catch {
      thrown = true;
    }
    // Accept either behavior as baseline: ensure we detect if it currently throws.
    // We assert that at least it doesn't silently include the invalid package by name
    // so if it didn't throw, ensure the invalid package isn't listed
    if (!thrown) {
      const project = await createProjectWorkspace(rootWorkspace);
      const keys = [...project.children.keys()];
      expect(keys).not.toContain("invalid-json-package");
    }
  });
});
