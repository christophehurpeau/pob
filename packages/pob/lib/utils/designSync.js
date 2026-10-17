/**
 * Whether the project uses Claude Design sync: its tracked config lives in
 * ".design-sync", next to the untracked ".ds-sync" cache and "ds-bundle"
 * build output.
 *
 * @param {import("yeoman-generator").default} generator
 */
export default function hasDesignSync(generator) {
  return generator.fs.exists(
    generator.destinationPath(".design-sync/config.json"),
  );
}
