# Research Note: Run as a Durable Task

本文中的重要结论均显式使用 `SOURCE`、`DOCS`、`EXPERIMENT` 或 `INFERENCE` 标签。

## Research Question

产品语境中的一次 Run 在 Multica 源码中由什么持久对象表示，`TaskService` 如何创建并推进它，为什么 completion / failure / cancellation、自动 retry 与人工 rerun 都必须围绕独立的 durable task record，而不是一次内存调用或对 Issue 状态的覆盖？

## Upstream Baseline

- Repository: `multica-ai/multica`
- Commit: `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- Inspected on: 2026-10-16
- Checkout state: managed, clean, read-only checkout at the full commit above；未修改、未建分支、未推送上游。

## Scope

### Included

- 产品 Run、Issue 与内部 task record 的映射。
- `TaskService` 和 `agent_task_queue` 的职责边界。
- 普通 Issue run 的持久创建，以及 trigger / attribution / runtime / result / lineage 字段的作用类别。
- `deferred → queued → dispatched → waiting_local_directory / running → completed | failed | cancelled` 的状态骨架。
- terminal compare-and-swap、幂等回调与历史读取。
- 自动 retry 和人工 rerun 的“新记录 + 血缘”语义。
- 官方 Runs 文档与当前源码的对照。

### Excluded

- M04 已覆盖的四类 trigger 入口细节。
- M06 的 polling、claim 候选选择、锁竞争、并发额度和唯一执行权证明。
- M07–M10 的 Daemon、execution environment 与 provider 实现。
- M11–M12 的消息流与 realtime fanout。
- M13 的完整 timeout、offline、orphan recovery、backoff 与 failure-classification 策略。

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: TaskService
  role: "集中编排 task 的 enqueue、start、terminal、cancel、retry、rerun 与相关事务后副作用"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/generated/models.go
  symbol: AgentTaskQueue
  role: "当前持久 task row 的生成类型，包含身份、状态、时间、结果、来源、session/workdir 与 retry/rerun 血缘"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).enqueueIssueTaskWithCommentPlan
  role: "验证目标 Agent / Runtime 和 attribution，构造 CreateAgentTask 参数，先持久 insert，再发布 queued event 并通知 Runtime"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).NotifyTaskEnqueued and (*TaskService).notifyRuntimeMayHaveWork
  role: "在 task row 已持久化后使 empty-claim cache 失效并发送 Runtime work hint；通知不承载 task 状态"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: CreateAgentTask and CreateDeferredChannelIssueTask
  role: "分别创建 queued / deferred 的独立 UUID task row，并持久化目标、来源、上下文与审计字段"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: ClaimAgentTask, StartAgentTask, MarkAgentTaskWaitingLocalDirectory
  role: "定义 queued → dispatched、dispatched → waiting_local_directory 和 dispatched/waiting → running 的数据库状态边界；claim 竞争细节留给 M06"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).CompleteTaskWithTransition and (*TaskService).FailTaskWithTransition
  role: "用事务包住终态写入及相关 durable settlement，并把已终态回放处理为无重复副作用的幂等成功"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: CompleteAgentTask and FailAgentTask
  role: "通过 status predicate 对 running / active row 执行终态 CAS，并保存 result/error/session/workdir/branch 元数据"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).CancelTaskWithResult
  role: "将单条 active task 原子地推进为 cancelled，随后 reconcile、broadcast 并通知等待者；重复取消返回现有记录"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: CreateRetryTask
  role: "从失败 parent 新建 retry child，递增 attempt，写 parent_task_id / retry_of_task_id，并按策略保留或清除 session、保留 work_dir"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).RerunIssue and (*TaskService).enqueueRerunTask
  role: "人工 rerun 解析历史或当前目标，创建 direct_human 的新 task，并用 rerun_of_task_id 连接来源记录"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/handler/task_lifecycle.go
  symbol: (*Handler).RerunIssue
  role: "暴露 POST /api/issues/{id}/rerun，验证操作者和目标 Agent 权限后调用 TaskService"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/handler/daemon.go
  symbol: (*Handler).ListTasksByIssue
  role: "把 agent_task_queue 历史作为 Issue execution log 返回；默认完整历史，active 模式只取非终态"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/handler/agent.go
  symbol: AgentTaskResponse and taskToResponse
  role: "把持久 row 映射为面向客户端的 Run 形状，包括状态、时间、结果、错误、attempt、lineage 与 attribution"
  evidence: SOURCE
```

