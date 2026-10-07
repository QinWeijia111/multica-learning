# Run Lifecycle Diagram Evidence

本文档把 `site/src/content/tutorials/run-lifecycle.mdx` 中的 Mermaid 图映射回既有研究证据。它不是新的源码研究产物，也不增加 `research/run-lifecycle/research-note.md` 之外的实现事实。

## Diagram plan

| 读者问题 | 教程位置 | 类别 | Mermaid 类型 | 图优于纯文字的原因 | Research Note 证据是否足够 | 决定 |
| --- | --- | --- | --- | --- | --- | --- |
| 初学者应怎样连接 Issue、Run、Runtime、Daemon 与 Coding Agent？ | “最小心智模型” | `CONCEPTUAL` | `flowchart` | 一眼呈现五个概念的递进关系，同时可在 caption 中明确它不是源码类型图 | 是；只复用教程已有概念模型，不作为实现证据 | 加入 |
| 为什么 `NotifyTaskAvailable` 不等于 daemon 已拥有任务？ | “主调用链”之后、“关键实现拆解”之前 | `IMPLEMENTATION` | `flowchart` | 分叉再汇合的结构能同时展示 wakeup 与 polling 的不同作用，并把所有权边界固定在 claim | 是；Research Note 的 Execution / Call Chain、Finding C 与 Evidence Table 直接支持节点、顺序和关系 | 加入 |
| 直接分配主路径上的 task 经过哪些状态？ | “daemon 先准备本地环境，再报告 `running`” | `IMPLEMENTATION` | `stateDiagram-v2` | 状态图能比行内箭头更清楚地区分转换触发点、成功终态与失败终态 | 是；Research Note 的 Finding F 逐项列出转换与 symbol | 加入 |
| Issue 分配到本地 Codex 执行期间，各参与者按什么顺序交互？ | 原计划放在“主调用链” | `IMPLEMENTATION` | `sequenceDiagram` | sequence diagram 适合参与者时序，但这里需要同时容纳 API、服务、数据库、daemon、provider 与进程 | 局部足够，但完整绘制会与现有简化调用链及另外两张图重复，并容易混合抽象层级 | 不加入；保留现有文字调用链 |

本次选择三张图，不以数量为目标。被省略的 sequence diagram 没有提供足以抵消重复与密度的新教学价值。

## Diagram 1 — `conceptual-run-path`

### Diagram

- 标题 / 标识：`conceptual-run-path`
- 读者问题：初学者应怎样连接 Issue、Run、Runtime、Daemon 与 Coding Agent？
- 类别：`CONCEPTUAL`
- Mermaid 类型：`flowchart`
- 教程位置：“最小心智模型”开头，替换原 ASCII 图

### Evidence baseline

- 研究产物：`research/run-lifecycle/research-note.md`
- 上游仓库：`multica-ai/multica`
- 完整上游 commit：`b4ca5b4a23e68b26292a680dca7689a952bb1cd5`

### Node evidence

这是一张教学概念图，不把节点声明为源码 symbol。节点沿用已通过技术评审的教程原模型；Research Note 的 Tutorial Implications 支持把产品 `Run` 映射到内部 task 术语，并把 daemon 与 provider/Codex 路径作为本章教学主线。

### Edge evidence

概念边只表达本章的阅读顺序，不作为 `SOURCE` 调用关系。caption 与紧邻正文明确说明这些概念不都对应同名源码类型。

### Preserved uncertainty

- 未把 `Run` 画成源码中的中心 type。
- 未展开 runtime/provider 配置、`execenv.Prepare` 内部机制或自定义 runtime 行为。

### Review

- 精确标识符：`Issue`、`Run`、`Runtime`、`Daemon`、`Coding Agent` 沿用产品/教程术语。
- 文本 fallback：图后的五项定义与 `Run` 到内部 task 术语的映射完整保留。
- Reviewer verdict：`PASS`（Tutorial Writer 自审；仍需 Technical Reviewer 复核）。

## Diagram 2 — `durability-and-ownership`

### Diagram

- 标题 / 标识：`durability-and-ownership`
- 读者问题：为什么 `NotifyTaskAvailable` 不等于 daemon 已拥有任务？
- 类别：`IMPLEMENTATION`
- Mermaid 类型：`flowchart`
- 教程位置：“主调用链”的简化调用链之后

### Evidence baseline

