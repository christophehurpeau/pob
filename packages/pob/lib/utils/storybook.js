// Fallbacks for the storybook options of a config missing them.

/**
 * @param {Record<string, any>[]} pkgs
 * @param {(name: string) => boolean} test
 */
const someDependency = (pkgs, test) =>
  pkgs.some((pkg) =>
    [pkg.dependencies, pkg.devDependencies].some(
      (dependencies) => dependencies && Object.keys(dependencies).some(test),
    ),
  );

// a web storybook depends on its framework (@storybook/react-vite,
// @storybook/nextjs...): "storybook" alone is also a dependency of the
// react-native one
const webFrameworkRegExp =
  /^@storybook\/(?:.+-(?:vite|webpack5)|nextjs|angular|ember|sveltekit)$/;

/** @param {Record<string, any>[]} pkgs */
export const detectStorybook = (pkgs) =>
  someDependency(pkgs, (name) => webFrameworkRegExp.test(name));

/** @param {Record<string, any>[]} pkgs */
export const detectStorybookReactNative = (pkgs) =>
  someDependency(pkgs, (name) => name === "@storybook/react-native");
