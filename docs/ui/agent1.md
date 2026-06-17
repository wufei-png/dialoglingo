你的判断是对的：**当前 Workbook 页面既不是 UI 设计稿的最优形态，也没有对齐 v1 spec 的产品契约**。我和 subagent 对照了 `docs/ui/2026-06-16-workbook-ui-design.md`、v1 spec 和现有代码，结论如下。

---

## 结论先行

当前实现是一个 **「Search 布局 + 表单堆叠卡片 + 永久右栏」的 MVP 折中**，对「高频语料清洗」这个核心场景并不最优。主要问题不是「缺功能」，而是 **信息架构和交互模型选错了默认值**：

| 维度 | 设计意图 | 当前实现 |
|------|----------|----------|
| 右侧溯源 | 默认隐藏 / 按需弹出 | **永久占 80% 宽度**（共享 Search 的 1:4 split） |
| 卡片编辑 | 原地 blur-to-save | **Edit → Save/Cancel 三步** |
| 卡片密度 | 紧凑，一屏 7–10 张 | **8 个字段全展开**，一屏 2–3 张 |
| 键盘流 | j/k 导航 + Cmd+Enter 前进 | **未实现** |
| 初始选中 | 无选中 → 空态 Dashboard | **自动选中第一张** |

---

## 两份设计文档本身也有冲突

需要先厘清「设计文档」不是单一真相：

**`docs/ui/2026-06-16-workbook-ui-design.md`（较新、偏交互细节）**
- 60/40 持久双栏，但右侧 **默认空态**，选中卡片后才 fade-in
- 双击分割线可 **折叠右侧** 进入专注模式
- 原地表单编辑、blur-to-save、虚拟列表、同源聚类

**`docs/superpowers/specs/2026-06-15-dialoglingo-v1-design.md`（产品契约）**
- 明确写：**溯源面板不应是默认 40% 的永久列**，应是 **on-demand overlay/drawer**
- 顶部 **单行 sticky bar**（Tabs + 统计 + Export），不是左右分栏各一套 header
- v1 spec 2026-06-17 snapshot 也标注：**「Workbook layout is still an open product decision」**

所以不是「设计说抽屉、实现做错了」这么简单——**UI doc 和 v1 spec 在「持久双栏 vs 按需抽屉」上尚未定案**。当前代码更接近「把 Search 的双栏骨架复用到 Workbook」，两边都没对齐。

---

## 当前实现的具体问题

### 1. 布局：Search 的 1:4 比例用在 Workbook 上是最糟组合

```120:122:docs/superpowers/specs/2026-06-15-dialoglingo-v1-design.md
- Search and Workbook both use the same persisted split-pane ratio. The default is compact left / wide right, `1:4` (`ui.splitRatio = 0.2`), with a draggable divider on both sections.
```

Search 左窄右宽合理（左是 session 列表，右是 transcript 预览）。Workbook 左是 **可编辑卡片流**，默认只给 **20% 宽度**，长句输入会频繁换行，卡片纵向被撑得很高——这和 UI doc 要求的 `min-width: 600px` 完全相反。

### 2. 右侧：永久占位，不是「按需溯源」

```193:219:src/renderer/src/features/workbook/WorkbookPage.tsx
        right={(
          <section className="workbook-right-pane">
            ...
            <SourcePanel
              open={Boolean(sourceItem)}
              ...
              onClose={() => setSelectedItemId(null)}
            />
          </section>
        )}
```

`SourcePanel` 在未选中时只显示 “No source selected”，但 **右栏 80% 空间仍然被占着**。更关键的是 `useEffect` 会在加载后 **自动选中第一张卡片**，用户几乎看不到空态 Dashboard。

### 3. 卡片：不是「流式卡片」，而是「滚动表单堆」

`WorkbookCard` 每张卡固定展示 Source textarea、Target、Gloss、Explanation、Quiz、Tags 等 **8 个字段 + 6 个按钮**。这不是 UI doc 说的「扫视 → 不爽直接改」，而是 **每张卡都像一个小 Anki 编辑器**，滚动成本很高。

