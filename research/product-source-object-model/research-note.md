# M02 源码研究：从产品对象到源码对象

本文是 M02 的权威研究交接，不是教程正文。所有实现结论固定在同一上游快照；标签含义为 `SOURCE`（源码）、`DOCS`（同一快照中的官方文档）、`EXPERIMENT`（受控运行观察）和 `INFERENCE`（由证据推导但非代码直接声明）。

## Research Question

在当前 Multica 中，Workspace、Project、Issue、Agent、Runtime 与产品 Run / 实现 task 各自是什么，它们通过哪些持久关系和执行关系连接？为什么 Runtime 不能等同于 Daemon，Run 也不能等同于 Issue 或 Runtime？

## Upstream Baseline

- Repository：`multica-ai/multica`
- Commit：`c76a012dc70da037372159bbd19a4f69f0120783`
- 快照：Multica 管理的干净 checkout，HEAD 提交时间为 `2026-10-08T20:29:44-07:00`；2026-10-09 只读检查。
- 文档边界：本文的 `DOCS` 证据来自该提交内 `apps/docs/content/docs/`，不是对未固定线上文档的声明。
- M01 复用边界：M01 的 Run/task、Agent→Runtime、task→Runtime 结论在本基线重新核对；不直接继承旧提交 `b4ca5b4a23e68b26292a680dca7689a952bb1cd5` 的结论。

## Scope

### Included

- 六个主要产品对象的产品语义、持久锚点和本章必要关系。
- Issue assignee、Issue→Project、Issue→Run/task、Agent→Runtime、Run/task→Agent/Runtime/Issue 的关系。
- Project 对执行上下文的有限影响。
- Daemon 仅研究到足以否定 `Runtime = Daemon`。
- 产品词 `Run` 与内部 `task` 的术语差异。

### Excluded

- 触发算法、queue/claim 细节、并发控制和 polling。
- Daemon 生命周期、heartbeat 判定和故障恢复。
- `execenv.Prepare`、provider adapter、realtime/WebSocket。
- Squad、Autopilot、权限算法、task-scoped identity。
- 全量 schema 或所有 workspace-owned 表。

## 一页结论：对象不是一一对应

| 读者对象 | 本章分类 | 产品语义（`DOCS`） | 当前主要持久/源码锚点（`SOURCE`） | 最重要边界 |
| --- | --- | --- | --- | --- |
| Workspace | 组织范围 | 团队、工作和配置相互隔离的顶层边界 | `workspace` / `db.Workspace`；主要对象以 `workspace_id` 直接或间接归属 | 不是一次执行，也不是本地目录 |
| Project | 组织对象 + 执行上下文来源 | 围绕共同目标组织多个 Issue，并可绑定资源 | `project` / `db.Project`；`issue.project_id` 可选；`project_resource` | 不拥有执行进程；Project 状态与 Issue 状态独立 |
| Issue | 协作 / 工作对象 | 一件工作的目标、讨论、状态、负责人和历史 | `issue` / `db.Issue` | 一个 Issue 可产生多个 Run；Run 完成不等于 Issue 完成 |
| Agent | 编排身份与可复用配置 | 工作区内的 AI 协作者身份与配置 | `agent` / `db.Agent`，含 instructions、model、可空 runtime_id、并发等配置 | 不是常驻进程；同一 Agent 可产生多个 Run |
| Runtime | 持久执行资源记录 | 某工作区可用的“计算机 + AI 工具（或自定义 profile）” | `agent_runtime` / `db.AgentRuntime`，含 workspace_id、daemon_id、provider、status 等 | 不是 Agent、单次 Run、Daemon 进程或整台机器的同义词 |
| Run / task | 执行记录 | Agent 的一次具体执行 | 产品称 `Run`；内部核心为 `agent_task_queue` / `db.AgentTaskQueue` / `TaskService`，主键 `task.id` | `issue_id` 可空；并非每个 Run 都来自 Issue |
| Daemon（辅助） | 活的执行侧进程 | 一台计算机上的后台进程，发现工具、领取 Run、回传结果 | `internal/daemon.Daemon` 的 `runtimeIndex map[string]Runtime` 与注册流程 | 一个 Daemon 可为多个 workspace/provider 注册多个 Runtime |

