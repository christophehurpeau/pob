import { describe, expect, test } from "vitest";
import { createTrackedJson } from "./model.ts";
import { defineStep } from "./step.ts";
import {
  UndeclaredAccessError,
  WriteConflictError,
  createTracker,
} from "./tracker.ts";

const step = (
  name: string,
  declarations: { reads?: string[]; writes?: string[]; overrides?: string[] },
) => defineStep<unknown>({ name, ...declarations, run: () => {} });

describe("access enforcement", () => {
  test("reading an undeclared path throws in strict mode", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson(
      "pkg",
      { scripts: { test: "vitest" } },
      tracker,
    );
    tracker.runAs(step("ci", { reads: ["pkg.scripts.test"] }), () => {
      expect(pkg.get("scripts.test")).toBe("vitest");
      expect(() => pkg.get("scripts")).toThrow(UndeclaredAccessError);
      expect(() => pkg.get("name")).toThrow(
        'step "ci" reads "pkg.name" without declaring it in its reads or writes',
      );
    });
  });

  test("writing needs a declared write", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("lint", { reads: ["pkg.scripts"] }), () => {
      expect(() => {
        pkg.set("scripts.lint", "oxlint");
      }).toThrow(
        'step "lint" writes "pkg.scripts.lint" without declaring it in its writes',
      );
    });
    tracker.runAs(step("lint", { writes: ["pkg.scripts"] }), () => {
      pkg.set("scripts.lint", "oxlint");
      expect(pkg.get("scripts.lint")).toBe("oxlint");
    });
  });

  test("wildcards cover one segment", () => {
    const tracker = createTracker({ strict: true });
    const model = createTrackedJson("oxlintrc", {}, tracker);
    tracker.runAs(step("lint", { writes: ["*.extends"] }), () => {
      model.set("extends", ["a"]);
      expect(() => {
        model.set("ignorePatterns", []);
      }).toThrow(UndeclaredAccessError);
    });
  });

  test("is not checked outside strict mode", () => {
    const tracker = createTracker({ strict: false });
    const pkg = createTrackedJson("pkg", { name: "a" }, tracker);
    tracker.runAs(step("ci", {}), () => {
      expect(pkg.get("name")).toBe("a");
    });
  });

  test("peek reads without declaration", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", { name: "a" }, tracker);
    tracker.runAs(step("ci", {}), () => {
      expect(pkg.peek("name")).toBe("a");
    });
  });
});

describe("write conflicts", () => {
  test("two steps setting different values throw", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("transpiler", { writes: ["pkg.sideEffects"] }), () => {
      pkg.set("sideEffects", true);
    });
    tracker.runAs(step("lib", { writes: ["pkg.sideEffects"] }), () => {
      expect(() => {
        pkg.set("sideEffects", false);
      }).toThrow(WriteConflictError);
    });
  });

  test("overrides allows replacing the value of another step", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("transpiler", { writes: ["pkg.sideEffects"] }), () => {
      pkg.set("sideEffects", true);
    });
    tracker.runAs(
      step("lib", { writes: ["pkg.sideEffects"], overrides: ["transpiler"] }),
      () => {
        pkg.set("sideEffects", false);
      },
    );
    expect(pkg.snapshot()).toEqual({ sideEffects: false });
  });

  test("the same value written by two steps is fine", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    for (const name of ["vite", "testing"]) {
      tracker.runAs(step(name, { writes: ["pkg.devDependencies"] }), () => {
        pkg.set("devDependencies.vite", "8.0.0");
      });
    }
    expect(pkg.snapshot()).toEqual({ devDependencies: { vite: "8.0.0" } });
  });

  test("removing a key another step writes throws", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("husky", { writes: ["pkg.devDependencies"] }), () => {
      pkg.set("devDependencies.husky", "9.0.0");
    });
    tracker.runAs(step("legacy", { writes: ["pkg.devDependencies"] }), () => {
      expect(() => {
        pkg.delete("devDependencies.husky");
      }).toThrow(
        /step "legacy" sets "pkg.devDependencies.husky" to nothing \(removed\) but step "husky" sets it to "9.0.0"/,
      );
    });
  });

  test("duplicate removals are fine", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson(
      "pkg",
      { scripts: { "lint:prettier": "prettier", test: "vitest" } },
      tracker,
    );
    for (const name of ["lint", "legacy"]) {
      tracker.runAs(step(name, { writes: ["pkg.scripts"] }), () => {
        pkg.delete("scripts.lint:prettier");
      });
    }
    expect(pkg.snapshot()).toEqual({ scripts: { test: "vitest" } });
  });

  test("a parent write conflicts with a different child value", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("a", { writes: ["pkg.engines"] }), () => {
      pkg.set("engines.node", ">=24");
    });
    tracker.runAs(step("b", { writes: ["pkg.engines"] }), () => {
      expect(() => {
        pkg.set("engines", { node: ">=22" });
      }).toThrow(WriteConflictError);
      pkg.set("engines", { node: ">=24", pnpm: ">=12" });
    });
  });
});

