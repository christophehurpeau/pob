import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import createRollupConfig from "./createRollupConfig.js";

describe("fixtures", () => {
  const testsPath = `${fileURLToPath(new URL("../test", import.meta.url))}/`;
  const tests = fs.readdirSync(testsPath);

  tests.forEach((dirname) => {
    // eslint-disable-next-line jest/valid-title
    describe(dirname, () => {
      const cwd = testsPath + dirname;
      process.chdir(cwd);
      const configs = createRollupConfig({
        cwd: testsPath + dirname,
      });

      configs.forEach((config, index) => {
        // eslint-disable-next-line jest/valid-title
        test(String(index), async () => {
          // TODO: configure browserslist
          const bundle = await rollup(config);
          const {
            output: [{ code: actual }],
          } = await bundle.generate({ format: "esm" });

          expect(actual).toMatchSnapshot();
        });
      });
    });
  });
});
