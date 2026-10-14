/**
 * The pause menu and the settings panel.
 *
 * Neither exists in the original SWF — it had no pause, no options and no cheats.
 * They are built as DOM overlays rather than drawn on the canvas so that they get
 * real buttons (keyboard tabbing, screen readers, native focus rings) for free,
 * and so the virtual joystick can recognise a tap that belongs to the UI.
 */
import { LAST_LEVEL } from "../game/constants";
import {
  CHEAT_KEYS,
  CHEAT_LABELS,
  type SettingsStore,
  type ToggleKey,
} from "../settings";

export interface OverlayHost {
  settings: SettingsStore;
  /** True while a round is running, so Esc knows whether pausing makes sense. */
  canPause: () => boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onLevelJump: (level: number) => void;
  /** Fired whenever an overlay opens or closes, so input can be gated. */
  onOpenChange: (open: boolean) => void;
}

interface Row {
  key: ToggleKey;
  label: string;
  hint: string;
}

/**
 * The settings panel's tabs.  「关于」 is prose rather than switches, which is why
 * its panel is built from its own markup instead of the row helper.
 */
const TABS = [
  { id: "basic", label: "基本" },
  { id: "cheat", label: "金手指" },
  { id: "about", label: "关于" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** The plain-settings tab, grouped. */
const BASIC_GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "声音",
    rows: [
      { key: "music", label: "背景音乐", hint: "开场和游戏中的循环音乐" },
      { key: "sfx", label: "游戏音效", hint: "吃鱼、受伤、升级等提示音" },
    ],
  },
  {
    title: "操作",
    rows: [{ key: "showStick", label: "显示虚拟摇杆", hint: "触摸屏幕时出现的摇杆" }],
  },
];


/** The 「关于」 tab: plain prose, no switches.  Facts are the ones the port implements. */
const ABOUT_HTML = `
  <h3>怎么玩</h3>
  <ul>
    <li>吃掉<b>比自己小</b>的鱼，鲸鱼就会长大；碰到大鱼会扣血，碰到鲨鱼几乎致命。</li>
    <li>左上角「Life」是饥饿条，一直在下降，见底就结束。</li>
    <li>底部四个 Mission 计数清零即升级，一共 <b>10 关</b>。</li>
    <li><b>第 8 关</b>开始出现鲨鱼，它们会主动追你。</li>
    <li><b>第 5 关</b>起会从右边漂来红色小鱼，吃到可隐身 5 秒——期间免疫伤害，鲨鱼也找不到你。</li>
  </ul>

  <h3>操作</h3>
  <ul>
    <li>键盘：<b>方向键</b>或 <b>WASD</b></li>
    <li>触屏：按住屏幕<b>任意位置</b>拖动，摇杆会出现在手指处</li>
    <li><b>P</b> 或 <b>Esc</b> 暂停，切到后台会自动暂停</li>
  </ul>

  <p class="dim">原版是韩国 NHN / Hangame 的《아기고래 쿠아》(Baby Whale Qua)，这一份是联众世界发行的中文版《喂食鲸》的 HTML5 复刻，美术、音效和玩法数值都取自原始 SWF。</p>
`;

/** The cheat tab. */
const CHEAT_ROWS: Row[] = CHEAT_KEYS.map((key) => ({
  key,
  label: CHEAT_LABELS[key].title,
  hint: CHEAT_LABELS[key].hint,
}));

export class Overlays {
  private root!: HTMLElement;
  private pausePanel!: HTMLElement;
  private settingsPanel!: HTMLElement;
  private pauseButton!: HTMLButtonElement;
  /** Corner buttons the host wires up (fullscreen) or reveals. */
  fsButton!: HTMLButtonElement;
  settingsButton!: HTMLButtonElement;
  private stepperOut!: HTMLElement;
  private storage: HTMLElement | null = null;
  private armed: { btn: HTMLButtonElement; label: string; timer: number } | null = null;
  private settingsFrom: "intro" | "pause" = "intro";

