/**
 * Player-facing options.
 *
 * None of this exists in the original SWF — it had no settings, no pause and no
 * cheats.  Everything that changes how the game plays defaults to the original
 * behaviour, so a player who never opens this panel gets a faithful port.
 */
import { LAST_LEVEL } from "./game/constants";

export interface Settings {
  // --- sound ---
  music: boolean;
  sfx: boolean;
  // --- presentation of the additions themselves ---
  showStick: boolean;
  // --- cheats ---
  /** Take no damage from fish or sharks. */
  god: boolean;
  /** Permanent transparence item: dim, immune, and sharks stop hunting you. */
  invisible: boolean;
  /** Hunger never drains, so a round has no time limit. */
  noHunger: boolean;
  /** Ignore the size rule; even sharks become edible. */
  eatAnything: boolean;
  /** Level to jump to, and the level the next round starts on (1..10). */
  level: number;
}

export const DEFAULTS: Readonly<Settings> = {
  music: true,
  sfx: true,
  showStick: true,
  god: false,
  invisible: false,
  noHunger: false,
  eatAnything: false,
  level: 1,
};

const KEY = "feedwhale.settings";

/** Every switch in the panel is a boolean; only `level` is numeric. */
export type ToggleKey = Exclude<keyof Settings, "level">;

/** The cheat switches, in the order the panel lists them. */
export const CHEAT_KEYS = ["god", "invisible", "noHunger", "eatAnything"] as const;
export type CheatKey = (typeof CHEAT_KEYS)[number];

export const CHEAT_LABELS: Record<CheatKey, { title: string; hint: string }> = {
  god: { title: "无敌", hint: "撞到大鱼和鲨鱼都不掉血" },
  invisible: { title: "永久隐身", hint: "常驻道具效果，鲨鱼也不会追你" },
  noHunger: { title: "饥饿不减", hint: "饥饿条不再下降，时间无限" },
  eatAnything: { title: "吃任何鱼", hint: "无视体型，连鲨鱼也能吃" },
};

type Listener = (settings: Settings, changed: keyof Settings) => void;

function clampLevel(n: number): number {
  if (!Number.isFinite(n)) return DEFAULTS.level;
  return Math.max(1, Math.min(LAST_LEVEL, Math.round(n)));
}

export class SettingsStore {
  private values: Settings = { ...DEFAULTS };
  private listeners = new Set<Listener>();

  constructor() {
    this.load();
  }

  get all(): Readonly<Settings> {
    return this.values;
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.values[key];
  }

  /** True when any cheat is on, for the "this run was assisted" note. */
  get anyCheatOn(): boolean {
    return CHEAT_KEYS.some((k) => this.values[k]);
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const next = key === "level" ? (clampLevel(value as number) as Settings[K]) : value;
    if (this.values[key] === next) return;
    this.values[key] = next;
    this.save();
    for (const fn of this.listeners) fn(this.values, key);
  }

  toggle(key: ToggleKey): void {
    this.values[key] = !this.values[key];
    this.save();
    for (const fn of this.listeners) fn(this.values, key);
  }

  setLevel(n: number): void {
    this.set("level", clampLevel(n));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      // merge field by field so a stale or hand-edited blob cannot inject junk
      const merged: Settings = { ...DEFAULTS };
      const loose = parsed as Record<string, unknown>;
      for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
        if (typeof loose[key] === typeof DEFAULTS[key]) {
          Object.assign(merged, { [key]: loose[key] });
        }
      }
      merged.level = clampLevel(merged.level);
      this.values = merged;
    } catch {
      /* unreadable storage: keep the defaults */
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.values));
    } catch {
      /* storage unavailable; the session still works */
    }
  }
}

export const settings = new SettingsStore();
