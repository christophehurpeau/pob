import { existsSync, rmSync } from "node:fs";

const GENERATED_MARKERS = [
  ".nojekyll",
  "assets",
  "index.html",
  "coverage.lcov",
];

/**
 * Remove the legacy generated "docs" directory, which is now "generated-docs".
 * Only removes it when it still looks generated, so that a hand-written
 * markdown "docs" directory is left untouched.
 *
 * @param {(path: string) => string} destinationPath
 */
export default function removeLegacyGeneratedDocs(destinationPath) {
  const docsPath = destinationPath("docs");
  if (!existsSync(docsPath)) return;
  if (
    !GENERATED_MARKERS.some((marker) => existsSync(`${docsPath}/${marker}`))
  ) {
    return;
  }
  rmSync(docsPath, { recursive: true, force: true });
}