### 4. 交互：显式 Edit/Save  vs  设计的 blur-to-save

设计是 Notion/Cursor 式 **点击即编、失焦即存**；当前是 CRUD 表单模式，清洗 40+ 条语料时摩擦明显更大。

---

## 三种现代 UI 方案（含 subagent 讨论）

### 方案 A：按需 Overlay / Slide-over（对齐 v1 spec）

```
┌─────────────────────────────────────────────┐
│ [All][Expr][Sent][Del]    42 items  [Export]│  ← 单行 sticky bar
├─────────────────────────────────────────────┤
│  ┌─ Expression ──────────────────────────┐  │
│  │ geometric registration                │  │
│  │ Target: 几何配准          [···] [源]  │  │  ← 100% 宽度卡片流
│  └───────────────────────────────────────┘  │
│  ┌─ Sentence ────────────────────────────┐  │
│  │ ...                                     │  │
└─────────────────────────────────────────────┘
                              ┌──────────────┐
                              │ Source Panel │  ← 从右侧滑入，Esc 关闭
                              │ (overlay)    │
                              └──────────────┘
```

**参考**：VS Code Secondary Side Bar、Figma Inspect、Linear issue detail panel

| 优点 | 缺点 |
|------|------|
| 默认 100% 给编辑区，卡片密度最高 | 溯源与编辑不能同时看（需 pin） |
| 和 v1 spec 一致 | 长对话对照时要反复开关 |
| 实现上可复用 Search 的 split 仅给 Search | |

**适合**：大多数条目「一眼能判断，偶尔查源」的清洗流。

---

### 方案 B：可折叠持久双栏（对齐 UI doc）

```
┌──────────────────────┬────────────────────┐
│ 60% 卡片流           │ 40% 溯源（可折叠）  │
│ [Tabs]               │ 空态 → Dashboard   │
│ 卡片...              │ 选中 → 高亮 snippet │
└──────────────────────┴────────────────────┘
         ↑ 双击分割线 → 左侧 100% 专注模式
```

**参考**：Cursor 终端面板、Notion 双栏、IDE 可调 split

| 优点 | 缺点 |
|------|------|
| 编辑 + 对照可并行，减少 context switch | 默认占 40%，小屏更挤 |
| 同源卡片切换时右栏可保持静止 | 需 Workbook 独立 splitRatio |
| UI doc 细节（空态、折叠、分组）都能落地 | 比 overlay 实现复杂 |

**适合**：需要 **频繁对照原文** 才能决定翻译/删留的场景。

---

### 方案 C：混合（推荐）

**默认 = 方案 A（全宽卡片流 + 按需 drawer）**  
**可选 Pin = 方案 B（固定双栏，Workbook 独立 ratio，默认约 65:35）**

```
状态机：
  [专注模式]  100% 卡片流，无右栏
  [溯源模式]  点击「View source」→ slide-over（约 420px）
  [Pin 模式]  用户 pin → 持久双栏，记住 workbookSplitRatio
```

**参考**：Chrome DevTools（dock/undock）、VS Code panel 的 pin 行为

| 优点 | 缺点 |
|------|------|
| 默认最优密度，需要时再开对照 | 状态机 + 两套 ratio 要设计清楚 |
| 同时满足 v1 spec 和 UI doc | 首版可只做 A，Pin 后做 |
| 和 Search 的 split 彻底解耦 | |

---

## 推荐方向

**主推方案 C，首版先落地方案 A 的核心部分。**

理由：

1. **任务模型**：Workbook 是「批量 triage + 轻量编辑」，不是「长时间读 transcript」。默认应最大化卡片吞吐，溯源是 **辅助**，不是主视图。
2. **v1 spec 已写死**：「不应是永久 40% peer column」——当前实现直接违背。
3. **UI doc 的 60/40 可以保留为 Pin 模式**，而不是默认——这样既保留「对照原文」能力，又不牺牲默认体验。
4. **和 Search 解耦 splitRatio 是 P0**：即便暂不改 drawer，也应立刻让 Workbook 左栏 ≥ 55%。

