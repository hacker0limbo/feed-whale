# 《喂食鲸》/ 아기고래 쿠아 (Qua01.swf) — Reverse-engineering implementation spec

Target: exact HTML5/TypeScript reimplementation of `Qua01.swf` (+ `Qua_RES.swf`).
Source SWF: SWF v7, AS2/AVM1, stage **550x450**, **30 fps**, root timeline **2 frames**, background colour **#003366**.
Companion: `game/lang/Qua_RES.swf` (165 420 bytes) — imported *inside* Qua01 through
`ImportAssets` tags (NOT `loadMovie`), see §1.8 and §8.

Reading conventions used below:
* Names in `backticks` are identifiers taken verbatim from the ActionScript.
* `§N` = the `§§constant(N)` placeholders printed by JPEXS FFDec; resolved against the
  de-obfuscation tables stored in the ConstantPool of each action stream (see §10.1).
* All coordinates are stage pixels = twips/20. All `_x`/`_y` are the clip's registration
  point on stage unless stated otherwise.

---

## 1. Entity & object model

### 1.1 Root timeline layout (from FFDec `-swf2xml`, exact tag order)

**Frame 1 (intro screen) — in tag order:**

| depth | character | name | x | y | scale | notes |
|---|---|---|---|---|---|---|
| — | DoAction | — | — | — | — | the frame-1 script (§8.1) |
| 1 | 58 (DefineShape 550x450) | — | 0 | 0 | 1 | full-screen rectangle **filled with bitmap 57 = `@qua_intro`** → the intro background |
| 2 | 59 (imported `@b_qhowto01`) | `help_btn` | 380.95 | 345.0 | 1 | button, 98x38 |
| 5 | 60 (imported `@b_qstart01`) | `start_btn` | 275.95 | 345.0 | 1 | button, 98x38 |
| 9 | 64 (DefineSprite, 9 frames) | `gamehelp_mc` | 274.6 | 224.2 | 1.0 / 0.99617 | the how-to panel |
| 11 | 65 (imported `@coryright_mc`) | — | 280.1 | 428.8 | 1 | copyright logo strip |
| 14 | 78 (DefineSprite, 2 frames, `stop()` on f1) | — | -47 | 51 | 1 | un-named intro decoration |

`rank_btn` is referenced by the frame-1 script but **never placed** — it is supplied by the
web host wrapper (Hangame/Ourgame `ServerConnection`/`FrameFunc` boilerplate). See §10.4.

**Frame 2 (gameplay) — in tag order:** first 5 `RemoveObject2` (depths 2,5,9,11,14) wipe the
intro, then the frame-2 DoAction (§5), then:

| depth | character | name | x | y | scale | notes |
|---|---|---|---|---|---|---|
| 1 | 80 (DefineShape 550x450, bitmap 79) | — | 0 | 0 | 1 | the sea background bitmap |
| 2 | 89 (DefineSprite, 4 frames) | `eatable_mc` | 198.5 | 373.9 | 1 | "fish you may eat" indicator |
| 9 | 90 (DefineShape 551x361.85, black) | — | 0 | 0 | 1 | dark water overlay above the background |
| 10 | 204 (DefineSprite, 10 frames) | `player_mc` | 270.0 | 167.0 | 1 | **the whale** |
| 54 | 206 (DefineSprite, 35 frames) | `levelup_mc` | -39.95 | -22.75 | 1 | level-up burst (follows the whale, §5.7) |
| 69 | 207 (DefineSprite, 1 frame, empty) | `boggle_mc` | 0 | 0 | 1 | container for bubbles |
| 71 | 208 (DefineSprite, 1 frame, empty) | `fish_area` | 0 | 0 | 1 | container for all fish/sharks/items |
| 74 | 215 (DefineSprite, 10 frames) | `gameover_mc` | 282.35 | 266.75 | 1 | game-over card, `stop()` at f10 |
| 77 | 221 (DefineSprite, 10 frames) | `gameclear_mc` | 274.55 | 235.4 | 1 | game-clear card, `stop()` at f10 |
| 89 | 223 (DefineShape 32x189, bitmap 222) | — | 1.9 | 1.75 | 1 | foreground plant |
| 90 | 225 (DefineShape 31x156, bitmap 224) | — | 392.7 | 2.1 | 1 | foreground plant |
| 91 | 230 (DefineSprite, 68 frames) | `hungry_bar` | 50.2 | 6.0 | 1 | **life/hunger bar** (frame = hunger) |
| 99 | 231 (DefineSprite, 1 frame) | `score_mc` | 413.45 | 6.0 | 1 | score display: **6** digits |
| 111 | 232 (DefineSprite, 1 frame) | `mission1` | 165.55 | 417.9 | 1 | mission counter 1 (2 digits) |
| 115 | 232 | `mission2` | 226.5 | 417.9 | 1 | |
| 119 | 232 | `mission3` | 302.5 | 417.9 | 1 | |
| 123 | 232 | `mission4` | 394.45 | 417.9 | 1 | |
| 127 | 232 | `level_mc` | 66.7 | 392.9 | 1 | level display (2 digits) |
| 131 | 234 (DefineSprite, 1 frame → shape 233, 551x300) | `aqua_mc` | 0 | -1.0 | **1.0000305 / 1.1800995** | the play-area bounding box + water art |

The 6-digit `score_mc` (sprite 231) is six `scorenum` (chid 54) instances at
x = 49.5, 63.5, 77.5, 91.5, 105.5, 119.5 (pitch 14). `mission1..4` and `level_mc`
(sprite 232) are two `scorenum` instances at x = -6.5 and 7.5 (pitch 14).

### 1.2 Attachment (library) symbols — `ExportAssets` / `attachMovie` ids

| linkage name | character id | used by |
|---|---|---|
| `enemy` | 30 (4 frames) | `fish_area.attachMovie("enemy", …)` in `makeEnemy()`; class `Fish` registered via `Object.registerClass("enemy",Fish)` |
| `shark` | 10 (1 frame) | same, for type > `fishesTotal`; `Object.registerClass("shark",Fish)` |
| `item` | 33 (1 frame) | `makeItem()` |
| `boggle` | 56 (1 frame) | `newBoggle()` / `backBoggle()` |
| `scorenum` | 54 (10 frames, digits 0-9) | class `nhn.game.Digit` registered with `Object.registerClass("scorenum", …)` |
| `s_bg`,`s_over2`,`s_ending`,`s_level`,`s_item`,`s_eat1`,`s_eat2`,`s_bomb1`,`s_bomb2`,`s_sharkstage1`,`s_shark1`,`s_eat3` | 77,68,72,70,71,75,74,76,1,66,67,73 | sounds, see §7 |
| `s_over1` | 69 | exported but **never used** |
| (unnamed) | 63 | a sound in the file that has no export name and is never referenced |

Class-definition clips (0 frames, `DoInitAction` only): 235 `__Packages.Fish`,
236 `nhn.game.Digit`, 237 `nhn.game.DigitSet`, 238 `nhn.game.Timer`,
239 `mx.events.EventDispatcher`, 240 `mx.transitions.OnEnterFrameBeacon`,
241 `mx.transitions.BroadcasterMX`, 242 `mx.transitions.Tween`, 243 `nhn.game.Shock`,
244 `nhn.game.SoundMaster`, 245 `mx.transitions.easing.Regular`, 246 `nhn.game.Input`.

### 1.3 `player_mc` (sprite 204) — internal structure

10 frames (one per growth level) — frame N is the whale at level N (`getLevel()` ==
`player_mc._currentframe`). Children, re-placed on every frame:

| frame | child (depth 1 = `ani`) | `light` (depth 3) | `hitArea` (depth 41) | `boggle` (depth 43) |
|---|---|---|---|---|
| 1 | 101 @ (-23, -13) | 104 @ (0.05,-0.6) | 9 @(-12.8,-9.65) s(0.2492,0.3294) | 56 @(19.3,3.05) |
| 2 | 115 @ (-27.5,-15.5) | scale 1.2428 | s(0.2819,0.3834) | @(22.4,2.75) |
| 3 | 126 @ (-32.5,-17.5) | 1.4856 | s(0.3825,0.4791) | @(29.25,4.95) |
| 4 | 137 @ (-37,-20) | 1.7284 | s(0.4122,0.5334) | @(33.8,5.65) |
| 5 | 148 @ (-42,-22.5) | 1.9712 | s(0.4792,0.6429) | @(41.9,6.35) |
| 6 | 159 @ (-47,-25.5) | 2.2141 | s(0.4749,0.6650) | @(45.15,7.05) |
| 7 | 170 @ (-52,-27.5) | 2.4569 | s(0.4805,0.7118) | @(49.05,8.5) |
| 8 | 181 @ (-57,-30) | 2.6996 | s(0.5417,0.7674) | @(54.1,8.95) |
| 9 | 192 @ (-62,-32.5) | 2.9425 | s(0.5486,0.8294) | @(55.2,9.4) |
| 10 | 203 @ (-67,-35) | 3.1853 | s(0.6047,0.9145) | @(58.25,9.85) |

* `ani` (sprites 101/115/126/137/148/159/170/181/192/203, each 5 frames) is the whale's
  animation bank for that level; `playerAni()` selects frame 1..5 (see §6).
* `light` (sprite 104, 65 frames) is the level-up sparkle; `player_mc.light.gotoAndPlay(1)`.
  It contains 10 × sprite 103 (30 frames) bubbles; 8 of them run
  `onClipEvent(load){ gotoAndPlay(20) }` and one runs `gotoAndPlay(10)` → staggered burst.
