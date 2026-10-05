import { describe, expect, it } from "vitest";
import { getRepoName, parseRepositoryUrl } from "./git.js";

describe("getRepoName", () => {
  it("removes the scope and the monorepo suffix", () => {
    expect(getRepoName("@chapplications/stories-monorepo")).toBe("stories");
  });

  it("removes the monorepo suffix", () => {
    expect(getRepoName("pob-monorepo")).toBe("pob");
  });

  it("keeps a plain name", () => {
    expect(getRepoName("foo")).toBe("foo");
  });
});

describe("parseRepositoryUrl", () => {
  it("parses an https url", () => {
    expect(
      parseRepositoryUrl("https://github.com/christophehurpeau/pob.git"),
    ).toEqual({
      gitHost: "github",
      gitAccount: "christophehurpeau",
      repoName: "pob",
    });
  });

  it("parses an ssh url", () => {
    expect(
      parseRepositoryUrl("git@github.com:christophehurpeau/pob.git"),
    ).toEqual({
      gitHost: "github",
      gitAccount: "christophehurpeau",
      repoName: "pob",
    });
  });

  it("parses a repository object and a name with a dot", () => {
    expect(
      parseRepositoryUrl({
        type: "git",
        url: "git+https://github.com/christophehurpeau/foo.js",
      }),
    ).toEqual({
      gitHost: "github",
      gitAccount: "christophehurpeau",
      repoName: "foo.js",
    });
  });

  it("rejects a url built from a scoped package name", () => {
    expect(
      parseRepositoryUrl(
        "https://github.com/christophehurpeau/@chapplications/stories-monorepo.git",
      ),
    ).toBeUndefined();
  });

  it("rejects a url with an invalid repository name", () => {
    expect(
      parseRepositoryUrl(
        "https://github.com/christophehurpeau/@chapplications",
      ),
    ).toBeUndefined();
  });

  it("returns undefined without url", () => {
    expect(parseRepositoryUrl(undefined)).toBeUndefined();
  });
});
