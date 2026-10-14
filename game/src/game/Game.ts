/**
 * The port of Qua01.swf's frame-2 script.
 *
 * Everything here is transliterated from the decompiled ActionScript (see
 * re/REPORT.md for the section numbers cited in the comments).  Names, ordering and
 * numeric literals follow the original; where the port deliberately differs it is
 * called out in a comment.
 */
import type { Assets } from "../assets";
import { Clip, Stage } from "../flash/Stage";
import type { SettingsStore } from "../settings";
import type { FrameArt } from "../flash/Stage";
import { SoundMaster } from "../flash/SoundMaster";
import {
  ART, DAMAGE_LEVEL, EAT_LEVEL, FISHES_TOTAL, FISH_CHANGE_RATE, FISH_HIGH_RATE,
  FISH_HIGH_SPEED, FISH_LOW_SPEED, HUNGRY_LEVEL, HUNGRY_SHARK, HUNGRY_UP, IV,
  LAST_LEVEL, LAYOUT, NEXT_LEVEL_0, NEXT_LEVEL_1, SCORE_LEVEL, SCORE_UP,
  SHOW_COUNT, SPEED_LEVEL, X_SPEED, Y_SPEED, rnd,
} from "./constants";

/** Whale hit-box: sprite 9's art size, scaled per level (§1.3). */
const HIT_W = 63;
const HIT_H = 123;
const WHALE_HIT_SCALE: [number, number][] = [
  [0.2492, 0.3294], [0.2819, 0.3834], [0.3825, 0.4791], [0.4122, 0.5334],
  [0.4792, 0.6429], [0.4749, 0.6650], [0.4805, 0.7118], [0.5417, 0.7674],
  [0.5486, 0.8294], [0.6047, 0.9145],
];
const WHALE_ANI_OFFSET: [number, number][] = [
  [-23, -13], [-27.5, -15.5], [-32.5, -17.5], [-37, -20], [-42, -22.5],
  [-47, -25.5], [-52, -27.5], [-57, -30], [-62, -32.5], [-67, -35],
];
/**
 * Where each swim loop sits inside the `enemy`/`shark` sprite (REPORT.md §1.4).
 * The composites that ffdec exports bake the loop's first pose in, so the body
 * art is suppressed and the live loop is placed at these offsets instead.
 */
const FISH_ANI_OFFSET: Record<number, [number, number]> = {
  2: [-3.35, -3.4],
  3: [3.75, 0.5],
  4: [2.95, 1.55],
};
const SHARK_ANI_OFFSET: [number, number] = [-84.55, -50.55];

const FISH_HIT = { w: HIT_W * 0.1639, h: HIT_H * 0.2592 };

/** retry_btn / intro_btn inside the card face (REPORT.md §1.7), face-relative.
 *  These are the buttons' *centres*: the RES art registers on its centre. */
const GAMEOVER_BTN = [
  { x: 59.15, y: 79.45 },
  { x: 159.15, y: 79.45 },
];
/** Size of the game-over buttons, for hit testing. */
const BTN_W = 98;
const BTN_H = 38;

/** "Go to top" button inside the clear card (REPORT.md §1.7); again its centre. */
const CLEAR_BTN = { x: 111.1, y: 132.65 };

/**
 * The play area's mask, straight out of shape 90 in the SWF: the water body, whose
 * bottom edge curves down to y=380.7 in the middle and back up to y=338 at the
 * sides.  In the original this shape sits at depth 9 with `clipDepth = 73`, which
 * hides everything drawn at depths 10..73 — the whale, level-up burst, bubbles and
 * fish — outside it, while the HUD at depth 91+ and the cards at 74/77 stay clear.
 */
const WATER_MASK = new Path2D("M550 -1 L550 340 Q265.05 380.7 0 338 L0 -1 Z");

/** The how-to panel's open animation, frames 1..9 (REPORT.md §1.7). */
const HELP_FROM = { x: 59.4, y: -106.6 };
const HELP_TO = { x: -77, y: -211 };
const HELP_WOBBLE = [0.2, 0.4, 0.6, 0.8, 1.0, 0.9725, 0.945, 0.9725, 1.0];

/** Stand-ins for art the SWF gets from elsewhere: a 1x1 transparent frame and a
 *  full-stage black overlay (the game-over card's dimmer). */
const TRANSPARENT_FRAME = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  return { image: c as CanvasImageSource, originX: 0, originY: 0, w: 1, h: 1 };
})();
const BLACK_FRAME = (() => {
  const c = document.createElement("canvas");
  c.width = 550;
  c.height = 450;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 550, 450);
  return { image: c as CanvasImageSource, originX: 0, originY: 0, w: 550, h: 450 };
})();
const SHARK_HIT = { w: HIT_W * 0.7133, h: HIT_H * 0.8176 };
/** The item clip carries its own, larger hitArea (REPORT.md §1.5). */
const ITEM_HIT = { w: HIT_W * 0.274, h: HIT_H * 0.5098 };

/** How far the pickup drifts left each frame: `this._x -= 3` in the original. */
const ITEM_DRIFT = 3;

/**
 * The cards' backdrop is shape 209, whose fill is `#000000` at
 * `fill-opacity="0.3019608"` -- a *slight* dim, not a blackout.
 */