---

## 卡片展示：比布局更 urgent 的改进

即便布局暂不动，**卡片信息架构**也应优先改：

| 当前 | 建议 |
|------|------|
| 8 字段全展开 | **默认 3 行**：Source（只读）+ Target + Gloss |
| Explanation / Quiz / Tags | 折叠在 **「More fields ▾」** 或 hover action |
| Edit / Save / Cancel | **blur-to-save** + 左侧 modified 边条 + Revert |
| 6 个按钮常驻 | 收到 **「···」菜单** 或卡片 hover toolbar |
| 普通 scroll list | **虚拟列表**（40+ items 时必要） |

紧凑卡片 + blur-to-save  alone 通常就能让清洗效率提升一个数量级，且不依赖布局大改。

---

## 实施优先级建议

| 优先级 | 项 | 理由 |
|--------|-----|------|
| **P0** | Workbook 独立 `workbookSplitRatio` 或默认全宽 | 立刻缓解 20% 宽度的硬伤 |
| **P0** | 卡片字段折叠 + blur-to-save | 核心清洗路径 |
| **P0** | j/k + Cmd+Enter 前进 | 开发者用户预期 |
| **P1** | 右侧改为 slide-over drawer，取消 auto-select | 对齐 v1 spec |
| **P1** | 空态 Dashboard（词汇/句型统计） | UI doc 的空态价值 |
| **P1** | 虚拟列表 | 性能 + 滚动体验 |
| **P2** | Pin 双栏 + 可折叠 | 方案 C 完整态 |
| **P2** | 同源 grouping、snippet 高亮、Prev/Next match | 溯源质量 |

---

## 和 subagent 的一致结论

Subagent 的核心判断与上面一致：

- 当前是 **「Search 骨架 + CRUD 表单」**，不是设计里的 **「流式清洗控制台」**
- 文档冲突需在 v1 spec 里 **关闭 open decision**，建议采纳 **默认 drawer + 可选 pin 双栏**
- **P0 不依赖布局决策**：blur-to-save、字段折叠、键盘导航，可以马上做

---

如果你希望继续推进，我可以按优先级直接改代码（例如先做 P0：解耦 split + 卡片折叠 + blur-to-save），或先帮你把 v1 spec 里的 layout open question 更新成方案 C 的正式决策。你更想先动 **布局** 还是 **卡片交互**？





卡片字段折叠 + blur-to-save 和 空态 Dashboard（词汇/句型统计） 和虚拟列表 	
Pin 双栏 + 可折叠 这些具体什么意思


下面用「现在是什么样 → 改完是什么样 → 你怎么操作」来说明这四项，都针对 Workbook 清洗语料这个场景。

---

## 1. 卡片字段折叠 + blur-to-save

### 卡片字段折叠

**现在**：每张卡片把 8 个字段全部摊开——Source、Target、Gloss、Explanation、Quiz、Tags 等，对应 `WorkbookCard.tsx` 里一长串 input/textarea。一张卡往往占半屏，滚很久才能看完 40 条。

**改完后**：默认只显示清洗时最常用的 3 行：

```
┌─ Expression ──────────────────────────────┐
│ geometric registration          [···]    │  ← 类型 + 源文本（只读）
│ Target: 几何配准                          │  ← 翻译（可点改）
│ Gloss: 点云配准术语                       │  ← 释义（可点改）
│ ▾ More fields (Explanation, Quiz, Tags)  │  ← 点开展开
└───────────────────────────────────────────┘
```

Explanation、Quiz、Tags 这类 **不是每条都要改** 的字段，收在「More fields」里。需要时再展开，改完可以再收起。

**效果**：一屏从 2–3 张卡变成大约 7–10 张，更适合「快速扫一遍、删差的、改错的」。

---

### blur-to-save（失焦即保存）