**总模型（`SOURCE + DOCS + INFERENCE`）**：产品概念、Go 类型、数据库行和本地资源是不同观察层。它们常以 ID 相连，但不能按名称做一一映射。例如产品 `Run` 没有一个通用核心 `Run` 持久类型；`AgentRuntime` 行也不是 Daemon 进程本身。

## Verified Relationship Model

下图只表达本章已核实的关系；边后的标签说明证据性质。

```text
Workspace
  ├─ scopes Project                         [SOURCE: project.workspace_id]
  │    ├─ organizes zero or more Issues     [SOURCE: issue.project_id is nullable]
  │    └─ contributes description/resources
  │       to a claimed execution            [SOURCE: resolveClaimProjectContext]
  ├─ scopes Issue                           [SOURCE: issue.workspace_id]
  │    ├─ may name member/agent/squad
  │    │  as assignee                       [SOURCE: typed assignee pair]
  │    └─ may have many issue-linked tasks  [SOURCE: agent_task_queue.issue_id]
  ├─ scopes Agent                           [SOURCE: agent.workspace_id]
  │    ├─ binds to zero/one Runtime now     [SOURCE: nullable agent.runtime_id]
  │    └─ owns many task records over time  [SOURCE: agent_task_queue.agent_id]
  └─ scopes Runtime records                 [SOURCE: agent_runtime.workspace_id]
       └─ registered/served by a Daemon     [SOURCE: daemon_id + daemon runtimeIndex]

issue-linked Run (product)
  = AgentTaskQueue row / task_id (implementation) [DOCS + SOURCE]
  ├─ agent_id   -> Agent                    [SOURCE]
  ├─ runtime_id -> execution Runtime target [SOURCE; active task requires it]
  └─ issue_id   -> Issue                    [SOURCE; nullable for other run sources]
```

### Edge evidence and caveats

| Edge | Evidence | Precise meaning / caveat |
| --- | --- | --- |
| Workspace → Project | `SOURCE` | `project.workspace_id` is non-null and workspace-scoped queries use both IDs. |
| Workspace → Issue | `SOURCE` | `issue.workspace_id` is non-null; issue number is unique/counted within workspace. |
| Workspace → Agent | `SOURCE` | `agent.workspace_id` is non-null; user-facing agent lists filter `kind='user'`. |
| Workspace → Runtime | `SOURCE` | `agent_runtime.workspace_id` is non-null. The same physical daemon/tool can have separate runtime rows for different workspaces. |
| Workspace → Run/task | `SOURCE + INFERENCE` | `agent_task_queue` has no `workspace_id`; workspace authorization/snapshots derive scope by joining its non-null `agent_id` to `agent.workspace_id`. Therefore it is workspace-scoped indirectly, not by a direct column. |
| Project → Issue | `SOURCE + DOCS` | `issue.project_id` is nullable, so an Issue belongs to at most one Project and may have none. Delete uses `ON DELETE SET NULL`; Project deletion does not delete Issues. |
| Project → execution context | `SOURCE + DOCS` | Claim-time resolution loads project title/description/resources within the Issue/claim workspace; project GitHub resources override workspace repos when present. This makes Project both organizational and execution-relevant, without making it an executor. |
| Issue → assignee | `SOURCE + DOCS` | `assignee_type` + `assignee_id` is polymorphic (`member`/`agent`/`squad`). It is not a single `agent_id` FK; `validateAssigneePair` checks existence and workspace at the application boundary. |
| Issue → Run/task | `SOURCE + DOCS` | For issue work, each execution gets a new task row with `issue_id`; `ListTasksByIssue` orders the history. The relationship is one Issue to many Runs over time, not one-to-one. |
| Agent → Runtime | `SOURCE + DOCS` | `agent.runtime_id` chooses the execution resource. Agent creation verifies the Runtime belongs to the workspace. A Runtime can host multiple Agents; an Agent row has zero or one current binding because runtime deletion may leave it unbound. |
| Agent → Run/task | `SOURCE + DOCS` | Every task row has non-null `agent_id`; Agent is identity/configuration while each task row is one execution record. |
| Run/task → Runtime | `SOURCE` | enqueue copies the Agent's current `runtime_id` into the task row. Active tasks must retain it; runtime deletion may clear it on terminal history. It remains distinct from the Agent's mutable current binding. |
| Runtime → Daemon | `SOURCE + DOCS` | Runtime row stores `daemon_id` and `provider`; the daemon keeps a runtime-ID index and registers per-workspace runtimes. The relation is many Runtime records served by one process/machine, not identity equality. |

