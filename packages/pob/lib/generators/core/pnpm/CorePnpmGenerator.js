import { execFileSync } from "node:child_process";
import sortObject from "@pob/sort-object";
import { FAILSAFE_SCHEMA, dump, load, loadAll } from "js-yaml";
import { satisfies } from "semver";
import Generator from "yeoman-generator";
import { writeAndFormat } from "../../../utils/writeAndFormat.js";

const pnpmVersionRange = "^12.0.0";

// pnpm 12 writes the pnpm version in a first document of pnpm-lock.yaml when
// devEngines.packageManager is not ignored. Removes it when it has nothing
// else (no config dependencies).
const removePackageManagerLockfileDocument = (lockfile) => {
  if (!lockfile.startsWith("---\n")) return lockfile;
  const end = lockfile.indexOf("\n---\n", 4);
  if (end === -1) return lockfile;
  const envDocument = load(lockfile.slice(4, end), { schema: FAILSAFE_SCHEMA });
  const importer = envDocument?.importers?.["."] ?? {};
  const hasOtherEntries = Object.keys(importer).some(
    (key) =>
      key !== "packageManagerDependencies" && key !== "configDependencies",
  );
  if (
    hasOtherEntries ||
    Object.keys(importer.configDependencies ?? {}).length > 0
  ) {
    return lockfile;
  }
  return lockfile.slice(end + "\n---\n".length);
};

const getRunningPnpmVersion = (cwd) => {
  try {
    return execFileSync("pnpm", ["--version"], {
      cwd,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
};

const minimumReleaseAgeExcludePackages = [
  "@pob/*",
  "pob",
  "pob-dependencies",
  "check-package-dependencies",
  "alouette",
  "alouette-icons",
  "nightingale",
  "nightingale-logger",
];

const trustedBuilds = ["esbuild"];

export default class CorePnpmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("type", {
      type: String,
      required: false,
      default: "lib",
      description: "Project type (app or lib)",
    });

    this.option("enable", {
      type: Boolean,
      required: true,
      description: "Enable pnpm",
    });
  }

  async writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enable) {
      // devEngines.packageManager is read by pnpm/action-setup. onFail is
      // "ignore": otherwise pnpm writes its version in pnpm-lock.yaml and it
      // has to be updated manually. The version is checked by engines.pnpm.
      delete pkg.packageManager;
      pkg.devEngines = {
        ...pkg.devEngines,
        packageManager: {
          name: "pnpm",
          version: pnpmVersionRange,
          onFail: "ignore",
        },
      };

      const lockfilePath = this.destinationPath("pnpm-lock.yaml");
      if (this.fs.exists(lockfilePath)) {
        const lockfile = this.fs.read(lockfilePath);
        const newLockfile = removePackageManagerLockfileDocument(lockfile);
        if (newLockfile !== lockfile) this.fs.write(lockfilePath, newLockfile);
      }

      const configString = this.fs.read(
        this.destinationPath("pnpm-workspace.yaml"),
        { defaults: "" },
      );
      const [loadedConfig] = loadAll(configString, {
        schema: FAILSAFE_SCHEMA,
      });
      const config = loadedConfig ?? {};

      // the file is read with FAILSAFE_SCHEMA: booleans are read as strings.
      // Other values are placeholders written by pnpm for ignored builds.
      const allowBuilds = Object.fromEntries(
        Object.entries(config.allowBuilds ?? {}).map(([key, value]) => {
          if (value === "true") return [key, true];
          if (value === "false") return [key, false];
          return [key, value];
        }),
      );
      // build scripts of the dependencies pob adds itself. Set even before a
      // package needs them: the root is generated before its packages, and an
      // ignored build makes pnpm fail.
      for (const name of trustedBuilds) {
        if (typeof allowBuilds[name] !== "boolean") allowBuilds[name] = true;
      }
      config.allowBuilds = allowBuilds;
      this.pendingAllowBuilds = Object.keys(allowBuilds).filter(
        (name) => typeof allowBuilds[name] !== "boolean",
      );

      if (pkg.workspaces) {
        config.packages = pkg.workspaces;
      } else {
        delete config.packages;
      }
      config.savePrefix = this.options.type === "app" ? "" : "^";
      config.minimumReleaseAge = 1440 * 2.5; // 2.5 days in minutes
      config.minimumReleaseAgeExclude = minimumReleaseAgeExcludePackages;
      config.dedupePeerDependents = true;
      config.nodeLinker = "hoisted";

      await writeAndFormat(
        this.fs,
        this.destinationPath("pnpm-workspace.yaml"),
        dump(sortObject(config), { lineWidth: 9999 }),
      );
    } else {
      if (pkg.packageManager?.startsWith("pnpm@")) {
        delete pkg.packageManager;
      }
      if (pkg.devEngines?.packageManager?.name === "pnpm") {
        delete pkg.devEngines.packageManager;
        if (Object.keys(pkg.devEngines).length === 0) delete pkg.devEngines;
      }
      this.fs.delete("pnpm-lock.yaml");
      this.fs.delete("pnpm-workspace.yaml");
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  end() {
    if (this.options.enable) {
      if (this.pendingAllowBuilds.length > 0) {
        console.warn(
          `pnpm-workspace.yaml: set allowBuilds to true or false for ${this.pendingAllowBuilds.join(", ")}`,
        );
      }
      // the running pnpm can be older than the version required by pob, for
      // example in the @pob/root renovate workflow after a pnpm major update
      const runningPnpmVersion = getRunningPnpmVersion(this.destinationPath());
      const pnpmArgs =
        runningPnpmVersion && satisfies(runningPnpmVersion, pnpmVersionRange)
          ? []
          : ["with", pnpmVersionRange];

      // pob just modified package.json: the lockfile must be allowed to update,
      // in particular in the automatic update GitHub Actions workflow (CI
      // defaults to frozen lockfile)
      this.spawnSync(
        "pnpm",
        [...pnpmArgs, "install", "--no-frozen-lockfile"],
        {},
      );
      this.spawnSync("pnpm", [...pnpmArgs, "dedupe"], {});

      this.fs.delete("package-lock.json");
      this.fs.delete("yarn.lock");

      const pkg = this.fs.readJSON(this.destinationPath("package.json"));

      if (pkg.scripts?.preversion) {
        try {
          this.spawnSync("pnpm", [...pnpmArgs, "run", "preversion"]);
        } catch {}
      } else if (pkg.scripts?.build) {
        try {
          this.spawnSync("pnpm", [...pnpmArgs, "run", "build"]);
        } catch {}
      }
    }
  }
}
