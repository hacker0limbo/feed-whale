/**
 * Asset loading.
 *
 * Every sprite frame was exported from the SWF by ffdec together with the offset of
 * that sprite's registration point inside the PNG (see tools/build_manifest.py), so
 * drawing at (x, y) puts the clip exactly where Flash had it.
 */
import manifestJson from "./assets-index.json";

export interface FrameArt {
  image: HTMLImageElement;
  originX: number;
  originY: number;
  w: number;
  h: number;
}

interface ManifestFrame {
  frame: number;
  originX: number;
  originY: number;
  w: number;
  h: number;
  hasArt: boolean;
}
interface ManifestSprite {
  id: number;
  exportName: string | null;
  frames: ManifestFrame[];
}
interface Manifest {
  sprites: Record<string, ManifestSprite>;
  images: Record<string, string>;
  sounds: Record<string, string>;
}
const manifest = manifestJson as unknown as Manifest;

const BASE = "assets/";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

export class Assets {
  private sprites = new Map<string, FrameArt[]>();
  private images = new Map<string, HTMLImageElement>();
  private sounds = new Map<string, AudioBuffer>();
  private resImages = new Map<string, HTMLImageElement>();
  private resButtons = new Map<string, HTMLImageElement[]>();

  /** sprite folder name -> FrameArt[1..n] */
  get(name: string): FrameArt[] {
    const s = this.sprites.get(name);
    if (!s) throw new Error(`sprite ${name} not loaded`);
    return s;
  }

  image(name: string): HTMLImageElement {
    const i = this.images.get(name);
    if (!i) throw new Error(`image ${name} not loaded`);
    return i;
  }

  /** UI image from Qua_RES.swf, e.g. "@qua_intro", "@howto", "@gameover02". */
  resImage(name: string): HTMLImageElement | undefined {
    return this.resImages.get(name);
  }

  /** Button art from Qua_RES.swf: [up, over, down]. */
  resButton(name: string): HTMLImageElement[] | undefined {
    return this.resButtons.get(name);
  }

  sound(linkage: string): AudioBuffer | undefined {
    return this.sounds.get(linkage);
  }

  async load(ctx: AudioContext): Promise<void> {
    const jobs: Promise<void>[] = [];

    for (const [name, frames] of Object.entries(manifest.sprites)) {
      jobs.push(
        (async () => {
          const arts: FrameArt[] = [];
          for (const f of frames.frames) {
            if (!f.hasArt) continue;
            const img = await loadImage(`${BASE}sprites/${name}/${f.frame}.png`);
            arts.push({ image: img, originX: f.originX, originY: f.originY, w: f.w, h: f.h });
          }
          this.sprites.set(name, arts);
        })(),
      );
    }

    for (const [id, file] of Object.entries(manifest.images)) {
      jobs.push(
        (async () => {
          this.images.set(id, await loadImage(file));
        })(),
      );
    }

    // UI from Qua_RES.swf
    for (const [file, key] of [
      ["1_@qua_intro.jpg", "@qua_intro"],
      ["2_@howto.png", "@howto"],
      ["3_@gameover02.png", "@gameover02"],
      ["22.png", "btn97a"],
      ["25.png", "btn97b"],
      ["36.png", "btn214"],
    ] as const) {
      jobs.push(
        (async () => {
          this.resImages.set(key, await loadImage(`${BASE}res/images/${file}`));
        })(),
      );
    }
    for (const [id, name] of [
      ["27", "@b_qhowto01"],
      ["29", "@b_qstart01"],
      ["31", "@b_qrank01"],
      ["33", "@b_qgototop01"],
      ["35", "@b_qagain01"],
    ] as const) {
      jobs.push(
        (async () => {
          const dir = `${BASE}res/buttons/DefineButton2_${id}_${name}`;
          try {
            const up = await loadImage(`${dir}/1_up.png`);
            let over = up;
            try {
              over = await loadImage(`${dir}/2_over.png`);
            } catch {
              /* some buttons ship no over state */
            }
            this.resButtons.set(name, [up, over]);
          } catch {
            /* button art is optional; the port falls back to a drawn label */
          }
        })(),
      );
    }

    // sounds: exported linkage name -> file
    for (const [linkage, file] of Object.entries(manifest.sounds)) {
      jobs.push(
        (async () => {
          const res = await fetch(file);
          const buf = await res.arrayBuffer();
          this.sounds.set(linkage, await ctx.decodeAudioData(buf));
        })(),
      );
    }

    await Promise.all(jobs);
  }
}

export const assets = new Assets();