## Findings by Reader Question

### 1. Workspace 是什么范围？

1. 官方定义把 Workspace 称为团队协作、工作和配置相互隔离的顶层边界；成员、Issue、Project、Agent、Runtime 与 Run 历史都属于某个 Workspace。**`DOCS`**
2. `db.Workspace` / `workspace` 行是持久锚点，保存 ID、name、slug、context、repos、issue prefix/counter 等工作区级数据。**`SOURCE`**
3. Project、Issue、Agent、AgentRuntime 都直接带非空 `workspace_id`。task 表例外：`agent_task_queue` 没有 `workspace_id`；`GetAgentTaskInWorkspace` 和 workspace task snapshot 通过 `task.agent_id → agent.workspace_id` 建立租户边界。**`SOURCE`**
4. 因而“Workspace contains Run history”是正确的产品语义，但源码实现不是“每个核心对象都有 workspace_id”这一机械规则。**`DOCS + SOURCE`**
5. 本章不把 Workspace 解释为某个 Git checkout 或本地工作目录；那些是后续执行环境概念。**`INFERENCE`**（由字段/文档边界得出的教学限定）

### 2. Project 只是整理 Issue 的文件夹吗？

1. Project 持久记录包含 title、description、status、priority、lead 与日期；`issue.project_id` 可选，所以 Project 对 Issue 是零/一归属，Project 可聚合多个 Issue。**`SOURCE`**
2. 产品文档明确说 Project 组织共享目标、跟踪聚合进度，并可绑定 repository/local-directory 资源。Project status 与 Issue status 独立。**`DOCS`**
3. Project 具有执行相关性：`resolveClaimProjectContext` 在领取 payload 中加入 Project ID、title、description 和 workspace-filtered resources；如果有项目级 GitHub repo，它们优先于 Workspace repos。**`SOURCE`**
4. 所以 Project 的准确分类是“主要是组织对象，同时是共享执行上下文的来源”，不是 Runtime 或 Run。**`SOURCE + DOCS + INFERENCE`**
5. 删除 Project 时 Issue 被脱离而非删除（`issue.project_id` 的 `ON DELETE SET NULL`）；这也支持“组织关系”而非所有权生命周期等同。**`SOURCE + DOCS`**

### 3. Issue 保存什么，怎样关联负责人和执行历史？

1. 产品语义中，Issue 是一件工作的持续协作记录：目标、描述、讨论、状态、负责人和活动/执行历史。**`DOCS`**
2. `db.Issue` / `issue` 是持久锚点；包含 `workspace_id`、`project_id`、typed assignee、状态、父子关系、日期、属性与 revision 等。**`SOURCE`**
3. `assignee_type` 和 `assignee_id` 是多态引用。当前产品允许 member、agent、squad；应用层 `validateAssigneePair` 检查二者成对、目标存在于同一 Workspace，并对 agent/squad 做额外可调用性检查。**`SOURCE`**
4. 分配给 member 不产生 Run；分配给 Agent 会在满足触发条件时产生 Run；Squad 路径由 leader 协调。本章只记录这种关系，不展开触发规则。**`DOCS`**
5. 一个 Issue 可对应多个 `AgentTaskQueue` 行。每个新执行保留自己的 task ID 和状态；`ListTasksByIssue` 返回按时间倒序的历史。**`SOURCE + DOCS`**
6. `completed` task 只说明一次执行结束，不会普遍自动把 Issue 标为 done。Issue 生命周期与 Run 生命周期是两套记录。**`DOCS`**（M01 已有相符 `SOURCE`，本章未重走完整终态服务路径）