const CARD_DIM_ALPHA = 0.3019608 * 100;

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function overlap(a: Box, b: Box): boolean {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

/** Flash `mx.transitions.Tween` with `easing.Regular.easeIn` (= linear). */
class Tween {
  private elapsed = 0;
  onMotionChanged: ((t: Tween) => void) | null = null;
  onMotionFinished: ((t: Tween) => void) | null = null;
  time = 0;

  constructor(
    public target: { y: number },
    private from: number,
    private to: number,
    private durationFrames: number,
  ) {}

  step(): boolean {
    this.elapsed++;
    this.time = this.elapsed / this.durationFrames;
    const k = Math.min(1, this.time);
    this.target.y = this.from + (this.to - this.from) * k;
    this.onMotionChanged?.(this);
    if (k >= 1) {
      this.onMotionFinished?.(this);
      return false;
    }
    return true;
  }
}

/** `nhn.game.Digit`/`DigitSet` — a right-aligned run of bitmap digits. */
class DigitStrip {
  readonly clips: Clip[] = [];
  private value = 0;

  constructor(
    digits: FrameArt[],
    private width: number,
    parent: Clip,
    x: number,
    y: number,
    pitch = 14,
  ) {
    for (let i = 0; i < width; i++) {
      const c = new Clip(`digit${i}`, digits);
      c.x = x + i * pitch;
      c.y = y;
      c.gotoAndStop(1);
      this.clips.push(parent.add(c));
    }
    this.number = 0;
  }

  set number(v: number) {
    this.value = Math.max(0, Math.floor(v));
    const s = String(this.value).padStart(this.width, "0").slice(-this.width);
    for (let i = 0; i < this.width; i++) {
      // Digit does gotoAndStop(n+1); number = _currentframe - 1  (§9.5)
      this.clips[i].gotoAndStop(Number(s[i]) + 1);
    }
  }

  get number(): number {
    return this.value;
  }
}

/** The enemy/fish/shark/item clip, matching `Fish` in __Packages/Fish.as (§4). */
class Fish extends Clip {
  type = 1;
  shark = false;
  count = 0;
  getaway = false;
  dir = 1;
  high = true;
  itemType: number | undefined;
  ani: Clip | null = null;

  // wired by the game
  onTick: ((f: Fish) => void) | null = null;
  private game: Game;

  constructor(game: Game, art: FrameArt[], name: string) {
    super(name, art);
    this.game = game;
  }

  setType(t: number): void {
    this.type = t;
    if (this.type > 4) this.shark = true;
    this.gotoAndStop(Math.min(this.type, this.totalFrames));

    if (this.shark) {
      // the shark symbol is a single frame, so its `_currentframe` is not the
      // type; the game only ever reads `this.type` for it
      this.ani = this.game.makeSharkAni();
      this.ani.x = SHARK_ANI_OFFSET[0];
      this.ani.y = SHARK_ANI_OFFSET[1];
    } else if (this.type > 1) {
      this.ani = this.game.fishAniFor(this.type);
      const off = FISH_ANI_OFFSET[this.type];
      if (this.ani && off) {
        this.ani.x = off[0];
        this.ani.y = off[1];
      }
    } else {
      // type 1 has no swim loop; its exported frame is just the fish itself
      this.ani = null;
    }

    // frames 2..4 of `enemy` (and the shark) already contain the loop's first
    // pose, so the body must not draw them as well
    this.skipOwnArt = this.ani !== null;
    if (this.ani) this.add(this.ani);
  }

  setStartPosition(d: number): void {
    this.dir = d;
    // dir == -1 means "start at the right edge and swim left" (§4.2)
    this.x = this.dir === -1 ? 550 + this.width / 2 : -this.width / 2;
    this.y = rnd(400);
    this.xscale = this.dir * 100;
    this.xspeed = FISH_HIGH_SPEED[this.type - 1] * this.dir;
    this.high = true;
  }

  /** The per-frame AI, transliterated from Fish._onEnterFrame. */
  override tick(): void {
    // An item is not a `Fish` in the original: it is a plain clip whose own
    // onEnterFrame just walks it left.  Note the recycle test there reads
    // `if (this._x > IV.RIGHT)` *after* the move, so it never fires and the item
    // drifts off the left edge and stays in eList -- reproduced as-is below.
    if (this.itemType !== undefined) {
      this.x -= ITEM_DRIFT;
      return;
    }

    this.x += this.xspeed;
    this.y += this.yspeed;

    if (this.x > 650 || this.x < -100 || this.y > 450 || this.y < -50) {
      this.game.removeEnemy(this);
      return;
    }

    this.count++;
    if (this.count >= 30) {
      this.count = 0;
      const level = this.game.getLevel();
      if (level < FISH_CHANGE_RATE[this.type - 1]) {
        this.speedChange(level < FISH_HIGH_RATE[this.type - 1]);
      }
    }

    if (this.type === 1 || this.shark) {
      const p = this.game.player;
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (this.type === 1 && d < 80) {
        this.getAway();
      } else if (this.shark) {
        if (p.die) {
          if (!this.high || this.getaway) {
            this.getaway = false;
            this.speedChange(true);
          }
        } else if (Math.abs(dx) < 120 && Math.abs(dy) < 90) {
          this.getAway();
        } else {
          this.getaway = false;
        }
      }
    }
    this.onTick?.(this);
    // Fish overrides Clip.tick(), so the `ani` swim loop has to be advanced here
    for (const c of this.children) c.tick();
  }

  getAway(): void {
    if (!this.getaway) {
      this.getaway = true;
      this.speedChange(!this.shark);
    }
  }

  speedChange(high: boolean): void {
    this.high = high;
    let sp: number;
    if (!high) {
      if (this.ani) {
        this.ani.gotoAndStop(this.ani.totalFrames);
        if (this.shark) this.ani.gotoAndPlay(1);
      }
      sp = FISH_LOW_SPEED[this.type - 1];
      this.yspeed = Math.random() * 1 - 0.5;
    } else {
      this.dir = rnd(2) * 2 - 1;
      this.ani?.gotoAndPlay(1);
      sp = FISH_HIGH_SPEED[this.type - 1];
      this.yspeed = Math.random() * 2 - 1;
    }
    this.xspeed = sp * this.dir;
    const p = this.game.player;

    if (this.type === 1 && high && this.getaway) {
      const a =
        Math.atan2(p.y - this.y, p.x - this.x) + (Math.PI * (160 + rnd(40))) / 180;
      this.xspeed = Math.cos(a) * FISH_HIGH_SPEED[0];
      this.yspeed = (Math.sin(a) * FISH_HIGH_SPEED[0]) / 1.5;
      if (this.xspeed !== 0) this.dir = this.xspeed / Math.abs(this.xspeed);
      this.xscale = this.dir * 100;
    }

    if (
      this.shark && (!high || this.getaway) &&
      !p.die && p.item !== IV.ITEM_TRANS
    ) {
      if (this.getaway) {
        this.ani?.gotoAndStop(this.ani.totalFrames);
        this.game.sm.start(IV.SOUND_SHARK, 0, 1);
      }
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      this.xspeed = Math.cos(a) * FISH_LOW_SPEED[4];
      this.yspeed = (Math.sin(a) * FISH_LOW_SPEED[4]) / 2;
      if (this.xspeed !== 0) this.dir = this.xspeed / Math.abs(this.xspeed);
      this.getaway = false;
    }
    this.xscale = this.dir * 100;
  }

  hitBox(): Box {
    let b = FISH_HIT;
    let ox = -9.7;
    let oy = -7.9;
    if (this.itemType !== undefined) {
      b = ITEM_HIT;
      ox = -16.4;
      oy = -14.65;
    } else if (this.shark) {
      b = SHARK_HIT;
      ox = -17.6;
      oy = -19.45;
    }
    return { x1: this.x + ox, y1: this.y + oy, x2: this.x + ox + b.w, y2: this.y + oy + b.h };
  }
}

/** A drifting bubble, spawned by `newBoggle` / `backBoggle` (§5.10). */
class Bubble extends Clip {
  tw: Tween;
  fade = true;

  constructor(artFrame: FrameArt, x: number, y: number, scale: number, targetY: number, secs: number) {
    super("boggle", [artFrame]);
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.rotation = rnd(180);
    const holder = { y };
    this.tw = new Tween(holder, y, targetY, Math.max(1, Math.round(secs * 30)));
    this.tw.onMotionChanged = (t) => {
      this.y = holder.y;
      if (this.fade) this.alpha -= 1;
      this.xspeed *= 0.85;
      if (this.xspeed < 1) this.xspeed = Math.random() * 2 - 1;
      if (t.time > 1) this.x += Math.round(this.xspeed);
    };
  }

  step(): boolean {
    return this.tw.step();
  }
}

export class Game {
  readonly stage: Stage;
  readonly sm: SoundMaster;
  private assets: Assets;

  // --- frame-2 globals (§3) ---
  private score = 0;
  private hungry = 100;
  private eatcount = [0, 0, 0, 0];
  private eList: (Fish | Bubble)[] = [];
  private eListCount = 0;
  private ctenemy = false;

  // --- display list ---
  private bg!: Clip;
  private fishArea!: Clip;
  private boggleArea!: Clip;
  /**
   * The whale.  Its own timeline has one (art-less) frame per growth level, just
   * like sprite 204 in the original: `getLevel()` is `player._currentframe` and
   * levelling up is a `nextFrame()`.  The visible art lives in the `ani` child.
   */
  readonly player = new Clip("player_mc", Array.from({ length: LAST_LEVEL }, () => TRANSPARENT_FRAME));
  private playerAni = new Clip("ani");
  private playerLight!: Clip;
  private levelupMc!: Clip;
  private hungryBar!: Clip;
  private scoreMc!: DigitStrip;
  private missions: DigitStrip[] = [];
  private levelMc!: DigitStrip;
  private eatableMc!: Clip;
  private gameoverMc!: Clip;
  private gameclearMc!: Clip;
  private helpMc!: Clip;
  private introRoot!: Clip;
  private shock = 0;
  private shockFrames = 0;
  private shockAmp = 0;

  private bubbles: Bubble[] = [];
  private bPos: { x: number; y: number }[] = [];
  private moveani = 0;
  private aniTimer = 0;
  private aniTimerLeft = 0;

  constructor(
    stage: Stage,
    sm: SoundMaster,
    assets: Assets,
    private settings: SettingsStore,
  ) {
    this.stage = stage;
    this.sm = sm;
    this.assets = assets;
    stage.setTickHandler(() => this.tick());
  }

  // ==========================================================================
  // boot
  // ==========================================================================

  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.introRoot = this.buildIntro();
    this.stage.root.add(this.introRoot);
    const layer = this.buildGameLayer();
    layer.visible = false;
    this.stage.root.add(layer);
    this.showIntro();
    this.stage.start();
  }

  private gameLayer!: Clip;

  // ==========================================================================
  // intro — root frame 1 (§8.1)
  // ==========================================================================

  private buildIntro(): Clip {
    const root = new Clip("intro");

    const bg = this.assets.resImage("@qua_intro");
    if (bg) {
      const c = new Clip("intro_bg", [
        { image: bg, originX: 0, originY: 0, w: bg.width, h: bg.height },
      ]);
      root.add(c);
    }

    const startArt = this.assets.resButton("@b_qstart01");
    const helpArt = this.assets.resButton("@b_qhowto01");
    if (startArt) {
      const btn = new Clip("start_btn", [
        { image: startArt[0], originX: startArt[0].width / 2, originY: startArt[0].height / 2, w: startArt[0].width, h: startArt[0].height },
      ]);
      btn.x = LAYOUT.introButtons.start.x;
      btn.y = LAYOUT.introButtons.start.y;
      this.startBtn = root.add(btn);
    }
    if (helpArt) {
      const btn = new Clip("help_btn", [
        { image: helpArt[0], originX: helpArt[0].width / 2, originY: helpArt[0].height / 2, w: helpArt[0].width, h: helpArt[0].height },
      ]);
      btn.x = LAYOUT.introButtons.help.x;
      btn.y = LAYOUT.introButtons.help.y;
      this.helpBtn = root.add(btn);
    }

    this.helpMc = this.buildHelpPanel();
    root.add(this.helpMc);

    // rank_btn is host-supplied in the original and never placed here.
    return root;
  }

  private startBtn: Clip | null = null;
  private helpBtn: Clip | null = null;

  private showIntro(): void {
    // Coming back to the title screen from a round has to silence it.  The BGM
    // loops indefinitely, and the game-over path leaves its jingle playing, so
    // both would otherwise carry on over the title art.
    this.sm.stopAll();
    this.onPlayState?.(false);
    this.introRoot.visible = true;
    this.gameLayer!.visible = false;
    this.introMode = true;
  }

  private introMode = true;

  // ==========================================================================
  // gameplay layer — root frame 2 display list (§1.1)
  // ==========================================================================

  private buildGameLayer(): Clip {
    const root = new Clip("frame2");
    this.gameLayer = root;
    root.visible = false;

    const bgImg = this.assets.image(ART.background);
    this.bg = new Clip("bg", [
      { image: bgImg, originX: 0, originY: 0, w: bgImg.width, h: bgImg.height },
    ]);
    root.add(this.bg);

    this.eatableMc = new Clip("eatable_mc", this.assets.get(ART.eatable));
    this.eatableMc.x = LAYOUT.eatable.x;
    this.eatableMc.y = LAYOUT.eatable.y;
    root.add(this.eatableMc);

    const plantL = this.assets.image(ART.plantLeft);
    const pc1 = new Clip("plantL", [
      { image: plantL, originX: 0, originY: 0, w: plantL.width, h: plantL.height },
    ]);
    pc1.x = 1.9;
    pc1.y = 1.75;
    root.add(pc1);
    const plantR = this.assets.image(ART.plantRight);
    const pc2 = new Clip("plantR", [
      { image: plantR, originX: 0, originY: 0, w: plantR.width, h: plantR.height },
    ]);
    pc2.x = 392.7;
    pc2.y = 2.1;
    root.add(pc2);

    // depths 10..73 all live inside the water mask
    const playArea = new Clip("play_area");
    playArea.clip = WATER_MASK;
    root.add(playArea);

    this.player.x = LAYOUT.player.x;
    this.player.y = LAYOUT.player.y;
    this.player.add(this.playerAni);
    this.playerLight = new Clip("light", this.assets.get(ART.light));
    this.playerLight.gotoAndStop(1);
    this.playerLightLight();
    this.player.add(this.playerLight);
    playArea.add(this.player);

    this.levelupMc = new Clip("levelup_mc", this.assets.get(ART.levelup));
    this.levelupMc.x = LAYOUT.levelup.x;
    this.levelupMc.y = LAYOUT.levelup.y;
    this.levelupMc.gotoAndStop(1);
    playArea.add(this.levelupMc);

    this.boggleArea = new Clip("boggle_mc");
    playArea.add(this.boggleArea);
    this.fishArea = new Clip("fish_area");
    playArea.add(this.fishArea);

    this.gameoverMc = this.buildGameOverCard();
    root.add(this.gameoverMc);

    this.gameclearMc = new Clip("gameclear_mc", this.assets.get(ART.gameclear));
    this.gameclearMc.x = LAYOUT.gameclear.x;
    this.gameclearMc.y = LAYOUT.gameclear.y;
    // Sprite 221 places @b_qgototop01 on frames 9-10, but that is an imported
    // symbol ffdec cannot draw, so the card would have no way off it.  Added here
    // at the recorded position (REPORT.md §1.7).
    const topArt = this.assets.resButton("@b_qgototop01");
    let goTop: Clip | null = null;
    if (topArt) {
      goTop = new Clip("gototop_btn", [
        {
          image: topArt[0],
          originX: topArt[0].width / 2,
          originY: topArt[0].height / 2,
          w: topArt[0].width,
          h: topArt[0].height,
        },
      ]);
      goTop.x = CLEAR_BTN.x;
      goTop.y = CLEAR_BTN.y;
      goTop.visible = false;
      this.gameclearMc.add(goTop);
    }
    // The sprite's own frame 10 runs `stop()`; that script is not part of the
    // exported frames, so without this the card would loop and the button would
    // only flash on frames 9-10.
    this.gameclearMc.onFrame = (c, f) => {
      if (goTop) goTop.visible = f >= 9;
      if (f >= 10) c.stop();
    };
    this.gameclearMc.gotoAndStop(1);
    this.gameclearMc.visible = false;
    root.add(this.gameclearMc);

    this.hungryBar = new Clip("hungry_bar", this.assets.get(ART.hungryBar));
    this.hungryBar.x = LAYOUT.hungryBar.x;
    this.hungryBar.y = LAYOUT.hungryBar.y;
    root.add(this.hungryBar);

    const digits = this.assets.get(ART.digit);
    const scoreHolder = new Clip("score_mc");
    scoreHolder.x = LAYOUT.score.x;
    scoreHolder.y = LAYOUT.score.y;
    root.add(scoreHolder);
    // six digits at x = 49.5 + 14i inside sprite 231 (§1.1)
    this.scoreMc = new DigitStrip(digits, 6, scoreHolder, 49.5, 0);

    for (let i = 0; i < 4; i++) {
      const holder = new Clip(`mission${i + 1}`);
      holder.x = LAYOUT.missions[i].x;
      holder.y = LAYOUT.missions[i].y;
      root.add(holder);
      this.missions.push(new DigitStrip(digits, 2, holder, -6.5, 0));
    }
    const lv = new Clip("level_mc");
    lv.x = LAYOUT.level.x;
    lv.y = LAYOUT.level.y;
    root.add(lv);
    this.levelMc = new DigitStrip(digits, 2, lv, -6.5, 0);

    return root;
  }

  private playerLightLight(): void {
    this.playerLight.gotoAndStop(1);
  }

  /**
   * The game-over card cannot be used straight from the SWF: its face is the
   * *imported* bitmap `@gameover02`, which ffdec renders as a placeholder, and the
   * two buttons are imported symbols too.  So the card is rebuilt here from the
   * Qua_RES art, with the grow-and-slide animation described in REPORT.md §1.7.
   */
  private buildGameOverCard(): Clip {
    // ten identical frames: the card is driven entirely by onFrame
    const card = new Clip("gameover_mc", Array.from({ length: 10 }, () => TRANSPARENT_FRAME));
    card.x = LAYOUT.gameover.x;
    card.y = LAYOUT.gameover.y;

    // a full-stage dimmer; the card's own origin is well off-centre, so the
    // overlay is offset back to (0,0) of the stage
    const dim = new Clip("dim", [BLACK_FRAME]);
    dim.x = -LAYOUT.gameover.x;
    dim.y = -LAYOUT.gameover.y;
    dim.alpha = 0;
    card.add(dim);

    const face = this.assets.resImage("@gameover02");
    const faceClip = new Clip(
      "face",
      face ? [{ image: face, originX: 0, originY: 0, w: face.width, h: face.height }] : [],
    );
    card.add(faceClip);

    const retryArt = this.assets.resButton("@b_qagain01");
    const topArt = this.assets.resButton("@b_qgototop01");
    // The RES buttons register on their centre, which is why the SWF places them at
    // x = 59.15 and 159.15 inside a 215-wide card (see REPORT.md §1.7): with any
    // other origin they would straddle the card's right edge and its bottom.
    const mkBtn = (art: HTMLImageElement[] | undefined, name: string) =>
      new Clip(
        name,
        art
          ? [{
              image: art[0],
              originX: art[0].width / 2,
              originY: art[0].height / 2,
              w: art[0].width,
              h: art[0].height,
            }]
          : [],
      );
    // as in the original, both buttons live *inside* the card face (sprite 214),
    // so they inherit its grow/slide transform
    const retry = mkBtn(retryArt, "retry_btn");
    const intro = mkBtn(topArt, "intro_btn");
    retry.x = 59.15;
    retry.y = 79.45;
    intro.x = 159.15;
    intro.y = 79.45;
    faceClip.add(retry);
    faceClip.add(intro);

    card.onFrame = (c, f) => {
      const k = Math.max(0, Math.min(1, (f - 1) / 9));
      // as in the SWF the dimmer is simply present from frame 2, it does not fade
      dim.alpha = f >= 2 ? CARD_DIM_ALPHA : 0;
      faceClip.xscale = faceClip.yscale = (0.2 + 0.8 * k) * 100;
      // sprite 214 slides from (-28.3,-75.1) to (-114.3,-119.1) inside the card
      faceClip.x = -28.3 + (-114.3 + 28.3) * k;
      faceClip.y = -75.1 + (-119.1 + 75.1) * k;
      faceClip.visible = f >= 2;
      retry.visible = intro.visible = f >= 9;
      // the original's card plays 10 frames and holds the last one (§1.7)
      if (f >= 10) c.stop();
    };
    card.gotoAndStop(1);
    card.onFrame!(card, 1);
    card.visible = false;
    return card;
  }

  /**
   * The how-to panel, rebuilt for the same reason as the game-over card: its art
   * is the *imported* bitmap `@howto`, which ffdec can only render as a red
   * placeholder.  Sprite 64 grows it from 20% at (59.4,-106.6) to full size at
   * (-77,-211) over frames 1-5, then wobbles it (REPORT.md §1.7).
   */
  private buildHelpPanel(): Clip {
    const panel = new Clip("gamehelp_mc", Array.from({ length: 9 }, () => TRANSPARENT_FRAME));
    panel.x = LAYOUT.help.x;
    panel.y = LAYOUT.help.y;

    const art = this.assets.resImage("@howto");
    const face = new Clip(
      "help_face",
      art ? [{ image: art, originX: 0, originY: 0, w: art.width, h: art.height }] : [],
    );
    panel.add(face);

    panel.onFrame = (_c, f) => {
      if (f <= 5) {
        const t = (f - 1) / 4;
        face.xscale = face.yscale = (0.2 + 0.8 * t) * 100;
        face.x = HELP_FROM.x + (HELP_TO.x - HELP_FROM.x) * t;
        face.y = HELP_FROM.y + (HELP_TO.y - HELP_FROM.y) * t;
      } else {
        face.x = HELP_TO.x;
        face.y = HELP_TO.y;
        face.xscale = face.yscale = HELP_WOBBLE[f - 1] * 100;
      }
      if (f >= 9) _c.stop();
    };
    panel.gotoAndStop(1);
    panel.onFrame!(panel, 1);
    panel.visible = false;
    return panel;
  }

  /** Stage-space rectangles of the two game-over buttons, for hit testing. */
  private gameoverButtonRects(): { x1: number; y1: number; x2: number; y2: number }[] {
    const card = this.gameoverMc;
    const face = card.children.find((c) => c.name === "face");
    if (!face) return [];
    const sx = face.xscale / 100;
    const sy = face.yscale / 100;
    // GAMEOVER_BTN holds the buttons' centres, matching how the RES art registers
    return GAMEOVER_BTN.map((b) => {
      const px = card.x + face.x + b.x * sx;
      const py = card.y + face.y + b.y * sy;
      return {
        x1: px - (BTN_W / 2) * sx,
        y1: py - (BTN_H / 2) * sy,
        x2: px + (BTN_W / 2) * sx,
        y2: py + (BTN_H / 2) * sy,
      };
    });
  }

  // ==========================================================================
  // helpers matching the original's frame-2 functions
  // ==========================================================================

  getLevel(): number {
    return this.player.frame;
  }

  getEatLevel(): number {
    return EAT_LEVEL[this.getLevel() - 1];
  }

  private hungryBarUpdate(): void {
    if (this.hungry > 100) this.hungry = 100;
    const total = this.hungryBar.totalFrames;
    this.hungryBar.gotoAndStop(total + 1 - Math.round((this.hungry * total) / 100));
  }

  private addScore(s: number): void {
    this.score += s;
    this.scoreMc.number = this.score;
  }

  fishAniFor(type: number): Clip | null {
    const name = (ART.fishAni as Record<number, string>)[type];
    if (!name) return null;
    const c = new Clip(`ani${type}`, this.assets.get(name));
    c.gotoAndPlay(1);
    return c;
  }

  makeSharkAni(): Clip {
    const c = new Clip("sharkAni", this.assets.get(ART.sharkAni));
    c.gotoAndPlay(1);
    return c;
  }

  private makeEnemy(): void {
    const eatLevel = this.getEatLevel();
    let t = eatLevel + rnd(3) - 1;
    if (this.ctenemy) t = rnd(FISHES_TOTAL + 1) + 1;
    if (t < 1) t = 1;
    if (this.sharksTotal() >= 3 && t > FISHES_TOTAL) t = FISHES_TOTAL;

    const art = this.assets.get(ART.enemy);
    const e = new Fish(this, art, `e${this.fishArea.children.length}`);
    this.fishArea.add(e);
    this.eList.push(e);
    e.setType(t);
    e.setStartPosition(rnd(2) * 2 - 1);
  }

  private sharksTotal(): number {
    let n = 0;
    for (const e of this.eList) if (e instanceof Fish && e.shark) n++;
    return n;
  }

  removeEnemy(e: Fish | Bubble): boolean {
    const i = this.eList.indexOf(e);
    if (i >= 0) {
      this.eList.splice(i, 1);
      e.parent?.remove(e);
      return true;
    }
    return false;
  }

  private grow(el: number): void {
    if (rnd(5) !== 0) {
      const r = rnd(2) + 1;
      this.sm.start(r === 1 ? IV.SOUND_EAT1 : IV.SOUND_EAT2, 0, 1);
    } else {
      this.sm.start(IV.SOUND_EAT3, 0, 1);
    }
    this.playerAniSet("eat");
    this.eatcount[el - 1]--;
    if (this.eatcount[el - 1] < 0) this.eatcount[el - 1] = 0;
    let done = true;
    for (let i = 0; i < FISHES_TOTAL; i++) if (this.eatcount[i] > 0) done = false;
    if (done) this.nextLevel();
    this.updateEatCount();
    this.hungry += HUNGRY_UP[el - 1];
    this.hungryBarUpdate();
  }

  private setEatCount(): void {
    this.eatcount = [0, 0, 0, 0];
    const l = this.getEatLevel();
    this.eatcount[l - 1] = NEXT_LEVEL_1[this.getLevel() - 1];
    if (l - 1 > 0) this.eatcount[l - 2] = NEXT_LEVEL_0[this.getLevel() - 1];
    this.updateEatCount();
  }

  private updateEatCount(): void {
    for (let i = 1; i <= FISHES_TOTAL; i++) {
      this.missions[i - 1].number = this.eatcount[i - 1];
      this.missions[i - 1].clips[0].parent!.visible = this.eatcount[i - 1] !== 0;
    }
    this.eatableMc.gotoAndStop(this.getEatLevel());
  }

  private nextLevel(): void {
    this.sm.start(IV.SOUND_LEVEL, 0, 1);
    this.addScore(Math.round(this.hungry) * SCORE_LEVEL);
    if (this.getLevel() < LAST_LEVEL) {
      this.levelMc.number += 1;
      this.player.nextFrame();
      this.syncPlayerAni();
      this.playerLight.gotoAndPlay(1);
      this.levelupMc.play();
      this.setEatCount();
      this.hungry += 20;
      this.hungryBarUpdate();
      this.playerAniSet("normal");
      if (this.getLevel() > 4) this.makeItem(IV.ITEM_TRANS);
      if (this.getLevel() === 8) {
        this.sm.start(IV.SOUND_SHARKSTAGE, 0, 1);
      }
    } else {
      this.onGameClear();
    }
  }

  private makeItem(itype: number): void {
    const it = new Fish(this, this.assets.get(ART.item), `i${this.fishArea.children.length}`);
    this.fishArea.add(it);
    this.eList.push(it);
    it.itemType = itype;
    it.x = IV.RIGHT;
    it.y = (IV.TOP + IV.BOTTOM) / 2;
  }

  private useItem(itype: number): void {
    this.sm.start(IV.SOUND_ITEM, 0, 1);
    this.player.item = itype;
    if (itype === IV.ITEM_TRANS) {
      this.player.alpha = 40;
      this.itemTimer = 150; // 5000 ms at 30 fps
    }
  }

  private removeItem(): void {
    if (this.settings.get("invisible")) return; // held by the cheat, not the timer
    this.player.alpha = 100;
    delete this.player.item;
  }

  private itemTimer = 0;

  private playerAniSet(mode: "normal" | "move" | "eat" | "damage" | "die", d = 0): void {
    let duration = 0;
    switch (mode) {
      case "normal":
        this.playerAni.gotoAndStop(1);
        break;
      case "move":
        if (this.playerAni.frame === 1) this.playerAni.gotoAndStop(2);
        duration = d;
        break;
      case "eat":
        this.playerAni.gotoAndStop(3);
        duration = 5;
        break;
      case "damage":
        this.playerAni.gotoAndStop(4);
        duration = 1;
        break;
      case "die":
        this.playerAni.gotoAndStop(5);
        duration = 50000;
        break;
    }
    this.aniTimerLeft = duration;
    this.aniTimer = 0;
  }

  /** The whale's `ani` child changes with the level; re-point it after a grow. */
  private syncPlayerAni(): void {
    const [ox, oy] = WHALE_ANI_OFFSET[this.getLevel() - 1];
    this.playerAni.frames.length = 0;
    this.playerAni.frames.push(...this.assets.get(ART.whaleAni[this.getLevel() - 1]));
    this.playerAni.x = ox;
    this.playerAni.y = oy;
    this.playerAni.gotoAndStop(1);
  }

  // ==========================================================================
  // bubbles (§5.10)
  // ==========================================================================

  private backBoggle(x: number, y: number, size: number): void {
    const bub = this.assets.get(ART.bubble)[0];
    const b = new Bubble(bub, x, y, rnd(70) + 25 * size, 50 + rnd(50), Math.abs(y / 5) + 3);
    b.xspeed = (rnd(2) - 0.5) * 10;
    b.fade = true;
    this.boggleArea.add(b);
    this.bubbles.push(b);
  }

  private newBoggle(): void {
    const bub = this.assets.get(ART.bubble)[0];
    const b = new Bubble(
      bub,
      this.player.x + (this.player.xscale / 100) * 19.3,
      this.player.y + 3.05 - 10,
      rnd(70) + 25 * this.getLevel(),
      0,
      Math.abs(this.player.y / 5) + 1,
    );
    b.xspeed = this.player.xspeed;
    b.fade = false;
    this.boggleArea.add(b);
    this.bubbles.push(b);
  }

  // ==========================================================================
  // shock (§9.3) — a whole-stage shake
  // ==========================================================================

  private newShock(count: number, amp: number): void {
    this.shockFrames = count;
    this.shockAmp = amp;
  }

  // ==========================================================================
  // game flow
  // ==========================================================================

  private startGame(): void {
    this.sm.stop(IV.SOUND_OVER);
    this.sm.start(IV.SOUND_BG, 0, 10000);
    this.sm.setVolume(IV.SOUND_BG, 32);
    this.sm.setVolume(IV.SOUND_SHARK, 64);

    this.gameoverMc.visible = false;
    this.gameoverMc.gotoAndStop(1);
    this.gameclearMc.visible = false;
    this.gameclearMc.stop();

    for (const c of [...this.fishArea.children]) this.fishArea.remove(c);
    for (const c of [...this.boggleArea.children]) this.boggleArea.remove(c);
    this.eList = [];
    this.bubbles = [];
    this.eListCount = 0;

    this.score = 0;
    this.scoreMc.number = 0;
    this.hungry = 100;
    this.hungryBarUpdate();

    this.player.gotoAndStop(this.settings.get("level"));
    this.syncPlayerAni();
    this.player.yscale = 100;
    this.player.die = false;
    this.player.xspeed = 0;
    this.player.yspeed = 0;
    this.player.alpha = 100;
    delete this.player.item;
    this.itemTimer = 0;
    this.playerAniSet("normal");

    this.gameoverMc.visible = false;
    this.makeEnemy();
    this.setEatCount();
    this.levelMc.number = this.getLevel();
    this.gameplay = true;
    this.onPlayState?.(true);
  }

  private gameplay = false;

  private onGameOver(): void {
    this.sm.stop(IV.SOUND_BG);
    this.sm.start(IV.SOUND_OVER, 0, 1);
    this.player.die = true;
    this.playerAniSet("die");
    this.gameoverMc.visible = true;
    this.gameoverMc.play();
    this.gameplay = false;
    this.onPlayState?.(false);
  }

  private onGameClear(): void {
    this.sm.stop(IV.SOUND_BG);
    this.sm.start(IV.SOUND_ENDING, 0, 1000);
    for (const e of this.eList) {
      if (e instanceof Fish && e.ani) e.ani.gotoAndStop(1);
    }
    this.gameclearMc.visible = true;
    this.gameclearMc.play();
    this.gameplay = false;
    this.onPlayState?.(false);
  }



  // ==========================================================================
  // per-frame
  // ==========================================================================

  /**
   * The per-frame logic.  Clip timelines -- including every `Fish` and the whale's
   * own children -- are advanced by Stage's scene-graph walk, which runs right
   * after this; ticking them here as well would double their speed.
   */
  private tick(): void {
    if (this.introMode) return;

    if (this.gameplay && !this.player.die) this.playerFrame();

    if (this.player.die && !this.gameplay) {
      // the death fall still runs after game over (§5.12)
      if (rnd(15) === 0) this.newBoggle();
      this.player.y += 2;
      if (this.player.y > IV.BOTTOM) this.player.y = IV.BOTTOM;
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (!b.step()) {
        b.parent?.remove(b);
        this.bubbles.splice(i, 1);
      }
    }

    if (this.itemTimer > 0 && --this.itemTimer === 0) this.removeItem();

    this.tickAniTimer();
    this.updateShock();
  }

  private tickAniTimer(): void {
    if (this.aniTimerLeft > 0) {
      this.aniTimer++;
      if (this.aniTimer >= this.aniTimerLeft) {
        this.aniTimerLeft = 0;
        if (this.playerAni.frame !== 5) this.playerAni.gotoAndStop(1);
      }
    }
  }

  private updateShock(): void {
    if (this.shockFrames > 0) {
      this.shockFrames--;
      this.shock = rnd(2 * this.shockAmp + 1) - this.shockAmp;
      this.stage.root.x = this.shock;
      this.stage.root.y = this.shock;
    } else if (this.stage.root.x !== 0) {
      this.stage.root.x = 0;
      this.stage.root.y = 0;
    }
  }

  /** `pmc_onEnterFrame` (§5.2), in the original's exact statement order. */
  private playerFrame(): void {
    const p = this.player;

    // (a) ambient bubbles
    if (rnd(20) === 0) {
      const i = rnd(4);
      const sz = rnd(3) + 1;
      const spot = this.bPos[i] ?? { x: rnd(550), y: 380 };
      this.backBoggle(spot.x, spot.y, sz);
    }

    // (b) hunger; the 饥饿不减 cheat restores it instead of draining it, which
    // also undoes the hunger lost to collisions further down
    if (this.settings.get("noHunger")) this.hungry = 100;
    else this.hungry -= HUNGRY_LEVEL[this.getLevel() - 1] / 60;
    this.hungryBarUpdate();

    // 永久隐身: hold the transparence item on.  Worth noting this is not just a
    // damage immunity — the original also stops sharks homing while it is held,
    // so the cheat changes their behaviour too, exactly as the real item does.
    if (this.settings.get("invisible")) {
      p.item = IV.ITEM_TRANS;
      p.alpha = 40;
      this.itemTimer = 0;
    }

    // (c) spawn pacing
    if (this.eListCount++ > SHOW_COUNT) {
      this.makeEnemy();
      this.eListCount = 0;
    }

    // (d) input
    if (this.input?.left) p.xspeed -= X_SPEED;
    if (this.input?.right) p.xspeed += X_SPEED;
    if (this.input?.up) p.yspeed -= Y_SPEED;
    if (this.input?.down) p.yspeed += Y_SPEED;

    // (e) facing
    p.xscale = p.xspeed < 0 ? -100 : 100;

    // (f) decay + integrate
    const sp = SPEED_LEVEL[this.getLevel() - 1];
    p.xspeed *= sp;
    p.yspeed *= sp;
    p.x += p.xspeed;
    p.y += p.yspeed;

    // (g) clamp
    if (p.x > IV.RIGHT) {
      p.x = IV.RIGHT;
      p.xspeed = 0;
    } else if (p.x < IV.LEFT) {
      p.x = IV.LEFT;
      p.xspeed = 0;
    }
    if (p.y > IV.BOTTOM) {
      p.y = IV.BOTTOM;
      p.yspeed = 0;
    } else if (p.y < IV.TOP) {
      p.y = IV.TOP;
      p.yspeed = 0;
    }

    // (h) swim flap
    if (this.moveani > 15 - Math.abs(p.xspeed)) {
      this.moveani = 0;
      this.playerAniSet("move", (15 - Math.abs(p.xspeed)) / 2);
    } else {
      this.moveani += 1;
    }

    // (i) collisions
    const pb = this.whaleHitBox();
    for (const e of [...this.eList]) {
      if (!(e instanceof Fish)) continue;
      if (!overlap(pb, e.hitBox())) continue;

      const edible = this.settings.get("eatAnything") ||
        (!e.shark && this.getEatLevel() >= e.frame);
      if (edible) {
        if (e.itemType !== undefined) {
          this.playerAniSet("eat");
          this.useItem(e.itemType);
        } else {
          // a shark's clip is a single frame, so its size index has to come from
          // `type`; for fish the two are the same value anyway
          const size = e.shark ? FISHES_TOTAL : e.frame;
          this.addScore(SCORE_UP[size - 1]);
          this.grow(size);
        }
        this.newBoggle();
        this.removeEnemy(e);
      } else if (p.item !== IV.ITEM_TRANS && !this.settings.get("god")) {
        this.sm.start(IV.SOUND_HIT, 0, 1);
        this.playerAniSet("damage");
        if (e.shark) {
          this.newShock(10, 1);
          this.hungry -= HUNGRY_SHARK;
          this.hungryBarUpdate();
          this.newBoggle();
        } else {
          this.newShock(5, 1);
          this.hungry -= DAMAGE_LEVEL[this.getLevel() - 1];
          this.hungryBarUpdate();
          this.newBoggle();
          if (!e.high) {
            if (e.type === 3) e.speedChange(true);
            else if (e.shark) e.speedChange(false);
          }
        }
      }
    }

    // (j) death
    if (this.hungry < 0) this.onGameOver();
  }

  private whaleHitBox(): Box {
    const [sx, sy] = WHALE_HIT_SCALE[this.getLevel() - 1];
    return {
      x1: this.player.x - 12.8,
      y1: this.player.y - 9.65,
      x2: this.player.x - 12.8 + HIT_W * sx,
      y2: this.player.y - 9.65 + HIT_H * sy,
    };
  }

  // ==========================================================================
  // input plumbing
  // ==========================================================================

  input: { left: boolean; right: boolean; up: boolean; down: boolean } | null = null;

  /** Fired when a round starts or ends, so the host can show/hide the pause button. */
  onPlayState: ((playing: boolean) => void) | null = null;

  /**
   * Jump the whale to a growth level.
   *
   * In this game the level *is* `player_mc._currentframe`, so one value drives the
   * whale's size, the Level counter, the four mission targets and the edible-species
   * indicator.  Everything that derives from the level is refreshed together here.
   */
  jumpToLevel(n: number): void {
    const level = Math.max(1, Math.min(LAST_LEVEL, Math.round(n)));
    this.player.gotoAndStop(level);
    this.syncPlayerAni();
    this.setEatCount();
    this.levelMc.number = level;
    this.hungryBarUpdate();
    this.playerAniSet("normal");
    this.player.die = false;
  }

  /** Live score and level, for the pause menu. */
  get progress(): { score: number; level: number } {
    return { score: this.score, level: this.getLevel() };
  }

  /**
   * Player-facing music switch.  Turning it back on mid-round restarts the loop,
   * which is why the game owns this rather than the settings panel.
   */
  setMusicEnabled(on: boolean): void {
    this.sm.setMusicEnabled(on);
    if (on && this.gameplay) {
      this.sm.setVolume(IV.SOUND_BG, 32);
      this.sm.start(IV.SOUND_BG, 0, 10000);
    }
  }

  /** Public entry points for the pause menu. */
  restartRound(): void {
    this.startGame();
  }

  goHome(): void {
    this.showIntro();
  }

  // ==========================================================================
  // pointer / button handling
  // ==========================================================================

  /** Returns true when the click was consumed. */
  /**
   * Which clickable thing, if any, sits at a stage point.  Shared by the click
   * handler and by the hover test that drives the mouse cursor.
   */
  buttonAt(x: number, y: number): "start" | "help" | "retry" | "intro" | "home" | null {
    const inIntroBtn = (b: Clip | null) => {
      if (!b || !b.art) return false;
      const a = b.art;
      return Math.abs(x - b.x) <= a.w / 2 && Math.abs(y - b.y) <= a.h / 2;
    };

    if (this.introMode) {
      if (inIntroBtn(this.startBtn)) return "start";
      if (inIntroBtn(this.helpBtn)) return "help";
      return null;
    }

    const inside = (b: { x1: number; y1: number; x2: number; y2: number }) =>
      x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2;

    if (this.thisRoundOver() && this.gameoverMc.frame >= 9) {
      const [retry, intro] = this.gameoverButtonRects();
      if (inside(retry)) return "retry";
      if (inside(intro)) return "intro";
    }

    if (this.gameclearMc.visible && this.gameclearMc.frame >= 9) {
      if (inside(this.clearButtonRect())) return "home";
    }
    return null;
  }

  private clearButtonRect(): { x1: number; y1: number; x2: number; y2: number } {
    const cx = this.gameclearMc.x + CLEAR_BTN.x;
    const cy = this.gameclearMc.y + CLEAR_BTN.y;
    // the card's frames scale up as it opens, so follow the clip's own scale
    const a = this.gameclearMc.art;
    const k = a ? a.w / 551 : 1;
    const s = this.gameclearMc.xscale / 100 * k;
    return {
      x1: cx - (BTN_W / 2) * s,
      y1: cy - (BTN_H / 2) * s,
      x2: cx + (BTN_W / 2) * s,
      y2: cy + (BTN_H / 2) * s,
    };
  }

  private thisRoundOver(): boolean {
    return this.gameoverMc.visible;
  }

  /** True when a stage point is over a button, so the canvas can show a pointer. */
  hoverable(x: number, y: number): boolean {
    return this.buttonAt(x, y) !== null;
  }

  click(x: number, y: number): boolean {
    switch (this.buttonAt(x, y)) {
      case "start":
        this.introMode = false;
        this.showGame();
        return true;
      case "help":
        if (!this.helpMc.visible) {
          this.helpMc.visible = true;
          this.helpMc.play();
        }
        return true;
      case "retry":
        this.startGame();
        return true;
      case "intro":
        this.showIntro();
        return true;
      case "home":
        this.showIntro();
        return true;
      default:
        return false;
    }
  }

  private showGame(): void {
    this.introRoot.visible = false;
    this.gameLayer.visible = true;
    try {
      this.startGame();
    } catch (e) {
      // surfaced for debugging; the original had no equivalent guard
      this.lastError = e as Error;
      throw e;
    }
  }

  /** Last exception thrown while starting a round, if any. */
  lastError: Error | null = null;
}
