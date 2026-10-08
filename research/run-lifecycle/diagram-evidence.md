# Run Lifecycle Diagram Evidence

本文档把 `site/src/content/tutorials/run-lifecycle.mdx` 中的 Mermaid 图映射回既有研究证据。它不是新的源码研究产物，不增加 `research/run-lifecycle/research-note.md` 之外的实现事实。

本次 Golden Chapter 改写采用读者优先的 `TEACHING` / `IMPLEMENTATION` 分类。`TEACHING` 图用中文语义标签折叠已验证步骤，帮助首次阅读；它们不是源码实体图。`IMPLEMENTATION` 图保留固定上游 commit 下的准确状态值与转换依据。

## Diagram plan

| 读者问题 | 教程位置 | 类别 | Mermaid 类型 | 决定 |
| --- | --- | --- | --- | --- |
| Multica 是什么系统，Server 与本地执行的边界在哪里？ | “先看整台机器” | `TEACHING` | `flowchart` | 新增；作为开篇架构图 |
| 一项工作怎样从分配走到本地执行并返回？ | “一项工作怎样跑完全程” | `TEACHING` | `flowchart` | 新增；用八个语义阶段替代早期 symbol 链 |
| 为什么通知和周期检查都不等于获得执行权？ | “为什么收到通知还不算拥有任务？” | `TEACHING` | `flowchart` | 由旧 `IMPLEMENTATION` 可靠性交接图重构；移除主视觉中的函数名 |
| 普通直接分配 task 的主路径状态如何变化？ | “为什么领取以后还不能立刻启动 Codex？” | `IMPLEMENTATION` | `stateDiagram-v2` | 保留并微调说明 |
| 学完机制后，各职责怎样重新合在一起？ | “回到整张架构图” | `TEACHING` | `sequenceDiagram` | 新增；作为章节末尾的架构综合 |

旧的 `conceptual-run-path` 图被移除。它以 `Issue → Run → Runtime → Daemon → Coding Agent` 为主线，仍过早要求读者处理产品名词；新的开篇架构图改为先表达“协调与持久状态 / 本地执行 / 本地代码与文件”。旧的 `durability-and-ownership` 图被重新分类并重画为 `TEACHING`：精确 symbol 移至邻近源码坐标与文末附录。

## Diagram 1 — `whole-machine-boundary`

- **Diagram question:** Multica 是什么系统，Server、Daemon、Coding Agent 与本地文件各自在哪里？
- **Diagram category:** `TEACHING`
- **Research artifact:** `research/run-lifecycle/research-note.md`
- **Upstream commit:** `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- **Diagram type:** `flowchart`

### Evidence

- **Major semantic relationships / edge evidence:** Research Question 与 Findings B–E 验证了 Server 持久任务、Server 向 Daemon 发出 best-effort wakeup、Daemon 主动请求 claim、Daemon 独立回传过程与结果、Daemon 在本地准备环境以及 provider/backend 启动 Coding Agent 的边界。Source Map 中 `TaskService`、`agent_task_queue`、`NotifyTaskAvailable`、`claimTasksWSFirst`、Daemon `runTask` / `reportTaskResult`、`agent.Backend` 与 `codexBackend` 支持这些职责和方向。
- **Collapsed implementation steps:** 图把 `UpdateIssue`、入队、wakeup、WS-first/HTTP claim、start、provider resolution 与结果 endpoint 折叠为架构关系；这些精确步骤没有被声明为图中节点。三条跨边界语义保持分开：Server → Daemon 只标“提醒有工作”，Daemon → Server 的 claim 边只标“请求领取”，结果路径继续由另一条 Daemon → Server 的“回传过程与结果”表达，避免把 wakeup、claim 与 result reporting 混在一起。
- **Label policy:** “协调与持久状态”“提醒有工作”“请求领取”“回传过程与结果”“本地执行”“准备工作环境”“启动 Coding Agent”“本地代码与文件”是读者侧语义标签，故意不等同于真实 symbol。
- **Uncertainty preserved:** 未展示完整 Control Plane/Execution Plane、Redis relay、heartbeat/retry、`execenv.Prepare` 内部、全部 provider 或 UI fanout。

### Validation

- Mermaid render：production build 与三个目标 viewport 均成功渲染，无 error state。
- Mobile/readability：使用 `TD` 布局与七个节点；390px 无页面级或图容器 overflow。
- Exact identifiers：`PostgreSQL`、`Local Daemon`、`Provider Adapter`、`Coding Agent` 均与研究边界一致；中文职责标签不作为源码标识符。
- Text fallback：图前后正文明确陈述 Server 负责协调，本地侧负责执行，修改后的代码位于执行侧。
- **Reviewer verdict:** `PASS`（Tutorial Writer 自审；仍需 human teaching-quality review）。

## Diagram 2 — `semantic-execution-journey`

- **Diagram question:** 一项工作按什么语义阶段从 Issue 分配走到结果回传？
- **Diagram category:** `TEACHING`
- **Research artifact:** `research/run-lifecycle/research-note.md`
- **Upstream commit:** `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- **Diagram type:** `flowchart`

