const presets = "github>christophehurpeau/renovate-presets";

/**
 * The expo preset comes last so that it overrides the rules of the default
 * preset matching the same packages.
 *
 * @param {{ app: boolean, pkgName: string | undefined, withExpo: boolean }} options
 */
export const getRenovateExtends = ({ app, pkgName, withExpo }) =>
  [
    app ? "config:js-app" : "config:js-lib",
    !app && pkgName === "pob-monorepo" ? undefined : presets,
    withExpo ? `${presets}:expo` : undefined,
  ].filter(Boolean);
