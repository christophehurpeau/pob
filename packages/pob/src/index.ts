import fs from "node:fs";
import { runAdd } from "./cli/add.ts";
import type { CliCommand } from "./cli/args.ts";
import { UsageError, parseCliArgs } from "./cli/args.ts";
import { runExplain } from "./cli/explain.ts";
import { runInit } from "./cli/init.ts";
import { runMigrateToMonorepo } from "./cli/migrateToMonorepo.ts";
import { MissingAnswersError } from "./cli/questions.ts";
import { runShowConfig } from "./cli/showConfig.ts";
import { runUpdate } from "./cli/update.ts";

const usage = `Usage: pob [monorepo] [lib|app|init]
       pob [monorepo] update [from-pob] [--check [--json]]
       pob add <packageName> [--app <appType> [--testing] [--e2e]]
       pob migrate-to-monorepo
       pob explain <file>[#key]
       pob config`;

const help = `${usage}

Commands:
  lib                    Generate a library
  app                    Generate an app
  init                   Initialize the pob config (pob.json), prompting for
                         the missing keys, then update (the default command)
  update                 Regenerate files from the existing config, without prompts
  update from-pob        Same as update, without running install or build
  add <packageName>      Add a new package to the monorepo workspaces
  migrate-to-monorepo    Move the current project into packages/<name> and create a monorepo root
  explain <file>[#key]   Print the merge strategy and the steps that own a file,
                         or the steps that write a key of a merged file
                         (package.json#scripts.lint), with the config keys
                         that control them
  config                 Print the resolved config and the repository facts as JSON

  monorepo               Accepted for compatibility: the monorepo is detected
                         from the workspaces field

Options:
  --check                With update (implied when no command is given): print
                         the diffs and the effects without writing anything or
                         running anything, exit with code 1 when the plan is not empty
  --json                 With --check: print the plan as JSON
  --force                Accepted for compatibility, files are always written
  --app <appType>        With add: generate an app package without prompts
                         (alp, vite, vite-with-server, next.js, node, node-library,
                         untranspiled-library, alp-node, expo, other)
  --testing              With add --app: enable testing
  --e2e                  With add --app: enable e2e testing
  -h, --help             Show this help
  -v, --version          Show the version of pob

Without a TTY, the commands that need missing config fail and list the keys
to set in pob.json.`;

const readVersion = (): string => {
  const pkg = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string };
  return pkg.version;
};

const runCommand = (command: CliCommand, cwd: string): Promise<number> => {
  switch (command.name) {
    case "help":
      console.log(help);
      return Promise.resolve(0);
    case "version":
      console.log(readVersion());
      return Promise.resolve(0);
    case "update":
      return runUpdate({ cwd, ...command });
    case "init":
      return runInit({ cwd, type: command.type });
    case "add":
      return runAdd({
        cwd,
        packageName: command.packageName,
        app: command.app,
      });
    case "migrate-to-monorepo":
      return runMigrateToMonorepo({ cwd });
    case "explain":
      return runExplain({ cwd, argument: command.argument });
    case "config":
      return runShowConfig({ cwd });
    default:
      throw new Error("Unknown command");
  }
};

try {
  process.exitCode = await runCommand(
    parseCliArgs(process.argv.slice(2)),
    process.cwd(),
  );
} catch (error: unknown) {
  if (error instanceof UsageError) {
    console.error(error.message);
    console.error(usage);
  } else if (error instanceof MissingAnswersError) {
    console.error(error.message);
  } else {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
  }
  process.exitCode = 1;
}
