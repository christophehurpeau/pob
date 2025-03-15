import { execSync } from "node:child_process";
import semver from "semver";

export default function updateYarn({ pkg, pm }) {
  if (pm.name !== "yarn" || !pm.version) return;

  if (semver.lt(pm.version, "4.7.0")) {
    // Upgrade from yarn 1
    if (semver.lt(pm.version, "2.0.0")) {
      console.log("-- Install yarn berry --");
    } else {
      console.log("-- Update yarn --");
    }
    execSync("yarn set version stable", { stdio: "inherit" });

    // removes yarn paths (can have 2) to use the newly installed yarn
    const paths = process.env.PATH.split(":");
    while (paths[0].startsWith("/tmp/xfs-")) paths.shift();

    execSync("yarn install", {
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: paths.join(":"),
      },
    });
    console.log("Yarn update success !");
  }
}
