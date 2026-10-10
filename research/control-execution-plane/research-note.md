# 研究笔记：Control Plane 与 Execution Plane

本文使用 `SOURCE`、`DOCS`、`EXPERIMENT`、`INFERENCE` 标注证据。`Control Plane` / `Execution Plane` 是本章用于解释职责边界的教学模型；在所查提交中只发现两处注释把 Server 侧 skill-bundle 来源顺手称为 `control plane`，未发现成对的 `control plane / execution plane` 正式模块、类型或架构定义。

## Research Question

为什么 Multica 的 Server 不直接运行 Coding Agent，而是把耐久协调、Runtime 绑定和任务状态放在服务端，把工作目录准备、provider 解析和 CLI 进程执行放到本地 Daemon？这条边界实际传递什么，哪些本地资源与凭据结论能够被源码支持，哪些必须保留限制？

## Upstream Baseline

- Repository：`multica-ai/multica`
- Commit：`10a7e519da96e8e1819934c24f89bc55a71f88b5`
- Commit subject：`MUL-7797 fix(daemon): detect the Codex CLI nested in ChatGPT.app (#8944)`
- Inspected state：managed checkout 的干净只读工作树；研究期间未修改、建分支、推送或向上游创建 PR。
- Research date：2026-10-10。

## Scope

### Included

- 以普通 Issue 分配后的执行为代表行为，追踪 Server 入队、Runtime 定向、Daemon 领取、本地环境准备、provider backend 解析、具体 Coding Agent 进程启动以及消息 / 结果回传。
- Server 中 `AgentRuntime` 记录、Daemon 进程与 provider-specific Coding Agent 的职责区别。
- 任务跨 Server / Daemon 边界时携带的关键身份、配置和上下文。
- 本地 workdir、按需 repo checkout、宿主机工具 / 环境与 task-scoped Multica credential 的实际边界。
- `Control Plane` / `Execution Plane` 教学抽象与实现职责之间的可验证映射。

### Excluded

