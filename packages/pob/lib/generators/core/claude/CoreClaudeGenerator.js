import Generator from "yeoman-generator";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

const claudePostToolUseHook = {
  matcher: "Edit|Write|MultiEdit",
  hooks: [{ type: "command", command: "pob-claude-run-lint-staged" }],
};

export default class CoreClaudeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("root", {
      type: Boolean,
      required: false,
      default: true,
      description: "Root package.",
    });
  }

  async writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    const claudeGitignorePath = this.destinationPath(".claude/.gitignore");
    const claudeSettingsPath = this.destinationPath(".claude/settings.json");

    if (!this.options.root) {
      this.fs.delete(claudeGitignorePath);
      this.fs.delete(claudeSettingsPath);
      return;
    }

    this.fs.write(
      claudeGitignorePath,
      "/settings.local.json\n/skills/local.*\n",
    );

    const existing = this.fs.readJSON(claudeSettingsPath, {
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|Write|MultiEdit",
            hooks: [
              {
                type: "command",
                command:
                  pkg.name === "pob-monorepo"
                    ? "node ./@pob/root/bin/pob-claude-run-lint-staged.js"
                    : "./node_modules/.bin/pob-claude-run-lint-staged",
              },
            ],
          },
        ],
      },
    });

    // Find or create the PostToolUse hook entry for our matcher
    const postToolUse = existing.hooks?.PostToolUse ?? [];

    const existingEntry = postToolUse.find(
      (entry) => entry.matcher === claudePostToolUseHook.matcher,
    );
    if (existingEntry) {
      // Add any of our hooks not already present
      for (const hook of claudePostToolUseHook.hooks) {
        if (!existingEntry.hooks?.some((h) => h.command === hook.command)) {
          (existingEntry.hooks ??= []).push(hook);
        }
      }
    } else {
      postToolUse.push(claudePostToolUseHook);
    }

    await writeAndFormatJson(this.fs, claudeSettingsPath, {
      ...existing,
      hooks: {
        ...existing.hooks,
        PostToolUse: postToolUse,
      },
    });
  }
}
