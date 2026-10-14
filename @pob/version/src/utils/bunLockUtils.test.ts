import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BunPackageManager } from "../pm/BunPackageManager.ts";
import {
  syncBunLockFile,
  syncBunLockWorkspaceVersions,
} from "./bunLockUtils.ts";

const lock = `{
  "lockfileVersion": 1,
  "workspaces": {
    "": {
      "name": "root",
    },
    "packages/app": {
      "name": "app",
      "version": "1.0.0",
      "dependencies": {
        "core": "workspace:*",
        "other": "1.0.0",
      },
    },
    "packages/core": {
      "name": "core",
      "version": "1.0.0",
    },
  },
  "packages": {
    "other": ["other@1.0.0", "", {}, "sha512-x"],
  },
}
`;

describe("syncBunLockWorkspaceVersions", () => {
  it("only rewrites workspace versions", () => {
    const result = syncBunLockWorkspaceVersions(lock, (workspacePath) =>
      workspacePath === "packages/core" ? "1.0.1" : undefined,
    );
    expect(result).toBe(
      lock.replace(
        '"name": "core",\n      "version": "1.0.0"',
        '"name": "core",\n      "version": "1.0.1"',
      ),
    );
  });

  it("is a no-op when versions match", () => {
    expect(syncBunLockWorkspaceVersions(lock, () => "1.0.0")).toBe(lock);
  });
});

const bunAvailable = (() => {
  try {
    execFileSync("bun", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const suite = bunAvailable ? describe : describe.skip;

suite("bun workspace with workspace:*", () => {
  it("packs the bumped version of a workspace dependency", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pob-version-bun-"));
    try {
      const write = (file: string, content: object) => {
        mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        writeFileSync(path.join(dir, file), JSON.stringify(content));
      };
      write("package.json", {
        name: "root",
        private: true,
        workspaces: ["packages/*"],
      });
      write("packages/core/package.json", { name: "core", version: "1.0.0" });
      write("packages/app/package.json", {
        name: "app",
        version: "1.0.0",
        dependencies: { core: "workspace:*" },
      });
      execFileSync("bun", ["install"], { cwd: dir, stdio: "ignore" });

      // release bump: package.json only
      write("packages/core/package.json", { name: "core", version: "1.0.1" });

      const packedDependency = (): string => {
        const appDir = path.join(dir, "packages/app");
        execFileSync("bun", ["pm", "pack"], { cwd: appDir, stdio: "ignore" });
        const manifest = execFileSync(
          "tar",
          ["xzOf", "app-1.0.0.tgz", "package/package.json"],
          { cwd: appDir },
        ).toString();
        rmSync(path.join(appDir, "app-1.0.0.tgz"));
        return JSON.parse(manifest).dependencies.core;
      };

      // reproduces the bug
      expect(packedDependency()).toBe("1.0.0");

      await BunPackageManager.installOnPackageContentChange!({
        cwd: dir,
      } as any);
      expect(readFileSync(path.join(dir, "bun.lock"), "utf8")).toContain(
        '"version": "1.0.1"',
      );
      expect(packedDependency()).toBe("1.0.1");

      // idempotent
      await syncBunLockFile(dir);
      expect(packedDependency()).toBe("1.0.1");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