* `hitArea` (sprite 9 → shape 8, 62x121.95) is the collision box used by `hitTest`.
* `boggle` (sprite 56) is a marker: bubbles are spawned from its position, offset by
  `player_mc._xscale/100 * boggle._x` (so it mirrors with the whale).

### 1.4 `enemy` (sprite 30) and `shark` (sprite 10)

`enemy` has **4 frames = the 4 fish sizes/species** (`setType(t)` → `gotoAndStop(t)`).
Children per frame:

| frame (= type) | art | `ani` sub-sprite | `hitArea` |
|---|---|---|---|
| 1 | shape 12 (18x23, bitmap 11) — small yellow butterflyfish | — | sprite 9 @(-9.7,-7.9) s(0.1639,0.2592) |
| 2 | shape 19 @(-13.1,-10.6) (69x38) | 17 (22 frames) @(-3.35,-3.4) | (kept) |
| 3 | 38.2x… shape @(-13.85,-13.1) s(0.3839,0.4489) | 24 (18 frames) @(3.75,0.5) | (kept) |
| 4 | shape @(-38.2,3.6) s(0.8304,0.1946) | 29 (13 frames) @(2.95,1.55) | (kept) |

(frame 4 art = a large purple sailfish/swordfish.) `shark` (sprite 10) has **1 frame**:
`ani` = sprite 7 (3 frames) @(-84.55,-50.55) and `hitArea` = sprite 9 @(-17.6,-19.45)
s(0.7133,0.8176). Because the shark symbol has a single frame, `gotoAndStop(type)` with
type=5..7 leaves it on frame 1; only `this.type` (a property) distinguishes it, which is
what the game logic uses.

### 1.5 `item` (sprite 33), `boggle` (sprite 56)

* `item`: 1 frame; shape 32 (43x43, bitmap 31) + `hitArea` (sprite 9 @(-16.4,-14.65)
  s(0.274,0.5098)).
* `boggle`: 1 frame; shape 55 (6x6 white circle). Used for all bubbles.

### 1.6 `hungry_bar` (sprite 230), 68 frames

A filmstrip: frame 1 = full bar, frame 68 = empty. `hungryBar()` maps hunger → frame.
Contents: shape 226 (125x21.5 dark bar) + shape 228 (132x22, bitmap 227 = the "Life"
plate) + sprite 229 (23 frames, the animated water surface that scrolls in 68 steps).

### 1.7 Cards

* `gameover_mc` (sprite 215, 10 frames, `stop()` at f10): f1 empty, f2..f9 grow the card
  from scale 0.2 → 1.0 while sliding from (-28.3,-75.1) → (-114.3,-119.1); f2+ contains
  shape 209 (the dark backing) and sprite 214 (the card face) and the frame-10 state places
  chid 214 at scale 1.
* sprite 214 (1 frame) = the card face: shape 211 (215x110, **bitmap 210 = `@gameover02`**)
  plus `retry_btn` (chid 212 = `@b_qagain01`) @(59.15,79.45) and `intro_btn`
  (chid 213 = `@b_qgototop01`) @(159.15,79.45). Its frame-1 script is the button wiring
  (§8.5).
* `gameclear_mc` (sprite 221, 10 frames, `stop()` at f10): f2..f9 grow from 0.25 → 1.0;
  contains shape 209, shape 217 (356x346, bitmap 216) and four sprite 219 (23 frames, a
  0.72→1.06 "pulse" = e.g. rising bubbles) at decreasing scales; f9/f10 adds
  chid 220 (`@b_qgototop01`) @(111.1,132.65).
* `gamehelp_mc` (sprite 64, 9 frames, `stop()` at f9): the how-to panel; shape 62
  (**325x253, bitmap 61 = `@howto`**) grows from scale 0.2 @(59.4,-106.6) to scale 1.0
  @(-77,-211) over frames 1-5, then a 1.0 → 0.9725 → 0.945 → 0.9725 wobble on frames 5-8.

### 1.8 Qua_RES.swf assets

`ImportAssets("game/lang/Qua_RES.swf", …)` is executed 9 times (one import per tag) at
these points of the Qua01 tag stream, binding the following *local* character ids:

| local chid | imported name | where used |
|---|---|---|
| 57 | `@qua_intro` | bitmap fill of the frame-1 full-screen shape 58 |
| 59 | `@b_qhowto01` | root f1 depth 2 `help_btn` |
| 60 | `@b_qstart01` | root f1 depth 5 `start_btn` |
| 61 | `@howto` | bitmap fill of shape 62 (inside `gamehelp_mc`) |
| 65 | `@coryright_mc` | root f1 depth 11 |
| 210 | `@gameover02` | bitmap fill of shape 211 (game-over card face) |
| 212 | `@b_qagain01` | `retry_btn` in sprite 214 |
| 213 | `@b_qgototop01` | `intro_btn` in sprite 214 |
| 220 | `@b_qgototop01` | "go to top" button in `gameclear_mc` |

Qua_RES also defines (per its own export list) `@copyright` (sprite 16), the redirect
sprite 20 / `@coryright_mc` (sprite 21) and `@b_qrank01` (button 31).
The exported button art lives in `re/export/Qua_RES/buttons/DefineButton2_{27,29,31,33,35}_@{name}/`
(`1_up.png`, `2_over.png`, `3_down.png`, `4_hittest.png`).
`@copyright`'s frame-1 script is `frames.FrameFunc.logoFunc(this)` (host-provided
`frames` object) — see `re/export/Qua_RES/scripts/DefineSprite_16_@copyright/frame_1/`.
`@coryright_mc`'s child sprite 20 does a domain check with `enabled = false`
(`serviceType = "cn_ourgame1"`, `etcDomain = "http://flash.in.ourgame.com"`,
`toURL = "http://flash.ourgame.com"`, all set in an `on(construct)` clip event) which
therefore always falls to `this.gotoAndStop(2)` = show the plain copyright logo.

---

## 2. Global state variables

All of these are created as globals (properties of the root clip / `_global`) by the
**frame-2 DoAction** script, except where noted.

| variable | init value | meaning |
|---|---|---|
| `_global.IV` | `{}` | constant object, filled immediately (see §3.1) |
| `_global.GAME` | `{}` | only `GAME.score` is ever used; set to `score` on game over/clear (handed to the host) |
| `sm` | `new nhn.game.SoundMaster(this, 9999)` | sound manager (§9.1) |
| `score` | `0` | current score (integer) |
| `hungry` | `100` | life/stamina, 0..100 (clamped at 100 by `hungryBar()`) |
| `eList` | `[]` with extra property `count = 0` | array of all live fish/sharks/items; `count` is the frame counter used to pace spawning |
| `eatcount` | `[0,0,0,0]` | remaining fish to eat per size index 1..4 (index 0 = size 1) |
| `fishesTotal` | `4` | number of fish sizes; `eatcount` length; also the "biggest fish" type |
| `ctenemy` | `false` | debug flag toggled by the mouse cheat (§5.12): spawns uniformly random types |
| `player_mc.xspeed` / `.yspeed` | `0` / `0` | whale velocity (reset once at init, then per-frame) |
| `player_mc.item` | undefined (= no item) | set to `IV.ITEM_TRANS` when the invisibility item is active |
| `player_mc.moveani` | undefined → 0 | move-animation phase counter |
| `player_mc.die` | undefined/false | true after `onGameOver()`; Fish reads it |
| `bPos` | `[{x:297,y:310},{x:157,y:308},{x:74,y:279},{x:430,y:336}]` | four points where ambient bubbles rise from the sea floor |
| `gameover_listener` | object with `onKeyDown`/`onMouseDown` | **dead code — never registered with `nhn.game.Input`.** (See §10.3.) |
| `c_listener` | object with `onMouseDown`/`onMouseUp`, `time = getTimer()` | mouse cheat listener, registered with `nhn.game.Input.addListener(c_listener)` |
| `item_listener` | **never defined anywhere** | `makeItem()` does `item_listener.isShow = true`, which throws a silent AVM1 error. Treat as a no-op. |
| `ServerConnection` | not defined in the SWF | host object; `ServerConnection.onGameStart()`, `.onGameOver()`, `.getRankEnabled()`, `.onGameRankRequest()` are called but resolve to undefined (AVM1 errors are non-fatal). Stub it. |

Helper functions defined by the same script (all globals): `hungryBar`, `makeItem`,
`removeItem`, `useItem`, `grow`, `addScore`, `getLevel`, `getEatLevel`, `setEatCount`,
`updateEatCount`, `nextLevel`, `makeEnemy`, `sharksTotal`, `removeEnemy`, `backBoggle`,
`newBoggle`, `startGame`, `onGameOver`, `onGameClear`, `playerAni`, `pmc_onEnterFrame`.

Frame-1 script globals: the intro Sound object (`set(<obfuscated name>, new Sound(...))`),
plus the wiring functions described in §8.1.

---

## 3. Constant tables

### 3.1 `IV` (created as `_global.IV` — this is the real name; it is never renamed)

```as
IV.TOP            = aqua_mc._y;                      // = -1      (stage px)
IV.BOTTOM         = aqua_mc._y + aqua_mc._height;    // = -1 + 300*1.1800995 = 353.03
IV.LEFT           = aqua_mc._x;                      // = 0
IV.RIGHT          = aqua_mc._x + aqua_mc._width;     // = 551 * 1.0000305  = 551.02
IV.ITEM_TRANS     = 1;
IV.SOUND_BG       = 0;
IV.SOUND_OVER     = 1;
IV.SOUND_ENDING   = 2;
IV.SOUND_LEVEL    = 3;
IV.SOUND_ITEM     = 4;
IV.SOUND_EAT1     = 5;
IV.SOUND_EAT2     = 6;
IV.SOUND_EAT3     = 11;
IV.SOUND_HIT      = 8;
IV.SOUND_SHARKSTAGE = 9;
IV.SOUND_SHARK    = 10;
```

