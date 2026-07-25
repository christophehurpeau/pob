import { isDeepStrictEqual } from "node:util";

export const apply = ({
  filesOverridesIf = [],
  extensions = "{js,cjs,mjs}",
  files = [`**/*.${extensions}`],
  configs,
  mode = "throw-if-files-exists",
}) => {
  return configs.map((config) => {
    switch (mode) {
      case "keep-files-if-exists": {
        return {
          ...config,
          files: config.files || files,
        };
      }
      case "throw-if-files-exists": {
        if (config.files) {
          if (
            !filesOverridesIf.some((filesOverrides) =>
              isDeepStrictEqual(filesOverrides, config.files),
            )
          ) {
            console.log({ filesOverridesIf });
            throw new Error(
              `"files" already exists: ${JSON.stringify(config.files)} for ${config.name ? `"${config.name}"` : "unknown"}`,
            );
          }
        }

        return {
          ...config,
          files,
        };
      }
      case "keep-extension": {
        if (!Array.isArray(files)) {
          throw new TypeError(`apply: "files" should be an array: ${files}`);
        }
        if (files.length !== 1) {
          throw new Error(
            `apply: "files" should have only one element: ${files}`,
          );
        }
        if (!files[0].startsWith("**/")) {
          throw new Error(`apply: "files" should start with "**/": ${files}`);
        }

        return {
          ...config,
          files: config.files.map((filesGlob) => {
            if (!filesGlob.startsWith("**/")) {
              throw new Error(
                `"files" should start with "**/": ${config.files} for ${config.name ? `"${config.name}"` : JSON.stringify(config)}`,
              );
            }
            return files[0] + filesGlob.slice(3);
          }),
        };
      }
      case "add-extensions": {
        return {
          ...config,
          files: config.files
            ? config.files.map((filesGlob) => {
                if (filesGlob.endsWith("/**")) {
                  return `${filesGlob}/*.${extensions}`;
                }
                throw new Error(
                  `apply: "files" should end with "/**": ${filesGlob} for ${config.name ? `"${config.name}"` : JSON.stringify(config)}`,
                );
              })
            : files,
        };
      }
      case "directory": {
        if (files.length !== 1) {
          throw new Error(
            `apply: "files" should have only one element: ${files}`,
          );
        }
        return {
          ...config,
          files: config.files
            ? config.files.map((fileGlob) => files[0] + fileGlob)
            : [`${files[0]}**/*.${extensions}`],
        };
      }

      default:
        throw new Error('apply: "mode" is invalid');
    }
  });
};
