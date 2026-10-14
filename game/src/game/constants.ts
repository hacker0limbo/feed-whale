/**
 * Every gameplay constant, taken verbatim from the decompiled frame_2 script of
 * Qua01.swf (see re/REPORT.md §3).  Do not "tune" these — they are what makes the
 * port behave like the original.
 */

/** The play area, derived in the original from aqua_mc's placement. */
export const IV = {
  TOP: -1,
  BOTTOM: -1 + 300 * 1.1800995, // 353.029...
  LEFT: 0,
  RIGHT: 551 * 1.0000305, // 551.016...
  ITEM_TRANS: 1,
  SOUND_BG: 0,
  SOUND_OVER: 1,
  SOUND_ENDING: 2,
  SOUND_LEVEL: 3,
  SOUND_ITEM: 4,
  SOUND_EAT1: 5,
  SOUND_EAT2: 6,
  SOUND_EAT3: 11,
  SOUND_HIT: 8,
  SOUND_SHARKSTAGE: 9,
  SOUND_SHARK: 10,
} as const;

export const STAGE_W = 550;
export const STAGE_H = 450;
export const FPS = 30;

/** frame-2 globals */
export const SPEED_LEVEL = [0.9, 0.9, 0.88, 0.86, 0.85, 0.85, 0.85, 0.84, 0.83, 0.82];
export const EAT_LEVEL = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4];
export const SHARK_STAGE = 8;
export const NEXT_LEVEL_0 = [0, 0, 3, 3, 4, 4, 5, 6, 6, 7];
export const NEXT_LEVEL_1 = [4, 5, 3, 4, 4, 5, 5, 6, 7, 8];
export const LAST_LEVEL = NEXT_LEVEL_1.length; // 10
export const HUNGRY_LEVEL = [1.5, 2, 3, 5, 7, 9, 11, 13, 15, 17];
export const HUNGRY_UP = [4, 8, 12, 16];
export const SCORE_UP = [100, 150, 250, 300];
export const SCORE_LEVEL = 15;
export const DAMAGE_LEVEL = [16, 16, 8, 9, 10, 11, 13, 15, 17, 20];
export const SHOW_COUNT = 20;
export const X_SPEED = 1.5;
export const Y_SPEED = 1;
export const HUNGRY_SHARK = 100;
export const FISHES_TOTAL = 4;

/** Fish class statics, indexed by type-1 (index 4 = shark). */
export const FISH_HIGH_SPEED = [3, 6, 4, 9, 7];
export const FISH_LOW_SPEED = [0.5, 2, 0.5, 4, 4];
export const FISH_HIGH_RATE = [0.2, 0.5, 0.2, 0.2, 0.8];
export const FISH_CHANGE_RATE = [0.5, 0.5, 0.3, 0.8, 0.7];

/** Root-timeline placements (see re/REPORT.md §1.1). */
export const LAYOUT = {
  player: { x: 270.0, y: 167.0 },
  levelup: { x: -39.95, y: -22.75 },
  gameover: { x: 282.35, y: 266.75 },
  gameclear: { x: 274.55, y: 235.4 },
  hungryBar: { x: 50.2, y: 6.0 },
  score: { x: 413.45, y: 6.0 },
  level: { x: 66.7, y: 392.9 },
  missions: [
    { x: 165.55, y: 417.9 },
    { x: 226.5, y: 417.9 },
    { x: 302.5, y: 417.9 },
    { x: 394.45, y: 417.9 },
  ],
  eatable: { x: 198.5, y: 373.9 },
  help: { x: 274.6, y: 224.2 },
  introButtons: { start: { x: 275.95, y: 345.0 }, help: { x: 380.95, y: 345.0 } },
} as const;

/** Sprite folder names, named after what they are in the game. */
export const ART = {
  player: "DefineSprite_204",
  /** whale animation banks, level 1..10 (frames: idle, swim, eat, hurt, dead) */
  whaleAni: [
    "DefineSprite_101", "DefineSprite_115", "DefineSprite_126", "DefineSprite_137",
    "DefineSprite_148", "DefineSprite_159", "DefineSprite_170", "DefineSprite_181",
    "DefineSprite_192", "DefineSprite_203",
  ],
  enemy: "DefineSprite_30_enemy",
  /** fish swim loops for types 2, 3, 4 (type 1 has no sub-animation) */
  fishAni: { 2: "DefineSprite_17", 3: "DefineSprite_24", 4: "DefineSprite_29" },
  shark: "DefineSprite_10_shark",
  sharkAni: "DefineSprite_7",
  item: "DefineSprite_33_item",
  bubble: "DefineSprite_56_boggle",
  digit: "DefineSprite_54_scorenum",
  hungryBar: "DefineSprite_230",
  eatable: "DefineSprite_89",
  levelup: "DefineSprite_206",
  /** NOT usable: its face is the imported bitmap @gameover02, which ffdec can only
   *  render as a red placeholder.  Game.buildGameOverCard() rebuilds it. */
  gameover: "DefineSprite_215",
  gameclear: "DefineSprite_221",
  /** NOT usable, same reason as `gameover` (imported bitmap @howto).
   *  Game.buildHelpPanel() rebuilds it. */
  help: "DefineSprite_64",
  light: "DefineSprite_104",
  background: "79",
  plantLeft: "222",
  plantRight: "224",
} as const;

export function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