describe("overrides chain", () => {
  const setInSteps = (
    writes: [name: string, value: unknown, overrides?: string[]][],
    path = "sideEffects",
  ): void => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    for (const [name, value, overrides] of writes) {
      tracker.runAs(step(name, { writes: ["pkg"], overrides }), () => {
        pkg.set(path, value);
      });
    }
  };

  test("a value equal to the overriding one does not conflict with the overridden one", () => {
    expect(() => {
      setInSteps([
        ["a", 1],
        ["b", 2, ["a"]],
        ["c", 2],
      ]);
    }).not.toThrow();
  });

  test("a value different from the overriding one conflicts with it", () => {
    expect(() => {
      setInSteps([
        ["a", 1],
        ["b", 2, ["a"]],
        ["c", 3],
      ]);
    }).toThrow(
      /step "c" sets "pkg.sideEffects" to 3 but step "b" sets it to 2/,
    );
  });

  test("a value equal to the overridden one conflicts with the overriding one", () => {
    expect(() => {
      setInSteps([
        ["a", 1],
        ["b", 2, ["a"]],
        ["c", 1],
      ]);
    }).toThrow(/but step "b" sets it to 2/);
  });

  test("a child override changes the effective value of the parent write", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("a", { writes: ["pkg.engines"] }), () => {
      pkg.set("engines", { node: ">=22", pnpm: ">=10" });
    });
    tracker.runAs(
      step("b", { writes: ["pkg.engines"], overrides: ["a"] }),
      () => {
        pkg.set("engines.node", ">=24");
      },
    );
    tracker.runAs(step("c", { writes: ["pkg.engines"] }), () => {
      pkg.set("engines", { node: ">=24", pnpm: ">=10" });
      expect(() => {
        pkg.set("engines", { node: ">=22", pnpm: ">=10" });
      }).toThrow(WriteConflictError);
    });
  });
});

describe("rendering", () => {
  test("a container emptied by a removal is removed", () => {
    const tracker = createTracker({ strict: false });
    const pkg = createTrackedJson(
      "pkg",
      { scripts: { a: "a" }, jest: {} },
      tracker,
    );
    pkg.delete("scripts.a");
    expect(pkg.snapshot()).toEqual({ jest: {} });
  });

  test("records the step of each write", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createTrackedJson("pkg", {}, tracker);
    tracker.runAs(step("lint", { writes: ["pkg.scripts"] }), () => {
      pkg.set("scripts.lint", "oxlint");
    });
    expect(tracker.recordsFor(["pkg", "scripts", "lint"])).toEqual([
      {
        step: "lint",
        path: ["pkg", "scripts", "lint"],
        value: "oxlint",
        changed: true,
      },
    ]);
  });
});
