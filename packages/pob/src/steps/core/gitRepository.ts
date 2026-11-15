import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { parseRepositoryUrl } from "../../utils/misc.ts";

export interface GitRepository {
  /** first segment of the host name: github, gitlab, bitbucket */
  gitHost: string;
  gitHostAccount: string;
  repoName: string;
  /** only a real remote means the repository already exists */
  hasOriginRemote: boolean;
}

export const gitHostDomains: Record<string, string | undefined> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

/**
 * From the origin remote, or the repository of the initial package.json
 * without a remote. Without either, the old generator prompted for the host.
 */
export const getGitRepository = (
  ctx: PackageContext,
  { warn }: { warn: boolean },
): GitRepository => {
  const originUrl = ctx.facts.originUrl;
  let repository = parseRepositoryUrl(originUrl);
  if (!originUrl) {
    const pkgRepository =
      ctx.initial.readJson<JsonObject>("package.json")?.repository;
    repository = parseRepositoryUrl(pkgRepository);
    if (pkgRepository && !repository && warn) {
      ctx.warn(
        `git: ignoring invalid repository in package.json: ${JSON.stringify(pkgRepository)}`,
      );
    }
  }
  if (!repository) {
    throw new Error(
      "git: cannot find the git host: add an origin remote, or a repository in package.json",
    );
  }
  return {
    gitHost: repository.gitHost,
    gitHostAccount: repository.gitAccount,
    repoName: repository.repoName,
    hasOriginRemote: !!originUrl,
  };
};
