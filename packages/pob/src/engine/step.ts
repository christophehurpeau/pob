import { patternsOverlap } from "./paths.ts";
import type { StepDeclaration } from "./tracker.ts";

export interface StepDefinition<Context> {
  name: string;
  /** runs only when true; every step runs by default */
  when?: (ctx: Context) => boolean;
  /** tracked paths whose final value the step needs: it runs after their writers */
  reads?: readonly string[];
  /** tracked paths and `files:` outputs the step writes */
  writes?: readonly string[];
  /** steps whose writes this one may replace: it runs after them */
  overrides?: readonly string[];
  /** explicit ordering, for the rare cases not expressed by reads/writes */
  after?: readonly string[];
  run: (ctx: Context) => void | Promise<void>;
}

export interface Step<Context>
  extends StepDefinition<Context>, StepDeclaration {
  reads: readonly string[];
  writes: readonly string[];
  overrides: readonly string[];
  after: readonly string[];
}

export const defineStep = <Context>(
  definition: StepDefinition<Context>,
): Step<Context> => ({
  ...definition,
  reads: definition.reads ?? [],
  writes: definition.writes ?? [],
  overrides: definition.overrides ?? [],
  after: definition.after ?? [],
});

export interface OrderEdge {
  from: string;
  to: string;
  reason: string;
}

export class StepCycleError extends Error {
  constructor(cycle: string[], edges: OrderEdge[]) {
    const reasons = cycle
      .map((from, index) => {
        const to = cycle[(index + 1) % cycle.length] ?? from;
        const edge = edges.find(
          (candidate) => candidate.from === from && candidate.to === to,
        );
        return `  ${from} -> ${to}${edge ? ` (${edge.reason})` : ""}`;
      })
      .join("\n");
    super(`Cycle in step order:\n${reasons}`);
    this.name = "StepCycleError";
  }
}

/** Edges `from` must run before `to`, with the declaration causing them. */
export const computeOrderEdges = (
  steps: readonly Step<unknown>[],
): OrderEdge[] => {
  const edges: OrderEdge[] = [];
  const names = new Set(steps.map((step) => step.name));
  for (const step of steps) {
    for (const dependency of [...step.after, ...step.overrides]) {
      if (!names.has(dependency)) {
        throw new Error(
          `step "${step.name}" refers to unknown step "${dependency}"`,
        );
      }
      edges.push({
        from: dependency,
        to: step.name,
        reason: step.after.includes(dependency) ? "after" : "overrides",
      });
    }
    for (const writer of steps) {
      if (writer === step) continue;
      const read = step.reads.find((pattern) =>
        writer.writes.some((written) => patternsOverlap(pattern, written)),
      );
      if (read) {
        edges.push({
          from: writer.name,
          to: step.name,
          reason: `${step.name} reads ${read}`,
        });
      }
    }
  }
  return edges;
};

/**
 * A cycle among the steps that cannot run. Each of them waits on another one
 * of them, so walking back their predecessors always ends in a cycle, while
 * walking forward can end on a step that only waits on the cycle.
 */
const findCycle = (remaining: string[], edges: OrderEdge[]): string[] => {
  const remainingSet = new Set(remaining);
  const predecessor = (name: string): string | undefined =>
    edges.find((edge) => edge.to === name && remainingSet.has(edge.from))?.from;
  const start = remaining[0];
  if (start === undefined) return [];
  const path: string[] = [];
  const seen = new Map<string, number>();
  let current: string | undefined = start;
  while (current !== undefined && !seen.has(current)) {
    seen.set(current, path.length);
    path.push(current);
    current = predecessor(current);
  }
  if (current === undefined) return path.toReversed();
  const cycle = path.slice(seen.get(current)).toReversed();
  // starts at the first registered step of the cycle
  const first = remaining.find((name) => cycle.includes(name));
  const index = first === undefined ? 0 : cycle.indexOf(first);
  return [...cycle.slice(index), ...cycle.slice(0, index)];
};

/**
 * Topological order of the steps. Steps that do not depend on each other keep
 * their registration order.
 */
export const orderSteps = <Context>(
  steps: readonly Step<Context>[],
): Step<Context>[] => {
  const edges = computeOrderEdges(steps as readonly Step<unknown>[]);
  const incoming = new Map(steps.map((step) => [step.name, new Set<string>()]));
  for (const edge of edges) incoming.get(edge.to)?.add(edge.from);

  const ordered: Step<Context>[] = [];
  const done = new Set<string>();
  while (ordered.length < steps.length) {
    const next = steps.find(
      (step) =>
        !done.has(step.name) &&
        [...(incoming.get(step.name) ?? [])].every((name) => done.has(name)),
    );
    if (!next) {
      throw new StepCycleError(
        findCycle(
          steps.filter((step) => !done.has(step.name)).map((step) => step.name),
          edges,
        ),
        edges,
      );
    }
    ordered.push(next);
    done.add(next.name);
  }
  return ordered;
};