- heartbeat、在线 / 离线判定、注册恢复和 Daemon 生命周期；这些是 M07 的主题。
- wakeup、polling、claim 竞争、并发 admission 和数据库所有权算法；这里只保留证明跨边界衔接所需的最短路径，细节留给 M06。
- execution environment 的隔离、GC、worktree / local-directory 完整语义；留给 M08。
- provider protocol、session、retry、模型选择和各 adapter 差异；留给 M10 / M13。
- 全部 trigger、context assembly、消息持久化和前端 realtime fanout；分别留给后续章节。
- 对 SaaS 部署拓扑、网络信任模型、所有 secret 存储位置或外部模型数据处理作安全审计。

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/taskfailure/failure.go
  symbol: "ReasonSkillBundleUnavailable comment"
  role: "上游把 Daemon 下载 skill bundle 的 Server 来源顺手称为 control plane；这不是成对 plane 的正式定义"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: packages/core/dashboard/failure-class.ts
  symbol: "skill_bundle_unavailable classification comment"
  role: "前端注释同样以 control plane 指 Server 侧 skill 来源，并把故障归到 Runtime 而非 provider"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: README.md
  symbol: "What is Multica?; Your own runtime; Your first agent; architecture diagram"
  role: "官方仓库把 Runtime 描述为用户控制的机器，把 Agent daemon 放在代码旁，并画出 backend → daemon → agent CLI 的边界"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/handler/issue_trigger.go
  symbol: "(*Handler).dispatchIssueRun"
  role: "服务端把直接 Agent trigger 交给 TaskService 入队，而不是创建本地 provider 进程"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/service/task.go
  symbol: "(*TaskService).enqueueIssueTaskWithCommentPlan"
  role: "从 Agent 当前绑定复制 runtime_id，创建耐久 task，发布 queued 事件并通知目标 Runtime"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/service/task.go
  symbol: "(*TaskService).notifyRuntimeMayHaveWork"
  role: "服务端以 runtime_id 发出 best-effort wakeup；通知只促使 Daemon claim，不承载执行进程"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemonws/hub.go
  symbol: "(*Hub).NotifyTaskAvailable"
  role: "明确把 task_available 定义为发给观察目标 Runtime 的 best-effort wakeup"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/db/generated/models.go
  symbol: "Agent; AgentRuntime; AgentTaskQueue"
  role: "区分 Agent 配置 / 身份、Runtime 注册记录与一次执行 task，并显示 Agent 和 task 各自保存 runtime_id"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/db/queries/runtime.sql
  symbol: "UpsertAgentRuntime; UpsertAgentRuntimeWithProfile"
  role: "服务端把 Daemon 宣告的 provider / profile 能力持久化为 workspace-scoped Runtime 行"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/handler/daemon.go
  symbol: "runtime registration path around UpsertAgentRuntime"
  role: "Daemon 注册请求被规范化并写成 local Runtime；provider/profile 决定后续任务路由身份"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/db/queries/agent.sql
  symbol: "ClaimAgentTask"
  role: "目标 Runtime 上的 queued task 经数据库状态转换成为 dispatched；本章仅用它证明执行权先由服务端耐久状态交接"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/types.go
  symbol: "Task; AgentData"
  role: "展示 Server → Daemon claim payload 携带 task/runtime/workspace/agent 身份、仓库元数据、配置和 task-scoped token"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/daemon.go
  symbol: "(*Daemon).pollLoop; (*Daemon).runBatchPoller; (*Daemon).handleTask"
  role: "Daemon 领取 task 后按 runtime_id 查询本机 runtimeIndex，得到 provider 并进入本地 runner"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/daemon.go
  symbol: "(*Daemon).runTask"
  role: "本地校验身份、准备 workdir、注入 task credential / 环境、解析 backend，并以 env.WorkDir 调用 provider"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/execenv/execenv.go
  symbol: "PrepareParams; Environment; Prepare"
  role: "在 Daemon 主机创建 task-local envRoot/workdir、写入上下文，并按 provider 准备本地配置；repo 默认按需 checkout"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/agent/agent.go
  symbol: "Backend; ExecOptions; Config"
  role: "定义 Daemon 与多种 provider-specific worker 之间的统一本地执行接口，包含 cwd、env 和 executable path"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/agent/builtin_runtimes.go
  symbol: "ResolveBackend"
  role: "Daemon 使用的统一生产入口，把 Runtime/provider identity 解析为具体 backend"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/pkg/agent/codex.go
  symbol: "codexBackend; buildCodexArgs; (*codexBackend).executeOnce"
  role: "具体证明 provider backend 在 Daemon 主机生成命令，以 task workdir/env 启动 codex app-server 进程"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/health.go
  symbol: "activeRepoCheckoutTask; (*Daemon).repoCheckoutHandler"
  role: "本机 localhost checkout endpoint 用 active task credential 和 owned workdir 约束仓库 checkout"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "10a7e519da96e8e1819934c24f89bc55a71f88b5"
  file: server/internal/daemon/client.go
  symbol: "ReportProgress; ReportTaskMessages; CompleteTask; FailTask"
  role: "Daemon 把进度、消息和终态经 API 回传 Server，证明边界是双向控制 / 结果通道而非离线执行孤岛"
  evidence: SOURCE