### 4. Agent 是进程还是配置？

1. 官方定义明确：Agent 是工作区内可复用的协作者身份和配置，不是持续运行的进程；工作到来时才产生 Run。**`DOCS`**
2. `db.Agent` / `agent` 持久字段支持该定义：name/description、instructions、model/thinking/service tier、runtime binding、environment/arguments/MCP、permission mode、skills 关系及 concurrency limit 等。**`SOURCE`**
3. M02 只需保留 name/identity、instructions/capabilities、model、Access、runtime binding 与 execution settings 这些配置类别；字段细节留给后章。**`DOCS + INFERENCE`**
4. Agent 通过当前 `runtime_id` 绑定零或一个 Runtime；正常创建要求绑定，Runtime 删除后 Agent 可保留为 unbound。一个 Runtime 可被多个 Agent 引用。创建 Agent 时，handler 先以 `GetAgentRuntimeForWorkspace` 验证 Runtime 与 Workspace，并检查可用性。**`SOURCE`**
5. task 入队时把 Agent ID 和当时的 Runtime ID 都写入 task 行。因此 Agent 与具体 Run 分离：修改 Agent 或日后重绑 Runtime，不会把历史 task 变成 Agent 本身。**`SOURCE + INFERENCE`**

### 5. Runtime 究竟代表什么？

1. 产品文档的精确定义是：一个 Workspace 可用的具体执行环境，对应“一台计算机 + 一个 AI coding tool”，或该机器上的一个 custom runtime profile。**`DOCS`**
2. 持久锚点是 `agent_runtime` / `db.AgentRuntime`，关键字段为 `workspace_id`、`daemon_id`、`provider`、`profile_id`、owner/visibility、status/last_seen 等。**`SOURCE`**
3. Runtime 同时有持久面和活性面：数据库行保存身份、绑定和最近状态；真正执行依赖本地 Daemon 仍在运行并掌握对应 Runtime ID/provider。**`SOURCE + INFERENCE`**
4. Runtime 不是 Agent：Agent 决定“谁/如何工作”，Runtime 决定“在哪台机器、由哪个工具执行”。两者由 `agent.runtime_id` 连接。**`DOCS + SOURCE`**
5. Runtime 不是一次 Run：task 行另有自己的 ID、状态、时间和结果。活跃 task 必须保存 `runtime_id` 指向执行资源；Runtime 删除可以把终态历史 task 的该字段清空而保留历史。**`SOURCE`**
6. Runtime 也不严格等同于物理机器：一台机器可安装多个 provider，并且一个 Daemon 可连接多个 Workspace，于是同一进程/机器会注册多条 workspace/provider Runtime 记录。**`DOCS + SOURCE`**

### 6. 为什么 Runtime 不等于 Daemon？

1. Daemon 是一台计算机上的后台进程，负责发现工具、注册 Runtime、领取工作、启动工具并回传结果。Runtime 是 Server 持久化、可被 Agent 和 task 引用的执行资源记录。**`DOCS + SOURCE`**
2. `db.AgentRuntime` 有数据库 ID 和 `daemon_id`；daemon 内部另有轻量 `daemon.Runtime`，并以 `runtimeIndex map[string]Runtime` 同时索引多个 Runtime ID。**`SOURCE`**
3. 注册循环按 Workspace 遍历，并把响应中的多个 Runtime ID 放入 workspace state 与全局 runtime index。这个结构直接否定“一进程 = 一 Runtime”。**`SOURCE`**
4. 教学上可以说“Daemon 承载/兑现 Runtime 所代表的能力”，但这句话是架构抽象，不是一个源码类型关系。**`INFERENCE`**

### 7. 产品 Run 在实现里是什么？

