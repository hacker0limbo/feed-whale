/**
 * Browser-side concerns that have no counterpart in the original SWF: keyboard and
 * touch input, and fitting the 550x450 stage into the window.
 */
import { STAGE_H, STAGE_W } from "./game/constants";

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/**
 * Arrow keys plus WASD, and a floating virtual joystick for touch devices.  The
 * joystick writes the same four booleans the keyboard does, so the rest of the
 * game never learns which one is in use.
 */
export class Input {
  readonly state: InputState = { left: false, right: false, up: false, down: false };

  private held = new Set<string>();
  private virtual = new Set<keyof InputState>();
  /** Clears the stick; set while buildStick() is alive so it can be forced off. */
  private dropStick: (() => void) | null = null;
  private stickEnabled = true;

  constructor(canvas: HTMLCanvasElement, onDown: (e: KeyboardEvent) => void) {
    const map: Record<string, keyof InputState | undefined> = {
      ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
      a: "left", d: "right", w: "up", s: "down",
      A: "left", D: "right", W: "up", S: "down",
    };

    window.addEventListener("keydown", (e) => {
      const k = map[e.key];
      if (k) {
        this.held.add(k);
        this.sync();
        e.preventDefault();
      }
      onDown(e);
      if (e.key.startsWith("Arrow")) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      const k = map[e.key];
      if (k) {
        this.held.delete(k);
        this.sync();
      }
    });
    // releasing focus must not leave a key stuck down
    window.addEventListener("blur", () => {
      this.held.clear();
      this.sync();
    });

    void canvas;
    this.buildStick();
  }

  private sync(): void {
    for (const k of ["left", "right", "up", "down"] as (keyof InputState)[]) {
      this.state[k] = this.held.has(k) || this.virtual.has(k);
    }
  }

  /** Apply a set of directions to the virtual layer, clearing the rest. */
  private setVirtual(dirs: readonly (keyof InputState)[]): void {
    for (const k of ["left", "right", "up", "down"] as (keyof InputState)[]) {
      if (dirs.includes(k)) this.virtual.add(k);
      else this.virtual.delete(k);
    }
    this.sync();
  }

  /**
   * The floating joystick.
   *
   * The original game reads `Key.isDown(37/38/39/40)` — four digital directions,
   * with speed built up over frames by the physics — so there is no analog axis to
   * drive.  The stick therefore resolves to the same octant split an 8-way digital
   * stick has: pushing into a 45-degree sector lights up one or two of the four
   * directions, and the result is bit-for-bit what the keyboard produces.
   *
   * It floats over the stage rather than sitting beside it, which is what lets the
   * game use the whole screen; the base is translucent so the play area shows
   * through.
   */
  /**
   * The floating joystick.
   *
   * Nothing is drawn until the player touches the stage: the base then appears
   * centred on the touch point, follows the drag, and fades out on release.  That
   * is what makes it discoverable — a permanently hidden stick at a fixed spot
   * would give no clue where to put your thumb.
   *
   * The original game reads `Key.isDown(37/38/39/40)` — four digital directions,
   * with speed built up over frames by the physics — so there is no analog axis to
   * drive.  The stick therefore resolves to the same octant split an 8-way digital
   * stick has, and the result is bit-for-bit what the keyboard produces.
   */
  private buildStick(): void {
    // `?touch=1` forces it on, which is how the mobile layout can be checked from
    // a desktop browser (and gives touch-less machines on-screen controls).
    const forced = new URLSearchParams(location.search).get("touch") === "1";
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!forced && !hasTouch) return;

    // the base is purely decorative: all events are taken from the canvas (down)
    // and the window (move/up), so it never has to be hit-testable itself
    const base = document.createElement("div");
    base.className = "stick";
    base.innerHTML = '<div class="stick-knob"></div><div class="stick-ring"></div>';
    const host = document.getElementById("controls") ?? document.body;
    // without this the overlay stays display:none and the stick is never visible
    host.classList.add("has-touch");
    host.appendChild(base);

    const knob = base.querySelector<HTMLElement>(".stick-knob")!;
    let activeId: number | null = null;
    let anchorX = 0;
    let anchorY = 0;
    let travel = 40;

    // cos(67.5 deg): the axis threshold that partitions the circle into 8 equal
    // sectors, so pointing right lights only "right" and pointing up-right lights
    // "right" and "up" together.
    const AXIS = Math.cos((67.5 * Math.PI) / 180);

