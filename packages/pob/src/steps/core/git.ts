import { spawnSync } from "node:child_process";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import type { GitRepository } from "./gitRepository.ts";
import {
  getGitRepository,
  getRepositoryMetadata,
  gitHostDomains,
} from "./gitRepository.ts";

const isGitRepository = (cwd: string): boolean =>
  spawnSync("git", ["rev-parse", "--git-dir"], { cwd, stdio: "ignore" })
    .status === 0;

/**
 * Without an origin remote: there may be no repository yet. The check runs
 * with the effect, an origin remote implies a repository.
 */
const planGitSetup = (
  ctx: PackageContext,
  repository: GitRepository | undefined,
): void => {
  ctx.effects.add({
    id: "git-init",
    reason: "no origin remote: the git repository may not exist",
    command: "git init",
    run: ({ cwd }) => {
      if (isGitRepository(cwd)) return;
      const result = spawnSync("git", ["init"], { cwd, stdio: "inherit" });
      if (result.status !== 0) throw new Error("git init failed");
    },
  });

  if (!repository) return;
  const remoteHost = gitHostDomains[repository.gitHost];
  const originSSH = `git@${remoteHost}:${repository.gitHostAccount}/${repository.repoName}.git`;
  ctx.effects.add({
    id: "git-remote-add",
    reason: "no origin remote",
    command: `git remote add origin ${originSSH}`,
    after: ["git-init"],
    run: ({ cwd }) => {
      const result = spawnSync("git", ["remote", "add", "origin", originSSH], {
        cwd,
        stdio: "inherit",
      });
      if (result.status !== 0) {
        console.warn(
          `git: failed to add origin, run by hand: git remote add origin ${originSSH}`,
        );
      }
    },
  });
};

/**
 * repository, homepage and bugs of a standalone package or a monorepo root
 * (pob:core:package sets them in monorepo packages).
 */
export const gitStep = defineStep<PackageContext>({
  name: "git",
  when: (ctx) => ctx.facts.isRoot,
  writes: ["pkg.homepage", "pkg.bugs", "pkg.repository"],
  run: (ctx) => {
    const { pkg } = ctx;
    const repository = getGitRepository(ctx, { warn: true });
    if (!repository) {
      if (!ctx.facts.originUrl) planGitSetup(ctx, undefined);
      return;
    }
    const homepage = pkg.get("homepage");
    const metadata = getRepositoryMetadata(repository, homepage);
    if (metadata.homepage !== homepage) pkg.set("homepage", metadata.homepage);
    pkg.set("bugs", metadata.bugs);
    pkg.set("repository", metadata.repository);

    if (!repository.hasOriginRemote) planGitSetup(ctx, repository);
  },
});
