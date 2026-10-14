import "./style.css";
import { assets } from "./assets";
import { Game } from "./game/Game";
import { Input, View } from "./platform";
import { settings } from "./settings";
import { Overlays } from "./ui/overlays";
import { SoundMaster } from "./flash/SoundMaster";
import { Stage } from "./flash/Stage";
import { STAGE_H, STAGE_W } from "./game/constants";

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const statusEl = document.getElementById("status")!;
const loading = document.getElementById("loading")!;

// Vite's HMR re-executes this module on every edit, which would otherwise leave a
// second Stage fighting over the same canvas.
declare global {
  interface Window {
    __fwBooted?: boolean;
  }
}

async function main(): Promise<void> {
  if (window.__fwBooted) return;
  window.__fwBooted = true;

  // Browsers only let audio start from a user gesture, so the context stays
  // suspended until the first tap.  Nothing plays before then anyway — the title
  // screen's own buttons are the first thing a player touches.
  let ctx: AudioContext | null = null;
  const audioCtx = () => (ctx ??= new AudioContext());
  const unlockAudio = () => void audioCtx().resume();
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });

  // Decoding needs no gesture, so the load pass uses a throwaway context.
  const probe = new AudioContext();
  await assets.load(probe);
  await probe.close();

  const stage = new Stage(canvas, STAGE_W, STAGE_H, 30);

  // Input comes first: it creates the touch-control strip that View then sizes the
  // stage around.  On a device with no touch the strip stays empty and takes no
  // room, so the desktop layout is unchanged.
  const input = new Input(canvas, () => {
    /* any key press also unlocks audio, handled above */
  });
  const view = new View(canvas);
  const sm = new SoundMaster(audioCtx());
  const game = new Game(stage, sm, assets, settings);
  game.input = input.state;

  const toStage = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((cx - r.left) / r.width) * STAGE_W,
      y: ((cy - r.top) / r.height) * STAGE_H,
    };
  };

  // Canvas-drawn buttons cannot get a cursor from CSS, so drive it from the hit test.
  canvas.addEventListener("mousemove", (e) => {
    const p = toStage(e.clientX, e.clientY);
    canvas.style.cursor = game.hoverable(p.x, p.y) ? "pointer" : "default";
  });
  canvas.addEventListener("mouseleave", () => {
    canvas.style.cursor = "default";
  });

  canvas.addEventListener("mousedown", (e) => {
    const p = toStage(e.clientX, e.clientY);
    game.click(p.x, p.y);
  });
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      const p = toStage(t.clientX, t.clientY);
      game.click(p.x, p.y);
    },
    { passive: true },
  );

  // ---------------------------------------------------------------- pause ---
  // Pausing stops the clock and suspends the audio context; the rAF loop keeps
  // painting so the overlays have something to sit on.
  const setPaused = (on: boolean) => {
    stage.paused = on;
    if (on) sm.pause();
    else sm.resume();
    input.setStickEnabled(!on && !overlays.isOpen);
  };

  const overlays = new Overlays({
    settings,
    canPause: () => isPlaying && !stage.paused,
    onResume: () => setPaused(false),
    onRestart: () => {
      setPaused(false);
      game.restartRound();
    },
    onHome: () => {
      setPaused(false);
      game.goHome();
    },
    onLevelJump: (level) => {
      settings.setLevel(level);
      if (isPlaying) game.jumpToLevel(level);
    },
    // Opening any overlay stops the clock: a menu on screen while the whale keeps
    // swimming (and starving) would be worse than useless.
    onOpenChange: (open) => setPaused(open),
  });

  let isPlaying = false;
  game.onPlayState = (playing) => {
    isPlaying = playing;
    overlays.setPlayState(playing);
  };

  // ------------------------------------------------------------- fullscreen ---
  // Chrome on Android grants this; iPhone Safari has no Fullscreen API at all,
  // which is why the manifest/PWA route exists for iOS instead.
  const canFullscreen =
    !!document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === "function";
  if (canFullscreen) {
    overlays.fsButton.addEventListener("click", () => {
      if (document.fullscreenElement) void document.exitFullscreen?.();
      else void document.documentElement.requestFullscreen()?.catch(() => {});
    });
  }
  document.addEventListener("fullscreenchange", () => {
    const on = !!document.fullscreenElement;
    overlays.fsButton.setAttribute("aria-label", on ? "退出全屏" : "全屏");
    view.fit();
  });

  // ------------------------------------------------------- settings wiring ---
  sm.setMusicEnabled(settings.get("music"));
  sm.sfxOn = settings.get("sfx");
  input.setStickEnabled(settings.get("showStick"));

  settings.subscribe((s, changed) => {
    switch (changed) {
      case "music":
        game.setMusicEnabled(s.music);
        break;
      case "sfx":
        sm.sfxOn = s.sfx;
        break;
      case "showStick":
        input.setStickEnabled(s.showStick && !stage.paused && !overlays.isOpen);
        break;
      case "level":
        if (isPlaying) game.jumpToLevel(s.level);
        break;
    }
  });

  // `P` toggles the pause menu.  Escape is owned by the overlays (see onKey
  // there for why the two must not both act on it).
  window.addEventListener("keydown", (e) => {
    if (e.repeat || overlays.isOpen || !isPlaying) return;
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      setPaused(true);
      overlays.openPause();
    }
  });

  // Losing the tab must not cost you the run.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isPlaying && !stage.paused) {
      setPaused(true);
      overlays.openPause();
    }
  });

  // ---------------------------------------------------------------- boot ---
  // Build the scene graph and drop the splash.  From the player's side this is
  // simply: waiting, then the game's own title screen — there is no host dialog
  // in between.
  game.start();
  overlays.setPlayState(false); // title screen: the settings button shows
  overlays.fsButton.hidden = !canFullscreen;
  view.fit();
  loading.hidden = true;

  // expose a couple of handles for automated visual checks
  Object.assign(window as unknown as Record<string, unknown>, {
    __game: game,
    __stage: stage,
    __view: view,
    __settings: settings,
    __sm: sm,
    __assets: assets,
  });
}

main().catch((e: unknown) => {
  const err = e as Error;
  loading.hidden = true;
  statusEl.textContent = "启动失败：" + String(e);
  statusEl.dataset.stack = String(err?.stack ?? e);
  console.error(e);
});
