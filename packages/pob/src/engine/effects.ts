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
  /**
   * planned on every update whatever changed (the github settings sync):
   * --check lists it, but it does not make --check fail
   */
  everyUpdate?: boolean;
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

interface OrderableEffect {
  id: string;
  /** package location: ids are unique per package, "." by default */
  location?: string;
  after?: readonly string[];
}

const effectKey = (effect: OrderableEffect): string =>
  `${effect.location ?? "."}#${effect.id}`;

/**
 * Orders effects by their `after` declarations, keeping the order they were
 * planned in otherwise. An id in `after` refers to the effect of the same
 * package, or, when the package does not plan it, to the effects with this id
 * in every package (the install of a monorepo runs at the root). `after` on
 * an effect that is not planned is ignored.
 */
export const orderEffects = <Effect extends OrderableEffect>(
  effects: readonly Effect[],
): Effect[] => {
  const keys = new Set(effects.map(effectKey));
  const dependencies = new Map(
    effects.map((effect) => [
      effect,
      (effect.after ?? []).flatMap((id) => {
        const sameLocation = effectKey({ id, location: effect.location });
        if (keys.has(sameLocation)) return [sameLocation];
        return effects
          .filter((other) => other.id === id)
          .map((other) => effectKey(other));
      }),
    ]),
  );
  const ordered: Effect[] = [];
  const done = new Set<string>();
  while (ordered.length < effects.length) {
    const next = effects.find(
      (effect) =>
        !done.has(effectKey(effect)) &&
        (dependencies.get(effect) ?? []).every((key) => done.has(key)),
    );
    if (!next) {
      throw new Error(
        `Cycle in effect order: ${effects
          .filter((effect) => !done.has(effectKey(effect)))
          .map((effect) => effectKey(effect))
          .join(", ")}`,
      );
    }
    ordered.push(next);
    done.add(effectKey(next));
  }
  return ordered;
};
