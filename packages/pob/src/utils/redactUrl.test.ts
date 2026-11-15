import { describe, expect, test } from "vitest";
import { redactUrls } from "./redactUrl.ts";

describe("redactUrls", () => {
  test.each([
    [
      "https://gitlab-ci-token:abc123@gitlab.com/o/r.git",
      "https://***@gitlab.com/o/r.git",
    ],
    [
      "origin: git+https://token@github.com/a/b.git, other: ssh://u:p@host/x",
      "origin: git+https://***@github.com/a/b.git, other: ssh://***@host/x",
    ],
    ["git@github.com:a/b.git", "git@github.com:a/b.git"],
    ["https://github.com/a/b.git", "https://github.com/a/b.git"],
    ["mail a@b.c", "mail a@b.c"],
  ])("%s", (text, expected) => {
    expect(redactUrls(text)).toBe(expected);
  });
});