**IMPORTANT for the implementer:** `IV` only ever holds the entries above. Everything else
the task brief listed as `IV.xxx` is in fact a **bare global** in the frame-2 script
(no `IV.` prefix):

`HUNGRY_LEVEL`, `HUNGRY_SHARK`, `HUNGRY_UP`, `DAMAGE_LEVEL`, `EAT_LEVEL`, `SCORE_LEVEL`,
`SCORE_UP`, `SHARK_STAGE`, `SHOW_COUNT`, `LAST_LEVEL`, `NEXT_LEVEL`, `SPEED_LEVEL`,
`X_SPEED`, `Y_SPEED`, `fishesTotal`.
There is **no `IV.FPS`** anywhere in the SWF (searched `frame_2`, `frame_1`, all
`__Packages` scripts and all sprite scripts) — frame rate is the SWF header's 30 fps.
`IV.TOP/BOTTOM/LEFT/RIGHT` are computed at runtime from `aqua_mc`, so the literal values
above are derived from `aqua_mc`'s placement (x=0, y=-1, xscale=1.0000305,
yscale=1.1800995, content 551x300).

### 3.2 Level tables (verbatim from `frame_2/DoAction.as`)

```as
SPEED_LEVEL = [0.9, 0.9, 0.88, 0.86, 0.85, 0.85, 0.85, 0.84, 0.83, 0.82];   // 10 entries
EAT_LEVEL   = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4];                              // 10 entries
SHARK_STAGE = 8;
NEXT_LEVEL       = [];
NEXT_LEVEL[0]    = [0, 0, 3, 3, 4, 4, 5, 6, 6, 7];                         // 10 entries
NEXT_LEVEL[1]    = [4, 5, 3, 4, 4, 5, 5, 6, 7, 8];                         // 10 entries
LAST_LEVEL  = NEXT_LEVEL[1].length;                                       // = 10
HUNGRY_LEVEL= [1.5, 2, 3, 5, 7, 9, 11, 13, 15, 17];                        // 10 entries
HUNGRY_UP   = [4, 8, 12, 16];                                             // 4 entries
SCORE_UP    = [100, 150, 250, 300];                                       // 4 entries
SCORE_LEVEL = 15;
DAMAGE_LEVEL= [16, 16, 8, 9, 10, 11, 13, 15, 17, 20];                      // 10 entries
SHOW_COUNT  = 20;
X_SPEED     = 1.5;
Y_SPEED     = 1;
HUNGRY_SHARK= 100;
fishesTotal = 4;
score       = 0;
ctenemy     = false;
eatcount    = [0,0,0,0];
```

Volume settings applied right after construction:

```as
sm.setVolume(IV.SOUND_BG,    32);
sm.setVolume(IV.SOUND_SHARK, 64);
```

### 3.3 `Fish` class constants (static arrays on the class object)

```as
Fish.highSpeed  = [3, 6, 4, 9, 7];      // px/frame toward the front, indexed by type-1
Fish.lowSpeed   = [0.5, 2, 0.5, 4, 4];  // px/frame "get-away / low" speed
Fish.highRate   = [0.2, 0.5, 0.2, 0.2, 0.8];  // level threshold for switching to "high"
Fish.changeRate = [0.5, 0.5, 0.3, 0.8, 0.7];  // level threshold for re-evaluating speed
```
Index meaning: 0..3 = fish type 1..4, index 4 = the shark (type ≥ 5).

### 3.4 Derived gameplay constants

* Spawn period: `if (eList.count++ > SHOW_COUNT) { makeEnemy(); eList.count = 0; }`
  → one new fish every **22 frames** (0.73 s at 30 fps), the first at frame 22.
* Hunger drain: `hungry -= HUNGRY_LEVEL[getLevel()-1] / 60` per frame
  → level 1: 0.025/frame (0.75/s); level 10: 0.2833/frame (8.5/s).
* Score for a level-up: `Math.round(hungry) * SCORE_LEVEL` (=15 × current hunger).

---

## 4. The `Fish` class (`re/flat/__Packages__Fish.flat.as`, `Fish.as`)

Declared as `_global.Fish`, `Fish extends MovieClip`, registered for both `enemy` and
`shark`. Note the class body is stored in a non-standard SWF tag (code 253); FFDec exports
it as `scripts/__Packages/Fish.as`.

### 4.1 Fields

| field | inferred meaning | evidence |
|---|---|---|
| `type` | species/size index 1..4 (fish) or ≥5 (shark) | `setType`; also compared against `EAT_LEVEL` and used to index the static arrays |
| `shark` | true iff `type > 4` | `if(this.type > 4) this.shark = true;` |
| `count` | frame counter, 0..29, drives the periodic speed re-evaluation | `this.count++; if(this.count >= 30) { this.count = 0; … }` |
| `getaway` | "running away" flag for the current frame | see `getAway()`/`speedChange()` |
| `dir` | heading, -1 = left, +1 = right | `setStartPosition`; `this._xscale = this.dir * 100` |
| `xspeed`, `yspeed` | per-frame velocity | `this._x += this.xspeed` |
| `high` | true = fast cruise, false = slow/wander | `this.high = true` in `setStartPosition`; `if(!this.high)` |
| `item` | if set, this clip is an item and carries the item type | read by the main loop |
| `_onEnterFrame` / `onEnterFrame` | the per-frame AI; `setStartPosition` does `this.onEnterFrame = this._onEnterFrame` | |

### 4.2 Methods

```as
function Fish()                     // constructor
{ super(); this.count = 0; this.getaway = false; }

function setType(t)                // called from makeEnemy()
{ this.type = t;
  if (this.type > 4) this.shark = true;
  this.gotoAndStop(this.type); }   // frame 1..4 = fish size; shark symbol has 1 frame

function setStartPosition(d)       // d = -1 or +1 (random side)
{ this.dir = d;
  if (this.dir == -1) this._x = 550 + this._width / 2;    // start off the RIGHT edge
  else                this._x = -this._width / 2;         // start off the LEFT edge
  this._y = random(400);                                  // random depth 0..399
  this._xscale = this.dir * 100;
  this.xspeed = Fish.highSpeed[this.type - 1] * this.dir;
  this.high = true;
  this.onEnterFrame = this._onEnterFrame; }
```
Note: `makeEnemy()` does `setStartPosition(random(2)*2 - 1)` → -1 or +1;
**dir == -1 means "start at the right edge and swim left"**, so the sign of the initial
velocity is `highSpeed[type-1] * dir` — i.e. dir is also the swim direction sign.

```as
function _onEnterFrame()
{ this._x += this.xspeed; this._y += this.yspeed;

  // recycle off-stage fish (note: this removes them via the parent's helper)
  if (this._x > 650 || this._x < -100 || this._y > 450 || this._y < -50)
     this._parent._parent.removeEnemy(this);      // _root.removeEnemy(this)

  this.count++;
  if (this.count >= 30) {
     this.count = 0;
     if (_root.getLevel() < Fish.changeRate[this.type - 1])
        this.speedChange(_root.getLevel() < Fish.highRate[this.type - 1]);
  }

  if (this.type == 1 || this.shark) {
     var p = _root.player_mc;
     var dx = this._x - p._x, dy = this._y - p._y;
     var d  = Math.sqrt(dx*dx + dy*dy);
     if (this.type == 1 && d < 80) this.getAway();
     else if (this.shark) {
        if (p.die) {                       // whale is dead: charge it
           if (!this.high || this.getaway) { this.getaway = false; this.speedChange(true); }
        } else if (Math.abs(dx) < 120 && Math.abs(dy) < 90) this.getAway();
        else this.getaway = false;
     }
  }
}

function getAway()
{ if (!this.getaway) {
     this.getaway = true;
     this.speedChange(!this.shark);        // fish: switch to high; shark: switch to low
  } }

function speedChange(high)
{ this.high = high;
  var sp;
  if (!high) {                              // --- slow / wander mode
     this.ani.gotoAndStop(this.ani._totalframes);   // last frame of the swim loop
     if (this.shark) this.ani.gotoAndPlay(1);
     sp = Fish.lowSpeed[this.type - 1];
     this.yspeed = Math.random() * 1 - 0.5;
  } else {                                  // --- fast cruise
     this.dir = random(2) * 2 - 1;          // re-pick a heading
     this.ani.gotoAndPlay(1);
     sp = Fish.highSpeed[this.type - 1];
     this.yspeed = Math.random() * 2 - 1;
  }
  this.xspeed = sp * this.dir;
  var p = _root.player_mc;

  // type-1 fish fleeing: veer away from the whale (angle + 160..200 deg)
  if (this.type == 1 && high && this.getaway) {
     var a = Math.atan2(p._y - this._y, p._x - this._x)
             + Math.PI * (160 + random(40)) / 180;
     this.xspeed = Math.cos(a) * Fish.highSpeed[0];
     this.yspeed = Math.sin(a) * Fish.highSpeed[0] / 1.5;
     if (this.xspeed != 0) this.dir = this.xspeed / Math.abs(this.xspeed);
     this._xscale = this.dir * 100;
  }

  // shark hunting run
  if (this.shark && (!high || this.getaway)
      && !p.die && p.item != _global.IV.ITEM_TRANS) {
     if (this.getaway) {
        this.ani.gotoAndStop(this.ani._totalframes);
        _root.sm.start(_global.IV.SOUND_SHARK, 0, 1);      // growl, once
     }
     var a = Math.atan2(p._y - this._y, p._x - this._x);   // straight at the whale
     this.xspeed = Math.cos(a) * Fish.lowSpeed[4];
     this.yspeed = Math.sin(a) * Fish.lowSpeed[4] / 2;
     if (this.xspeed != 0) this.dir = this.xspeed / Math.abs(this.xspeed);
     this.getaway = false;
  }
  this._xscale = this.dir * 100;
}

ASSetPropFlags(Fish.prototype, null, 1);
```