1. 官方开发者文档明确约定：UI/产品文档称 **Run**，内部 scheduler、API、数据库沿用 **task**，如 `TaskService`、`task_id`。**`DOCS`**
2. 当前核心持久对象是 `agent_task_queue` 行及生成类型 `db.AgentTaskQueue`。它保存唯一 `id`、agent/runtime/source links、状态、时间、result/error、session/workdir 和 lineage 等。**`SOURCE`**
3. 对普通 issue-linked 执行，`enqueueIssueTaskWithCommentPlan` 读取 Issue assignee Agent，读取 Agent 当前 Runtime，然后构造 `CreateAgentTaskParams{AgentID, RuntimeID, IssueID, ...}`；`CreateAgentTask` 插入 `queued` 行。**`SOURCE`**
4. `issue_id` 后来被改为可空，并另有 `chat_session_id`、`autopilot_run_id` 等来源字段。因此“Run = Issue 的执行”只适用于 issue-linked 子集；Run 是更一般的一次 Agent 执行记录。**`SOURCE`**
5. 在 `server`、`packages`、`apps` 范围搜索 `Run` 类型声明，没有发现替代 task 持久模型的通用 Agent `Run` 类型。前端确有 `TimelineRun`、`CommentRun` 等展示/派生类型，但它们包裹 `AgentTask`；`AutopilotRun`、GitHub check run 等则是其他领域对象。**`SOURCE`**（负面搜索只覆盖该提交和这些目录，不能证明未来不存在该类型）
6. 一个 Run 的持久锚点是 task UUID（`AgentTaskQueue.ID` / `task_id`），而不是 runtime ID、issue ID 或 daemon ID。**`SOURCE + DOCS`**

## Relevant State / Data Path

本章只保留对象关系所需的最短路径，不展开 M04/M05/M06 的算法。

```text
Issue(workspace_id, optional project_id, assignee_type='agent', assignee_id)
  [SOURCE: db.Issue + validateAssigneePair]
→ TaskService.enqueueIssueTaskWithCommentPlan loads Agent by assignee_id
  [SOURCE]
→ verifies Agent has runtime_id
  [SOURCE]
→ CreateAgentTaskParams(agent_id, runtime_id, issue_id, ...)
  [SOURCE]
→ agent_task_queue row with fresh task ID and status='queued'
  [SOURCE]
→ claim payload resolves Issue's Project in the same Workspace and attaches
  project description/resources when present
  [SOURCE: resolveClaimProjectContext]
→ local Daemon finds task.runtime_id in its runtimeIndex and uses its provider
  [SOURCE; detailed launch path excluded]
```

