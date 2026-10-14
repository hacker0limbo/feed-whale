/**
 * A minimal stand-in for the slice of Flash Player this game actually uses.
 *
 * The original is ActionScript 2 / AVM1 running on a stage of 550x450 at 30 fps.
 * Everything the game does is: blit pre-rendered frames of a MovieClip, move and
 * scale them, and flip between named frames.  So instead of a general vector
 * renderer we keep a tiny scene graph of frame-atlases and advance it on a fixed
 * 30 Hz step, which reproduces Flash's timeline semantics exactly.
 */

export type Seconds = number;

export interface Transform {
  x: number;
  y: number;
  xscale: number; // percent, like Flash's _xscale
  yscale: number;
  rotation: number; // degrees
  alpha: number; // percent, like Flash's _alpha
  visible: boolean;
}

/** One exported sprite frame: its pixels plus where the clip's origin sits. */
export interface FrameArt {
  image: CanvasImageSource;
  /** Offset in pixels from the frame's top-left to the clip registration point. */
  originX: number;
  originY: number;
  /** Natural size in pixels. */
  w: number;
  h: number;
}

export class Clip {
  readonly name: string;
  /** frame 1..n, matching Flash's _currentframe. */
  frame = 1;
  readonly frames: FrameArt[] = [];
  t: Transform = {
    x: 0,
    y: 0,
    xscale: 100,
    yscale: 100,
    rotation: 0,
    alpha: 100,
    visible: true,
  };

  /** Children re-placed by the current frame, in depth order. */
  children: Clip[] = [];
  parent: Clip | null = null;

  /**
   * Flash's `PlaceObject2` clipDepth: a clip carrying this path hides everything
   * it and its children draw outside the path.  The original uses one to keep the
   * whale, fish and bubbles inside the water, above the curved mission bar.
   */
  clip: Path2D | null = null;

  /**
   * Draw only the children, not this clip's own bitmap.  Needed where an exported
   * frame already has a sub-animation baked in: the fish composites contain the
   * swim loop's first pose, so their animated child has to replace it, not stack
   * on top of it.  The frame data is kept so `frame` and the clip's box still work.
   */
  skipOwnArt = false;

  /** Set by the game to model Flash's onEnterFrame on this clip. */
  onEnterFrame: ((clip: Clip) => void) | null = null;
  /** Called once when the playhead enters a new frame. */
  onFrame: ((clip: Clip, frame: number) => void) | null = null;

  // -- fields the original stores on the clips themselves (see re/REPORT.md) --
  /** Per-frame velocity, used by the whale and by `Fish`. */
  xspeed = 0;
  yspeed = 0;
  /** Set on `player_mc` once the round is lost; sharks home in while it is true. */
  die = false;
  /** Item id carried by `player_mc` (IV.ITEM_TRANS) or by an item clip. */
  item: number | undefined;
  /** Frame counter driving the whale's two-pose swim flap. */
  moveani = 0;
  /** Marker child of `player_mc` that bubbles are emitted from. */
  boggle: { x: number; y: number } | undefined;

  playing = false;
  private loop = true;

  constructor(name: string, frames: FrameArt[] = []) {
    this.name = name;
    this.frames.push(...frames);
  }

  get totalFrames(): number {
    return this.frames.length;
  }

  get art(): FrameArt | null {
    return this.frames[this.frame - 1] ?? null;
  }

  /** Flash `_width` / `_height` of the current frame, honouring scale. */
  get width(): number {
    const a = this.art;
    return a ? (a.w * this.t.xscale) / 100 : 0;
  }

  get height(): number {
    const a = this.art;
    return a ? (a.h * this.t.yscale) / 100 : 0;
  }

  set x(v: number) {
    this.t.x = v;
  }
  get x(): number {
    return this.t.x;
  }
  set y(v: number) {
    this.t.y = v;
  }
  get y(): number {
    return this.t.y;
  }

  /** `_xscale` and `_yscale` move together. */
  set scale(pct: number) {
    this.t.xscale = pct;
    this.t.yscale = pct;
  }
  get xscale(): number {
    return this.t.xscale;
  }
  set xscale(v: number) {
    this.t.xscale = v;
  }
  get yscale(): number {
    return this.t.yscale;
  }
  set yscale(v: number) {
    this.t.yscale = v;
  }

  set alpha(v: number) {
    this.t.alpha = v;
  }
  get alpha(): number {
    return this.t.alpha;
  }

  set rotation(v: number) {
    this.t.rotation = v;
  }
  get rotation(): number {
    return this.t.rotation;
  }

  set visible(v: boolean) {
    this.t.visible = v;
  }
  get visible(): boolean {
    return this.t.visible;
  }

  add(child: Clip): Clip {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(child: Clip): void {
    const i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
    }
  }

  /** Flash `gotoAndStop` — clamps into range like AVM1 does. */
  gotoAndStop(frame: number): void {
    const f = Math.max(1, Math.min(this.totalFrames || 1, Math.round(frame)));
    if (f !== this.frame) {
      this.frame = f;
      this.onFrame?.(this, f);
    }
    this.playing = false;
  }

  gotoAndPlay(frame: number): void {
    const f = Math.max(1, Math.min(this.totalFrames || 1, Math.round(frame)));
    if (f !== this.frame) {
      this.frame = f;
      this.onFrame?.(this, f);
    }
    this.playing = true;
    this.loop = true;
  }