**现在**：要先点 **Edit**，改完再点 **Save** 或 **Cancel**，三步流程。

**改完后**：像 Notion / Google Docs 一样——

1. 点 Target 或 Gloss 就能直接打字（不用先 Edit）
2. 光标移出该字段（blur），或按 `Cmd+Enter`，**自动保存**到 SQLite
3. 改过的卡片左侧出现一条细色边 + **Revert** 按钮
4. 只有在你按 `Esc` 时才放弃本次未保存的修改

```
你：点 Target → 改成「几何对齐」→ 点下一张卡
App：自动保存，左侧出现 modified 边条
```

**和折叠的关系**：折叠减少「噪音字段」；blur-to-save 减少「点按钮」——两者一起让清洗更快。

---

## 2. 空态 Dashboard（词汇/句型统计）

**现在**：右侧 80% 宽度一直占着；没选中时只显示一行 “No source selected”。而且代码会在加载后 **自动选中第一张卡**，你几乎看不到真正的空态。

**改完后**：进入 Workbook、或还没点任何卡片时，右侧（或全屏 overlay 关闭时）显示 **汇总面板**，而不是空白：

```
┌─ Workbook Overview ─────────────────────┐
│  本次共 42 项                            │
│  ┌──────────┐  ┌──────────┐             │
│  │ 25 词汇  │  │ 17 例句  │             │
│  └──────────┘  └──────────┘             │
│  已修改: 3 项    已删除: 1 项            │
│  来源: 2 个 session                     │
│  高频标签: ML, Backend, API             │
│                                         │
│  ← 点击左侧卡片查看原文上下文            │
└─────────────────────────────────────────┘
```

**作用**：

- 刚生成完 workbook，先知道「生成了什么规模」
- 右侧不再是大块空白浪费空间
- 和「选中卡片 → 显示溯源」形成清晰状态切换：**没选 = 总览，选了 = 上下文**

数据来自现有 workbook 列表（Expression/Sentence 计数、`isEdited`、tags 等），不需要新后端能力。

---

## 3. 虚拟列表（Virtualized List）

**现在**：`CardStream` 用简单的 `rows.map()`，40 条就渲染 40 张完整 DOM 卡片。每条还有多个 textarea，DOM 很重。

**改完后**：用 `@tanstack/react-virtual` 或类似方案，**只渲染屏幕里看得见的那几张卡**（比如 8–12 张 + 少量缓冲），滚出视口的从 DOM 卸掉。

```
视口内可见:  [卡#12][卡#13][卡#14][卡#15][卡#15]  ← 实际渲染 ~10 个 DOM
内存里总共:  500 条                              ← 逻辑上都在，但不全进 DOM
```

**你会感受到的变化**：

| 场景 | 现在 | 虚拟列表后 |
|------|------|------------|
| 40 条 workbook | 略卡，滚动略沉 | 流畅 |
| 200+ 条（以后） | 可能明显卡顿 | 仍然流畅 |
| 滚动位置 | 正常 | 正常（高度由虚拟izer 计算） |

**注意**：虚拟列表主要解决 **性能和长列表滚动**；卡片变紧凑后一屏能看更多，但 100+ 条时虚拟列表仍然必要。

---

## 4. Pin 双栏 + 可折叠

这是 **布局方案**，和上面三项可以独立理解。

### 背景：两种「看原文」的方式

| 方式 | 行为 | 类比 |
|------|------|------|
| **Slide-over（默认）** | 点「View source」→ 面板从右侧滑入，盖住一部分卡片 | VS Code 的 peek / 移动端 drawer |
| **Pin 双栏** | 面板固定占右侧 35–40%，左边卡片、右边原文 **同时可见** | Cursor 的终端面板 dock 在右边 |

### Pin 双栏

