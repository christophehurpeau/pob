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
 * From the origin remote, or the repository of a package.json without a
 * remote. Undefined for a host other than github, gitlab or bitbucket.
 * @param describe names the missing source in the error
 */
export const resolveGitRepository = (
  originUrl: string | undefined,
  pkgRepository: unknown,
  describe = "add an origin remote, or a repository in package.json",
): { repository: GitRepository | undefined; source: unknown } => {
  const source = originUrl ?? pkgRepository;
  if (!source) {
    throw new Error(`git: cannot find the git host: ${describe}`);
  }
  const repository = parseRepositoryUrl(source);
  return {
    source,
    repository: repository && {
      gitHost: repository.gitHost,
      gitHostAccount: repository.gitAccount,
      repoName: repository.repoName,
      hasOriginRemote: !!originUrl,
    },
  };
};

export const unknownHostWarning = (source: unknown): string =>
  `git: unknown git host in ${describeRepository(source)}: repository, homepage and bugs are left as they are, the github features are skipped`;

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
  const { repository, source } = resolveGitRepository(
    ctx.facts.originUrl,
    ctx.initial.readJson<JsonObject>("package.json")?.repository,
  );
  if (!repository && warn) ctx.warn(unknownHostWarning(source));
  return repository;
};

/** A custom homepage is kept, unless it points to another repository. */
const isHomepageKept = (
  homepage: unknown,
  gitHost: string,
  repositoryUrl: string,
): boolean => {
  if (!homepage || typeof homepage !== "string") return false;
  if (!homepage.startsWith(`https://${gitHost}.com/`)) return true;
  const lowerHomepage = homepage.toLowerCase();
  const lowerRepositoryUrl = repositoryUrl.toLowerCase();
  return (
    lowerHomepage === lowerRepositoryUrl ||
    lowerHomepage.startsWith(`${lowerRepositoryUrl}/`) ||
    lowerHomepage.startsWith(`${lowerRepositoryUrl}#`)
  );
};

export interface RepositoryMetadata {
  repository: string;
  homepage: unknown;
  bugs: { url: string };
}

/**
 * repository, homepage and bugs the git step writes in the package.json of a
 * standalone package or a monorepo root, from its current homepage. The
 * packages of a monorepo copy those of the root.
 */
export const getRepositoryMetadata = (
  { gitHost, gitHostAccount, repoName }: GitRepository,
  homepage: unknown,
): RepositoryMetadata => {
  // wrong for bitbucket.org, kept from the yeoman generator
  const repositoryUrl = `https://${gitHost}.com/${gitHostAccount}/${repoName}`;
  return {
    repository: `${repositoryUrl}.git`,
    homepage: isHomepageKept(homepage, gitHost, repositoryUrl)
      ? homepage
      : repositoryUrl,
    bugs: { url: `${repositoryUrl}/issues` },
  };
};