关系上最重要的一点是：task 同时保存 `agent_id`、`runtime_id` 和可选来源 ID。它不是把 Agent、Runtime 或 Issue 其中任何一个“改成运行中”，而是新建一条独立执行记录。**`SOURCE + INFERENCE`**

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/pkg/db/generated/models.go
  symbol: Workspace, Project, Issue, Agent, AgentRuntime, AgentTaskQueue
  role: "固定六个对象在当前数据库生成层的字段边界；显示 task 没有 workspace_id 且 issue_id 可空"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/001_init.up.sql
  symbol: workspace, agent, issue, agent_task_queue initial tables
  role: "建立 Workspace、Agent、Issue、task 的基础持久关系与主键语义"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/004_agent_runtime_loop.up.sql
  symbol: agent_runtime table and agent/task runtime_id migrations
  role: "把 Runtime 抽为独立持久记录，并让 Agent 与 task 分别引用它"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/251_agent_runtime_unbind.up.sql
  symbol: nullable agent.runtime_id and agent_task_queue.runtime_id; agent_task_queue_active_requires_runtime
  role: "允许 Agent 在 Runtime 删除后保持 unbound，并只对终态 task 清空 Runtime 引用；活跃 task 仍必须有 Runtime"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/034_projects.up.sql
  symbol: project table and issue.project_id
  role: "建立 Project→Workspace 与 Issue→Project 的可选关系及删除脱离语义"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/065_project_resources.up.sql
  symbol: project_resource table
  role: "证明 Project 可持久绑定执行资源指针，而非纯显示分组"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/migrations/033_chat.up.sql
  symbol: agent_task_queue.issue_id DROP NOT NULL and chat_session_id
  role: "证明内部 task 是跨来源的 Run 记录，并不总属于 Issue"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/pkg/db/queries/project.sql
  symbol: GetProjectInWorkspace, CountIssuesByProject, GetProjectIssueStats
  role: "证明 Project 查询以 workspace 隔离，并从关联 Issue 聚合进度"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/pkg/db/queries/issue.sql
  symbol: CreateIssue, GetIssueInWorkspace, ListIssues
  role: "证明 Issue 直接属于 Workspace，且 project_id/typed assignee 是其关系字段"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/service/issue.go
  symbol: IssueService.Create
  role: "创建时在同一 Workspace 验证 parent/project，并把 Project 关系持久化"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/handler/issue.go
  symbol: Handler.validateAssigneePair
  role: "验证多态 assignee 成对存在、属于同一 Workspace；说明关系由应用层解释"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/pkg/db/queries/agent.sql
  symbol: CreateAgent, CreateAgentTask, GetAgentTaskInWorkspace, ListWorkspaceAgentTaskSnapshot, ListTasksByIssue
  role: "连接 Agent、Runtime、Issue 与 task，并显示 task 的间接 workspace scope 和 issue history"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: packages/core/types/agent.ts
  symbol: AgentTask
  role: "前端共享边界仍以 AgentTask 表示核心 Run 数据"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: packages/views/issues/components/issue-run-timeline.ts
  symbol: TimelineRun
  role: "说明源码中的 Run 命名可作为包裹 AgentTask 的产品展示模型存在，而非新的持久实体"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/service/task.go
  symbol: TaskService.enqueueIssueTaskWithCommentPlan
  role: "在 issue-linked Run 创建时把 Agent、Runtime、Issue 三个 ID 写入新 task"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/handler/agent.go
  symbol: Handler.CreateAgent
  role: "创建 Agent 前按 Workspace 解析 Runtime，形成配置绑定而非进程关系"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/pkg/db/queries/runtime.sql
  symbol: UpsertAgentRuntime, UpsertAgentRuntimeWithProfile, ListAgentRuntimes
  role: "Runtime 按 workspace/daemon/provider 或 profile 持久注册并更新"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/daemon/types.go
  symbol: Runtime, Task
  role: "显示 Daemon 本地看到的是按 Runtime ID/provider 路由的执行描述和独立 task payload"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/daemon/daemon.go
  symbol: Daemon.runtimeIndex, allRuntimeIDs, workspace registration loop
  role: "一个 Daemon 同时维护多个 Workspace 的多个 Runtime ID，否定 Runtime=Daemon"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: server/internal/handler/project_resource.go
  symbol: resolveClaimProjectContext
  role: "把 Project identity/description/resources 作为 claim-time execution context，并实施 workspace scope 与 repo precedence"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/concepts.mdx
  symbol: Basic objects; Agents and execution; How the objects relate
  role: "官方产品对象定义与高层关系"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/workspaces.mdx
  symbol: What a workspace contains
  role: "官方定义 Workspace 为 work/team/agent configuration/run history 的隔离边界"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/projects.mdx
  symbol: Projects and issues; Project description and execution context
  role: "官方定义 Project 的 Issue 组织关系与 execution-context 作用"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/issues.mdx
  symbol: Parts of an issue; Issues and runs
  role: "官方区分持续工作记录 Issue 与多次具体 Run"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/agents.mdx
  symbol: Agent configuration; Agents, runtimes, and runs
  role: "官方定义 Agent 为非驻留的可复用身份/配置，并区分 Agent、Runtime、Run"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/tasks.mdx
  symbol: Issues and runs; Execution lifecycle
  role: "官方定义 Run 为一次执行记录及其与 Issue 的一对多关系"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/developers/architecture.mdx
  symbol: task versus product Run terminology; Code path for one execution
  role: "官方明确 Run/task 兼容术语并给出分层边界"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "c76a012dc70da037372159bbd19a4f69f0120783"
  file: apps/docs/content/docs/daemon-runtimes.mdx
  symbol: Daemon vs runtime
  role: "官方区分进程与 workspace-scoped machine+tool/profile Runtime"
  evidence: DOCS
