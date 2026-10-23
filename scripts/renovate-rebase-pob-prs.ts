#!/usr/bin/env node
/**
 * Ask renovate to rebase its open pob PRs (by ticking the rebase checkbox), so
 * commits are recreated with the latest pob version.
 *
 * Usage: node scripts/renovate-rebase-pob-prs.ts [--owner <owner>] [--filter <regexp>] [--dry-run]
 */
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

interface PullRequest {
  id: string;
  number: number;
  body: string;
  repository: { nameWithOwner: string };
}

const { values } = parseArgs({
  options: {
    owner: { type: "string" },
    filter: { type: "string", default: "pob" },
    "dry-run": { type: "boolean", default: false },
  },
});

const gh = (args: string[]): string =>
  execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const graphql = <T>(query: string): T =>
  JSON.parse(gh(["api", "graphql", "-f", `query=${query}`])).data;

const owner = values.owner ?? gh(["api", "user", "--jq", ".login"]).trim();
const titleFilter = new RegExp(values.filter, "i");

const UNCHECKED = "- [ ] <!-- rebase-check -->";
const CHECKED = "- [x] <!-- rebase-check -->";

const prs: PullRequest[] = [];
let cursor: string | null = null;
do {
  const data = graphql<{
    search: {
      pageInfo: { hasNextPage: boolean; endCursor: string };
      nodes: (PullRequest & { title: string })[];
    };
  }>(`query {
    search(type: ISSUE, first: 100${cursor ? `, after: "${cursor}"` : ""}, query: "is:pr is:open author:app/renovate user:${owner}") {
      pageInfo { hasNextPage endCursor }
      nodes { ... on PullRequest { id number title body repository { nameWithOwner } } }
    }
  }`);
  prs.push(...data.search.nodes.filter((pr) => titleFilter.test(pr.title)));
  cursor = data.search.pageInfo.hasNextPage
    ? data.search.pageInfo.endCursor
    : null;
} while (cursor);

const toRebase = prs.filter((pr) => pr.body.includes(UNCHECKED));
const skipped = prs.filter((pr) => !pr.body.includes(UNCHECKED));

for (const pr of skipped) {
  const reason = pr.body.includes(CHECKED)
    ? "rebase already requested"
    : "no rebase checkbox";
  console.log(`skip ${pr.repository.nameWithOwner}#${pr.number}: ${reason}`);
}

if (values["dry-run"] || toRebase.length === 0) {
  for (const pr of toRebase) {
    console.log(`would rebase ${pr.repository.nameWithOwner}#${pr.number}`);
  }
} else {
  const chunkSize = 25;
  for (let i = 0; i < toRebase.length; i += chunkSize) {
    const chunk = toRebase.slice(i, i + chunkSize);
    graphql(`mutation {
      ${chunk
        .map(
          (pr, index) =>
            `pr${index}: updatePullRequest(input: { pullRequestId: "${pr.id}", body: ${JSON.stringify(pr.body.replace(UNCHECKED, CHECKED))} }) { clientMutationId }`,
        )
        .join("\n")}
    }`);
    for (const pr of chunk) {
      console.log(
        `rebase requested ${pr.repository.nameWithOwner}#${pr.number}`,
      );
    }
  }
}
