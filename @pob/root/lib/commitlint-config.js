import { RuleConfigSeverity } from "@commitlint/types";
import createConventionalPreset from "conventional-changelog-conventionalcommits";

export default {
  parserPreset: await createConventionalPreset(),
  rules: {
    "body-leading-blank": [RuleConfigSeverity.Warning, "always"],
    "body-max-line-length": [RuleConfigSeverity.Disabled],
    "footer-leading-blank": [RuleConfigSeverity.Warning, "always"],
    "footer-max-line-length": [RuleConfigSeverity.Disabled],
    "header-max-length": [RuleConfigSeverity.Disabled],
    "header-trim": [RuleConfigSeverity.Error, "always"],
    "subject-case": [
      RuleConfigSeverity.Error,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
    "subject-empty": [RuleConfigSeverity.Error, "never"],
    "subject-full-stop": [RuleConfigSeverity.Error, "never", "."],
    "type-case": [RuleConfigSeverity.Error, "always", "lower-case"],
    "type-empty": [RuleConfigSeverity.Error, "never"],
    "type-enum": [
      RuleConfigSeverity.Error,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
  },
};