```

## Evidence Table

| Claim | Label | Primary evidence | Limitation |
| --- | --- | --- | --- |
| Workspace 是顶层组织/隔离范围 | `DOCS + SOURCE` | `workspaces.mdx`; `db.Workspace`;各对象 `workspace_id` | 未枚举全部 workspace-owned 表 |
| Project 既组织 Issue 又影响执行上下文 | `DOCS + SOURCE` | `projects.mdx`; `issue.project_id`; `resolveClaimProjectContext` | 未研究资源 materialization |
| Issue 与 Run 是一对多而非同一对象 | `DOCS + SOURCE` | `issues.mdx`, `tasks.mdx`; `ListTasksByIssue` | 非 Issue Run 来源只用于界定边界 |
| Agent 是身份/配置而非常驻进程 | `DOCS + SOURCE` | `agents.mdx`; `db.Agent`; `CreateAgent` | 未详述权限、skills、MCP |
| Agent 当前绑定零或一个 Runtime；Runtime 可供多个 Agent | `SOURCE + DOCS` | `agent.runtime_id`; migration 251; Agent/Runtime docs | 正常创建要求 Runtime；删除后可 unbound |
| Runtime 是 workspace-scoped machine+tool/profile 记录 | `DOCS + SOURCE` | `daemon-runtimes.mdx`; `db.AgentRuntime`; runtime upserts | 活性算法排除在外 |
| Runtime 不等于 Daemon | `DOCS + SOURCE` | Daemon vs Runtime docs; `runtimeIndex`;注册循环 | 未研究 Daemon 生命周期 |
| 产品 Run 的核心内部表示是 task | `DOCS + SOURCE` | developer architecture; `AgentTaskQueue`; `CreateAgentTask` | 不是声称每个含 “Run” 的领域类型都映射 task |
| 一次 issue-linked task 持久保存 Agent/Runtime/Issue ID | `SOURCE` | `enqueueIssueTaskWithCommentPlan`; `CreateAgentTask` | 不展开触发和 claim |
| task 通过 Agent 间接取得 workspace scope | `SOURCE` | `GetAgentTaskInWorkspace`; `ListWorkspaceAgentTaskSnapshot` | 写入路径还存在多源 owner fence，本文不泛化所有租户校验 |

## Experiments

未进行运行时实验。对象、字段、关系、入队写入和 Daemon 多 Runtime 索引均能由固定提交中的显式类型、SQL、服务调用和官方文档回答；启动真实 Daemon/Agent 需要外部凭据，且不会为这些静态关系增加必要证据。

执行了一个受限的源码负面搜索，但将其归为 `SOURCE` 检查而非 `EXPERIMENT`：

```text
scope: server/, packages/, apps/ at c76a012dc70da037372159bbd19a4f69f0120783
patterns: Go/TypeScript type, interface, or class declarations whose name contains Run
result: no central persisted generic Agent Run type; UI-derived TimelineRun/CommentRun
        wrap AgentTask, while domain-specific AutopilotRun/check-run types also exist
