import fs from "node:fs/promises";

const COMMIT_GUIDELINE =
  "See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.";

const CHANGELOG_HEADER = [
  "# Changelog",
  "",
  "All notable changes to this project will be documented in this file.",
  COMMIT_GUIDELINE,
  "",
].join("\n");

export const updateChangelogFile = async (
  versionChangelogContent: string,
  tagPrefix: string,
  file = "CHANGELOG.md",
): Promise<void> => {
  const START_OF_LAST_RELEASE_PATTERN = new RegExp(
    `(^#+ \\[?(?:${tagPrefix})?\\d+\\.\\d+\\.\\d+|<a name=)`,
    "m",
  );

  let oldContent = "";

  try {
    oldContent = await fs.readFile(file, "utf8");
    const oldContentStart = oldContent.search(START_OF_LAST_RELEASE_PATTERN);
    // find the position of the last release and remove header:
    if (oldContentStart !== -1) {
      oldContent = oldContent.slice(Math.max(0, oldContentStart));
    }
  } catch {}

  await fs.writeFile(
    file,
    `${CHANGELOG_HEADER}\n${versionChangelogContent}\n${oldContent}`,
  );
};