### Evidence

- **Major semantic relationships:** Research Note 的 Execution / Call Chain 逐步支持分配、持久化、通知、Daemon 发现、普通 `runBatchPoller` 路径在 claim 前预留本地 slot、Server claim、环境准备、provider 执行和回传。
- **Collapsed implementation steps:** “保存”折叠 `CreateAgentTask` 与 queued event；“提醒”折叠 cache bump 与 `NotifyTaskAvailable`；第 5 步折叠本地 slot reservation、WS-first/HTTP claim 与 Server ownership confirmation，但保持“slot reservation → claim”的顺序；第 6 步只折叠 claim 成功后的环境准备 / 复用；“回传”折叠 messages/progress/complete/fail endpoints。
- **Label policy:** 八个标签故意使用动作语义，而不是 `UpdateIssue`、`ClaimAgentTask`、`ResolveBackend` 等准确 symbol。精确坐标保留在附录。
- **Uncertainty preserved:** 只画普通直接分配 happy path；未加入 `waiting_local_directory`、`deferred`、retry、stale claim 或完整失败恢复。

### Validation

- Mermaid render：production build 与三个目标 viewport 均成功渲染，无 error state。
- Mobile/readability：纵向八节点避免超宽布局；390px 无页面级或图容器 overflow。
- Exact identifiers：图中没有伪造的生产 symbol。
- Text fallback：紧邻图前的编号列表完整复述八步。
- **Reviewer verdict:** `PASS`（Tutorial Writer 自审；仍需 human teaching-quality review）。

## Diagram 3 — `notification-versus-ownership`

- **Diagram question:** 为什么收到通知或周期检查到工作，仍不等于获得执行权？
- **Diagram category:** `TEACHING`
- **Research artifact:** `research/run-lifecycle/research-note.md`
- **Upstream commit:** `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- **Diagram type:** `flowchart`

### Evidence

- **Major semantic relationships:** Finding C.1 验证持久任务先于 best-effort wakeup；C.2 验证 wakeup 与周期 polling 都促使检查；C.5 验证 `ClaimAgentTask` 的 `queued → dispatched` 才是数据库所有权边界。
- **Collapsed implementation steps:** “Server 原子确认”折叠 WS RPC/HTTP transport、service eligibility checks 与 `ClaimAgentTask` SQL；“继续等待或检查”只表示没有取得本次执行权，不声明具体 retry 策略。
- **Label policy:** 主视觉只保留“工作事实 / 提醒 / 请求领取 / 原子确认 / 执行权”。`NotifyTaskAvailable`、`tasks.claim` 与 `ClaimAgentTask` 在正文和附录映射。
- **Uncertainty preserved:** 未绘制通知丢失概率、polling 间隔、完整心跳/离线恢复、stale dispatch 或自动 retry。

### Validation

- Mermaid render：production build 与三个目标 viewport 均成功渲染，无 error state。
- Mobile/readability：`TD` 布局包含六个节点和一个决策点；390px 无页面级或图容器 overflow。
- Exact identifiers：图中没有把 WebSocket transport 画成所有权；邻近正文保留准确事件/RPC/SQL 名称。
- Text fallback：图前后的自然语言与伪代码分别解释通知、轮询和原子认领。
- **Reviewer verdict:** `PASS`（Tutorial Writer 自审；仍需 human teaching-quality review）。

## Diagram 4 — `direct-assignment-task-states`

- **Diagram question:** 普通直接分配主路径上的 task 有哪些状态，什么操作触发转换？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/run-lifecycle/research-note.md`
- **Upstream commit:** `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- **Diagram type:** `stateDiagram-v2`

### Evidence

- **Node evidence:** `queued`、`dispatched`、`running`、`completed`、`failed` 均来自 Finding F 的 ordinary direct-assignment 主路径。
- **Edge evidence:** `CreateAgentTask` 支持创建 `queued`；`ClaimAgentTask` 支持 `queued → dispatched`；本地准备完成后 `StartTaskForClaim` 支持 `dispatched → running`；`CompleteTaskWithTransition` 与 `FailTaskWithTransition` 支持两个终态。
- **Uncertainty preserved:** `waiting_local_directory` 作为可选分支留在邻近正文；`deferred` 明确排除于普通起始路径。未绘制 cancel、retry、stale-claim recovery、queued expiry 或完整状态图。
- **Notation boundary:** `[*]` 仅为 Mermaid 起止记号，不是 Multica 状态；终态到 `[*]` 也不是额外数据库迁移。

### Validation

- Mermaid render：production build 与三个目标 viewport 均成功渲染，无 error state。
- Mobile/readability：主路径只保留五个实现状态；390px 无页面级或图容器 overflow。
- Exact identifiers：状态值与五个转换 symbol 已依据 Research Note 核对。
- Text fallback：caption、前后段落与可选分支说明完整保留状态语义。
- **Reviewer verdict:** `PASS`（Tutorial Writer 自审；仍需 human technical review）。

## Diagram 5 — `architecture-synthesis`

- **Diagram question:** 理解各机制后，Server 持久协调、本地执行、所有权和结果回传怎样组成一次完整协作？
- **Diagram category:** `TEACHING`
- **Research artifact:** `research/run-lifecycle/research-note.md`
- **Upstream commit:** `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- **Diagram type:** `sequenceDiagram`

