import fs from "node:fs";
import path from "node:path";

/** Read-only access to the files of a package as they are before pob runs. */
export interface InitialFiles {
  read: (filePath: string) => string | undefined;
  readJson: <T = Record<string, unknown>>(filePath: string) => T | undefined;
  exists: (filePath: string) => boolean;
  isDirectory: (filePath: string) => boolean;
  /** a file the current user can execute */
  isExecutable: (filePath: string) => boolean;
  /** files under a directory, recursively, relative to the package */
  listFiles: (directory: string) => string[];
}

const parseJson = <T>(
  content: string | undefined,
  filePath: string,
): T | undefined => {
  if (content === undefined) return undefined;
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}`, { cause: error });
  }
};

export const createDiskFiles = (root: string): InitialFiles => {
  const resolve = (filePath: string): string => path.resolve(root, filePath);
  const read = (filePath: string): string | undefined => {
    try {
      return fs.readFileSync(resolve(filePath), "utf8");
    } catch {
      return undefined;
    }
  };
  const listFiles = (directory: string): string[] => {
    const result: string[] = [];
    const walk = (relative: string): void => {
      for (const entry of fs.readdirSync(resolve(relative), {
        withFileTypes: true,
      })) {
        const entryPath = path.posix.join(relative, entry.name);
        if (entry.isDirectory()) walk(entryPath);
        else result.push(entryPath);
      }
    };
    if (fs.existsSync(resolve(directory))) walk(directory);
    return result.toSorted();
  };
  return {
    read,
    readJson: <T>(filePath: string) => parseJson<T>(read(filePath), filePath),
    exists: (filePath) => fs.existsSync(resolve(filePath)),
    isDirectory: (filePath) => {
      try {
        return fs.statSync(resolve(filePath)).isDirectory();
      } catch {
        return false;
      }
    },
    isExecutable: (filePath) => {
      try {
        if (!fs.statSync(resolve(filePath)).isFile()) return false;
        fs.accessSync(resolve(filePath), fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    },
    listFiles,
  };
};

/** In-memory files, for step tests. */
export const createMemoryFiles = (
  files: Record<string, string>,
  executableFiles: readonly string[] = [],
): InitialFiles => {
  const normalize = (filePath: string): string =>
    path.posix.normalize(filePath).replace(/^\.\//, "").replace(/\/$/, "");
  const entries = new Map(
    Object.entries(files).map(([filePath, content]) => [
      normalize(filePath),
      content,
    ]),
  );
  const isDirectory = (filePath: string): boolean => {
    const prefix = `${normalize(filePath)}/`;
    return [...entries.keys()].some((key) => key.startsWith(prefix));
  };
  const read = (filePath: string): string | undefined =>
    entries.get(normalize(filePath));
  return {
    read,
    readJson: <T>(filePath: string) => parseJson<T>(read(filePath), filePath),
    exists: (filePath) =>
      entries.has(normalize(filePath)) || isDirectory(filePath),
    isDirectory,
    isExecutable: (filePath) =>
      entries.has(normalize(filePath)) &&
      executableFiles.some(
        (executable) => normalize(executable) === normalize(filePath),
      ),
    listFiles: (directory) => {
      const prefix = `${normalize(directory)}/`;
      return [...entries.keys()]
        .filter((key) => key.startsWith(prefix))
        .toSorted();
    },
  };
};