Behaviour summary:

* **Type 1 (smallest fish)** is the only one with proximity AI: it flees whenever it is
  closer than 80 px to the whale, otherwise it cruises.
* **Sharks** (type ≥ 5) ignore the whale when it is dead (`p.die` = they home in on it) and
  when the whale carries the transparence item; they start a homing run when within
  120 x 90 px (a rectangle test), and `getAway()` on a shark means "start the run" + play
  the shark growl.
* Every 30 frames each fish re-checks the current level against `changeRate[type-1]`:
  **a fish only changes speed while `getLevel() < changeRate[type-1]`** and only becomes
  "high" while `getLevel() < highRate[type-1]`. So fish get more passive as the level rises
  (e.g. type 4 stops changing speed after level 0.8 → i.e. it never changes).
* `this._currentframe` is used by the main loop as the size index (1..4) because
  `setType` did `gotoAndStop(type)`; `type` and `_currentframe` are therefore equal for
  fish. `this.type` is used inside the class (the shark's `_currentframe` stays 1).

---

## 5. Frame-by-frame gameplay (`frame_2/DoAction.as`)

### 5.0 Execution order

The frame-2 `DoAction` executes **after** the frame's display list is built (it references
`player_mc`, `score_mc`, `fish_area`, `aqua_mc`, … placed by later tags of the same frame).
Its top-level flow is:

1. define all helper functions (hoisted) — `hungryBar` … `playerAni`;
2. build `IV`, `GAME`, `sm`, all tables (§3), `eatcount`, `bPos`;
3. define `pmc_onEnterFrame`;
4. `player_mc.xspeed = 0; player_mc.yspeed = 0;`
5. define `gameover_listener` and `c_listener`, `nhn.game.Input.addListener(c_listener)`;
6. `startGame();`

### 5.1 `startGame()` — (re)initialisation of a round

```as
function startGame()
{ ServerConnection.onGameStart();                 // host hook (no-op in the SWF)
  sm.stop(IV.SOUND_OVER);
  sm.start(IV.SOUND_BG, 0, 10000);                // looping BGM, 32% volume
  level_mc.digitset.align = "center";
  gameover_mc._visible = false;  gameover_mc.gotoAndStop(1);
  gameclear_mc._visible = false; gameclear_mc.stop();
  for (var k in fish_area) { delete fish_area[k].onEnterFrame; fish_area[k].removeMovieClip(); }
  GAME.score = 0;  score = 0;  score_mc.digitset.number = 0;
  eList = [];  eList.count = 0;
  hungry = 100;  hungryBar();
  player_mc.onEnterFrame = pmc_onEnterFrame;
  player_mc.gotoAndStop(1);                       // level 1
  player_mc._yscale = 100;
  player_mc.die = false;
  playerAni("normal");
  makeEnemy();                                    // one fish immediately
  setEatCount();
  level_mc.digitset.number = getLevel();          // = 1
}
```
Note `startGame` does **not** reset `player_mc._x/_y`, `xspeed`/`yspeed` (only the very
first call at init zeroes them), `player_mc.item`/`_alpha`, or `hungry_bar`'s frame beyond
`hungryBar()`. `retry_btn` in the game-over card calls this same `startGame` (see §8.5).

### 5.2 `pmc_onEnterFrame` — the whale (assigned as `player_mc.onEnterFrame`)

Executed once per frame with `this` = `player_mc`, in this exact order:

```as
// (a) ambient sea-floor bubbles: 1/20 chance per frame
if (random(20) == 0) { var i = random(4), sz = random(3)+1;
                       backBoggle(bPos[i].x, bPos[i].y, sz); }

// (b) hunger drain + bar
hungry -= HUNGRY_LEVEL[getLevel() - 1] / 60;
hungryBar();

// (c) spawn pacing
if (eList.count++ > SHOW_COUNT) { makeEnemy(); eList.count = 0; }

// (d) input  (Key codes: 37=left, 38=up, 39=right, 40=down)
if (Key.isDown(37)) this.xspeed -= X_SPEED;   // -1.5
if (Key.isDown(39)) this.xspeed += X_SPEED;   // +1.5
if (Key.isDown(38)) this.yspeed -= Y_SPEED;   // -1.0
if (Key.isDown(40)) this.yspeed += Y_SPEED;   // +1.0

// (e) facing
if (this.xspeed < 0) this._xscale = -100; else this._xscale = 100;

// (f) velocity decay + integration
var sp = SPEED_LEVEL[getLevel() - 1];
this.xspeed *= sp;  this.yspeed *= sp;
this._x += this.xspeed;  this._y += this.yspeed;

// (g) clamp to the play area
if (this._x > IV.RIGHT)      { this._x = IV.RIGHT;  this.xspeed = 0; }
else if (this._x < IV.LEFT)  { this._x = IV.LEFT;   this.xspeed = 0; }
if (this._y > IV.BOTTOM)     { this._y = IV.BOTTOM; this.yspeed = 0; }
else if (this._y < IV.TOP)   { this._y = IV.TOP;    this.yspeed = 0; }

// (h) swim-flap animation
if (this.moveani > 15 - Math.abs(this.xspeed)) {
   this.moveani = 0;
   playerAni("move", (15 - Math.abs(this.xspeed)) / 2);
} else {
   if (this.moveani == undefined) this.moveani = 0;
   this.moveani += 1;
}

// (i) collisions — iterate eList (index was `_loc4_`; `i` was `_loc3_`)
for (var i = 0; i < eList.length; i++) {
   var e = eList[i];
   if (e.hitArea.hitTest(this.hitArea)) {
      if (!e.shark && getEatLevel() >= e._currentframe) {   // edible
         if (e.item != undefined) { playerAni("eat"); useItem(e.item); }
         else { addScore(SCORE_UP[e._currentframe - 1]); grow(e._currentframe); }
         newBoggle();
         removeEnemy(e);
      }
      else if (player_mc.item != IV.ITEM_TRANS) {           // damage
         sm.start(IV.SOUND_HIT, 0, 1);
         playerAni("damage");
         if (e.shark) {
            new nhn.game.Shock(_root, 10, 1);                // 10 shakes of ±1 px / 20 ms
            hungry -= HUNGRY_SHARK;                          // -100
            hungryBar(); newBoggle();
         } else {
            new nhn.game.Shock(_root, 5, 1);
            hungry -= DAMAGE_LEVEL[getLevel() - 1];
            hungryBar(); newBoggle();
            if (!e.high) {
               if (e.type == 3)       e.speedChange(true);
               else if (e.shark)      e.speedChange(false);
            }
         }
      }
   }
}

// (j) death check
if (hungry < 0) onGameOver();
```

Remarks:
* The **no-friction** movement: holding a key adds 1.5 (x) / 1.0 (y) per frame and the
  whole velocity is multiplied by `SPEED_LEVEL[level-1]` (0.90 → 0.82) every frame, so the
  terminal speed is ≈ 1.5/(1-0.9)=15 px/frame at level 1 and ≈1.5/(1-0.82)≈8.3 at level 10.
  Without a key held, the velocity decays geometrically to 0.
* `highSpeed` / `lowSpeed` / `changeRate` / `speedChange` are **Fish** members, not whale
  members (see §4).
* Note the `e.type == 3` special case: a type-3 fish that the whale bounced into (and that
  was slow) is pushed back to `high` speed.
* The damage branch is skipped entirely while `player_mc.item == IV.ITEM_TRANS`
  (invulnerable), but the *eat* branch still works.
* `hungry < 0` (strictly) triggers game over — hunger reaching exactly 0 is survivable.

### 5.3 `hungryBar()`

```as
function hungryBar() {
   if (hungry > 100) hungry = 100;
   hungry_bar.gotoAndStop(hungry_bar._totalframes + 1
                          - Math.round(hungry * hungry_bar._totalframes / 100));
}
```
With `_totalframes == 68`: hunger 100 → frame 1 (full), hunger 0 → frame 69 → clamped to
frame 68 (empty). The bar is *not* clamped below 0 (negative hunger yields frame > 68 →
Flash clamps to the last frame).

### 5.4 `getLevel()` / `getEatLevel()`

```as
function getLevel()    { return player_mc._currentframe; }          // 1..10
function getEatLevel() { return EAT_LEVEL[getLevel() - 1]; }        // 1..4
```

### 5.5 `makeEnemy()`

```as
function makeEnemy()
{ var eatLevel = getEatLevel();
  var t = eatLevel + random(3) - 1;                 // one of {eatLevel-1, eatLevel, eatLevel+1}
  if (ctenemy) t = random(fishesTotal + 1) + 1;     // debug: 1..5
  var depth = fish_area.getNextHighestDepth();
  if (t < 1) t = 1;
  if (sharksTotal() >= 3 && t > fishesTotal) t = fishesTotal;   // at most 3 sharks alive
  var e;
  if (t <= fishesTotal) e = fish_area.attachMovie("enemy", "e" + depth, depth);
  else                  e = fish_area.attachMovie("shark", "e" + depth, depth);
  eList.push(e);
  e.setType(t);
  e.setStartPosition(random(2) * 2 - 1);            // -1 or +1 (side + direction)
}
function sharksTotal()
{ var n = 0; for (var i = 0; i < eList.length; i++) if (eList[i].shark) n++; return n; }
function removeEnemy(e)
{ for (var i = 0; i < eList.length; i++)
     if (eList[i] == e) { eList.splice(i, 1); e.removeMovieClip(); return true; } }
```
Notes: a new clip is attached **every 22 frames**; both fish and sharks are attached into
`fish_area` under the name `"e" + depth`; the clip name is never used again.

