# Research Note: Wakeup, Polling, Claim and Concurrency

本文中的重要结论均显式使用 `SOURCE`、`DOCS`、`EXPERIMENT` 或 `INFERENCE` 标签。

## Research Question

当一条 durable task 已经处于 `queued`，Multica 怎样让 Daemon 尽快知道有工作、在提示丢失时继续发现工作，并在多次提示、多个 claim 请求、Daemon / Agent 两层容量限制与 response 丢失并存时，只把一代可执行所有权授予一个 winner？

## Upstream Baseline

- Repository: `multica-ai/multica`
- Commit: `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- Inspected on: 2026-10-16
- Checkout state: managed, clean, read-only checkout at the full commit above；未修改、未建分支、未推送上游。

## Scope

### Included

- task 持久化后的 empty-claim cache invalidation 与 best-effort Daemon wakeup。
- Daemon WebSocket reconnect catch-up、普通 polling 与健康 WS safety poll。
- machine-level batch claim 的 HTTP / WS RPC 入口与 Daemon / Runtime authorization。
- Daemon slot-before-claim、Server-side Agent concurrency cap 与 per-target serialization。
- `ClaimTasksForRuntimes → claimTask → ClaimAgentTask` 的候选、事务和状态路径。
- 并发 claim winner、claim payload finalization、generation CAS 与 stale-dispatch reclaim。

### Excluded

- M04 的 trigger taxonomy 与 Issue Wakeup 产品功能。
- M05 的完整 task lifecycle、retry / rerun lineage。
- M07 的 Runtime 注册、Daemon 生命周期、heartbeat online 判定。
- M08 的本地目录锁实现；这里只确认 `waiting_local_directory` 占用 capacity。
- M13 的完整 offline / timeout / orphan / retry / backoff 策略。

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).notifyTaskAvailable and (*TaskService).notifyRuntimeMayHaveWork
  role: "先 Bump empty-claim invalidation version，再发 task_available hint；通知是持久 task 之后的加速路径"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/daemonws/notifier.go
  symbol: (*RelayNotifier).NotifyTaskAvailable and notifyTask
  role: "向本 API node 的 Hub 和可选 shared relay 发布 runtime-scoped、best-effort wakeup"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/daemon/wakeup.go
  symbol: (*Daemon).runTaskWakeupConnection and readTaskWakeupMessagesForConnection
  role: "连接 / 重连后发 catch-up nudge；task_available 只向批量 poller 发非阻塞信号，断线时 polling 保持可用"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/daemon/daemon.go
  symbol: (*Daemon).pollLoop, runBatchPoller and taskClaimPollInterval
  role: "单机批量 claim loop；先预留本地 slot，再按空闲 slot 数 claim；wakeup、普通 poll 与健康 WS safety poll 汇合"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/daemon/wsrpc.go
  symbol: (*Daemon).claimTasksWSFirst
  role: "优先通过 WS tasks.claim RPC，按明确的 transport outcome 决定 HTTP fallback；不确定结果进入 safety window"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/handler/daemon_rpc.go
  symbol: (*Handler).rpcClaimTasks
  role: "把 WS tasks.claim 复用到与 HTTP 相同的 ClaimTasksByRuntime handler contract"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/handler/daemon.go
  symbol: (*Handler).ClaimTasksByRuntime
  role: "验证 daemon_id、Runtime 集合、workspace / machine ownership 与 max_tasks，再调用 TaskService 并 finalise claim payload"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).ClaimTasksForRuntimes
  role: "按 promote、stale reclaim、empty-cache、candidate list、per-agent claim 的顺序完成 machine-level batch claim"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/internal/service/task.go
  symbol: (*TaskService).claimTask
  role: "在 Agent row lock 的事务内检查 runtime binding 与 max_concurrent_tasks，再执行一条 queued→dispatched claim"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: GetAgentForClaimUpdate and CountRunningTasks
  role: "串行化同一 Agent 的容量检查；dispatched、running、waiting_local_directory 均占 Agent capacity"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: ClaimAgentTask
  role: "按 priority / FIFO 选 queued row，以 runtime freshness、binding、per-target active fence 与 FOR UPDATE SKIP LOCKED 约束原子更新为 dispatched"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: server/pkg/db/queries/agent.sql
  symbol: RequeueAgentTaskAfterClaimFailure, ReclaimStaleDispatchedTasksForRuntimes and LockAgentTaskStartClaim
  role: "通过 dispatched_at generation CAS 处理 finalization failure、lost response reclaim 与 stale start / replay"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: apps/docs/content/docs/daemon-runtimes.mdx
  symbol: Dispatch and online status; Concurrency limits
  role: "官方产品语义：Server 通知、Daemon polling 后盾，以及 Daemon / Agent 两层并发限制"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "231dedb55287ab6e40fd103634a024e4d9d1baeb"
  file: apps/docs/content/docs/tasks.mdx
  symbol: Execution lifecycle
  role: "官方产品语义：queued 等待 Runtime claim，dispatched 表示已 claim 且正在启动工具"
  evidence: DOCS
```