## Behavior-first Call / State Paths

### 1. 一次普通 Issue trigger 怎样成为 durable Run

```text
已准入的 Issue trigger
→ TaskService.EnqueueTaskForIssue* / enqueueIssueTaskWithCommentPlan
→ 解析 agent.runtime_id、attribution、trigger context、priority
→ CreateAgentTask
→ INSERT agent_task_queue(id=UUIDv7, status='queued', ...)
→ transaction / statement success returns persisted AgentTaskQueue
→ broadcast task:queued
→ NotifyTaskEnqueued / Runtime wakeup
```

关键顺序是“先有持久 row，后有通知”。因此 wakeup 是加速 Runtime 发现工作的信号，不是 Run 本身，也不是执行所有权。即使通知未成为后续执行事实，数据库记录仍可由轮询和读取路径观察。**`SOURCE`**

媒体尚未完成绑定的 channel Issue 是同一原则的强化例子：`CreateDeferredChannelIssueTask` 先写 `status='deferred'`，等媒体就绪或 `fire_at` 到期后才提升为 `queued`。它已经是 durable record，但尚不可 claim。**`SOURCE`**

### 2. 一条记录的核心状态骨架

```text
deferred --(promotion)--> queued
queued --(claim boundary; M06)--> dispatched
dispatched --(local path contention)--> waiting_local_directory
dispatched | waiting_local_directory --(start acknowledgement)--> running
running --(complete CAS)--> completed
dispatched | waiting_local_directory | running --(fail CAS)--> failed
active state --(cancel CAS)--> cancelled
```

- `CreateAgentTask` 直接写 `queued`；deferred enqueue / retry 写 `deferred` 并携带 `fire_at`。**`SOURCE`**
- `ClaimAgentTask` 的 `queued → dispatched` 是获得执行权的关键边，但其候选、锁与并发正确性属于 M06。**`SOURCE`**
- `StartAgentTask` 只接受 `dispatched` 或 `waiting_local_directory`，并写 `started_at`；等待状态保存 `wait_reason`。**`SOURCE`**
- `CompleteAgentTask` 只接受 `running`；`FailAgentTask` 接受 `dispatched`、`waiting_local_directory` 或 `running`，因为启动前和本地等待期间也可能失败。**`SOURCE`**
- cancellation 接受仍 active 的任务并保留 row，而不是删除历史；user cancellation 还可持久化 actor metadata。**`SOURCE`**

### 3. 终态回调为什么可以重放

```text
daemon terminal callback
→ CompleteTaskWithTransition / FailTaskWithTransition
→ transaction:
   terminal SQL update guarded by current status
   + settle related durable obligations
   + chat outcome / resume pointer changes when applicable
→ commit
→ capture analytics, reconcile status, publish terminal event, wake waiters
```

`CompleteAgentTask` 以 `WHERE status='running'` 做 compare-and-swap；`FailAgentTask` 只接受 active states。若同一回调重放时 SQL 已无 row 可转换，service 再读现有 task，并把“已终态”返回为 `transitioned=false` 的成功；事务外 side effect 只能在首次转换成功时执行。**`SOURCE`**

这不是“每个 terminal endpoint 都随便覆盖 status”，而是“一条 durable row 只赢一次终态转换，重放观察既有事实”。**`SOURCE`**

### 4. 自动 retry：新 attempt，不是重置 parent

```text
active parent --FailTaskWithTransition--> failed parent
                               └─ same transaction → CreateRetryTask
                                                      → new child row
                                                      → attempt = parent.attempt + 1
                                                      → parent_task_id = parent.id
                                                      → retry_of_task_id = parent.id
                                                      → queued or deferred
```

- retry eligibility 由有限 failure-reason allowlist、attempt ceiling、来源形状等共同决定；本章只使用它证明 lineage，不教学完整恢复策略。**`SOURCE`**
- retry child 继承 trigger / attribution / issue-or-chat relation 与 workdir；session 是否保留取决于失败是否会污染 resume。**`SOURCE`**
- parent 的 `failed` 与 child 的创建放在同一事务中，避免外部观察到“失败已提交但应有 retry 尚不存在”的裂缝。**`SOURCE`**
- `retry_of_task_id` 与 `parent_task_id` 保存系统 retry 血缘；旧 task 不被改回 `queued`。**`SOURCE`**