```

## Execution / Call and State Path

```text
Issue trigger
  → Handler.dispatchIssueRun
    [SOURCE: Server 选择直接 Agent 或 Squad leader 入队路径]
  → TaskService.enqueueIssueTaskWithCommentPlan
    [SOURCE: 读取 Agent；复制 agent.runtime_id；CreateAgentTask]
  → AgentTaskQueue(status=queued, agent_id, runtime_id, issue_id, ...)
    [SOURCE: 耐久协调记录位于 Server / PostgreSQL]
  → task:queued + notifyRuntimeMayHaveWork(runtime_id)
    [SOURCE: best-effort wakeup，只提示有工作]
  → Daemon pollLoop / runBatchPoller → Server claim
    [SOURCE: 最短衔接；poll/claim 算法细节非本章目标]
  → ClaimAgentTask: queued → dispatched
    [SOURCE: 服务端耐久状态交付执行权]
  → claim response Task{task/runtime/workspace/agent/config/repos/AuthToken/...}
    [SOURCE: 明确的 Server → Daemon 数据边界]
  → Daemon.handleTask: runtimeIndex[task.RuntimeID] → provider
    [SOURCE: Runtime ID 路由到本机已探测能力]
  → Daemon.runTask → execenv.Prepare / Reuse
    [SOURCE: 本机创建或选取 workdir；写 task context；repo 元数据供按需 checkout]
  → taskMulticaEnvironment + task-scoped token + local/provider env
    [SOURCE]
  → agent.ResolveBackend(provider, Config{ExecutablePath, Env, RuntimeID, ...})
    [SOURCE]
  → Backend.Execute(prompt, ExecOptions{Cwd: env.WorkDir, ...})
    [SOURCE]
  → Codex example: runtimeCmd.exec("app-server", "--listen", "stdio://", ...)
    [SOURCE: Coding Agent 子进程由 Daemon-side backend 启动]
  → Daemon drains messages and result
    [SOURCE]
  → ReportProgress / ReportTaskMessages / CompleteTask | FailTask
    [SOURCE: 执行观察与终态返回 Server]