### Evidence

- **Major semantic relationships:** Research Note 的完整 Execution / Call Chain 支持 Human/Web 入口、Server 持久任务、wakeup，以及普通 `runBatchPoller` 路径中的“Daemon 预留本地 slot → 发出 claim → Server 数据库确认 ownership → claim 成功后准备 / 复用环境 → start → `running` → provider/Codex 执行 → 消息/终态回传 → Server 终态写入”。
- **Collapsed implementation steps:** Server 与 PostgreSQL 之间的边折叠 handler/service/SQL；“预留本地执行 slot”折叠 `runBatchPoller` 的 semaphore 操作，“准备 / 复用执行环境”折叠 runtime lookup 与 `execenv.Prepare` / reuse，“环境就绪，请求 start → 写入 running”折叠 start endpoint 与 `StartTaskForClaim`；“通过 provider 启动”折叠 `ResolveBackend` 和具体 Codex backend。图明确把 slot reservation 与 claim 后的 environment preparation 画成两个阶段，不再使用 `claim → local slot reservation` 的错误顺序。
- **Label policy:** participant 与消息均使用中文职责语义；它们是教学角色，不声称对应单一 process/type。Coding Agent 自循环的“修改本地代码与文件”表示执行侧行为，不表示独立 Server 调用。
- **Uncertainty preserved:** slot-before-claim 只限定于当前研究确认的普通 `runBatchPoller` 路径，不扩张为所有 Multica 执行路径的全局保证；图不展开协议 fallback、失败/retry、完整环境内容、terminal callback durability 或 UI fanout。

### Validation

- Mermaid render：production build 与三个目标 viewport 均成功渲染，无 error state。
- Mobile/readability：五个 participant 在 390px 仍缩放到图容器内，无页面级 overflow；无 JavaScript 时原始 DSL 可读。
- Exact identifiers：图不使用源码 symbol；准确调用链紧随文末附录。
- Text fallback：图前后段落完整复述“保存、提醒、预留本地 slot、领取、准备、start / running、执行、回传”。
- **Reviewer verdict:** `PASS`（Tutorial Writer 自审；仍需 human teaching-quality review）。

## Validation record

- Mermaid render：production build 转换 5 个 Mermaid block；本地 production preview 在 1440×1000、1024×900、390×844 三个 viewport 中均得到 5 个 `data-processed` 容器、5 个 SVG、5 条 caption，未出现 Mermaid error 节点。
- 响应式：三个 viewport 的 `documentElement.scrollWidth` 均未超过实际 viewport；五张图的 `scrollWidth` 均等于容器 `clientWidth`。代码块在 390px 下按设计保留容器内横向滚动，没有造成页面级 overflow。
- 视觉检查：三个 viewport 的章标题、描述、来源卡与开篇正文均未截断；1440px 右侧 outline 可见，1024px 与 390px 保留移动 outline。页面共有 17 个二/三级标题链接。
- 阅读进度与 outline：在三个 viewport 滚动到页面底部后，`--reading-progress` 分别约为 0.995、0.993、0.997，且始终只有一个 outline 项处于 current 状态。
- JavaScript disabled：5 个 Mermaid block 均未出现 `data-processed`，`flowchart TD`、`stateDiagram-v2` 与 `sequenceDiagram` 原始 DSL 可见，5 条 caption 保留。
- GitHub Pages base：production preview 中检查到的绝对站内资源与导航链接均保留 `/multica-learning/` 前缀。
- 阅读统计：页面显示 `4,808 字，含 68 行代码，约 27 分钟`；15 行 production SQL 与新增教学伪代码计入源码行数，Mermaid DSL 仍被排除；`npm test` 通过，统计结果可确定复现。
- 本地命令：`npm ci`、`npm run check`、`npm test`、`npm run build`、`git diff --check` 均通过。build 成功生成 3 个静态页面；现有 bundler directive 与 chunk-size warning 未影响输出。

构建成功只证明语法兼容；前述证据审查才是图的技术正确性依据。
