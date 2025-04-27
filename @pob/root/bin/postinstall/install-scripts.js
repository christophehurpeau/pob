import fs from "node:fs";

const addPobRootPostinstallInScript = (pkg, scriptName) => {
  if (!pkg.scripts[scriptName]) {
    pkg.scripts[scriptName] = "pob-root-postinstall";
  } else if (!pkg.scripts[scriptName].includes("pob-root-postinstall")) {
    pkg.scripts[scriptName] =
      `pob-root-postinstall ; ${pkg.scripts.postinstall}`;
  }
};

export default function installScripts({ pkg, pm }) {
  if (!pkg.scripts) pkg.scripts = {};
  if (pkg.name === "pob-monorepo") return;

  if (pm.name === "yarn") {
    delete pkg.scripts.postinstallDev;
    addPobRootPostinstallInScript(pkg, "postinstall");
  } else {
    addPobRootPostinstallInScript(pkg, "prepare");
  }

  fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}
