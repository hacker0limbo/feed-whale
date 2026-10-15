# AGENTS.md

## 这个仓库是什么

Flash 游戏《喂食鲸》（韩国 NHN《아기고래 쿠아》的中文发行版）的 HTML5 复刻，外加把它逆向出来的整套工具链。两条线：

- **`re/` + `tools/`** —— Python 逆向管线：反混淆、反汇编、素材导出。已经跑完，产物在 `re/` 里。
- **`game/`** —— Vite + TypeScript 的复刻工程。真正在维护的是这部分。

上游输入是 `swf/Qua01.swf`（游戏）和 `swf/Qua_RES.swf`（界面资源）。**这两个文件是只读母本**，`ref/` 里放的是按 `game/lang/Qua_RES.swf` 相对路径摆好的副本（原作用 `ImportAssets` 走这个相对路径取素材，跑原版时需要）。本仓库**不是 git 仓库**，没有历史可回滚，删改前想清楚。

## 命令

```bash
cd game
npm run dev        # host:true + strictPort:5173，localhost / 127.0.0.1 / 局域网 IP 都能开
npm run build      # tsc --noEmit && vite build —— 唯一的自动化检查
npm run preview    # 预览 dist/
```

**没有 lint、没有测试套件**。`npm run build` 里的 `tsc --noEmit` 是仅有的静态关卡（`strict` + `noUnusedLocals` + `noUnusedParameters`），改完必须跑。功能验证靠浏览器：`main.ts` 暴露了 `window.__game / __stage / __view / __settings / __sm / __assets`，可以直接读状态、`.click(x, y)` 点画布按钮、`__game.onGameOver()` 之类强制走分支。

```bash
# 逆向管线（只在需要重新导出素材时才跑，见 README「常用命令」）
tools/ff -export script,image,shape,sprite,button,font,sound,text,binaryData,frame re/export/Qua01 swf/Qua01.swf
python3 tools/build_manifest.py re/tmp_svg re/export/Qua01/sprites re/manifest.json
python3 tools/prepare_assets.py     # 清空并重建 game/public/assets，只拷 KEEP_* 白名单里的素材
```

`tools/ff` 是 ffdec 的包装脚本，负责把 keg-only 的 Homebrew OpenJDK 塞进 `PATH`。`re/tmp_svg` 按需生成，仓库里没有。

## 目录结构

```
feed-whale/
├── swf/                  # ★ 只读母本：Qua01.swf（游戏）+ Qua_RES.swf（界面资源）
├── ref/                  # 摆成 game/lang/Qua_RES.swf 的副本，跑原版对照用
├── tools/                # 逆向与素材流水线（Python；tools/ffdec 是解压好的 ffdec）
├── re/                   # 逆向产物：REPORT.md / export/ / flat/ / logs/ / ref_frames/ / compare/
├── game/                 # ← 日常改这里
│   ├── index.html        # 画布 + 浮层根节点 + PWA meta
│   ├── src/
│   │   ├── main.ts       # 启动、把 game/input/overlays/audio 接起来
│   │   ├── flash/        # Flash 兼容层：Clip.ts · Stage.ts · SoundMaster.ts
│   │   ├── game/         # constants.ts（数值表）+ Game.ts（游戏逻辑）
│   │   ├── ui/overlays.ts # 暂停菜单 + 设置面板的 DOM 构建与交互
│   │   ├── settings.ts   # 设置存储（localStorage，增补功能的开关都在这）
│   │   ├── platform.ts   # 键鼠/触屏输入、摇杆、View.fit()
│   │   ├── assets.ts + assets-index.json   # 素材加载 + 索引（后者是生成物）
│   │   └── style.css     # 全部样式（含 PWA 安全区、横竖屏适配）
│   ├── public/           # assets/（生成物，2.2MB，只含用得到的）· icons/ · manifest.webmanifest
│   ├── dist/             # 构建产物（生成物）
│   └── vite.config.ts · tsconfig.json · .npmrc
├── README.md             # 中文文档：结构、逆向过程、已知差异
└── AGENTS.md             # 本文件
```

带「生成物」标记的东西都不要手改。下面那张表把边界规则单独列了一遍；两份文档不一致时以它为准。