    const move = (clientX: number, clientY: number): void => {
      const dx = clientX - anchorX;
      const dy = clientY - anchorY;
      const dist = Math.hypot(dx, dy);

      const clamp = dist > travel ? travel / dist : 1;
      knob.style.transform = `translate(${dx * clamp}px, ${dy * clamp}px)`;

      if (dist < travel * 0.18) {
        this.setVirtual([]);
        return;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const dirs: (keyof InputState)[] = [];
      if (nx > AXIS) dirs.push("right");
      if (nx < -AXIS) dirs.push("left");
      if (ny > AXIS) dirs.push("down");
      if (ny < -AXIS) dirs.push("up");
      this.setVirtual(dirs);
    };

    const release = (): void => {
      activeId = null;
      base.classList.remove("active", "shown");
      knob.style.transform = "translate(0px, 0px)";
      this.setVirtual([]);
    };
    this.dropStick = release;

    // The whole window is the control surface, not just the canvas.  In landscape
    // the stage is height-limited and only fills ~54% of the width, so binding to
    // it would leave the natural thumb position in the letterbox band dead.  The
    // the corner buttons and any open menu are skipped: those are real UI.
    window.addEventListener("pointerdown", (e) => {
      if (!this.stickEnabled) return;
      if (activeId !== null) return; // one finger drives the stick
      const target = e.target as Element | null;
      // the corner buttons and the menus are real UI, not play area
      if (target?.closest?.("#overlays, #pause-btn, #settings-btn, #fs-btn")) return;

      activeId = e.pointerId;
      anchorX = e.clientX;
      anchorY = e.clientY;

      base.style.left = `${anchorX}px`;
      base.style.top = `${anchorY}px`;
      // travel is measured now that the element has a size; it only changes on
      // resize, and the base is re-placed on every touch anyway
      travel = Math.max(1, base.offsetWidth / 2 - knob.offsetWidth / 2);
      base.classList.add("active", "shown");
      knob.style.transform = "translate(0px, 0px)";
      this.setVirtual([]);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener("pointermove", (e) => {
      if (e.pointerId !== activeId) return;
      e.preventDefault();
      move(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", (e) => {
      if (e.pointerId === activeId) release();
    });
    window.addEventListener("pointercancel", (e) => {
      if (e.pointerId === activeId) release();
    });
    // belt and braces: a tab switch mid-drag must not leave a direction stuck on
    window.addEventListener("blur", release);
  }

  /**
   * Enable or disable the on-screen joystick.
   *
   * Switched off while a menu is open: the stick listens on the whole window, so
   * without this a drag across a settings panel would bank speed for the whale and
   * it would shoot off the moment you resumed.
   */
  setStickEnabled(on: boolean): void {
    this.stickEnabled = on;
    if (!on) this.dropStick?.();
  }

  /** Map a client-space point to stage coordinates. */
  toStage(canvas: HTMLCanvasElement, cx: number, cy: number): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((cx - r.left) / r.width) * STAGE_W,
      y: ((cy - r.top) / r.height) * STAGE_H,
    };
  }
}

/**
 * The stage is always 550x450 internally.  Fit it to the window preserving aspect
 * ratio; `fill` also allows the original 1:1 pixel size when it fits.
 */
export class View {
  private scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.fit();
    window.addEventListener("resize", () => this.fit());
    window.addEventListener("orientationchange", () => this.fit());
  }

  /**
   * The stage is a fixed 550x450.  Nothing is reserved for the controls any more —
   * they float over the game — so the stage simply gets everything inside `main`'s
   * padding, which is where the safe-area insets live.  It is centred by the flex
   * layout, and in landscape the leftover width becomes even bands on either side.
   */
  fit(): void {
    const root =
      this.canvas.closest("main") ?? (this.canvas.parentElement as HTMLElement | null);
    const cs = root ? getComputedStyle(root) : null;
    const padL = parseFloat(cs?.paddingLeft ?? "8") || 0;
    const padR = parseFloat(cs?.paddingRight ?? "8") || 0;
    const padT = parseFloat(cs?.paddingTop ?? "8") || 0;
    const padB = parseFloat(cs?.paddingBottom ?? "8") || 0;

    // read the padding back rather than assuming 8px, so the safe-area insets that
    // keep content clear of the notch and home bar are accounted for automatically
    const availW = window.innerWidth - padL - padR;
    const availH = window.innerHeight - padT - padB;

    const s = Math.max(0.25, Math.min(availW / STAGE_W, availH / STAGE_H));
    this.scale = s;
    this.canvas.style.width = `${Math.round(STAGE_W * s)}px`;
    this.canvas.style.height = `${Math.round(STAGE_H * s)}px`;
  }

  get currentScale(): number {
    return this.scale;
  }
}
