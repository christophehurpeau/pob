import { after, describe, it } from "node:test";
import { RuleTester } from "@typescript-eslint/rule-tester";

RuleTester.afterAll = after;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

// eslint-disable-next-line unicorn/prefer-export-from -- because we modify it, it is clearer if we export the modified version even if it has no impact.
export { RuleTester };