## Behavior-first Call / State Paths

### 1. 持久 task 怎样变成“现在值得检查”的提示

```text
durable enqueue commits a queued row
→ TaskService.notifyTaskAvailable
→ EmptyClaim.Bump(runtime_id)
→ RelayNotifier.NotifyTaskAvailable(runtime_id, task_id)
→ local Hub + optional shared relay
→ daemon:task_available(runtime_id, task_id)
→ Daemon signalTaskWakeup (buffered, non-blocking)
→ machine-level batch poller wakes
```

`Bump` 必须在 hint 前发生：否则 wakeup 驱动的 claim 可能仍命中旧的“空队列”缓存并返回空。`task_available` payload 只有 Runtime / task 标识，不包含 task 内容、token 或 ownership。Hub delivery miss、relay publish failure、重复消息和 buffered signal coalescing 都不会改变数据库 task state。**`SOURCE`**

因此“Daemon 收到提示”只说明它应尽快调用 claim；它不是 `queued → dispatched` 的状态事实。官方文档也把 Server notify 与 Daemon periodic poll 描述为即时路径和 backstop。**`SOURCE + DOCS`**

### 2. Wakeup 与 polling 怎样汇入同一个 claim loop

```text
WS connect / reconnect catch-up ─┐
daemon:task_available ──────────┼→ pollLoop nudge
runtime set changed ────────────┤
task finished / slot released ──┤
scheduled safety poll ──────────┘
                                ↓
                         runBatchPoller
```

- WebSocket 连接成功立即发送一次 catch-up nudge，弥补断线期间遗漏的提示；连接失败日志明确说明 polling fallback 仍 active。**`SOURCE`**
- 健康 WS 且双方支持 `rpc-v1` / `claim-poll-hints-v1` 时，空闲 safety poll 使用独立上限和 downward-only jitter；默认 `3m` 上限产生约 `2m30s–2m45s`。如果是旧 Server、非 WS claim 或结果不确定，则保留普通 `PollInterval`，默认 `30s`。未来 deferred task 的相对 delay 可以缩短下一次 poll。**`SOURCE + DOCS`**
- wakeup channel 和 poller nudge 都是有界 buffer；burst 可合并，因为下一次 batch claim 会重新读取全部 Runtime 的 durable state。**`SOURCE`**

### 3. Daemon 为什么先拿本地 slot，再去 claim

```text
runBatchPoller
→ read allRuntimeIDs()
→ acquire ≥1 free machine slot; drain additional free slots
→ tryEnterClaim auto-update barrier
→ claimTasksWSFirst(runtime_ids, max_tasks = reserved slot count)
→ for each returned task: activeTasks++, goroutine handleTask
→ on terminal cleanup: release slot, nudge poller
```

Daemon 的 `MaxConcurrentTasks` 是机器级上限。slot-before-claim 保证 Server 把 task 置为 `dispatched` 前，本地已有接纳位置；否则已 claim 的 task 可能仅因机器无空位而滞留并与 dispatch recovery 竞争。claim request 的 `max_tasks` 等于已预留 slot 数，Server 还把单次 batch cap 限为 32。**`SOURCE`**