### 5.6 Eating — `grow(el)`, `addScore`, `useItem`

```as
function addScore(s) { score += s; score_mc.digitset.number = score; }

function grow(el)                     // el = the eaten clip's _currentframe (1..4)
{ if (random(5) != 0) { var r = random(2) + 1; sm.start(IV["SOUND_EAT" + r], 0, 1); }
  else sm.start(IV.SOUND_EAT3, 0, 1);         // 4/5 → EAT1 or EAT2 (50/50), 1/5 → EAT3
  playerAni("eat");
  eatcount[el - 1]--;
  if (eatcount[el - 1] < 0) eatcount[el - 1] = 0;
  var done = true;
  for (var i = 0; i < fishesTotal; i++) if (eatcount[i] > 0) done = false;
  if (done) nextLevel();
  updateEatCount();
  hungry += HUNGRY_UP[el - 1];                // +4 / +8 / +12 / +16
  hungryBar();
}
```
The score award happens *before* `grow` in the main loop:
`addScore(SCORE_UP[e._currentframe - 1])` → 100 / 150 / 250 / 300 for sizes 1..4.
The **level advances when all four `eatcount` entries are 0** (i.e. the mission counters
shown at the bottom of the HUD are all satisfied).

### 5.7 `setEatCount()` / `updateEatCount()` / `nextLevel()`

```as
function setEatCount()
{ eatcount = [0,0,0,0];
  var l = getEatLevel();                       // EAT_LEVEL[level-1]
  eatcount[l - 1] = NEXT_LEVEL[1][getLevel() - 1];
  if (l - 1 > 0) eatcount[l - 2] = NEXT_LEVEL[0][getLevel() - 1];
  updateEatCount();
}

function updateEatCount()
{ for (var i = 1; i <= fishesTotal; i++) {     // NB: uses this["mission"+i] = _root.missionN
     var m = this["mission" + i];
     m.digitset.number = eatcount[i - 1];
     m._visible = (eatcount[i - 1] != 0);
  }
  eatable_mc.gotoAndStop(getEatLevel());
}
```
Resulting table (level → the four mission counters `[size1,size2,size3,size4]`):

| level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| size1 | 4 | 5 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| size2 | 0 | 0 | 3 | 4 | 4 | 4 | 5 | 0 | 0 | 0 |
| size3 | 0 | 0 | 0 | 0 | 4 | 5 | 5 | 6 | 6 | 7 |
| size4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 7 | 8 |

```as
function nextLevel()
{ sm.start(IV.SOUND_LEVEL, 0, 1);
  addScore(Math.round(hungry) * SCORE_LEVEL);              // bonus = floor-ish(hunger)*15
  if (getLevel() < LAST_LEVEL) {
     level_mc.digitset.number += 1;
     player_mc.nextFrame();                                // grow the whale
     player_mc.light.gotoAndPlay(1);                       // sparkle burst
     levelup_mc.play();                                    // 35-frame burst
     setEatCount();
     hungry += 20; hungryBar();
     playerAni("normal");
     if (getLevel() > 4)          makeItem(IV.ITEM_TRANS); // from level 5 upwards
     if (getLevel() == SHARK_STAGE) sm.start(IV.SOUND_SHARKSTAGE, 0, 1);
  } else onGameClear();                                    // level 10 finished → clear
}
```
Important: the `getLevel() > 4` and `getLevel() == SHARK_STAGE` tests are evaluated
**after** `player_mc.nextFrame()`, i.e. they test the *new* level. `LAST_LEVEL` is 10, so
clearing the requirements of level 10 (size4 ×8) ends the game with a clear.

### 5.8 Sharks

* A "shark" is `type > 4`; `makeEnemy()` produces those once `getEatLevel() >= 4` (levels
  8, 9, 10) because `type = eatLevel + random(3) - 1` can reach 5 only then; this matches
  `SHARK_STAGE = 8`.
* At most 3 sharks may exist at once (`sharksTotal() >= 3` forces the type back to 4).
* AI: see §4.2 (`speedChange` shark branch): the shark homes straight at the whale at
  `lowSpeed[4]` = 4 px/frame in x and 2 px/frame in y, plays `s_shark1` once when the run
  starts, and is blocked from chasing (and from homing) while the whale is transparent.
* Touching a shark costs the whole `HUNGRY_SHARK` = 100 (instant death unless the bar was
  refilled) and shakes the stage 10×±1px.

### 5.9 Items

```as
function makeItem(itype)
{ item_listener.isShow = true;                            // (undefined object → silent error)
  var depth = fish_area.getNextHighestDepth();
  var it = fish_area.attachMovie("item", "e" + depth, depth);
  it.item = itype;
  it._x = IV.RIGHT;                                       // enters from the right edge
  it._y = (IV.TOP + IV.BOTTOM) / 2;                       // vertical middle = 176.0
  it.onEnterFrame = function() {
       this._x -= 3;                                      // drifts left at 3 px/frame
       if (this._x > IV.RIGHT) this.removeMovieClip();     // ** dead test (see §10.2)
  };
  eList.push(it);
}
```
* Items are only created from `nextLevel()` when the new level > 4 → items arrive at
  levels 5,6,7,8,9,10.
* Because of the inverted bounds test the item never removes itself; it keeps moving left
  out of the stage forever but stays in `eList` and can still be collected if the whale
  overlaps its `hitArea`.
* Collection: in the collision loop, `e.item != undefined` and the clip is edible
  (`_currentframe` == 1 ≤ `getEatLevel()`), so it is always collectible.

```as
function useItem(itype)
{ sm.start(IV.SOUND_ITEM, 0, 1);
  player_mc.item = itype;
  if (itype == IV.ITEM_TRANS) {                 // the only item type (value 1)
     player_mc._alpha = 40;                     // 40% transparency
     nhn.game.Timer.setDelayCall(removeItem, 5000);   // auto-expire after 5000 ms
  }
}
function removeItem() { player_mc._alpha = 100; delete player_mc.item; }
```
So the invisibility power-up lasts exactly 5 seconds and grants immunity to damage
(the eat branch still runs).

### 5.10 Bubbles — `backBoggle` / `newBoggle`

```as
function backBoggle(x, y, size)          // ambient, from the sea floor
{ var d = random(70) + 25 * size;                     // scale 25..94 %
  var b = boggle_mc.attachMovie("boggle", "b" + boggle_mc.getNextHighestDepth(), depth);
  b._x = x; b._y = y;
  b.xspeed = (random(2) - 0.5) * 10;                  // -0.5 .. 4.5 px
  b._xscale = b._yscale = d;  b._rotation = random(180);
  b.tw = new mx.transitions.Tween(b, "_y", mx.transitions.easing.Regular.easeIn,
                                  b._y, 50 + random(50),
                                  Math.abs(b._y / 5) + 3);      // duration in seconds
  b.tw.onMotionChanged = function() {
      this.obj._alpha -= 1;
      this.obj.xspeed *= 0.85;
      if (this.obj.xspeed < 1) this.obj.xspeed = Math.random() * 2 - 1;
      if (this.time > 1) this.obj._x += Math.round(this.obj.xspeed);
  };
  b.tw.onMotionFinished = function() { this.obj.removeMovieClip(); };
}

function newBoggle()                     // burst at the whale's mouth
{ var b = boggle_mc.attachMovie("boggle", …, depth);
  b._x = player_mc._x + player_mc._xscale / 100 * player_mc.boggle._x;
  b._y = player_mc._y + player_mc.boggle._y - 10;
  var d = random(70) + 25 * getLevel();
  b._xscale = b._yscale = d;  b._rotation = random(180);
  b.xspeed = player_mc.xspeed;
  b.tw = new Tween(b, "_y", Regular.easeIn, b._y, 0, Math.abs(b._y / 5) + 1);
  b.tw.onMotionChanged = function() { /* same, but no alpha fade */ };
  b.tw.onMotionFinished = function() { this.obj.removeMovieClip(); };
}
```
`newBoggle()` is called once on every successful eat, once on the ambient roll, on every
hit, and once per frame while the whale is dead (1/15 chance).

### 5.11 `playerAni(mode, duration)`

```as
function playerAni(m, d)
{ var duration = 0, count = 0;
  switch (m) {
   case "normal": player_mc.ani.gotoAndStop(1); break;
   case "move":   if (player_mc.ani._currentframe == 1) player_mc.ani.gotoAndStop(2);
                  duration = d; break;
   case "eat":    player_mc.ani.gotoAndStop(3); duration = 5; break;
   case "damage": player_mc.ani.gotoAndStop(4); duration = 1; break;
   case "die":    player_mc.ani.gotoAndStop(5); duration = 50000; break;
  }
  if (duration > 0)
     player_mc.ani.onEnterFrame = function() {
        if (++count >= duration) { this.gotoAndStop(1); count = 0; delete this.onEnterFrame; }
     };
}
```
* `player_mc.ani` is always the frame-1 child of the current `player_mc` frame (depth 1),
  so switching frames does not break the reference.
* `"move"` uses a *still* frame 2 and returns to frame 1 after `(15-|xspeed|)/2` frames,
  giving a 2-pose flap while moving (see §5.2(h)).
* `"die"` locks frame 5 for 50000 frames = forever.

### 5.12 `onGameOver()` and `onGameClear()`

