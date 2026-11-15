import type { Tracker } from "./tracker.ts";

export interface EffectRunContext {
  /** absolute path of the directory the effect runs in */
  cwd: string;
}

export interface EffectDefinition {
  /** unique per directory: adding the same id twice merges the reasons */
  id: string;
  /** directory relative to the package, "." by default */
  cwd?: string;
  reason: string;
  /** effects that must run before this one, by id */
  after?: readonly string[];
  /** files the effect may change, which --check cannot predict */
  mayModify?: readonly string[];
  /** the command, for --check */
  command?: string;
  run: (context: EffectRunContext) => void | Promise<void>;
}

export interface PlannedEffect extends EffectDefinition {
  reasons: string[];
  owners: string[];
}

export interface EffectRegistry {
  add: (effect: EffectDefinition) => void;
  list: () => PlannedEffect[];
}

export const createEffectRegistry = (tracker: Tracker): EffectRegistry => {
  const effects = new Map<string, PlannedEffect>();
  return {
    add: (effect) => {
      const owner = tracker.current?.name ?? "engine";
      const existing = effects.get(effect.id);
      if (existing) {
        if (!existing.reasons.includes(effect.reason)) {
          existing.reasons.push(effect.reason);
        }
        if (!existing.owners.includes(owner)) existing.owners.push(owner);
        return;
      }
      effects.set(effect.id, {
        ...effect,
        reasons: [effect.reason],
        owners: [owner],
      });
    },
    list: () => [...effects.values()],
  };
};

/**
 * Orders effects by their `after` declarations, keeping the order they were
 * planned in otherwise. `after` on an effect that is not planned is ignored.
 */
export const orderEffects = <
  Effect extends { id: string; after?: readonly string[] },
>(
  effects: readonly Effect[],
): Effect[] => {
  const ids = new Set(effects.map((effect) => effect.id));
  const ordered: Effect[] = [];
  const done = new Set<string>();
  while (ordered.length < effects.length) {
    const next = effects.find(
      (effect) =>
        !done.has(effect.id) &&
        (effect.after ?? []).every((id) => !ids.has(id) || done.has(id)),
    );
    if (!next) {
      throw new Error(
        `Cycle in effect order: ${effects
          .filter((effect) => !done.has(effect.id))
          .map((effect) => effect.id)
          .join(", ")}`,
      );
    }
    ordered.push(next);
    done.add(next.id);
  }
  return ordered;
};