这层容量不等同于 Agent concurrency。官方文档说明有效并发是 Daemon ceiling 与单 Agent ceiling 中较小者；源码另外在 Server claim transaction 中检查 Agent cap。**`SOURCE + DOCS`**

### 4. WS-first 与 HTTP 为什么是运输选择，不是两套 ownership

```text
Daemon claimTasksWSFirst
├─ healthy rpc-v1 → WS method tasks.claim
│                    → Handler.rpcClaimTasks
│                    → Handler.ClaimTasksByRuntime
└─ safe transport failure / unsupported route → HTTP POST /api/daemon/tasks/claim
                                               → same ClaimTasksByRuntime
```

WS RPC 与 HTTP 使用同形 request / response，并复用 `ClaimTasksByRuntime`。handler 要求 `daemon_id`，把 token identity 与 body 对齐，批量读取 Runtime 后过滤 workspace access 和 `runtime.daemon_id` ownership；未知或刚删除的 Runtime 被跳过。`max_tasks=0` 明确 claim nothing，负数拒绝，正数被 cap。**`SOURCE`**

若 WS frame 可能已经送达但 response 因断线不确定，Daemon 不立即 HTTP fallback：它跳过本轮并等待 safety window。这样避免同一批本地空位同时承接一批可能已在 Server 提交的 WS claims 和第二批 HTTP claims。**`SOURCE`**

### 5. Server 批量 claim 怎样落到单 Agent 的原子 winner

```text
ClaimTasksByRuntime
→ ClaimTasksForRuntimes(authorized runtime set, max_tasks)
   1. promote due deferred tasks
   2. reclaim eligible stale dispatched tasks
   3. skip recently-proven-empty runtimes; sample invalidation versions
   4. list queued candidates, priority DESC + created_at ASC
   5. mark still-empty runtimes with sampled versions
   6. once per distinct candidate Agent → claimTask(agent, runtime)
      → transaction
         → GetAgentForClaimUpdate ... FOR UPDATE
         → verify current runtime binding
         → CountRunningTasks
         → if below agent.max_concurrent_tasks
            → ClaimAgentTask
               → choose eligible queued row
               → FOR UPDATE SKIP LOCKED
               → UPDATE status='dispatched', dispatched_at=now(), prepare lease
```

`GetAgentForClaimUpdate ... FOR UPDATE` 使同一 Agent 的两个 capacity checks 串行：第二个事务必须在第一个提交后重新计数，因此不能都基于同一个旧 active count 越过 `max_concurrent_tasks`。计数包含 `dispatched`、`running` 与 `waiting_local_directory`。**`SOURCE`**

`ClaimAgentTask` 的 row lock 与 `status='queued'` predicate 决定单 row winner：竞争者要么跳过已锁 row，要么在更新时已不再满足 queued。排序为 priority 降序、创建时间与 id 升序。**`SOURCE`**

### 6. “同一 Agent 可并发”为什么仍不等于“同一目标可重入”

`max_concurrent_tasks > 1` 允许同一 Agent 处理多个互不冲突目标，但 `ClaimAgentTask` 还要求不存在该 Agent 的 active task 与候选共享同一 Issue；Chat 使用同一 `chat_session_id`；无 Issue / Chat / Autopilot relation 的 quick-create shape 也互相序列化。不同 Agent 可以并行处理同一 Issue。**`SOURCE`**

这不是全局 Issue lock，而是 per-Agent、per-target 的重入防护。任务进入 `dispatched` 就开始占用该防护和 Agent capacity，不必等到 `running`。**`SOURCE`**

### 7. Claim response 丢失为什么不会把旧 owner 永久当真