  constructor(private host: OverlayHost) {
    this.build();
  }

  // -------------------------------------------------------------------------
  // construction
  // -------------------------------------------------------------------------

  private build(): void {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<button id="pause-btn" type="button" aria-label="暂停" hidden>
         <span aria-hidden="true">❚❚</span>
       </button>
       <button id="settings-btn" type="button" aria-label="设置" hidden>
         <span aria-hidden="true">⚙</span>
       </button>
       <button id="fs-btn" type="button" aria-label="全屏" hidden>
         <span aria-hidden="true">⛶</span>
       </button>
       <div id="overlays" hidden>
         <div class="scrim"></div>

         <section class="panel" id="pause-panel" role="dialog" aria-modal="true"
                  aria-labelledby="pause-title" hidden>
           <h2 id="pause-title">已 暂 停</h2>
           <div class="actions">
             <button class="primary" data-act="resume" type="button">继续</button>
             <button data-act="restart" type="button">重新开始</button>
             <button data-act="settings" type="button">设置</button>
             <button data-act="home" type="button">返回主菜单</button>
           </div>
         </section>

         <section class="panel wide" id="settings-panel" role="dialog" aria-modal="true"
                  aria-labelledby="settings-title" hidden>
           <h2 id="settings-title">设 置</h2>

           <div class="tabs" role="tablist" aria-label="设置分类">
             <button type="button" role="tab" id="tab-basic" aria-controls="panel-basic"
                     aria-selected="true" tabindex="0">基本</button>
             <button type="button" role="tab" id="tab-cheat" aria-controls="panel-cheat"
                     aria-selected="false" tabindex="-1">金手指</button>
             <button type="button" role="tab" id="tab-about" aria-controls="panel-about"
                     aria-selected="false" tabindex="-1">关于</button>
           </div>

           <div class="rows" id="panel-basic" role="tabpanel" aria-labelledby="tab-basic"></div>
           <div class="rows" id="panel-cheat" role="tabpanel" aria-labelledby="tab-cheat" hidden></div>
           <div class="about" id="panel-about" role="tabpanel" aria-labelledby="tab-about" hidden></div>

           <div class="actions">
             <button class="primary" data-act="close-settings" type="button">关闭</button>
           </div>
         </section>
       </div>`,
    );

    this.root = document.getElementById("overlays") as HTMLElement;
    this.pausePanel = document.getElementById("pause-panel") as HTMLElement;
    this.settingsPanel = document.getElementById("settings-panel") as HTMLElement;
    this.pauseButton = document.getElementById("pause-btn") as HTMLButtonElement;
    this.fsButton = document.getElementById("fs-btn") as HTMLButtonElement;
    this.settingsButton = document.getElementById("settings-btn") as HTMLButtonElement;

    this.pauseButton.addEventListener("click", () => this.openPause());
    this.settingsButton.addEventListener("click", () => this.openSettings("intro"));

    this.pausePanel.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn) return;
      switch (btn.dataset.act) {
        case "resume":
          this.host.onResume();
          this.close();
          break;
        case "restart":
          this.confirm(btn as HTMLButtonElement, "重新开始", () => {
            this.close();
            this.host.onRestart();
          });
          break;
        case "settings":
          this.openSettings("pause");
          break;
        case "home":
          this.confirm(btn as HTMLButtonElement, "返回主菜单", () => {
            this.close();
            this.host.onHome();
          });
          break;
      }
    });

    this.buildSettingsRows();

    this.settingsPanel.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const onTab = (document.activeElement as HTMLElement | null)?.matches?.('[role="tab"]');
      if (!onTab) return;
      // stop the arrow reaching the game's movement keys underneath
      e.preventDefault();
      e.stopPropagation();
      const ids = TABS.map((t) => t.id);
      const current = ids.indexOf(
        (document.activeElement as HTMLElement).id.replace("tab-", "") as TabId,
      );
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = ids[(current + step + ids.length) % ids.length];
      this.selectTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    });

    this.settingsPanel.addEventListener("click", (e) => {
      const el = e.target as HTMLElement;
      const tab = el.closest<HTMLButtonElement>('button[role="tab"]');
      if (tab) {
        this.selectTab(tab.id.replace("tab-", "") as TabId);
        return;
      }
      const step = el.closest<HTMLButtonElement>("button[data-step]");
      if (step) {
        this.host.settings.setLevel(
          this.host.settings.get("level") + Number(step.dataset.step),
        );
        return;
      }
      const btn = el.closest<HTMLButtonElement>("button");
      if (!btn) return;
      if (btn.dataset.act === "close-settings") {
        this.openSettingsBack();
      }
    });

    // tapping anywhere else cancels a half-armed confirmation
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (this.armed && !this.armed.btn.contains(e.target as Node)) this.disarm();
      },
      true,
    );

    // tapping the dim backdrop steps back one level, which is the usual escape
    // hatch when the panel is taller than a phone in landscape
    this.root.querySelector(".scrim")?.addEventListener("click", () => {
      if (!this.settingsPanel.hidden) this.openSettingsBack();
      else if (!this.pausePanel.hidden) {
        this.host.onResume();
        this.close();
      }
    });

    this.host.settings.subscribe(() => this.syncControls());

    document.addEventListener("keydown", (e) => this.onKey(e));
  }

  private buildSettingsRows(): void {
    const basic = document.getElementById("panel-basic") as HTMLElement;
    const cheat = document.getElementById("panel-cheat") as HTMLElement;

    const sw = (key: ToggleKey, label: string, hint: string) =>
      `<label class="row">
         <span class="text"><b>${label}</b><i>${hint}</i></span>
         <input type="checkbox" data-key="${key}" aria-label="${label}">
         <span class="track" aria-hidden="true"></span>
       </label>`;
    const group = (title: string) => `<p class="group">${title}</p>`;

    const basicParts = BASIC_GROUPS.flatMap((g) => [
      group(g.title),
      ...g.rows.map((r) => sw(r.key, r.label, r.hint)),
    ]);

    const cheatParts = [
      ...CHEAT_ROWS.map((r) => sw(r.key, r.label, r.hint)),
      `<div class="row">
         <span class="text"><b>跳到关卡</b><i>同时也是鲸鱼的成长等级</i></span>
         <span class="stepper">
           <button type="button" data-step="-1" aria-label="上一关">−</button>
           <output id="level-out">1</output>
           <button type="button" data-step="1" aria-label="下一关">＋</button>
         </span>
       </div>`,
    ];

    basic.innerHTML = basicParts.join("");
    cheat.innerHTML = cheatParts.join("");
    (document.getElementById("panel-about") as HTMLElement).innerHTML = ABOUT_HTML;
    this.stepperOut = document.getElementById("level-out") as HTMLElement;

    for (const box of this.settingsPanel.querySelectorAll<HTMLInputElement>("input[data-key]")) {
      box.addEventListener("change", () => {
        this.host.settings.toggle(box.dataset.key as ToggleKey);
      });
    }
    this.syncControls();
  }

  /** Show one tab's panel and keep the tablist's ARIA state in step. */
  private selectTab(which: TabId): void {
    for (const t of TABS) {
      const selected = t.id === which;
      (document.getElementById(`panel-${t.id}`) as HTMLElement).hidden = !selected;
      const btn = document.getElementById(`tab-${t.id}`) as HTMLButtonElement;
      btn.setAttribute("aria-selected", String(selected));
      btn.tabIndex = selected ? 0 : -1;
    }
  }

  // -------------------------------------------------------------------------
  // state
  // -------------------------------------------------------------------------

  /** Push the stored values back into the widgets. */
  private syncControls(): void {
    const s = this.host.settings;
    for (const box of this.settingsPanel.querySelectorAll<HTMLInputElement>("input[data-key]")) {
      const key = box.dataset.key as ToggleKey;
      box.checked = s.get(key);
    }
    const level = s.get("level");
    this.stepperOut.textContent = String(level);
    const [minus, plus] = this.settingsPanel.querySelectorAll<HTMLButtonElement>("button[data-step]");
    minus.disabled = level <= 1;
    plus.disabled = level >= LAST_LEVEL;
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /**
   * Which corner button belongs in the top-left.
   *
   * While a round is running that is the pause button; everywhere else — the title
   * screen and the end cards — it is the settings button, so options are never
   * more than one tap away.  The fullscreen button sits opposite and is always on.
   */
  setPlayState(playing: boolean): void {
    this.pauseButton.hidden = !playing;
    this.settingsButton.hidden = playing;
    this.fsButton.hidden = false;
  }

  // -------------------------------------------------------------------------
  // opening and closing
  // -------------------------------------------------------------------------

  /**
   * Show the pause panel.  It is also the "back" target when Escape is pressed
   * inside the settings panel, so it has to cope with the overlay already being
   * on screen — guarding on `isOpen` would make Escape do nothing there.
   */
  openPause(): void {
    if (!this.pausePanel.hidden) return; // already the visible panel
    if (this.root.hidden) this.storage = document.activeElement as HTMLElement | null;
    this.pausePanel.hidden = false;
    this.settingsPanel.hidden = true;
    if (this.root.hidden) {
      this.root.hidden = false;
      this.host.onOpenChange(true);
    }
    this.focusFirst(this.pausePanel);
  }

  openSettings(from: "intro" | "pause"): void {
    this.settingsFrom = from;
    if (!this.isOpen) {
      this.storage = document.activeElement as HTMLElement | null;
      this.root.hidden = false;
      this.host.onOpenChange(true);
    }
    this.selectTab("basic");
    this.settingsPanel.hidden = false;
    this.pausePanel.hidden = true;
    this.syncControls();
    this.focusFirst(this.settingsPanel);
  }

  /** The close button / Esc inside settings goes back where you came from. */
  private openSettingsBack(): void {
    this.disarm();
    if (this.settingsFrom === "pause") {
      this.openPause();
    } else {
      this.close();
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.disarm();
    this.root.hidden = true;
    this.pausePanel.hidden = true;
    this.settingsPanel.hidden = true;
    this.host.onOpenChange(false);
    this.storage?.focus?.();
    this.storage = null;
  }

  private focusFirst(panel: HTMLElement): void {
    const target = panel.querySelector<HTMLElement>(
      "button:not([hidden]):not([disabled]), input:not([hidden])",
    );
    target?.focus({ preventScroll: true });
  }

  /**
   * Escape is handled here and nowhere else.
   *
   * Both this and the host listen for keydown, and the document listener runs
   * first as the event bubbles out.  Without stopPropagation the host would see
   * an already-closed menu, decide Escape meant "open the menu", and reopen it on
   * the same keystroke — making Escape unable to close anything.
   */
  private onKey(e: KeyboardEvent): void {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (!this.settingsPanel.hidden) this.openSettingsBack();
    else if (!this.pausePanel.hidden) {
      this.host.onResume();
      this.close();
    } else if (this.host.canPause()) {
      this.openPause();
    }
  }

  // -------------------------------------------------------------------------
  // two-step confirmation
  // -------------------------------------------------------------------------

  private confirm(btn: HTMLButtonElement, label: string, action: () => void): void {
    if (this.armed?.btn === btn) {
      this.disarm();
      action();
      return;
    }
    this.disarm();
    btn.classList.add("danger");
    btn.textContent = `确认${label}？`;
    const timer = window.setTimeout(() => this.disarm(), 3000);
    this.armed = { btn, label, timer };
  }

  private disarm(): void {
    if (!this.armed) return;
    const { btn, label, timer } = this.armed;
    window.clearTimeout(timer);
    btn.classList.remove("danger");
    btn.textContent = label;
    this.armed = null;
  }
}