```

## Findings

### A. 两个 plane 是教学模型，不是源码目录

1. 在固定提交中，对仓库做大小写不敏感搜索，发现 `server/pkg/taskfailure/failure.go` 与 `packages/core/dashboard/failure-class.ts` 的注释把 Server 侧 skill-bundle 来源称为 `control plane`；未发现 `execution plane`，也未发现这组词被成对定义为正式包、类型或架构标题。**`SOURCE`**
2. 因此本章可以用这组业界术语压缩职责，但必须把它标成 **教学架构模型**：Control Plane 对应 Server / PostgreSQL 中的意图、配置、Runtime 绑定、task 状态与协调 API；Execution Plane 对应 Daemon 主机中的 workdir、环境准备、provider backend 和 Coding Agent 进程。这个映射由多处源码职责共同支持，但“plane”本身是编辑抽象。**`SOURCE + INFERENCE`**
3. 两个 plane 不能硬等同为“Server 进程”与“Daemon 进程”两个盒子。PostgreSQL 属于耐久协调路径；外部 Git 服务、模型服务和 provider CLI 可能跨出这两个盒子；Daemon 也会回调 Server、领取 context 和上报消息。**`SOURCE + INFERENCE`**

### B. Server 协调“执行什么”，不在代表路径中启动 Coding Agent

1. 普通 Issue 执行在 Server 侧经 `dispatchIssueRun` 进入 `TaskService`。`enqueueIssueTaskWithCommentPlan` 读取目标 Agent、要求其当前有 Runtime、把 `agent.runtime_id` 复制到新 task，并写入耐久的 `AgentTaskQueue`。**`SOURCE`**
2. 入队后 Server 先发布 `task:queued`，再按 `runtime_id` 触发 `notifyRuntimeMayHaveWork`。Daemon WebSocket Hub 将其明确描述为发给目标 Runtime 观察者的 best-effort wakeup；执行权仍需 claim 路径通过 Server / 数据库状态取得。**`SOURCE`**
3. `ClaimAgentTask` 把符合条件的 task 从 `queued` 原子改为 `dispatched`。本章只据此确认 Server 维护耐久协调状态并向特定 Runtime 交接；候选选择、并发和锁细节留给 M06。**`SOURCE`**
4. 在这条代表性路径中，Server 侧代码创建 / 更新 task、选择 Runtime、发通知、响应 claim 和接收回调；实际 provider process launch 出现在 `server/internal/daemon` 调用 `server/pkg/agent` 的路径，而不在 `TaskService`。**`SOURCE`**

### C. Runtime 是 Server 可协调的能力记录，Daemon 才是活的本地承载进程

1. `db.AgentRuntime` 是数据库记录，保存 workspace、daemon ID、provider、profile、status、device metadata 等。它既不是物理机本身，也不是 OS 进程。**`SOURCE`**
2. Daemon 注册时把本机探测到的 provider / custom profile 能力提交给 Server；`UpsertAgentRuntime` / `UpsertAgentRuntimeWithProfile` 为同一 Daemon 创建或更新 workspace-scoped Runtime 行。**`SOURCE`**
3. 一个 Daemon 的 `runtimeIndex` 可包含多个 Runtime ID；claim 返回的 task 带 `RuntimeID`，`handleTask` 用它找到本机条目并取得 provider。Runtime 因而是 Server 与本地能力之间的稳定路由 / 绑定坐标，而 Daemon 是兑现这些能力的活进程。**`SOURCE`**
4. 官方 README 把 Runtime 描述为 Agent 可工作的用户机器，并画出 Go backend 经 WebSocket 到本机 Agent daemon、再 spawn 多种 CLI。这与源码关系一致，但文档将数据库记录、机器和能力压缩成产品术语；教程必须显式拆开。**`DOCS + SOURCE`**
5. Runtime 的 heartbeat、掉线、恢复与具体生命周期不由上述关系自动推出，全部保留给 M07。**`SOURCE`（范围限制）**

### D. Daemon 决定“如何在本机执行”

1. Daemon 领取的 `Task` payload 包含 task、Runtime、Workspace、Agent 身份，Agent 配置，repo / project metadata，先前 session/workdir 和 task-scoped credential。它不是把一条 shell command 从 Server 原样转发给操作系统。**`SOURCE`**
2. `handleTask` 先以 `task.RuntimeID` 查本机 `runtimeIndex` 并得到 provider；`runTask` 再校验 task/Agent 身份、确认 Workspace、准备或复用 execution environment、构造 provider config 与 prompt。**`SOURCE`**
3. `execenv.Prepare` 在 Daemon 主机的 workspaces root 下创建 task-local env root 与 workdir，或者采用受控的 local directory/worktree；它还把 context、skills 和 provider-specific config 写入本机路径。M03 只需要这项位置事实，不解释其隔离和清理机制。**`SOURCE`**
4. `agent.ResolveBackend` 把 provider / Runtime identity 解析为统一 `Backend`；Daemon 传入本机探测到的 executable path、环境和 Runtime ID。统一接口的 `Execute` 接收 `ExecOptions.Cwd = env.WorkDir`。**`SOURCE`**
5. Codex 是具体可验证实例：`codexBackend.executeOnce` 在 Daemon 侧组装 `codex app-server --listen stdio://`，设置 `cmd.Dir` 和 `cmd.Env`，然后管理 stdin/stdout JSON-RPC。不能从 Codex 一个 adapter 推断所有 provider 都使用相同 protocol，但可以证明至少具体 worker launch 位于执行侧。**`SOURCE`**

### E. 仓库、工具与凭据边界必须拆开说

1. 普通 managed environment 开始时 workdir 为空；claim payload 传递 repo URL/ref 等元数据，Agent 通过 `multica repo checkout` 请求 Daemon 的 localhost endpoint，在本机 cache / workdir 中完成 checkout。Server 不在这条路径中创建源代码工作树。**`SOURCE`**
2. `runTask` 给子进程的 `Cwd` 是 Daemon 本机 `env.WorkDir`。provider CLI、`git`、`gh`、`aws`、`kubectl`、`npm` 等工具解析发生在这个宿主环境；源码明确不重写 `HOME` / XDG，以继续使用 Daemon 用户已有状态。**`SOURCE`**
3. 这支持的严格结论是：**Multica 的工作目录和 provider 子进程位于 Runtime / Daemon 主机，Server 协调的是 task、配置和元数据。** 它不等价于“任何源代码字节永远不会离开机器”：Coding Agent 可能把上下文发送给外部模型，git remote 也天然涉及外部服务；本研究没有审计 provider 数据路径。**`SOURCE + INFERENCE`**
4. 凭据不是单一类别：
   - Server 在 claim 时签发 task-scoped `AuthToken`；Daemon 将其注入 `MULTICA_TOKEN`，使子进程以 task/Agent 身份调用 Multica，而不是继承 Daemon owner credential。**`SOURCE`**
   - Daemon 宿主的 ambient tool credentials 继续由本机 HOME / XDG 解析。**`SOURCE`**
   - Agent `custom_env` 与 MCP / connected-app 配置可由 Server 保存并随 task 下发，再由 Daemon 做过滤、合并或本地 materialization。不能笼统声称“所有凭据只在本机”。**`SOURCE`**
   - `RemoteMCPDaemonToken` 明确要求只留在 Daemon，不进入 agent env/config；这是一个字段级保证，不是对所有 secret 的全局保证。**`SOURCE`**