```text
queued --claim generation G1--> dispatched(dispatched_at=G1, prepare lease)
    ├─ payload finalization fails before response
    │    → RequeueAgentTaskAfterClaimFailure WHERE dispatched_at=G1
    │    → queued
    ├─ response arrives
    │    → Daemon StartTaskForClaim locks id+runtime+dispatched_at=G1
    │    → running
    └─ response lost; never started; recovery window + lease expires
         → ReclaimStaleDispatchedTasksForRuntimes
         → refresh dispatched_at=G2
         → redeliver
         → any stale G1 start/replay fails generation check
```

handler 在写 response 前 finalise task-scoped token、可选 daemon token、issue snapshot 与 comment receipt。finalization failure 可用 `dispatched_at` CAS 精确回滚这一代 claim；旧 handler 不能回滚更新一代。**`SOURCE`**

已提交但 response 丢失时，task 留在 `dispatched`，直到 recovery window 和 prepare lease 条件满足后被重新领取；reclaim 刷新 `dispatched_at`。`LockAgentTaskStartClaim` 用 task id、runtime id 和 `dispatched_at` 串行化 start / replay / reclaim / cancellation，使旧 generation 不再能启动或确认新 generation。**`SOURCE`**

完整 dispatch timeout、Daemon crash 后 terminal treatment 与自动 retry 属于 M13；本章只确认 lost-response recovery 仍围绕同一 durable row 的 claim generation，而不是同时承认两个 owner。**`SOURCE`**

## Verified Conclusions

### A. “知道有任务”与“获得执行权”是两个边界

1. wakeup 是 task 持久化后的 content-free hint，可丢失、重复、跨 node relay 或在本地 buffer 中合并；它不改变 task status。**`SOURCE`**
2. polling 与 wakeup 最终都只让同一个 batch poller 发起 claim。数据库中的 `queued → dispatched` 原子更新才形成 durable ownership fact。**`SOURCE`**
3. 官方文档的“Server notify + Daemon periodic poll backstop”与源码一致，未发现 docs/source 冲突。**`DOCS + SOURCE`**

### B. 唯一 winner 不依赖单一锁

1. Daemon slot 解决本机接纳能力；Agent row lock + active count 解决 per-Agent quota；per-target `NOT EXISTS` 解决同一 Agent 的目标重入；task row `FOR UPDATE SKIP LOCKED` + queued predicate 解决单 row claim 竞争。**`SOURCE`**
2. 这些门的作用域不同，不能用一个“最大并发数”概括。**`SOURCE`**
3. **`INFERENCE`**：教学上可把它们画成从外到内的四道门，但“四道门”是解释模型，不是源码中的统一 abstraction。

### C. Batch claim 改变效率，不改变 ownership authority

1. 一个 Daemon 对其全部 Runtime 做一次 machine-level batch claim，并按已预留 slot 数请求 task，避免一 Runtime 一 HTTP poller 的 fan-out。**`SOURCE`**
2. batch service 仍逐 Agent 进入原有 transaction-scoped claim primitive；每条 task 都通过相同 SQL ownership boundary。**`SOURCE`**
3. partial success 被返回而不是丢弃，因为先前 transaction 已经提交；隐藏已提交 claim 并立刻 fallback 才会制造额外 stranded / double-claim 风险。**`SOURCE`**

### D. Redis / WebSocket 优化不承担 correctness authority

1. EmptyClaim cache 只跳过近期确认为空的 Runtime；enqueue 先 bump version，竞争中的 stale `MarkEmpty` 会被后续 read 拒绝。cache 缺失 / 失败保留数据库路径。**`SOURCE`**
2. WebSocket 可加速 hint 和承载 claim RPC，但连接失败仍 polling，WS RPC 与 HTTP 进入同一 handler，uncertain outcome 不立即双投。**`SOURCE`**
3. durable queue、SQL predicate、transaction 和 generation CAS 才决定 owner 与恢复。**`SOURCE`**

### E. `dispatched` 是 claim 成功，不是工具已经运行

