import * as fs from "node:fs";
import { describe, expect, it } from "vitest";
// import simpleLib from './index.js';
// describe('index', () => {
//   it('should return hello world', () => {
//     expect(simpleLib()).toBe('hello world via typescript');
//   });
// });
describe("dist", () => {
    it("should build index.js", () => {
        expect(fs.readFileSync(new URL("../dist/index.js", import.meta.url), "utf8")).toMatchSnapshot();
    });
});
//# sourceMappingURL=index.test.js.map