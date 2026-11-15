import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import type { KnownGitHost } from "../../utils/misc.ts";
import { parseRepositoryUrl } from "../../utils/misc.ts";
import { redactUrls } from "../../utils/redactUrl.ts";

export interface GitRepository {
  gitHost: KnownGitHost;
  /** account or organization, nested groups joined by / on gitlab */
  gitHostAccount: string;
  repoName: string;
  /** only a real remote means the repository already exists */
  hasOriginRemote: boolean;
}

export const gitHostDomains: Record<KnownGitHost, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

const describeRepository = (repository: unknown): string =>
  redactUrls(
    typeof repository === "string" ? repository : JSON.stringify(repository),
  );

/**
 * From the origin remote, or the repository of the initial package.json
 * without a remote. Undefined, with a warning when `warn`, for a host other
 * than github, gitlab or bitbucket: the steps then leave repository, homepage
 * and bugs as they are and skip the features of the host.
 */
export const getGitRepository = (
  ctx: PackageContext,
  { warn }: { warn: boolean },
): GitRepository | undefined => {
  const originUrl = ctx.facts.originUrl;
  const source =
    originUrl ?? ctx.initial.readJson<JsonObject>("package.json")?.repository;
  if (!source) {
    throw new Error(
      "git: cannot find the git host: add an origin remote, or a repository in package.json",
    );
  }
  const repository = parseRepositoryUrl(source);
  if (!repository) {
    if (warn) {
      ctx.warn(
        `git: unknown git host in ${describeRepository(source)}: repository, homepage and bugs are left as they are, the github features are skipped`,
      );
    }
    return undefined;
  }
  return {
    gitHost: repository.gitHost,
    gitHostAccount: repository.gitAccount,
    repoName: repository.repoName,
    hasOriginRemote: !!originUrl,
  };
};