### 5. 人工 rerun：新的用户意图，与系统 retry 分开

```text
POST /api/issues/{id}/rerun [optional source task_id]
→ Handler.RerunIssue validates member + target-agent invoke permission
→ TaskService.RerunIssue resolves current assignee or historical agent
→ cancel only replaceable not-yet-started pending rows when necessary
→ enqueueRerunTask
→ new queued row with direct_human attribution
→ rerun_of_task_id = selected source task (when named)
```

人工 rerun 是新的 direct-human action。它使用 `rerun_of_task_id`，与系统生成的 `retry_of_task_id` 分离；历史 source row 仍保留。当前实现也不会为了 rerun 杀死已在执行的 run，而是允许新 row 在同一 Agent / Issue 的序列化边界后等待。**`SOURCE`**

关于 session 的精确表述需要避免旧注释造成误解：rerun row 固定 `force_fresh_session=true` 以保护旧 claim handler；当前 claim path 可以根据被明确点选的 source task、安全性和 Runtime 条件重用 workdir，并在安全时恢复 exact source session。教学时应说“人工 rerun 是新记录；是否复用本地成果 / session 是后续 claim 准备策略”，不能简化为“总是从空目录开始”。**`SOURCE`**

## Verified Conclusions

### A. 产品 Run 与内部 task 的映射

1. 官方 Runs 文档把 Run 定义为“一次 Agent execution”的独立记录：一个 Issue 可以拥有多条 Run，每条从 trigger 持续到完成、失败或取消，旧记录不被覆盖。当前源码用 `AgentTaskQueue` row、`TaskService` 和 task-oriented API / SQL 实现这组语义。**`DOCS + SOURCE`**
2. 这是一组语义映射，不意味着产品词 Run 与所有源码 identifier 一一同名。公开界面说 run；内部核心仍大量使用 `task_id`、`TaskService`、`agent_task_queue`。**`DOCS + SOURCE`**
3. `agent_task_queue` 名称保留了 queue 历史，但 row 在 `running` 和 terminal 后仍继续作为 execution log 记录存在。因此不能把它只理解成“尚未执行的队列项”。**`SOURCE`**

### B. Durable 的具体含义

1. 每次 enqueue 都生成独立 ID 并先写数据库；row 保存目标 Agent / Runtime、Issue / Chat / Autopilot relation、status / timestamps、trigger / attribution、context、result / error、session / workdir 以及 lineage。不同入口不必填满所有字段，但共用持久记录边界。**`SOURCE`**
2. Runtime notification 发生在 insert 成功之后。持久事实与 best-effort wakeup 分离，是任务能跨 HTTP 请求、Server handler 生命周期与本地 Runtime 发现延迟存在的直接证据。**`SOURCE`**
3. execution log 通过 `ListTasksByIssue` 重新读取这些 rows；默认返回完整历史，active filter 只返回执行中集合。这证明历史 row 是后续产品读取的数据，而不是执行结束即丢弃的临时对象。**`SOURCE`**

### C. 一条 Run 与一项 Issue 是两种生命周期

1. Run 的 `completed` 只说明该次执行正常结束。官方文档明确说明它不确认 Issue 目标已达成；用户仍可审查、讨论、补充要求或再次触发。**`DOCS`**
2. 源码把 Issue 与 task 存在独立表、独立状态字段和一对多查询；多次 enqueue / retry / rerun 均新增 task row。这支持“一项长期工作拥有多次执行尝试”的模型。**`SOURCE`**
3. **`INFERENCE`**：教学时把 Issue 比作“工作容器”、Run 比作“带审计轨迹的一次执行尝试”是合适的概念模型，但这两个比喻不是源码类型名。

### D. TaskService 与数据库各自承担什么

1. `TaskService` 不是单纯 CRUD wrapper：它解析 attribution / target，选择 enqueue 变体，组织事务，调用 SQL 状态转换，并在 commit 后协调 analytics、realtime 和 Runtime 通知。**`SOURCE`**
2. 状态正确性不能只归功于 service。关键的允许来源状态、CAS、唯一 pending slot、lineage copy 和 terminal persistence 明确写在 SQL predicate / transaction 中。**`SOURCE`**
3. handler 负责 HTTP 身份、输入、workspace / invoke 权限和 response mapping；它不取代 durable-state service / SQL。**`SOURCE`**