5. 官方 README 的 “Code never leaves it” 应在教程中解释为 Multica 执行位置 / 工作树边界的产品承诺，不能扩大为外部 Coding Agent / model provider 的完整隐私保证。**`DOCS + SOURCE + INFERENCE`**

### F. 分层不是断开：控制与结果持续双向流动

1. Server → Daemon 的 claim payload 会带入任务身份、上下文、配置、repo metadata 和 task credential；Execution Plane 并非只收到一个无状态命令。**`SOURCE`**
2. Daemon → Server 通过 `ReportProgress`、`ReportTaskMessages`、`CompleteTask` / `FailTask` 回传进度、结构化执行消息、输出、session/workdir/branch 等结果元数据。**`SOURCE`**
3. 所以最准确的模型是“耐久协调状态与本地执行资源分离，通过显式协议连接”，而不是“Server 与本机互不交换数据”或“Daemon 离线自治”。**`SOURCE + INFERENCE`**

### G. 为什么要分开：可证事实与架构推论

1. 官方产品说明明确强调用户控制的 Runtime、Daemon 与代码并置、使用已安装且已认证的 agent CLI。**`DOCS`**
2. 源码事实表明 Server 的共享职责是保存意图、绑定目标 Runtime、维护 task 生命周期并收集结果；Daemon 的本地职责是探测 executable、管理 workdir/环境、使用宿主工具与启动 provider process。**`SOURCE`**
3. 从这些职责可推论，分层让共享协作状态不依赖某台机器的进程生命周期，同时让机器相关的代码、工具、进程与部分凭据在能实际使用它们的主机上解析。该句解释“为什么”，但源码没有一条设计注释宣告完整动机，所以必须标为 **`INFERENCE`**，并由上述 `SOURCE + DOCS` 支撑。
4. 不能从当前路径推论“Server 永不执行任何自动化代码”或“Daemon 只执行 Agent task”；仓库还含 server-side maintenance/integration 等其他功能。本章只回答 Coding Agent execution 的分层。**`SOURCE`（范围限制）**

## Evidence Table

| Claim | Label | Primary evidence | Limitation |
| --- | --- | --- | --- |
| Server 为 Issue 执行创建耐久 task 并绑定 Runtime | `SOURCE` | `dispatchIssueRun`; `enqueueIssueTaskWithCommentPlan`; `AgentTaskQueue` | 代表普通 Issue 路径，不枚举全部 trigger |
| wakeup 只是按 Runtime 发出的 best-effort 提示 | `SOURCE` | `notifyRuntimeMayHaveWork`; `Hub.NotifyTaskAvailable` | 完整 missed-wakeup / polling 语义留给 M06 |
| Runtime 是持久能力 / 路由记录，不是 Daemon 进程 | `SOURCE + DOCS` | `AgentRuntime`; runtime upserts; README architecture | Runtime 生命周期留给 M07 |
| Daemon 可承载多个 provider Runtime 并按 Runtime ID 路由 task | `SOURCE` | runtime registration; `runtimeIndex`; `handleTask` | 未完整审计 profile drift / recovery |
| workdir 与 provider process 位于 Daemon 主机 | `SOURCE` | `execenv.Prepare`; `runTask`; `Backend`; Codex `executeOnce` | Codex protocol 不能泛化给所有 provider |
| repo 默认由 Agent 经本地 Daemon 按需 checkout | `SOURCE` | `execenv.Prepare` comments; active repo checkout task / handler | Git remote 本身仍是外部系统 |
| task-scoped Multica token 与 Daemon owner credential 分离 | `SOURCE` | `Task.AuthToken`; `taskScopedAuthToken`; `taskMulticaEnvironment` | 不代表所有 third-party credentials 都 task-scoped |
| 宿主工具可继续读取本机 HOME / XDG 状态 | `SOURCE` | `runTask` environment construction comments | 未安全审计每个 provider 的 env filtering |
| Agent 配置与部分 credential material 可由 Server 下发 | `SOURCE` | `Task.AgentData`; `custom_env`; MCP fields | secret storage/encryption 全貌非本章范围 |
| 进度、消息和终态由 Daemon 回传 Server | `SOURCE` | daemon client report methods; `executeAndDrain` | 不展开持久化与 UI realtime fanout |
| plane separation 的工程收益 | `DOCS + SOURCE + INFERENCE` | README product boundary + verified responsibility split | “why”不是单条源码注释直接声明 |