```as
function onGameOver()
{ sm.stop(IV.SOUND_BG);
  sm.start(IV.SOUND_OVER, 0, 1);              // s_over2
  player_mc.onEnterFrame = function() {       // fall / sink animation
     if (random(15) == 0) newBoggle();
     this._y += 2;
     if (this._y > IV.BOTTOM) this._y = IV.BOTTOM;
  };
  player_mc.die = true;
  playerAni("die");
  gameover_mc._visible = true;
  gameover_mc.play();                          // 10-frame card animation, stops at 10
  GAME.score = score;
  ServerConnection.onGameOver();
}
```
There is **no automatic restart**: the player must press `retry_btn` or `intro_btn` on the
card (sprite 214's script, §8.5). The "press any key to restart" listener
(`gameover_listener`) exists in the source but is never registered (§10.3).

```as
function onGameClear()
{ sm.stop(IV.SOUND_BG);
  sm.start(IV.SOUND_ENDING, 0, 1000);         // s_ending, effectively looping
  delete player_mc.onEnterFrame;
  for (var i = 0; i < eList.length; i++) { eList[i].ani.gotoAndStop(1);
                                           delete eList[i].onEnterFrame; }
  gameclear_mc._visible = true;
  gameclear_mc.play();
  GAME.score = score;
  ServerConnection.onGameOver();              // (yes: onGameOver, not a clear hook)
}
```

### 5.13 Debug / cheat listener (`c_listener`)

Registered at init with `nhn.game.Input.addListener(c_listener)` (which forwards `Key` and
`Mouse` events, §9.4):

```as
c_listener.onMouseDown = function() { this.time = getTimer(); };
c_listener.onMouseUp   = function() {
   if (getTimer() - this.time > 5000) {          // held the mouse >5 s
      sm.start(IV.SOUND_ITEM, 0, 1);
      ctenemy = !ctenemy;                        // randomise spawns
      player_mc._alpha = ctenemy ? 50 : 100;
      this.onMouseUp = function() {              // next click:
         sm.start(IV.SOUND_ITEM, 0, 1);
         player_mc.item = IV.ITEM_TRANS;
         this.onMouseUp = undefined;             // one-shot
      };
   }
};
```

---

## 6. Frame animation tables

Art folders: `re/export/Qua01/sprites/<folder>/<n>.png` (1-based frame number).

| entity | folder | frames | meaning |
|---|---|---|---|
| whale **body** | `DefineSprite_204` (player_mc) | **10** | one frame per growth level 1..10; each frame carries its own `ani`, `light`, `hitArea`, `boggle` at the offsets in §1.3. Driven by `player_mc.nextFrame()` / `gotoAndStop(1)`. |
| whale **ani** (level 1) | `DefineSprite_101` | **5** | 1 = idle, 2 = swim (move), 3 = eat, 4 = hurt, 5 = dead. Identical structure for levels 2..10 in `DefineSprite_115,126,137,148,159,170,181,192,203`. |
| level-up sparkle | `DefineSprite_104` (`player_mc.light`) | **65** | 10 bubbles (`DefineSprite_103`) placed once, 8 start at frame 20 and 1 at frame 10 (`onClipEvent(load){gotoAndPlay(10|20)}`), `stop()` at frame 65. |
| single bubble | `DefineSprite_103` | **30** | scale 1.0 → 1.0259 → 0.9465 → 0.7891 → … → -1.03 → -0.99 → -1.0 (a growing/shrinking/inverting pulse). |
| fish size 1 | `DefineSprite_30_enemy` frame 1 | 1 | small yellow butterflyfish. |
| fish size 2 | frame 2 | 1 | (see folder frame 2.png) using `ani` = `DefineSprite_17` (22 frames). |
| fish size 3 | frame 3 | 1 | using `ani` = `DefineSprite_24` (18 frames). |
| fish size 4 | frame 4 | 1 | large purple sailfish; `ani` = `DefineSprite_29` (13 frames). |
| fish swim loops | `DefineSprite_17` / `24` / `29` | 22 / 18 / 13 | looped through `gotoAndPlay(1)` on their last frame (21 / 17 / 12). |
| **shark** | `DefineSprite_10_shark` | 1 | body; `ani` = `DefineSprite_7` (**3** frames, loops via `gotoAndPlay(1)` on frame 2). `this.ani.gotoAndStop(3)` = the "attack" pose. |
| item | `DefineSprite_33_item` | 1 | |
| boggle/bubble | `DefineSprite_56_boggle` | 1 | |
| digit | `DefineSprite_54_scorenum` | **10** | frame N = digit N-1 (the `Digit` class does `gotoAndStop(n+1)` and `number = _currentframe - 1`). |
| score panel | `DefineSprite_231` | 1 | 6 digits. |
| mission/level panel | `DefineSprite_232` | 1 | 2 digits (reused for mission1..4 and level_mc). |
| life bar | `DefineSprite_230` | **68** | frame 1 = full, 68 = empty; contains the animated water strip `DefineSprite_229` (23 frames). |
| eatable indicator | `DefineSprite_89` | **4** | frame N = "sizes 1..N are edible" icon strip (`eatable_mc.gotoAndStop(getEatLevel())`). |
| level-up banner | `DefineSprite_206` | **35** | f1 = `stop()` (invisible), f2 defines a follower handler (§5.7/§10.5), f2+ shows the burst; placed at (-39.95,-22.75) and re-positioned onto the whale. |
| game-over card | `DefineSprite_215` | **10** | f1 empty, f2..f9 grow 0.2 → 1.0, f10 = final card; `stop()` at f10. |
| game-clear card | `DefineSprite_221` | **10** | f2..f9 grow 0.25 → 1.0 with 4 pulse rings (`DefineSprite_219`, 23 frames); `stop()` at f10. |
| how-to panel | `DefineSprite_64` (`gamehelp_mc`) | **9** | f1..f5 open (scale 0.2 → 1.0, slide), f5..f8 wobble, `stop()` at f9. |
| intro decoration | `DefineSprite_78` | 2 | `stop()` on frame 1 → only frame 1 is ever shown. |
| misc intro sprite | `DefineSprite_6` | 25 | frame 1: `gotoAndPlay(random(15))` → starts at a random frame (used by chid 6 inside sprite 7 and chid 58/65 areas — a random flicker). |
| misc | `DefineSprite_9` | 1 | the shared `hitArea` shape (62x121.95). |
| misc | `DefineSprite_84` | 1 | used by `eatable_mc` chid 84 @(0,14.95) — a "fish icon 1" small plate. |
| class clips | `DefineSprite_235..246` | 0 | no art (pure `DoInitAction`). |

---

## 7. Audio

`sm.attachAllSound("s_bg","s_over2","s_ending","s_level","s_item","s_eat1","s_eat2",
"s_bomb1","s_bomb2","s_sharkstage1","s_shark1","s_eat3")` defines the internal index
order, which the `IV.SOUND_*` constants index into:

| `IV` constant | index | linkage id | exported id | file in `re/export/Qua01/sounds/` | when played |
|---|---|---|---|---|---|
| `SOUND_BG` 0 | 0 | `s_bg` | 77 | `77_s_bg.mp3` | `startGame()`: `sm.start(0, 0, 10000)`; volume 32; stopped by `onGameOver`/`onGameClear` |
| `SOUND_OVER` 1 | 1 | `s_over2` | 68 | `68_s_over2.mp3` | `onGameOver()` (`start(…,0,1)`); stopped at `startGame()` |
| `SOUND_ENDING` 2 | 2 | `s_ending` | 72 | `72_s_ending.mp3` | `onGameClear()` (`start(…,0,1000)`) |
| `SOUND_LEVEL` 3 | 3 | `s_level` | 70 | `70_s_level.mp3` | first statement of `nextLevel()` |
| `SOUND_ITEM` 4 | 4 | `s_item` | 71 | `71_s_item.mp3` | `useItem()`; also the debug cheat toggles |
| `SOUND_EAT1` 5 | 5 | `s_eat1` | 75 | `75_s_eat1.mp3` | `grow()` — 50% of the 4/5 branch |
| `SOUND_EAT2` 6 | 6 | `s_eat2` | 74 | `74_s_eat2.mp3` | `grow()` — 50% of the 4/5 branch |
| (unused) 7 | 7 | `s_bomb1` | 76 | `76_s_bomb1.mp3` | never played by the game script |
| `SOUND_HIT` 8 | 8 | `s_bomb2` | 1 | `1_s_bomb2.mp3` | damage branch of the collision test |
| `SOUND_SHARKSTAGE` 9 | 9 | `s_sharkstage1` | 66 | `66_s_sharkstage1.mp3` | `nextLevel()` when the new level == 8 |
| `SOUND_SHARK` 10 | 10 | `s_shark1` | 67 | `67_s_shark1.mp3` | `Fish.speedChange()` when a shark starts a run; volume 64 |
| `SOUND_EAT3` 11 | 11 | `s_eat3` | 73 | `73_s_eat3.mp3` | `grow()` — the 1/5 branch |

Random eat selection, verbatim:
```as
if (random(5) != 0) { var r = random(2) + 1; sm.start(IV["SOUND_EAT" + r], 0, 1); }
else sm.start(IV.SOUND_EAT3, 0, 1);
```
→ 40 % `s_eat1`, 40 % `s_eat2`, 20 % `s_eat3`.

Also exported but unused: `s_over1` (69) and an unnamed sound (63).

Intro music: the frame-1 script creates a `Sound` object and does
`attachSound(<2-byte obfuscated id>)` then `start(0, 1)`. **No sound with that linkage id
exists in Qua01.swf** (the exported names are the `s_*` list above; `0x99 0x3C` is not
among them), so the `attachSound` fails and the intro is silent in this release. The
de-obfuscation table for that pool suggests the intended name is `intro` / `introbgm`.

---

## 8. UI flow / state machine

The whole game lives on the root timeline: **frame 1 = intro, frame 2 = game**, and the
root is stopped on frame 1 by the frame-1 script. There is no separate rank screen inside
the SWF (the rank button delegates to the host).

```
                ┌──────────────────────────────────────────────────┐
                │ ROOT FRAME 1 — intro                             │
                │  bg = bitmap @qua_intro (shape 58)                │
                │  start_btn (@b_qstart01)  → gotoAndStop(2)        │
                │  help_btn  (@b_qhowto01)  → gamehelp_mc.play()    │
                │  gamehelp_mc (bitmap @howto) hidden, stop()       │
                │  @coryright_mc bottom-centre                      │
                │  stop()                                          │
                └───────────────┬──────────────────────────────────┘
      start_btn.onRelease       │                       help_btn.onRelease
                                ▼                              ▼
                ┌──────────────────────────────┐   ┌──────────────────────────┐
                │ ROOT FRAME 2 — gameplay      │   │ gamehelp_mc plays f1→f9  │
                │  the frame-2 DoAction runs   │   │ (how-to panel; no way to │
                │  → startGame() immediately   │   │  close it; only start_btn│
                │  HUD + whale + fish          │   │  leaves this screen)     │
                └───────┬───────────────┬──────┘   └──────────────────────────┘
        hungry<0        │               │ all 10 levels cleared
                        ▼               ▼
              ┌──────────────────┐   ┌────────────────────────────┐
              │ gameover_mc.play │   │ gameclear_mc.play          │
              │ (10 frames, stop)│   │ (10 frames, stop)          │
              │ retry_btn →      │   │ "go to top" button         │
              │  _root.startGame │   │  (@b_qgototop01) → host    │
              │ intro_btn →      │   └────────────────────────────┘
              │  _root.gotoAndStop(1) │
              └──────────────────┘
```

### 8.1 Frame 1 (`frame_1/DoAction.as`) — exact reconstruction

Pool-resolved (`0=introbgm 1=this 2=Sound 3=intro 4=attachSound 5=start 6=gamehelp_mc
7=_visible 8=stop 9=start_btn 10=onRelease 11=help_btn 12=play 13=ServerConnection
14=getRankEnabled 15=rank_btn 16=onGameRankRequest`; `§0..§3` are written in the bytecode
as 2-4 byte obfuscated strings — see §10.1):

```as
set("introbgm", new Sound(this));         // §0 = the Sound object (name obfuscated)
introbgm.attachSound("intro");            // §3  (no such linkage id → silent no-op)
introbgm.start(0, 1);
gamehelp_mc._visible = false;
gamehelp_mc.stop();
start_btn.onRelease = function() { introbgm.stop(); gotoAndStop(2); };
help_btn.onRelease  = function() { if (!gamehelp_mc._visible)
                                      { gamehelp_mc._visible = true; gamehelp_mc.play(); } };
stop();                                   // ← stop #1 (the important one)

/* the bytecode repeats the same block with a shorter start_btn handler */
gamehelp_mc._visible = false;
gamehelp_mc.stop();
start_btn.onRelease = function() { gotoAndStop(2); };
help_btn.onRelease  = function() { if (!gamehelp_mc._visible)
                                      { gamehelp_mc._visible = true; gamehelp_mc.play(); } };

if (ServerConnection.getRankEnabled())    // undefined in the SWF → silent error
   rank_btn.onRelease = function() { ServerConnection.onGameRankRequest(); };
else
   rank_btn._visible = false;             // rank_btn is not placed either

stop();                                   // ← stop #2 (may never run: see §10.4)
```
Net effect: the intro stops, `start_btn` → frame 2 (game), `help_btn` → open the how-to
panel, the rank button is host-provided and absent here.

### 8.2 Frame 2

Runs the whole game script once, then per-frame behaviour comes from
`player_mc.onEnterFrame = pmc_onEnterFrame` (set inside `startGame()`). All timing is
frame-based (30 fps) except the `Shock` shake (20 ms interval) and `Timer.setDelayCall`
(5000 ms).

### 8.3 Level-up

`nextLevel()` → `level_mc.digitset.number += 1`, `player_mc.nextFrame()` (the whale gets
bigger), `player_mc.light.gotoAndPlay(1)` (sparkle), `levelup_mc.play()` (35-frame banner
that tracks the whale), `setEatCount()`, `hungry += 20`, `playerAni("normal")`, optional
item spawn, optional `s_sharkstage1`.

### 8.4 Game over

See §5.12. The card's buttons are wired by **sprite 214 frame 1**:

```as
intro_btn.onPress = function() { this._parent._parent._parent.gotoAndStop(1); }; // _root → intro
retry_btn.onPress = function() { this._parent._parent._parent.startGame(); };    // _root.startGame()
```
(`this` = the button; `_parent` = sprite 214; its `_parent` = gameover_mc; its `_parent` =
`_root`.) Note `onPress` (not `onRelease`) and the `intro_btn` way back reloads the intro
(because frame 1's script runs again, replaying the intro sound and re-arming the buttons).

### 8.5 How-to screen

`help_btn.onRelease` → `gamehelp_mc._visible = true; gamehelp_mc.play();` → the 9-frame
panel opens (bitmap `@howto`). There is **no close/back button** — the panel stays open
until `start_btn` is pressed (both buttons remain clickable underneath because the panel is
not opaque over them in the hit sense; the panel is 325x253 centred at (274.6,224.2)).
Note the source never re-hides it (`help_btn` only opens).

### 8.6 Rank / leaderboard, copyright

* Rank: **not implemented in the SWF**. `rank_btn.onRelease` → `ServerConnection.onGameRankRequest()`
  (host HTTP call). Art exists in Qua_RES as `@b_qrank01`.
* Copyright: the `@coryright_mc` sprite placed at (280.1, 428.8) on the intro screen (bottom
  centre). Its child sprite 20 contains the redirect boilerplate, disabled here
  (`enabled = false` → `gotoAndStop(2)`), so only the static logo shows.

---

## 9. Framework classes (API surface used by the game)

### 9.1 `nhn.game.SoundMaster`
`new nhn.game.SoundMaster(base_mc, n)` — `n = 9999` is an upper bound on the number of
sounds. Members (from the de-obfuscation table of its pool):
`base_mc`, `base`, `sound_array`, `createAllSound`, `_soundmaster`, `createEmptyMovieClip`,
`Sound`, `mc`, `attachAllSound`, `length`, `attachSound`, `volume_set`, `setAllVolume`,
`setVolume`, `sound_off`, `sound_on`, `setAllPan`, `setPan`, `start`, `stop`,
`stopAllSounds`.

Semantics needed:
```as
sm = new SoundMaster(_root, 9999);
sm.attachAllSound("a","b",…);   // creates a Sound object per name and calls attachSound(name)
sm.setVolume(i, v);             // v in 0..100 → sound[i].setVolume(v)
sm.start(i, offset, loops);     // sound[i].start(offset, loops);  (vol/pan only if >0)
sm.stop(i);                     // sound[i].stop()
```
(`setVolume(i,v)` also records the per-sound volume so it can be re-applied.)

### 9.2 `nhn.game.Timer`
Used only as a static helper: `nhn.game.Timer.setDelayCall(fn, delayMs [, extraArgs…])`
→ fires `fn()` once after `delayMs` milliseconds (internally `setInterval` + a self-clearing
callback). Other members present but unused by the game: `remain`, `started`, `paused`,
`startTimer`, `total`, `update`, `lastTime`, `count`, `clearTimer`, `intervalID`,
`updateTimer`, `pause`, `unpause`, `getPaused`, `addPauseListener`, `removePauseListener`,
`getRemainTime`, `getPassTime`, `end`, `setDelay`.
Used for: expiring the transparence item after 5000 ms.

### 9.3 `nhn.game.Shock`
`new nhn.game.Shock(target, count, magnitude)` — shakes `target` (`_root` here) by
`random(magnitude*2+1)-magnitude` px in x and y, repeating `count` times at an interval of
`20 ms`; each tick restores `_x`/`_y` from the saved `_x0`/`_y0` and calls
`updateAfterEvent()`. Called as `new nhn.game.Shock(_root, 10, 1)` (shark hit) and
`new nhn.game.Shock(_root, 5, 1)` (fish hit). Because the target is `_root`, the whole
stage visibly jitters ±1 px. Implementation must be re-entrant-safe: it deletes
`_x0`/`_y0` after the run.

### 9.4 `nhn.game.Input`
`nhn.game.Input.addListener(obj)` / `removeListener(obj)` — registers `obj` with **both**
`Key.addListener` and `Mouse.addListener`, so it receives `onKeyDown`, `onKeyUp`,
`onMouseDown`, `onMouseUp`, `onMouseMove`. The game uses it for `c_listener` (the mouse
cheat) and would have used it for `gameover_listener` (never registered). Keyboard
gameplay itself uses the plain global `Key.isDown(…)` in the per-frame loop, not this class.

### 9.5 `nhn.game.Digit` / `nhn.game.DigitSet`
`Digit extends MovieClip`; every Digit clip must have 10 frames, frame N = digit N-1.
```as
// Digit
this.number = n;      // → gotoAndStop(n+1)
this.number;          // → _currentframe - 1
this.visible = b;     // aliases _visible
this.before(dg);      // → this._x < dg._x
// constructor: this._parent.digitset ??= new DigitSet(this._parent); digitset.registerDigit(this)
```
```as
// DigitSet
ds = new DigitSet(mc);    // mc = the container clip
ds.number = 1234;         // setter: arranges the digits (sorted by _x) then writes the
                          // decimal digits right-to-left; digits beyond the figure length
                          // get number 0 and visible = false; then applies alignment
ds.number;                // → Number(figure)
ds.align = "center";      // opt-in: re-centre the used digits horizontally
ds.width / ds.left / ds.right   // derived from the registered digits' _x
```
`arrange()` bubble-sorts `digits_array` so that `digits_array[0]` is the **right-most**
digit; `numberAt(i) = figure.charAt(figure.length - i - 1)` (so index 0 = least
significant digit). With `align == "center"`:
`step = width/(digits_array.length-1)`, `x0 = (left+right)/2 - (length-1)*step/2`,
then digit i is placed at `x0 + i*step`.
Reimplementation: for `score_mc` (6 digits, pitch 14, x = 49.5..119.5) and
`missionN`/`level_mc` (2 digits, pitch 14), just compute the string and centre it.

### 9.6 `mx.transitions.Tween` + `mx.transitions.easing.Regular`
`new Tween(obj, prop, easingFunc, beginValue, endValue, durationInSeconds)`.
The game only uses `Tween` on a bubble's `_y` with `Regular.easeIn`, and only reads/writes
the callback hooks and properties:
* `tw.onMotionChanged = f` — called every frame while animating; inside it,
  `this.obj` = the target, `this.time` = elapsed seconds, `this.pos`/`this.position` =
  current value (written to the property).
* `tw.onMotionFinished = f` — called once at the end.
* `Tween` internally uses an enter-frame beacon (sprite 240 `OnEnterFrameBeacon` +
  `BroadcasterMX`, i.e. a listener list driven by one `onEnterFrame`) — `__initBeacon`,
  `initialize`, `broadcastMessage`, `addListener`, `removeListener`.
* `Regular.easeIn(t, b, c, d) = c*t/d + b` (linear!); `easeOut`/`easeInOut` exist but are
  unused. The easing name is misleading: it is a plain linear interpolation, so bubbles
  rise at a constant rate.
So for the port: `y = lerp(y0, target, min(1, elapsedSeconds/duration))` with
`onMotionChanged` fired each frame (the callbacks change `_alpha`, `xspeed`, `_x`) and
`removeMovieClip()` at the end.

### 9.7 Others present but unused by gameplay
`mx.events.EventDispatcher` (base of `Timer`), `OnEnterFrameBeacon`, `BroadcasterMX`
(used by `Tween`) — only needed if the Tween port keeps the same structure.

---

## 10. Open questions / uncertainties

1. **`§§constant(N)` name provenance.** Every obfuscated action stream carries *two*
   constant pools: a small one holding 2-4 obfuscated byte-string names and a larger
   "*de-obfuscation table*" holding the original readable names (e.g. the Fish table is
   exactly `[_global, Fish, count, getaway, MovieClip, prototype, setType, type, shark,
   gotoAndStop, setStartPosition, dir, _x, _width, _y, _xscale, xspeed, highSpeed, high,
   onEnterFrame, _onEnterFrame, yspeed, _parent, removeEnemy, Math, random, changeRate,
   highRate, speedChange, player_mc, sqrt, getAway, die, abs, ani, _totalframes,
   gotoAndPlay, lowSpeed, atan2, cos, sin, item, IV, ITEM_TRANS, SOUND_SHARK, sm, start,
   ASSetPropFlags]`).
   FFDec renders the first 3-4 constants with the *obfuscated* spelling (because that small
   pool is the last one it saw at that stream offset) and the rest with the readable
   spelling. I resolved all of them **0-based against the readable table**, which makes
   every single constant semantically coherent, and which is forced by the class
   registration: `DoInitAction` for sprite 30 pushes the *literal* string `"Fish"`
   (`96 06 00 00 46 69 73 68 00`) and calls `registerClass`, so `_global.Fish` must be the
   real name → `§1 = "Fish"`, not `"ȕ"`. The same reasoning fixes `§0 = "_global"`,
   `§2 = "count"`, `§3 = "getaway"`, `§4 = "MovieClip"`, `§5 = "prototype"`, `§47 =
   "ASSetPropFlags"`. Residual risk: low, but if a reimplementation ever needs the literal
   member spelling (e.g. for save-state compatibility) the obfuscated variants are
   `0x60 0x7D` (=`_global`), `0xC8 0x95` (=`Fish`), `0xA1 0x2A 0xDF 0x1C` (=`count`),
   `0xE5 0xA0` (=`getaway`).
2. **`makeItem`'s recycle test is inverted.** The source is
   `this._x -= 3; if (this._x > IV.RIGHT) this.removeMovieClip();` — since the item starts
   *at* `IV.RIGHT` and moves left, the condition can only be true on the very first frame
   (when `_x == IV.RIGHT`, strictly `>` is false) and never afterwards. Result: items never
   self-destruct and keep drifting left forever, staying in `eList` and still being
   collectible. I reproduced the code verbatim; a "fixed" version (`_x < IV.LEFT`) would
   change behaviour. **Whether this was intended cannot be determined** — recommend porting
   as-is but flagging it.
3. **`gameover_listener` is never registered** (`nhn.game.Input.addListener(c_listener)`
   is the only registration). So "press any key/mouse to restart" does not work; only the
   card's buttons do. Its handler also contains a curious `Key.getCode()` test that ignores
   the four arrow keys.
4. **`ServerConnection`, `item_listener`, `rank_btn`, `frames.FrameFunc`** are host-provided
   (the Ourgame/Hangame page wrapper). In AVM1 the resulting errors are non-fatal and abort
   only the current action list — which is why the frame-1 script has a *redundant first
   `stop()`* before the `ServerConnection.getRankEnabled()` call: without it the timeline
   would fall through to frame 2 (the game) and start immediately. A port should stub all
   four as no-ops and keep frame 1 stopped.
5. **`levelup_mc` follower.** Sprite 206 frame 2 defines a method (obfuscated name, ~
   `onEnterFrame`) that assigns two properties from `_root.player_mc` to itself:
   `this[§1] = _parent[§2][§1]; this[§3] = _parent[§2][§3];` where the readable pool is
   `[onEnterFrame, _x, player_mc, _y]` → almost certainly
   `this._x = _root.player_mc._x; this._y = _root.player_mc._y;`. The obfuscated pool's
   3 entries (`0x7D9F28F9`, `0x54F2`, `0x23EC9A`) map 1:1 onto the first three readable
   names, so the mapping is inferred, not literal. Verify visually if possible.
6. **`IV.TOP/BOTTOM/LEFT/RIGHT` are runtime-computed** from `aqua_mc`, whose placement
   includes a non-unit scale (`1.0000305 × 1.1800995`). The values I quote
   (TOP=-1, BOTTOM=353.03, LEFT=0, RIGHT=551.02) assume AVM1 `_width/_height` semantics
   (bounding box *after* scaling, which is what AVM1 returns). If the porter uses a
   different definition the play area shifts by a few pixels.
7. **`rating` of sound index 7 (`s_bomb1`) and `s_over1(69)`**: exported but never
   referenced anywhere in the game scripts or the Fish class. Not used.
8. **`63.mp3`** has no `ExportAssets` name and is referenced by nothing I could find.
9. **`DefineSprite_6`** (`gotoAndPlay(random(15))`) and the unplaced sprites 84, 89's
   children, 219, 229 are only reachable as sub-clips; I did not enumerate which parent
   instance uses `sprite 6`'s random start (it appears inside sprite 7 and possibly the
   intro decorations), so its visual role is unconfirmed.
10. **Exact hunger-bar frame mapping** assumes `hungry_bar._totalframes == 68` (the
    `DefineSprite_230` frame count). Because sprite 230 also contains a 23-frame water
    strip on a different depth, `_totalframes` is the *sprite's* frame count = 68. If a port
    redraws the bar as a graphic, use `frame = 69 - round(hungry * 68 / 100)` clamped to
    1..68.
11. **`eatable_mc`** shows a strip of fish icons in `DefineSprite_89`; I confirmed frame 2
    visually (small yellow fish + a bigger orange fish) but did not verify frames 1, 3, 4
    individually — the code says frame == `getEatLevel()` == 1..4.
12. **`ctenemy` debug mode** (`_alpha = 50`, uniform random types 1..5) has no other
    visible effect; it also affects `makeEnemy`'s shark cap logic (the cap still applies).
13. **Two duplicate blocks in the frame-1 script** (the button wiring appears twice). This
    is genuine bytecode, not an extraction artefact (the original `frame_1/DoAction.as` and
    the de-flattened copy both show it). Whether the original developer wrote it twice or
    the obfuscator duplicated it is unknowable; the second block overrides the first, so
    only the second `start_btn` handler (which does *not* stop the intro sound) is active.
14. **Nothing was found for `IV.FPS`, `IV.SPEED_LEVEL`, `IV.X_SPEED`, `IV.Y_SPEED`,
    `IV.HUNGRY_*`, `IV.DAMAGE_LEVEL`, `IV.EAT_LEVEL`, `IV.SCORE_*`, `IV.SHARK_STAGE`,
    `IV.SHOW_COUNT`, `IV.LAST_LEVEL`, `IV.NEXT_LEVEL`.** Searched: `re/flat/frame_2__DoAction.flat.as`,
    `re/export/Qua01/scripts/frame_2/DoAction.as`, the AVM1 dump, and the full decompressed
    SWF byte stream for the string `IV.` — the only `IV` members that exist are the 16
    listed in §3.1. The level tables are plain globals.