1. 官方 Runs 文档把 `queued` 定义为等待 Runtime claim，把 `dispatched` 定义为已 claim、正在启动工具；源码在 `ClaimAgentTask` 写 dispatched，之后由 start path 进入 running。**`DOCS + SOURCE`**
2. `dispatched`、`running`、`waiting_local_directory` 都占 Agent capacity；这防止准备中或等待本地目录的工作稍后恢复时越过额度。**`SOURCE`**
3. Daemon machine slot 在 Server claim 前预留；Agent capacity 则在 Server transaction 内判定。两层都需要。**`SOURCE`**

## Documentation Comparison

- `apps/docs/content/docs/tasks.mdx`（固定于本研究 commit）支持 `queued` / `dispatched` 的产品语义。
- `apps/docs/content/docs/daemon-runtimes.mdx` 支持“Server notify、Daemon periodic poll backstop”、Daemon / Runtime 角色与两层 concurrency。
- `CLI_AND_DAEMON.md` 和 `apps/docs/content/docs/environment-variables.mdx` 支持普通 poll 默认 `30s`、健康 WS safety-poll 上限 `3m`、downward jitter 与 Daemon concurrency 默认 `20`。

未发现会改变 M06 Contract 的 docs/source 冲突。一个必须保留的版本边界是：当前 commit 已使用单 machine-level batch poller 和 WS-first claim；旧资料中“一 Runtime 一 poller”不应写成当前实现。**`DOCS + SOURCE`**

## Experiment Record

未运行动态分布式实验。当前问题的通知顺序、fallback policy、slot acquisition、Agent row lock、task row lock、状态 predicate 与 generation CAS 均由固定 commit 的源码和已有测试源码直接建立；无需连接生产 Redis、PostgreSQL 或真实 Daemon。本地环境未安装 Go 工具链，因此没有把 Go test 执行结果列为实验或验证证据。**`SOURCE`**

限制：本文没有通过两个真实 API nodes / Daemons 的故障注入测量延迟、公平性或恢复耗时，因此不把调度延迟分布、锁饥饿概率或“恰好一次执行”作为实验事实。源码证明的是单代 claim ownership 和受约束恢复；外部 provider side effect 的 exactly-once 语义不在本章结论内。

## Evidence Boundaries and Unresolved Questions

### Verified boundary for M07

M06 使用“Runtime 必须 online / fresh、claim request 必须属于对应 Daemon”作为 eligibility evidence，但不解释 Runtime 怎样注册、heartbeat 怎样维持 freshness、断线怎样改变 online 状态。那些属于 M07。

### Verified boundary for M13

M06 解释 response 丢失时 `dispatched_at` generation 和 stale reclaim 如何避免旧代继续启动；不展开 dispatch timeout sweeper、Runtime offline settlement、terminal report replay、自动 retry 与 backoff。那些属于 M13。

### Remaining non-blocking questions

- Writer 是否在主图显示 EmptyClaim / ReclaimCheck 两个缓存，还是把它们放进“性能优化不拥有正确性”的旁注；实现证据已经具备。
- `FOR UPDATE SKIP LOCKED` 在高优先级持续到达时的长期公平性没有实验数据；源码只建立当前排序和并发 winner，不应承诺无饥饿。
- 产品文案可说“Runtime claims a run”，实现图应更精确地区分 machine Daemon 发请求、Server 为具体 Runtime 写 row、随后 Daemon 启动 task。

## Tutorial Implications

1. 从两个信封类比开场：门铃只告诉你可能有包裹，签收记录才决定谁拿到；随即明确类比边界。
2. 第一张顺序图固定分开 `insert → bump → wakeup` 与 `claim → dispatched`。
3. 第二张图画四种不同作用域的门：machine slot、Agent cap、per-target serialization、row winner。
4. 用“WS response 丢失”场景解释 generation，而不是在主线提前教授完整 recovery sweeper。
5. 明确 `dispatched ≠ running`，并把 `waiting_local_directory` 仍占 capacity 作为反直觉检查点。
6. Source Map 放附录；正文保留少量必要 symbol：`runBatchPoller`、`ClaimTasksForRuntimes`、`claimTask`、`ClaimAgentTask`、`LockAgentTaskStartClaim`。
