import { parseArgs } from "node:util";
import type { AddAppOptions } from "./add.ts";
import { appTypes } from "./questions.ts";

export type CliCommand =
  | { name: "help" }
  | { name: "version" }
  | { name: "update"; check: boolean; json: boolean; fromPob: boolean }
  | { name: "init"; type: "lib" | "app" | undefined }
  | { name: "add"; packageName: string; app: AddAppOptions | undefined }
  | { name: "migrate-to-monorepo" }
  | { name: "explain"; argument: string }
  | { name: "config" };

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

interface ParsedOptions {
  values: {
    check: boolean;
    json: boolean;
    force: boolean;
    help: boolean;
    version: boolean;
    app?: string;
    testing: boolean;
    e2e: boolean;
  };
  positionals: string[];
}

/** `monorepo` and `lerna` forced the monorepo mode: it is detected now */
const monorepoPrefixes = new Set(["monorepo", "lerna"]);

const parseOptions = (argv: readonly string[]): ParsedOptions => {
  try {
    return parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        check: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        force: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
        app: { type: "string" },
        testing: { type: "boolean", default: false },
        e2e: { type: "boolean", default: false },
      },
    });
  } catch (error: unknown) {
    throw new UsageError((error as Error).message);
  }
};

export const parseCliArgs = (argv: readonly string[]): CliCommand => {
  const { values, positionals } = parseOptions(argv);
  if (values.help || positionals[0] === "help") return { name: "help" };
  if (values.version) return { name: "version" };

  const args = monorepoPrefixes.has(positionals[0] ?? "")
    ? positionals.slice(1)
    : positionals;
  const [action = values.check ? "update" : "init", ...rest] = args;

  if (values.check && action !== "update") {
    throw new UsageError("--check can only be used with update");
  }
  if (values.json && !values.check) {
    throw new UsageError("--json can only be used with --check");
  }

  switch (action) {
    case "update":
      if (rest.length > 0 && rest[0] !== "from-pob") {
        throw new UsageError(`Unexpected arguments: ${rest.join(" ")}`);
      }
      return {
        name: "update",
        check: values.check,
        json: values.json,
        fromPob: rest[0] === "from-pob",
      };
    case "init":
      return { name: "init", type: undefined };
    case "lib":
    case "app":
      return { name: "init", type: action };
    case "add": {
      const [packageName] = rest;
      if (!packageName) throw new UsageError("Missing argument: packageName");
      if (values.app && !(appTypes as readonly string[]).includes(values.app)) {
        throw new UsageError(
          `Invalid --app: ${values.app}, expected one of ${appTypes.join(", ")}`,
        );
      }
      return {
        name: "add",
        packageName,
        app: values.app
          ? { type: values.app, testing: values.testing, e2e: values.e2e }
          : undefined,
      };
    }
    case "migrate-to-monorepo":
      return { name: "migrate-to-monorepo" };
    case "explain": {
      const [argument] = rest;
      if (!argument) throw new UsageError("Missing argument: <file>[#key]");
      return { name: "explain", argument };
    }
    case "config":
      return { name: "config" };
    default:
      throw new UsageError(`Unknown command: ${action}`);
  }
};