```

该结果只能支持“在所查范围和提交中未发现中心 `Run` 类型”，不能证明未来提交或其他语言生成物永远不存在。

## Documentation Differences

1. **Run / task 是刻意保留的术语层差异，不是行为冲突。** 产品文档统一用 Run；内部数据库表、API 字段与服务继续用 task。教程必须并列呈现，不能把内部名改写成不存在的 `Run` 源码类型。**`DOCS + SOURCE`**
2. **Workspace “contains everything” 是产品语义压缩。** Project、Issue、Agent、Runtime 有直接 `workspace_id`，核心 task 行没有；task 通过 owning Agent 的 Workspace 被查询和授权。教程可说 Run 属于 Workspace，但若进入实现层必须注明是间接关系。**`DOCS + SOURCE`**
3. **Runtime 文档把它描述为“computer + tool/profile”，源码将这层语义拆进多字段。** `AgentRuntime` 行本身只持久保存 `daemon_id`、provider/profile、metadata、status 等；物理机和活进程不是同一数据库对象。两者不冲突，但图不能把 Runtime 画成 Daemon process。**`DOCS + SOURCE`**
4. **Project 的产品描述强调组织，源码显示它也进入 execution claim context。** 官方 Projects 文档也明确写出 description/resources 进入执行，所以这不是文档冲突，而是“organizational only”假设被否定。**`DOCS + SOURCE`**
5. 未发现本章范围内的直接 DOCS/SOURCE 行为矛盾；发现的是不同抽象层与命名粒度。

## Evidence Boundaries and Open Questions

1. `agent_task_queue` 没有直接 `workspace_id`，当前用户侧 task workspace guard 以 Agent 为权威。本文没有审计所有 task 创建入口是否都保持 Agent、Issue、Runtime 同 Workspace；M18 的权限/identity 研究应做全路径审计。**未决，不影响普通 issue-linked 路径结论。**
2. Issue 的 typed assignee 是应用层多态关系，不是三个数据库 FK。本文验证标准 HTTP create/update 路径；没有证明所有内部写入入口都经过同一 validation helper。
3. `agent.runtime_id` 当前可因 teardown 等场景变为 nullable（生成类型为 `pgtype.UUID`），而正常用户 Agent 创建要求 Runtime。离线、解绑、archive/restore 的完整状态语义留给 M07。
4. task 持久化了 Runtime ID，但 retry/rerun 是否沿用或重新解析 Runtime 取决于各入口；本章不把普通 issue enqueue 的“复制当前 binding”推广到所有 retry/rerun。
5. Project resource 如何变成本地 repo/workdir、Workspace context 如何拼入 prompt，留给 M08/M09。
6. “execution record” 是对 product Run/task row 的教学分类；它不表示 task 表就是不可变 event log，状态字段会更新。

## Editorial / Architecture Findings

1. **无需改变 M02 的主要 Reader Question 或全书架构。** 六对象模型在当前源码上成立。
2. **建议修正教学目标中的 Project 分类措辞。** Project 不能只放入“organizational scope/object”；它主要组织工作，但 description/resources 会进入运行上下文，应明确为“组织对象 + 执行上下文来源”。这属于章内精化，不要求修改 `BOOK_ARCHITECTURE.md`。
3. **Runtime 分类应避免只写“execution capability”。** 更准确的表述是“Server 端持久的 execution-resource registration/binding；活能力由 Daemon 兑现”。否则读者仍可能把数据库行、物理机和进程合并。
4. **图必须画两条不同边：Agent → Runtime（当前配置绑定）与 Run/task → Runtime（该执行记录的目标）。** 合并成一条边会隐藏历史 task 与 Agent 当前配置不是同一对象。
5. **Workspace → Run 应标为产品归属/间接实现关系。** 若图是实现图，建议通过 Agent 连接，或在边上注明 task 无直接 `workspace_id`。

## Tutorial Implications

- 从 M01 的旅程暂停下来，先给对象按“范围 / 协作 / 配置 / 记录 / 资源”分类，再展示源码名。
- 用“一个 Issue 先后产生两次 Run”解释 Issue 与 Run 的基数；用“一个 Runtime 被多个 Agent 使用”解释身份与资源分离。
- 在首次出现 Run 时固定写法：**Run（产品词；当前内部为 task / `AgentTaskQueue`）**，随后正文以 Run 为主，源码导航保留 task。
- Runtime/Daemon 图应画成“一台 Daemon process → 多个 workspace/provider Runtime records”，不要使用一一对应图标。
- Project 放在 Issue 的上游组织关系中，同时用一条受控边指向“execution context”，避免误画为执行器。
- 不在 M02 展开 queue、claim、heartbeat、provider 或本地目录；只说明这些对象为后续机制提供哪些 ID 和边界。
- 完成题应要求读者解释：为何 task ID 才锚定一次执行，为什么 Issue/Agent/Runtime/Daemon 中任何一个都不能替代它。
