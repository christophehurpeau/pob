import * as fs from "node:fs";
import simpleLib from "./index.ts";

describe("index", () => {
  it("should return hello world", () => {
    expect(simpleLib()).toBe("hello world via node");
  });
});

describe("dist", () => {
  it("should build node20 mjs", () => {
    expect(
      fs.readFileSync(
        new URL("../dist/index-node20.mjs", import.meta.url),
        "utf8",
      ),
    ).toMatchInlineSnapshot(`
      "function simpleLib() {
        return \`hello world via \${"node"}\`;
      }

      export { simpleLib as default };
      //# sourceMappingURL=index-node20.mjs.map
      "
    `);
  });
});
