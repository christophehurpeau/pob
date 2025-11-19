import * as fs from "node:fs";
import { describe, expect, it } from "vitest"; // import simpleLib from './index.js';

// describe('index', () => {
//   it('should return hello world', () => {
//     expect(simpleLib()).toBe('hello world via typescript');
//   });
// });

describe("dist", () => {
  it("should build index-node22.mjs", () => {
    expect(
      fs.readFileSync(
        new URL("../dist/index-node22.mjs", import.meta.url),
        "utf8",
      ),
      // note that inline snapshot does not work with ESM currently
    ).toMatchSnapshot();
  });
});
