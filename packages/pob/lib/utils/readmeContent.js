// Generators regenerate the header of a README and keep the hand-written body
// that follows it. The body is whatever comes after the generated header, so
// it is found by matching the header itself — not by looking for the first
// heading, which loses any prose placed right after the header, and stops early
// on a `#` or `*` inside the header (a description such as "C# client").

/* oxlint-disable regexp/no-super-linear-backtracking, regexp/match-any */

// <h1>, optional <p> description, then the packages table
const monorepoHeaderRegex =
  /^<h1 align="center">[^]*?\n<h3>📦 Packages<\/h3>\n[^|]*(?:\|[^\n]*\n)+([^]*)$/;

// <h1>, then the <p> description and badges blocks
const libHeaderRegex =
  /^<h1 align="center">[^]*?<\/h1>\n(?:\s*<p align="center">[^]*?<\/p>\n)+([^]*)$/;

const matchFirst = (content, regexes) => {
  for (const regex of regexes) {
    const match = content.match(regex);
    if (match) return match[1].trim();
  }
  return content;
};

export function extractMonorepoReadmeContent(readmeFullContent) {
  return matchFirst(readmeFullContent, [
    monorepoHeaderRegex,
    // legacy headers
    /^<h1 align="center"[^#*]+([^]+)$/,
    /^<h3 align="center"[^#*]+([^]+)$/,
    /^<h3[^#*]+([^]+)$/,
    /^#[^#*]+([^]+)$/,
  ]);
}

export function extractLibReadmeContent(readmeFullContent) {
  return matchFirst(readmeFullContent, [
    // legacy headers with badges as reference links at the end
    /^<h1 align="center"[^#*]+([^]+)\[npm-image\]:/,
    /^<h1 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
    /^<h3 align="center"[^#*]+([^]+)\[npm-image\]:/,
    /^<h3 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
    libHeaderRegex,
    // legacy headers
    /^<h1 align="center"[^#*]+([^]+)$/,
    /^<h3 align="center"[^#*]+([^]+)$/,
    /^<h3[^#*]+([^]+)$/,
    /^#[^#*]+([^]+)\[npm-image\]:/,
    /^#[^#*]+([^]+)\[daviddm-image\]:/,
    /^#[^#*]+([^]+)$/,
  ]);
}