- 研究产物：`research/run-lifecycle/research-note.md`
- 上游仓库：`multica-ai/multica`
- 完整上游 commit：`b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- 主要依据：Execution / Call Chain；Finding B.2、C.1–C.4；Evidence Table 中 direct assignment persistence、notification、claim transport 与 claim eligibility 四项。

### Node evidence

- `agent_task_queue(status='queued')`：Source Map 的 `CreateAgentTask`；Finding B.2。
- `NotifyTaskAvailable`：Source Map 的 `(*Hub).NotifyTaskAvailable`；Finding C.1。
- 周期 polling 与 daemon 检查：Source Map 的 `(*Daemon).pollLoop`、`(*Daemon).runBatchPoller`；Finding C.2。
- `ClaimAgentTask` 与 `queued → dispatched`：Source Map 的 `ClaimAgentTask`；Finding C.4。

### Edge evidence

- `queued → NotifyTaskAvailable`：Execution / Call Chain 记录 `CreateAgentTask` 后发布 `task:queued`，再经 `EmptyClaim.Bump` 调用 `NotifyTaskAvailable`；Finding C.1 明确持久任务先于 best-effort 通知。
- `NotifyTaskAvailable → daemon 检查`：Finding C.1–C.2 说明 wakeup nudges `pollLoop`，提示 daemon 尽快检查。
- `周期 polling → daemon 检查`：Finding C.2 说明同一 loop 周期性 safety-poll，以恢复漏掉的事件。
- `daemon 检查 → ClaimAgentTask`：Execution / Call Chain 记录 `claimTasksWSFirst` 经 WS RPC `tasks.claim` 或 HTTP fallback 到服务端 claim 路径，最终由 `ClaimAgentTask` 原子完成 `queued → dispatched`。

### Preserved uncertainty

- 图不表示 notification 转移所有权，也不把 WebSocket transport 等同于 claim 语义。
- 未绘制 multi-instance wakeup relay、Redis invalidation、heartbeat/offline 完整恢复、stale dispatch、超时或重试。
- 未量化 polling 周期或通知丢失概率。

### Review

- 精确标识符：已核对 `agent_task_queue`、`NotifyTaskAvailable`、`tasks.claim`、`ClaimAgentTask`、`queued`、`dispatched`。
- 文本 fallback：caption、主调用链后的总结以及“WebSocket wakeup 不是 task ownership”“polling”“atomic claim”三节都保留关键结论。
- Reviewer verdict：`PASS`（Tutorial Writer 自审；仍需 Technical Reviewer 复核）。

## Diagram 3 — `direct-assignment-task-states`

### Diagram

- 标题 / 标识：`direct-assignment-task-states`
- 读者问题：普通直接分配主路径上的 task 经过哪些状态，什么操作触发转换？
- 类别：`IMPLEMENTATION`
- Mermaid 类型：`stateDiagram-v2`
- 教程位置：“daemon 先准备本地环境，再报告 `running`”

### Evidence baseline

- 研究产物：`research/run-lifecycle/research-note.md`
- 上游仓库：`multica-ai/multica`
- 完整上游 commit：`b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- 主要依据：Finding F “Verified state transitions”及其列出的各转换 symbol。

### Node evidence

`queued`、`dispatched`、`running`、`completed`、`failed` 均来自 Finding F 的 ordinary direct-assignment 主路径。

### Edge evidence

- `[*] → queued`：`[*]` 是 Mermaid 起点记号；真正被源码验证的事实是 `CreateAgentTask` 将普通直接分配任务的首个持久状态写为 `queued`。不把 `[*]` 视为 Multica 状态。
- `queued → dispatched`：`ClaimAgentTask` 原子 claim；Finding F。
- `dispatched → running`：`StartAgentTask` / `StartTaskForClaim`，且 Finding D.3–D.4 证明本地准备先于 start；图使用服务层 symbol `StartTaskForClaim`。
- `running → completed`：`CompleteAgentTask` 位于 `CompleteTaskWithTransition` 中；Finding F。
- `running → failed`：`FailAgentTask` 位于 `FailTaskWithTransition` 中；Finding F。
- `completed → [*]` / `failed → [*]`：两条边仅表示 Mermaid 图示结束，不表示 Multica 在 `completed` 或 `failed` 之后执行了额外数据库状态迁移。

### Preserved uncertainty

- `waiting_local_directory` 是已验证的可选分支，但不画进主路径；紧邻正文单独解释。
- `deferred` 不属于普通直接分配路径，因此未画。
- 未绘制 cancel、retry、stale-claim recovery、queued expiry 或完整 active/terminal 状态图。
- task 终态与 Issue workflow 状态的关系不在这张 task 状态图中混画；后文继续明确两者独立。

### Review

- 精确标识符：已核对五个状态值及 `CreateAgentTask`、`ClaimAgentTask`、`StartTaskForClaim`、`CompleteTaskWithTransition`、`FailTaskWithTransition`。
- 文本 fallback：caption、前后段落、可选 `waiting_local_directory` 小节与“task 状态与 Issue workflow status 是两套状态”小节保留完整结论。
- Reviewer verdict：`PASS`（Tutorial Writer 自审；仍需 Technical Reviewer 复核）。

## Validation record

- Mermaid render：生产 build 共转换 3 个 Mermaid block；本地 production preview 在 1440×1000、1024×900、390×844 三个 viewport 中均得到 3 个 `data-processed` 容器和 3 个 SVG，无 error state，也无 fatal console error。
- 响应式：三个 viewport 均无 page-level horizontal overflow；每张图的 `scrollWidth` 等于容器 `clientWidth`，因此无需 `data-wide`。
- Caption：三个 viewport 均可找到 3 条邻近 `figcaption`。
- 章节导航：1440px 的右侧 outline 可见且包含 29 个链接；1024px 与 390px 的移动 outline 同样保留 29 个链接。
- 阅读进度：三个 viewport 中滚动后 `--reading-progress` 都从初始值更新为非零值。
- JavaScript disabled：正文存在，3 个 Mermaid block 均未标记 `data-processed`，原始 DSL 可见，3 条 caption 保留。
- GitHub Pages base：production preview 中检查的站内绝对资源与链接均保留 `/multica-learning/` 前缀。
- 阅读统计：`npm test` 通过 Mermaid 排除规则；教程显示 `4,517 字，含 42 行代码，约 23 分钟`。修改前为 63 行，替换掉的 ASCII 图不再计入，新增 Mermaid DSL 也未被计为程序/源码行。
- 本地命令：`npm ci`、`npm run check`、`npm test`、`npm run build`、`git diff --check` 均通过。首次并行运行 `astro check` 与 build 时，两者争用 `.astro/content-modules.mjs.tmp` 导致一次 build rename 失败；随后按顺序重跑 build 成功，3 个静态页面生成完成。
