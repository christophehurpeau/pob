import { describe, expect, test } from "vitest";
import { parseGitUrl, parseRepositoryUrl } from "./misc.ts";

describe("parseGitUrl", () => {
  test.each([
    [
      "git@gitlab.mycorp.com:team/repo.git",
      { host: "gitlab.mycorp.com", segments: ["team", "repo"] },
    ],
    [
      "https://gitlab.com/group/sub/repo.git",
      { host: "gitlab.com", segments: ["group", "sub", "repo"] },
    ],
    [
      "https://gitlab-ci-token:secret@gitlab.com/o/r.git",
      { host: "gitlab.com", segments: ["o", "r"] },
    ],
    [
      "ssh://git@github.com:22/account/repo.git",
      { host: "github.com", segments: ["account", "repo"] },
    ],
    [
      "git+https://github.com/account/repo.git",
      { host: "github.com", segments: ["account", "repo"] },
    ],
    [
      "git@github.com:account/repo",
      { host: "github.com", segments: ["account", "repo"] },
    ],
  ])("%s", (url, expected) => {
    expect(parseGitUrl(url)).toEqual(expected);
  });

  test.each(["", "not a url", "https://github.com/account", "/a/b"])(
    "rejects %j",
    (url) => {
      expect(parseGitUrl(url)).toBeUndefined();
    },
  );
});

describe("parseRepositoryUrl", () => {
  test.each([
    [
      "https://github.com/account/repo.git",
      { gitHost: "github", gitAccount: "account", repoName: "repo" },
    ],
    [
      { type: "git", url: "git+https://github.com/account/repo.git" },
      { gitHost: "github", gitAccount: "account", repoName: "repo" },
    ],
    [
      "git@gitlab.com:account/repo.git",
      { gitHost: "gitlab", gitAccount: "account", repoName: "repo" },
    ],
    [
      "https://gitlab.com/group/sub/repo.git",
      { gitHost: "gitlab", gitAccount: "group/sub", repoName: "repo" },
    ],
    [
      "https://gitlab-ci-token:secret@gitlab.com/o/r.git",
      { gitHost: "gitlab", gitAccount: "o", repoName: "r" },
    ],
    [
      "https://bitbucket.org/account/repo.git",
      { gitHost: "bitbucket", gitAccount: "account", repoName: "repo" },
    ],
    // written by the init prompt of the yeoman generator
    [
      "https://bitbucket.com/account/repo.git",
      { gitHost: "bitbucket", gitAccount: "account", repoName: "repo" },
    ],
  ])("%j", (repository, expected) => {
    expect(parseRepositoryUrl(repository)).toEqual(expected);
  });

  test.each([
    // unknown host
    "git@gitlab.mycorp.com:team/repo.git",
    "https://example.com/account/repo.git",
    // github has no nested groups
    "https://github.com/a/b/c.git",
  ])("unknown or invalid: %s", (url) => {
    expect(parseRepositoryUrl(url)).toBeUndefined();
  });
});
