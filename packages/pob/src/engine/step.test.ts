import { describe, expect, test } from "vitest";
import {
  StepCycleError,
  computeOrderEdges,
  defineStep,
  orderSteps,
} from "./step.ts";

const step = (
  name: string,
  declarations: {
    reads?: string[];
    writes?: string[];
    after?: string[];
    overrides?: string[];
  } = {},
) => defineStep<unknown>({ name, ...declarations, run: () => {} });

const names = (steps: { name: string }[]): string[] =>
  steps.map(({ name }) => name);

describe("orderSteps", () => {
  test("runs a reader after the writers of what it reads", () => {
    const ci = step("ci", { reads: ["pkg.scripts.test"] });
    const testing = step("testing", { writes: ["pkg.scripts.test"] });
    expect(names(orderSteps([ci, testing]))).toEqual(["testing", "ci"]);
  });

  test("a write of a parent path orders the readers of its children", () => {
    const readme = step("readme", { reads: ["pkg.repository"] });
    const git = step("git", { writes: ["pkg"] });
    expect(names(orderSteps([readme, git]))).toEqual(["git", "readme"]);
  });

  test("a read of a parent path waits for writers of its children", () => {
    const npm = step("npm", { reads: ["pkg.exports"] });
    const app = step("app", { writes: ["pkg.exports.*"] });
    expect(names(orderSteps([npm, app]))).toEqual(["app", "npm"]);
  });

  test("keeps the registration order of independent steps", () => {
    const a = step("a", { writes: ["pkg.scripts.a"] });
    const b = step("b", { writes: ["pkg.scripts.b"] });
    const c = step("c", { reads: ["pkg.scripts.a"] });
    expect(names(orderSteps([c, b, a]))).toEqual(["b", "a", "c"]);
  });

  test("files: patterns use globs", () => {
    const writer = step("writer", {
      writes: ["files:packages/*/tsconfig.json"],
    });
    const reader = step("reader", {
      reads: ["files:packages/a/tsconfig.json"],
    });
    expect(names(orderSteps([reader, writer]))).toEqual(["writer", "reader"]);
  });

  test("after and overrides order steps", () => {
    const transpiler = step("transpiler", { writes: ["pkg.sideEffects"] });
    const lib = step("lib", {
      writes: ["pkg.sideEffects"],
      overrides: ["transpiler"],
    });
    const node = step("node", { after: ["lib"] });
    expect(names(orderSteps([node, lib, transpiler]))).toEqual([
      "transpiler",
      "lib",
      "node",
    ]);
  });

  test("reports a cycle with the declarations causing it", () => {
    const a = step("a", { reads: ["pkg.b"], writes: ["pkg.a"] });
    const b = step("b", { reads: ["pkg.a"], writes: ["pkg.b"] });
    expect(() => orderSteps([a, b])).toThrow(StepCycleError);
    expect(() => orderSteps([a, b])).toThrow(
      /a -> b \(b reads pkg\.a\)\n {2}b -> a \(a reads pkg\.b\)/,
    );
  });

  test("refuses an unknown step in after", () => {
    expect(() =>
      computeOrderEdges([step("a", { after: ["missing"] })]),
    ).toThrow('step "a" refers to unknown step "missing"');
  });
});
