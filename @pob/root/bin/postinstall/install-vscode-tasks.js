import fs from "node:fs";
import JSON5 from "json5";
import prettier from "prettier";

function readJSON5(path, defaults = null) {
  try {
    const content = fs.readFileSync(path);
    return JSON5.parse(content);
  } catch {
    return defaults;
  }
}

function getGroupNameFromScriptName(scriptName) {
  if (scriptName.startsWith("lint") || scriptName === "tsc") return "test";
  if (scriptName.startsWith("test")) return "test";
  if (scriptName.startsWith("start") || scriptName.startsWith("build")) {
    return "build";
  }
  return undefined;
}

function getProblemMatcherFromScriptName(scriptName) {
  if (scriptName === "lint:eslint") return ["$eslint-stylish"];
  if (scriptName === "tsc") return ["$tsc"];
  return [];
}

export default async function installVscodeTasks({ pkg }) {
  const existingConfig = readJSON5(".vscode/tasks.json");
  const existingTasks = existingConfig?.tasks || [];

  // filter all npm tasks, we will recreate them right after
  const tasks = existingTasks.filter((task) => task.type !== "npm");

  if (pkg.scripts) {
    const scriptNames = Object.keys(pkg.scripts);
    Object.entries(pkg.scripts).forEach(([scriptName, scriptCommand]) => {
      if (scriptName === "postinstall") return;
      if (scriptName === "lint") {
        tasks.push({
          label: scriptName,
          group: getGroupNameFromScriptName(scriptName),
          dependsOn: scriptNames.filter(
            (name) =>
              (name !== "lint" &&
                name.startsWith("lint") &&
                !name.endsWith(":fix")) ||
              name === "tsc",
          ),
        });
        return;
      }

      const problemMatcher = getProblemMatcherFromScriptName(scriptName);
      const task = {
        label: scriptName,
        problemMatcher,
        type: "npm",
        script: scriptName,
        group: getGroupNameFromScriptName(scriptName),
        presentation: {
          ...(problemMatcher.length > 0
            ? { close: true, revealProblems: "onProblem" }
            : {}),
          panel: "dedicated",
          group: getGroupNameFromScriptName(scriptName),
          clear: true,
        },
      };

      if (scriptName === "start" || scriptName === "watch") {
        task.isBackground = true;
      }

      tasks.push(task);
    });
  }

  fs.writeFileSync(
    ".vscode/tasks.json",
    await prettier.format(
      `{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": ${JSON.stringify(tasks)}
}
`,
      {
        filepath: ".vscode/tasks.json",
      },
    ),
  );
}
