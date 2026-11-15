import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { extractLibReadmeContent } from "../../utils/misc.ts";
import { camelCase } from "../../utils/untyped.ts";
import { getProjectKind } from "../settings.ts";
import { escapeHtml as e } from "./escape.ts";
import { getProjectLibSettings } from "./settings.ts";

export interface ReadmeOptions {
  packageName: string;
  privatePackage: boolean;
  description: string | undefined;
  gitHost: string | undefined;
  gitAccount: string | undefined;
  gitName: string | undefined;
  documentation: boolean;
  testing: boolean;
  codecov: boolean;
  ci: boolean;
  /** the hand-written body of the current README */
  content: string | undefined;
}

const renderBadges = (options: ReadmeOptions): string[] => {
  const { packageName: name, gitAccount = "", gitName = "" } = options;
  const badges: string[] = [];
  if (!options.privatePackage) {
    badges.push(
      `  <a href="https://npmjs.org/package/${e(name)}"><img src="https://img.shields.io/npm/v/${e(name)}.svg?style=flat-square" alt="npm version"></a>`,
      `  <a href="https://npmjs.org/package/${e(name)}"><img src="https://img.shields.io/npm/dw/${e(name)}.svg?style=flat-square" alt="npm downloads"></a>`,
      `  <a href="https://npmjs.org/package/${e(name)}"><img src="https://img.shields.io/node/v/${e(name)}.svg?style=flat-square" alt="node version"></a>`,
      `  <a href="https://npmjs.org/package/${e(name)}"><img src="https://img.shields.io/npm/types/${e(name)}.svg?style=flat-square" alt="types"></a>`,
    );
  }
  if (options.gitHost !== "github") return badges;
  if (options.testing && options.codecov) {
    badges.push(
      `  <a href="https://codecov.io/gh/${e(gitAccount)}/${e(gitName)}"><img src="https://img.shields.io/codecov/c/github/${e(gitAccount)}/${e(gitName)}/main.svg?style=flat-square"></a>`,
    );
  }
  if (options.documentation) {
    const documentationUrl = `https://${gitAccount}.github.io/${gitName}/`;
    badges.push(
      `  <a href="${e(documentationUrl)}"><img src="https://img.shields.io/website.svg?down_color=lightgrey&down_message=offline&up_color=blue&up_message=online&url=${e(encodeURIComponent(documentationUrl))}?style=flat-square"></a>`,
    );
  }
  return badges;
};

const renderDefaultContent = (options: ReadmeOptions): string => {
  const name = e(options.packageName);
  const camelCaseName = e(camelCase(options.packageName));
  const api =
    options.documentation && options.ci && options.gitHost === "github"
      ? `## API

[https://${e(options.gitAccount ?? "")}.github.io/${name}/](https://${e(options.gitAccount ?? "")}.github.io/${name}/)

`
      : "";
  return `## Install

\`\`\`bash
npm install --save ${name}
\`\`\`

${api}## Usage

\`\`\`js
import ${camelCaseName} from '${name}';

console.log(${camelCaseName});
\`\`\`
`;
};

/** templates/README.md.ejs of pob:lib:readme */
export const renderReadme = (options: ReadmeOptions): string => {
  const description = options.description
    ? `
<p align="center">
  ${e(options.description)}
</p>
`
    : "";
  const badges = renderBadges(options)
    .map((badge) => `${badge}\n`)
    .join("");
  return `<h1 align="center">
  ${e(options.packageName.replace(/-monorepo$/, ""))}
</h1>
${description}
<p align="center">
${badges}</p>

${options.content ? `${options.content}\n` : renderDefaultContent(options)}`;
};

const parseGitRepository = (
  repository: unknown,
): Pick<ReadmeOptions, "gitHost" | "gitAccount" | "gitName"> => {
  const url = (repository as { url?: unknown } | undefined)?.url ?? repository;
  const match =
    typeof url === "string"
      ? /^(?:git@|https?:\/\/)(?:([^./:]+)(?:\.com)?[/:])?([^/:]+)\/([^./:]+)(?:.git)?/.exec(
          url,
        )
      : null;
  return { gitHost: match?.[1], gitAccount: match?.[2], gitName: match?.[3] };
};

/** pob:lib:readme */
export const readmeStep = defineStep<PackageContext>({
  name: "lib:readme",
  when: (ctx) => getProjectKind(ctx) === "lib",
  reads: ["pkg.name", "pkg.private", "pkg.description", "pkg.repository"],
  writes: ["files:README.md"],
  run(ctx) {
    const { pkg } = ctx;
    const settings = getProjectLibSettings(ctx);
    const options: Omit<ReadmeOptions, "content"> = {
      packageName: pkg.get<string>("name") ?? "",
      privatePackage: !!pkg.get("private"),
      description: pkg.get<string>("description") || undefined,
      ...parseGitRepository(pkg.get("repository")),
      documentation: settings.documentation,
      testing: settings.testing,
      codecov: settings.codecov,
      ci: !!ctx.config.project.ci,
    };
    ctx.output.section(
      "README.md",
      (current) =>
        renderReadme({
          ...options,
          content:
            current === undefined
              ? undefined
              : extractLibReadmeContent(current),
        }),
      { format: "oxfmt" },
    );
  },
});