```
未 Pin（默认，全宽编辑）:
┌─────────────────────────────────────┐
│ [All][Expr]...          [Export]    │
│  卡片流占 100%                       : │
 │  ← Backspace  │  Delete  │  Esc  │  Enter  │  Cmd/Ctrl+Enter  │
|  卡片级 Delete/Backspace  │  未编辑时删除选中卡  │  未实现  │  未实现  │  未实现  │  未实现  │  未实现  │
|  编辑态 Esc  │  放弃当前字段编辑  │  部分（仅 target 字段 "Escape" 会 resetDraft）  │  未实现  │  未实现  │  未实现  │  未实现  │
|  编辑态 Cmd/Ctrl+Enter  │  保存当前编辑  │  部分（仅 target 输入框）  │  未实现  │  未实现  │  未实现  │  未实现  |
|  卡片级 Enter  │  进入编辑 / 聚焦 Target  │  未实现  │  未实现  │  未实现  │  未实现  │  未实现  │
|  Cmd/Ctrl+Enter 保存并跳下一张  │  保存 + 选中下一项  │  未实现  │  未实现  │  未实现  │  未实现  │  未实现  |

**实现要点（与 spec 一致）**

- 监听挂在 `WorkbookPage` 或包裹 `CardStream` 的容器上；**编辑态**（某张卡 `isEditing` 或 focus 在 input/textarea）时 **不** 处理 j/k、Delete、Enter 卡片级行为。
- `CardStream` / `WorkbookCard` 需暴露或通过 callback 上报「是否正在编辑」；或统一在 page 层用 `document.activeElement` 判断是否在 `.workbook-card` 的可编辑控件内。
- 列表为空、已在首/末项时 j/k  no-op；Deleted tab 下逻辑与 active 一致（删除/恢复按 tab 语义）。

**测试**

- 新增 `tests/renderer/workbook-keyboard.test.tsx`（或扩展现有 renderer 测试）：mock 列表 + `fireEvent.keyDown` 验证选中变化、删除 mutate 被调用；编辑态 mock focus 在 input 时不切换选中。

**验收**

- 非编辑：j/k、方向键改选中；Delete/Backspace 删当前；Enter 进编辑。
- 编辑：上述导航键不抢焦点；Esc 放弃；Cmd/Ctrl+Enter 保存并跳下一张（若实现保存并前进）。

---

## Task 3: 虚拟列表

**目标**：`CardStream` 在大量 items 时只渲染视口内卡片，滚动仍流畅。

**文件**

- 修改：`src/renderer/src/features/workbook/CardStream.tsx`
- 依赖：若项目无 `@tanstack/react-virtual`，在 `package.json` 增加（与 TanStack Query 同生态，Electron renderer 可用）
- 可选：`src/renderer/src/styles.css` — `.workbook-stream` 改为虚拟容器 + 内层 `position: relative` 与 item `transform/absolute` 或 library 推荐结构

**实现要点**

- 滚动容器：保持 `.workbook-stream` 为 `overflow: auto` + 固定高度（父级 `minmax(0,1fr)` 已有）。
- `useVirtualizer({ count: rows.length, getScrollElement, estimateSize })`；`estimateSize` 可先固定（如 120 collapsed / 280 expanded），后续可按 `expandedItemIds` 调 `measureElement`。
- 仅 `virtualItems.map` 渲染 `WorkbookCard`；`key={row.id}` 不变。
- **与键盘导航**：选中项 scrollIntoView 或 `virtualizer.scrollToIndex(index)`，避免 j/k 后选中卡不在视口。
- 折叠展开改变高度时调用 `virtualizer.measureElement` 或 `resizeItem`（TanStack Virtual v3 API）。

**测试**

- 可选轻量测试：mock 100 rows，断言 DOM 内 `.workbook-card` 数量 < rows.length（需 jsdom + 容器高度）；或手工验收 + 文档说明。

**验收**

- 40+ 条滚动无明显卡顿；选中/键盘切换时可见项跟随滚动。

---

## Task 4: Pin 双栏 + 可折叠

**目标**：Workbook 不再永久占用 Search 式右栏；默认全宽卡片流；溯源 **slide-over**；用户可 **Pin** 成持久双栏并 **折叠** 右栏回全宽。

**文件**

- 修改：`src/renderer/src/features/workbook/WorkbookPage.tsx` — 移除或条件化 `ResizableSplitPane` 的 permanent `right`；状态：`sourceOpen`（drawer）、`sourcePinned`、`workbookSplitRatio`（Pin 时 0.6–0.65）
- 新增或修改：`src/renderer/src/features/workbook/SourceDrawer.tsx`（或扩展 `SourcePanel.tsx`）— fixed/absolute 右侧宽 ~420px，动画 slide-in；Pin / Unpin / Close；Esc 关闭（未 Pin 时）
- 修改：`src/shared/schemas/settings.ts` — `workbookSplitRatio` optional default 0.6；`workbookSourcePinned` optional boolean default false
- 修改：`src/main/settings/defaults.ts`、`src/renderer/src/app/useLayoutSettings.ts` — 读写 workbook 专用 ratio（与 `splitRatio` 分离）
- 修改：`src/renderer/src/styles.css` — `.workbook-layout--full`、`.source-drawer`、`.source-drawer--pinned` + split divider
- 修改：`src/renderer/src/components/ResizableSplitPane.tsx` — 若需 double-click collapse，加 `onDividerDoubleClick` 或将 Workbook 专用 wrapper

**状态机（实现契约）**

```
专注: !sourceOpen && !sourcePinned → 仅左栏 100%
溯源 overlay: sourceOpen && !sourcePinned → 左 100% + drawer 浮层
Pin 双栏: sourcePinned → ResizableSplitPane(left cards, right SourcePanel)
折叠: sourcePinned && collapsed → ratio 1.0 左栏，右栏 width 0（或 unpin 语义二选一，文档写清）
```

**与 Task 2 关系**：未选中且无 drawer 时主区可显示 Dashboard（全宽）或右栏空态（Pin 时）；取消 `useEffect` 自动 `setSelectedItemId(rows[0])`，改为 `selectedItemId === null` 默认。

**Export**：sticky bar 右侧 `[Export]`，不依赖右栏 header（与 spec State B 一致）。

**测试**

- `tests/renderer/workbook-layout.test.tsx`：Pin 切换渲染 split；Esc 关闭 drawer
- settings 测试：`workbookSplitRatio` 持久化

**验收**

- 默认进入 Workbook 无强制右栏 80%；View source 打开 drawer；Pin 后拖拽分割；双击或按钮折叠回全宽编辑。

---

## 建议执行顺序

1. **Task 1**（卡片 UX）— 不依赖布局，收益最大  
2. **Task 2**（Dashboard + 取消 auto-select）— 与 Task 4 部分重叠，可先做单栏 Dashboard  
3. **Task 3**（虚拟列表）— 在卡片高度稳定后调 `estimateSize`  
4. **Task 4**（Pin + drawer）— 布局终态，动 settings 与 page 结构  
5. **Task 5**（键盘）— 可与 Task 1 并行，最好在 Task 4 前完成以便 scrollToIndex 联调  

---

## 文档与 spec 同步（实施前/后各一次）

- 更新 `docs/superpowers/specs/2026-06-15-dialoglingo-v1-design.md`：关闭 “Workbook layout is still an open product decision”，写死 **默认 overlay + 可选 Pin 双栏**；Implementation snapshot 与 keyboard 表对齐。
- `docs/ui/2026-06-16-workbook-ui-design.md` 加一句：60/40 为 **Pin 模式**，非默认。

---

## 验证命令（每个 Task 合并前）

```bash
npm run typecheck
npm test
```

Renderer 行为变更：手工 `npm run dev` 或 `npm run dev:mock-llm` 走一遍生成 → 清洗 → Export。

---

如果你希望 **只先做 P0、不动 Pin/虚拟列表**，可以把 Task 4 和 Task 3 标为 Phase 2，Task 1 + 2 + 5 标为 Phase 1；需要的话我可以再拆一版「最小可交付 Phase 1 计划」文件清单。