### E. retry、rerun 与“历史不覆盖”

1. 自动 retry 创建 child row，递增 `attempt` 并写 `retry_of_task_id`；manual rerun 创建另一条 direct-human row，并写 `rerun_of_task_id`。两者都不把 parent 重置成 queued。**`SOURCE`**
2. 两套 lineage 分开是有意义的：retry 表达系统针对 transient failure 的延续；rerun 表达用户再次执行的决定。**`SOURCE + DOCS`**
3. 官方文档说“每次 execution produces a new run record; earlier records are never overwritten”，与上述 insert / lineage 实现一致。**`DOCS + SOURCE`**

## Documentation Comparison

- [Runs](https://multica.ai/docs/tasks)（2026-10-16 检查）支持 Run / Issue 的一对多边界、八种生命周期状态、stop、自动 retry、manual retry，以及 `completed` 不等于 Issue done。
- [How Multica works](https://multica.ai/docs/how-multica-works)（2026-10-16 检查）支持“Server 创建 Run、Runtime claim、结果回写”的产品级纵向路径。
- [Daemon and runtimes](https://multica.ai/docs/daemon-runtimes)（2026-10-16 检查）支持 Server 协调持久工作、本地 Daemon claim / execute 的边界。

未发现会改变 M05 Contract 的 docs/source 冲突。一个需要 Writer 精确处理的表述差异是：产品文档把 UI action 统一称为 retry，而源码严格区分自动 `retry_of_task_id` 与人工 `rerun_of_task_id`；教程应先使用产品词，再解释内部血缘差异。**`DOCS + SOURCE`**

## Experiment Record

未运行动态实验。当前问题所需的持久 insert、状态 predicate、事务、lineage 与历史读取均由固定 commit 的源码和官方文档直接建立；本地无须连接 PostgreSQL、Daemon 或外部 provider。**`SOURCE + DOCS`**

限制：未通过故障注入观察 crash / retry 的实时顺序，因此本文不把配置时长、具体 sweeper cadence 或恢复成功率扩写为实验事实。

## Evidence Boundaries and Unresolved Questions

### Verified boundary for M06

本文只确认 `ClaimAgentTask` 是 `queued → dispatched` 的 durable ownership boundary。候选排序、`FOR UPDATE SKIP LOCKED`、heartbeat gate、Agent / Daemon concurrency 与重复 claim 防护应由 M06 逐层证明，M05 不把这些机制压缩成一句“Runtime 拿到任务”。

### Verified boundary for M13

本文只确认 failure 可以原子地产生带 lineage 的 retry child，并且 terminal / cancellation rows 被保留。完整 failure taxonomy、offline grace、dispatch reclaim、orphan recovery、timeout、退避和 exhausted behavior 应由 M13 研究。

### Remaining questions

- `visibleTaskHistory` 对产品 execution log 隐藏哪些系统专用 task，Writer 是否需要一句“并非所有内部 row 都是普通用户 Run”的边界提示？这不阻塞 M05 主线。
- 教程图是否显示 `deferred` 与 `waiting_local_directory` 两个旁路状态，或在主图简化、在注释补充，需要 Writer 按认知负担决定；两者的实现证据已具备。
- 当前源码字段持续演进，教程正文不应罗列全部 `AgentTaskQueue` 字段；应按身份、状态、来源、执行连续性、结果、血缘六类教学。

## Tutorial Implications

1. 从读者熟悉的反例开场：刷新网页、Server 重启或通知丢失时，为什么工作不能只存在于一个 handler / goroutine。
2. 第一张模型先画 `Issue 1 → N Runs`，再放大单条 Run 的 durable state machine。
3. 用“先 insert、后 notify”建立 durability；不要提前讲 M06 的锁算法。
4. 用一次 `failed parent → retry child` 和一次 `historical run → manual rerun` 展示 lineage，明确历史不覆盖。
5. 在状态图旁固定写出：terminal state 判断这次 execution，不判断 Issue 目标。
6. Source Map 放附录；正文只保留少量必要 symbol：`TaskService`、`AgentTaskQueue`、`CreateAgentTask`、terminal CAS、`CreateRetryTask`、`RerunIssue`。