## 目录边界

| 路径 | 性质 |
|---|---|
| `game/src/flash/` | Flash 兼容层（`Clip` 时间轴 / `Stage` 帧循环 / `SoundMaster`）。通用，不含游戏知识 |
| `game/src/game/constants.ts` | 从 SWF 里逐字抄下来的数值表。**不要"修正"里面的值** |
| `game/src/game/Game.ts` | 逐帧移植的游戏逻辑（约 1400 行） |
| `game/src/platform.ts`、`settings.ts`、`ui/overlays.ts` | 原作没有的增补（输入/自适应/暂停/设置/金手指） |
| `re/REPORT.md` | **1249 行逆向规格报告，改玩法和数值前的唯一依据** |
| `re/export/`、`re/flat/`、`re/logs/`、`re/ref_frames/`、`re/manifest.json` | 生成物，不要手改 |
| `game/src/assets-index.json`、`game/public/assets/`、`game/dist/` | 生成物（`tools/prepare_assets.py` / vite），不要手改。素材白名单是 `prepare_assets.py` 里的 `KEEP_*`，改名单后重跑生成器 |
| `README.md` | 结构说明 + 「已知差异与取舍」表，改行为时同步它 |

## 改代码时守住的规矩

1. **默认状态下游戏行为必须与原作逐帧一致。** 暂停、设置、金手指都是增补：金手指默认全关，新逻辑一律走 `settings.get(...)` 旁路，不要直接改 `Game.ts` 里的原作数值或分支结构。
2. **美术和音效一律来自 SWF 导出**，不重绘、不替换。精灵的注册点偏移只存在于 ffdec 的 SVG 帧导出里（PNG 导出丢掉原点），这是 `tools/build_manifest.py` 存在的理由。
3. **不要重复 tick。** 子 clip 的时间轴由 `Stage` 遍历场景图时统一推进；在 `Game.tick()` 里再 tick 一次会让动画双速。
4. **注释写英文**（解释"原作这里是怎么做的"/"为什么这么做"），README 和界面文案写中文。UI 用真的语义化元素（`<input type="checkbox">`、`role="tab"`），带 `aria-label`。
5. TypeScript 开了 `verbatimModuleSyntax`，类型导入必须写 `import type`。`noUnusedLocals` / `noUnusedParameters` 只拦得住未使用的局部变量、导入和 private 成员，**拦不住没人调用的 public 方法**——删功能时要自己把存储、回调、宿主接口、CSS 一起清干净（曾经留下的 `settings.reset()` 和 `Game.onRoundEnd` 就是这么发现的）。

## 踩过的坑

- **ffdec 会把 `ImportAssets` 引进来的位图渲染成纯红色块**。结算卡、帮助面板的"满屏红色"就是这么来的，真图在 `Qua_RES.swf` 里，需要用 `prepare_assets.py` 单独取。
- **任务栏是一堵墙，不是美术效果**：原作在 depth 9 放了形状 90 并设 `clipDepth = 73`，把 depth 10~73 的内容裁掉。复刻版用 `Path2D` + `ctx.clip()` 实现（`WATER_MASK`），别把它当成普通的绘制顺序问题。
- **浏览器自动化验证时，标签页不可见会让 `requestAnimationFrame` 被节流**，表现是游戏"冻住"（`__stage.tickCount` 不涨）。判断真死假死：看 `__stage.running === true` 且 `lastError === null` —— 若是这样，是测试环境的锅，不是代码的。
- **端口写死 5173（strictPort）**，上一个 dev server 没关会导致新实例启动失败。用户明确要求：验证完就把开发服务器关掉。
- 音效是 Web Audio；AS2 里对同一个 `Sound` 再 `start()` 是**重启**，所以 `SoundMaster.start()` 必须先停同索引再播，否则会叠出两条 BGM。

## 网络环境约束（用户明确要求）

- Homebrew 安装走**清华源**；npm 走**淘宝镜像**（已固化在 `game/.npmrc`：`registry=https://registry.npmmirror.com`）。
- 从 GitHub 下载一律加代理前缀：`https://gh-proxy.org/https://github.com/...`（直连很慢）。