## Experiments

未进行运行时实验。固定提交中的类型、调用点、SQL 状态转换、进程创建和文件系统操作足以区分职责；启动真实 Daemon 与 provider 需要外部 CLI / 凭据，也不会为本章边界增加必要证据。

执行了两个受限负面 / 定位搜索，归类为 `SOURCE` 检查而非 `EXPERIMENT`：

```text
scope: upstream repository at 10a7e519da96e8e1819934c24f89bc55a71f88b5
patterns: case-insensitive "control plane" / "execution plane"
result: two incidental "control plane" comments about server-side skill bundles;
        no "execution plane" match and no paired formal package/type/architecture definition

scope: server-side enqueue/service path and daemon/provider path at the same commit
patterns: task creation, runtime wakeup/claim, Backend.Execute, process construction
result: provider process construction located under daemon-side agent backends;
        server TaskService path persists and coordinates task state
```

负面搜索只能支持“在所查提交与范围未发现”，不能证明未来版本永远不采用这些术语或不存在任何其他进程启动代码。

## Documentation Differences

1. **README 用产品语言把 Runtime 说成一台可工作的机器；源码把它实现为 workspace-scoped `AgentRuntime` 行，并由 Daemon 活进程兑现。** 这是抽象粒度差异，不是冲突。**`DOCS + SOURCE`**
2. **README 的架构图说 Daemon spawn agent CLI，源码直接确认。** Codex adapter 的具体进程与 stdio protocol 是实例；教程不应把它写成所有 provider 的共同 protocol。**`DOCS + SOURCE`**
3. **“Code never leaves it” 比当前源码能静态证明的命题更宽。** 源码证明工作树和 CLI 位于 Daemon 主机；没有证明 provider 不向远端模型传输代码，也没有覆盖 git remote。教程应缩窄措辞并指出外部 provider 边界。**`DOCS + SOURCE + INFERENCE`**
4. **上游虽在两处注释中顺手使用 control plane，但没有把 Control Plane / Execution Plane 写成成对的正式模块名。** 本章可使用，但图注和正文首次出现时必须说明它是教学抽象，不应虚构 `control-plane` package 或固定 API。**`SOURCE + INFERENCE`**
5. 未发现本章最短执行路径上的直接 DOCS/SOURCE 行为矛盾；主要风险来自产品语义压缩和安全边界的过度外推。

## Evidence Boundaries and Open Questions