  /** `play()` continuing from the current frame. */
  play(): void {
    this.playing = true;
    this.loop = true;
  }

  stop(): void {
    this.playing = false;
  }

  nextFrame(): void {
    this.frame = this.frame >= this.totalFrames ? 1 : this.frame + 1;
    this.onFrame?.(this, this.frame);
  }

  prevFrame(): void {
    this.frame = this.frame <= 1 ? this.totalFrames : this.frame - 1;
    this.onFrame?.(this, this.frame);
  }

  /** Advance one 30 Hz tick: this clip's timeline, then its children's. */
  tick(): void {
    this.onEnterFrame?.(this);
    if (this.playing && this.totalFrames > 1) {
      if (this.frame >= this.totalFrames) {
        if (this.loop) this.frame = 1;
      } else {
        this.frame++;
      }
      this.onFrame?.(this, this.frame);
    }
    for (const c of this.children) c.tick();
  }

  /** Draw this clip and its children into `ctx` (already in stage space). */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.t.visible) return;
    ctx.save();
    ctx.translate(this.t.x, this.t.y);
    if (this.t.rotation) ctx.rotate((this.t.rotation * Math.PI) / 180);
    ctx.scale(this.t.xscale / 100, this.t.yscale / 100);
    if (this.t.alpha < 100) ctx.globalAlpha *= Math.max(0, this.t.alpha) / 100;
    if (this.clip) ctx.clip(this.clip);
    // A clip with no art of its own is still a coordinate frame for its children:
    // the game hangs sprite-less containers (score_mc, player_mc, fish_area) around,
    // so the transform has to be applied whether or not there is something to blit.
    const a = this.skipOwnArt ? null : this.art;
    if (a) ctx.drawImage(a.image, -a.originX, -a.originY, a.w, a.h);
    for (const c of this.children) c.render(ctx);
    ctx.restore();
  }

  /** Axis-aligned bounds in the parent's coordinate space. */
  bounds(): { x1: number; y1: number; x2: number; y2: number } {
    const a = this.art;
    const sx = this.t.xscale / 100;
    const sy = this.t.yscale / 100;
    const w = a ? a.w * Math.abs(sx) : 0;
    const h = a ? a.h * Math.abs(sy) : 0;
    return {
      x1: this.t.x - (a ? a.originX * Math.abs(sx) : 0),
      y1: this.t.y - (a ? a.originY * Math.abs(sy) : 0),
      x2: this.t.x - (a ? a.originX * Math.abs(sx) : 0) + w,
      y2: this.t.y - (a ? a.originY * Math.abs(sy) : 0) + h,
    };
  }

  /**
   * Flash's bounding-box hitTest.  The original uses
   * `clip.hitTest(target.hitArea)` with shapeFlag off, so an AABB overlap is the
   * right model.
   */
  hitTest(other: Clip): boolean {
    const a = this.bounds();
    const b = other.bounds();
    return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  }
}

/** The 550x450 stage, driven at a fixed 30 Hz. */
export class Stage {
  readonly root = new Clip("_root");
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  frame = 1;
  totalFrames = 1;
  playing = true;

  bgColor = "#000000";
  private ctx: CanvasRenderingContext2D;
  private acc = 0;
  private last = 0;
  private frameMs: number;
  private onTick: (() => void) | null = null;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    width = 550,
    height = 450,
    fps = 30,
  ) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.frameMs = 1000 / fps;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  /** Called once per fixed 30 Hz step, before the scene graph is advanced. */
  setTickHandler(fn: () => void): void {
    this.onTick = fn;
  }

  /** Last error thrown inside the frame loop, if any. */
  lastError: Error | null = null;
  /** How many times the loop has driven a step, for diagnostics. */
  tickCount = 0;

  /**
   * When paused the loop keeps painting but stops advancing anything, so the
   * overlays drawn on top stay crisp.  Not to be confused with `stop()`, which
   * halts the loop outright and would leave the canvas frozen on its last frame.
   */
  paused = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.acc += now - this.last;
      this.last = now;
      // Fixed step so the game runs at the same speed as the original on any
      // display; cap catch-up so a backgrounded tab does not fast-forward.
      let steps = 0;
      try {
        if (this.paused) {
          // drop the elapsed time instead of banking it, so resuming does not
          // fast-forward through the frames that were "missed" while paused
          this.acc = 0;
          this.render();
          this.lastError = null;
          requestAnimationFrame(loop);
          return;
        }
        while (this.acc >= this.frameMs && steps < 5) {
          this.acc -= this.frameMs;
          steps++;
          this.step();
          this.tickCount++;
        }
        if (steps === 5) this.acc = 0;
        this.render();
        this.lastError = null;
      } catch (e) {
        // Swallowing a bad frame keeps the loop alive instead of freezing the
        // game on a black canvas; the error stays available for debugging.
        this.lastError = e as Error;
        this.acc = 0;
        if (!this.reportedError) {
          this.reportedError = true;
          console.error("[Stage] frame failed", e);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private reportedError = false;

  stop(): void {
    this.running = false;
  }

  private step(): void {
    this.onTick?.();
    if (this.playing) {
      if (this.frame >= this.totalFrames) this.frame = 1;
      else this.frame++;
    }
    this.root.tick();
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.width, this.height);
    this.root.render(ctx);
  }
}
