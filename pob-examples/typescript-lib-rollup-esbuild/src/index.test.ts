import * as fs from "node:fs";
// import simpleLib from './index.js';

// describe('index', () => {
//   it('should return hello world', () => {
//     expect(simpleLib()).toBe('hello world via typescript');
//   });
// });

describe("dist", () => {
  it("should build index.mjs", () => {
    expect(
      fs.readFileSync(
        new URL("../dist/index-node20.mjs", import.meta.url),
        "utf8",
      ),
      // note that inline snapshot does not work with ESM currently
    ).toMatchSnapshot();
  });
});