1. 本研究没有证明所有 task trigger 都经过完全相同的 enqueue helper；M03 应使用普通 Issue 纵向路径作为代表，不声称所有 Autopilot / Chat / retry 入口完全一致。
2. 本研究没有审计完整 heartbeat、register reconciliation、offline sweep 或 Runtime recovery。关于“一台电脑怎样持续成为 Runtime”的任何生命周期结论都必须留给 M07。
3. 本研究只用 claim 证明耐久执行权交接，不解释 wakeup/poll/claim 的正确性、并发、缓存与恢复；留给 M06。
4. `execenv.Prepare` 包含大量隔离、worktree、context 与 provider-specific materialization；M03 只引用“发生在 Daemon 主机、产生 workdir”这两个边界事实，内部机制留给 M08/M09。
5. `custom_env`、MCP、connected apps、remote brokers 与宿主 ambient credentials 的来源不同。完整 credential threat model、加密存储、redaction 和权限控制需要 M18 或独立安全研究。
6. 外部 Coding Agent 是否以及如何把本地文件内容发送到模型服务，取决于 provider / CLI；这不属于 Multica Server-vs-Daemon 源码边界，不能用 README 一句话代替审计。
7. 当前源码允许 custom runtime profile 用另一条 command 实现既有 protocol family；这进一步说明 Runtime identity、provider protocol 与具体 executable 不是天然一一对应，但完整 custom runtime 语义留给 M10。
8. Daemon 回传 `work_dir` 等路径元数据。教程若说“本地资源不离开执行侧”，应特指资源内容 / 使用位置，不应暗示路径、repo URL、消息、diff 或结果元数据都不跨边界。

## Editorial / Architecture Findings

1. **无需修改 M03 Reader Question、Part 或非目标，`editorial_escalation: none`。** 已冻结的 Book Architecture 边界与当前实现一致。
2. **必须保留一个章内措辞修正：** 不写“Server 负责 Control Plane、Daemon 就是 Execution Plane”这种一一等式；应写成“用两个 plane 观察职责”，并把 PostgreSQL、协议、外部 Git / model provider 画在正确边界上。
3. **M07 边界稳定：** M03 只需说明 Runtime record 由 Daemon 能力兑现；heartbeat、掉线、重连和机器生命周期全部不讲。
4. **凭据结论需要分类：** task-scoped Multica token、宿主 ambient credentials、Server-managed Agent custom env / MCP、Daemon-only remote MCP token 至少四类，不能合成“凭据都在本地”。
5. **“代码留在本地”需要受限表达：** 可说 Multica 在 Runtime 主机准备 workdir 并启动 CLI；不可替 provider 的外部数据处理作保证。

## Tutorial Implications

- 从一个反事实开场：如果 Server 真正“亲自运行 Agent”，它必须拥有哪台机器的 repo、CLI、环境和凭据？随后用已验证路径展示这些资源实际在 Daemon 主机解析。
- 首张 `TEACHING` 图建议画五个区域：协作客户端、Server、PostgreSQL、Runtime host（Daemon + workdir/tools/credentials）、provider-specific worker；外部 Git / model service 作为边界外依赖，而不是藏进 Server 或 Daemon。
- 最短旅程保持为“Server 保存 task 与目标 Runtime → Daemon 领取 → 本机准备 workdir → backend 启动 CLI → 消息 / 结果返回”。不要在主叙事展开 heartbeat、polling 或 claim SQL。
- 把 Runtime 画成 Server 侧的能力 / 路由记录，并用一条关联边指向承载它的 Daemon；不要把 Runtime 画成第二个进程图标。
- 把 Coding Agent 叫作 provider-specific worker，仅在源码附录展示 `Backend` / `ResolveBackend` 与 Codex 实例，避免让读者误以为所有 provider 都是 Codex app-server。
- 设计一张小型“跨边界传什么”表：向执行侧传 task identity/context/config/repo metadata/token；向控制侧回传 progress/messages/result/branch/session metadata；workdir 与 process 在本地。
- 对凭据使用四分类边界，不做“一切只在本地”的口号式保证。
- Source appendix 应固定完整 SHA，并导航到 `enqueueIssueTaskWithCommentPlan`、`AgentRuntime`、`Task`、`handleTask` / `runTask`、`execenv.Prepare`、`ResolveBackend` 和一个具体 backend launch。
- 完成题应让读者面对一个新 provider / 新 Runtime，判断哪些职责应进入 Server，哪些应留在 Daemon，并列出需要重新验证的 source evidence，而不是背诵目录名。
