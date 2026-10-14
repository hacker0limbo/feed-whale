/**
 * Stand-in for the game's `nhn.game.SoundMaster`.
 *
 * The original keeps an internal index list built by
 * `attachAllSound("s_bg","s_over2","s_ending","s_level","s_item","s_eat1","s_eat2",
 *                 "s_bomb1","s_bomb2","s_sharkstage1","s_shark1","s_eat3")`
 * and the game refers to sounds by that index (see the IV.SOUND_* constants).
 * `sound_array` is that list.
 */
import { assets } from "../assets";

export const SOUND_LINKAGES = [
  "s_bg",          // 0  IV.SOUND_BG
  "s_over2",       // 1  IV.SOUND_OVER
  "s_ending",      // 2  IV.SOUND_ENDING
  "s_level",       // 3  IV.SOUND_LEVEL
  "s_item",        // 4  IV.SOUND_ITEM
  "s_eat1",        // 5  IV.SOUND_EAT1
  "s_eat2",        // 6  IV.SOUND_EAT2
  "s_bomb1",       // 7  (unused)
  "s_bomb2",       // 8  IV.SOUND_HIT
  "s_sharkstage1", // 9  IV.SOUND_SHARKSTAGE
  "s_shark1",      // 10 IV.SOUND_SHARK
  "s_eat3",        // 11 IV.SOUND_EAT3
] as const;

/** Index 0 in SOUND_LINKAGES is `s_bg`, the looping background track. */
const BGM_INDEX = 0;

export class SoundMaster {
  private ctx: AudioContext;
  private volumes = new Map<number, number>();
  private playing = new Map<number, AudioBufferSourceNode[]>();

  /** Player-facing gates; see src/settings.ts. */
  musicOn = true;
  sfxOn = true;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /** Turning the music off also silences the track that is already playing. */
  setMusicEnabled(on: boolean): void {
    this.musicOn = on;
    if (!on) this.stop(BGM_INDEX);
  }

  /**
   * Freeze and unfreeze everything at once.
   *
   * Suspending the AudioContext keeps each source's playback position, so the
   * music picks up mid-phrase rather than restarting — which is what "pause"
   * should sound like.
   */
  pause(): void {
    void this.ctx.suspend();
  }

  resume(): void {
    void this.ctx.resume();
  }

  /** Flash `setVolume(index, 0..100)`. */
  setVolume(index: number, vol: number): void {
    this.volumes.set(index, vol / 100);
  }

  /**
   * Flash `start(index, offsetSeconds, loops)`.
   *
   * `loops` in AS2 is a repeat count, where a large number means "keep going"
   * (the game passes 10000 for the BGM and 1000 for the ending theme).
   */
  start(index: number, offset = 0, loops = 1): void {
    if (index === BGM_INDEX ? !this.musicOn : !this.sfxOn) return;
    const linkage = SOUND_LINKAGES[index];
    if (!linkage) return;
    const buffer = assets.sound(linkage);
    if (!buffer) return;

    // AS2 has one Sound object per channel, so calling start() again *restarts*
    // that channel.  Our sources are independent nodes, so without this a second
    // start would leave the first running and two copies would be heard at once
    // (e.g. restarting a round relaunched the looping BGM on top of the old one).
    this.stop(index);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    // AS2 "loops" counts repeats after the first play
    src.loop = loops > 1;
    if (loops > 1) src.loopEnd = buffer.duration;

    const gain = this.ctx.createGain();
    gain.gain.value = this.volumes.get(index) ?? 1;
    src.connect(gain).connect(this.ctx.destination);
    src.start(0, offset);

    const list = this.playing.get(index) ?? [];
    list.push(src);
    this.playing.set(index, list);
    src.onended = () => {
      const l = this.playing.get(index);
      if (l) {
        const i = l.indexOf(src);
        if (i >= 0) l.splice(i, 1);
      }
    };
  }

  /** Flash `stop(index)` — silences every live instance of that sound. */
  stop(index: number): void {
    const list = this.playing.get(index);
    if (!list) return;
    for (const s of list.splice(0)) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
  }

  stopAll(): void {
    for (const index of this.playing.keys()) this.stop(index);
  }
}
