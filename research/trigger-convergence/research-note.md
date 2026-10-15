# 研究笔记：四类 Trigger 如何汇入执行主线

本文使用 `SOURCE`、`DOCS`、`EXPERIMENT`、`INFERENCE` 标注证据。这里的“四类”沿用官方产品 taxonomy：Issue 分配、评论 mention / 继续讨论、直接 Chat、Autopilot。它不是从数据库字段数量反推出来的分类。

## Research Question

Agent 为什么开始工作？四类显式 trigger 分别怎样解析目标、权限和上下文，怎样形成一次可由绑定 Runtime 领取的工作；它们在哪个边界汇合，又保留哪些不可抹平的差异？

## Upstream Baseline

- Repository：`multica-ai/multica`
- Commit：`52b26900c51f759b87707b4ea35fa9f141b83b52`
- Commit subject：`MUL-8012: fix(inbox): restrict notifications to current workspace recipients (#9242)`
- Commit time：2026-10-14T14:55:37+08:00
- Inspected state：managed checkout 的干净只读工作树；研究期间未修改、推送或向上游创建 PR。
- Research date：2026-10-15。

## Scope

### Included

- 官方四类 trigger 的产品语义与当前实现入口。
- 每类入口从行为到目标解析、准入、task 写入及 Runtime 通知的最短纵向路径。
- Issue-linked 与 issue-less 执行、触发来源字段和上下文锚点的差异。
- “四路汇合”能被源码支持的严格含义。

### Excluded

- `agent_task_queue` 的完整 schema、生命周期、retry / rerun 和产品 Run 映射；留给 M05。
- wakeup、polling、claim、数据库锁、并发槽和执行权竞争；留给 M06。
- Runtime heartbeat / liveness；留给 M07。
- Chat context assembly；留给 M09。
- comment coalescing / completion reconciliation 的完整恢复证明；留给 M13 / M14。
- Autopilot scheduler、webhook 验签、配额、failure monitor 与完整 automation 生命周期；留给 M17 / M18。

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: README.md
  symbol: "Get work to an agent"
  role: "官方仓库文档把 triggering-agents、assigning-issues 与 mentions 作为产品入口导航"
  evidence: DOCS
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/service/issue_trigger.go
  symbol: "(*IssueService).WillEnqueueRun"
  role: "统一判断 Issue create / assign / backlog promotion 是否产生 Agent 或 Squad leader run"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/handler/issue_trigger.go
  symbol: "(*Handler).dispatchIssueRun"
  role: "把已判定的 Issue trigger 路由到 Agent 或 Squad leader enqueue 方法"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/handler/comment.go
  symbol: "(*Handler).computeCommentAgentTriggers; triggerTasksForComment; resolveCommentTriggerEnqueue"
  role: "把 mention、thread parent、conversation continuation 与 assignee fallback 解析为实际执行 Agent，并处理合并 / 延后 / 新入队"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/service/task.go
  symbol: "(*TaskService).enqueueIssueTaskWithCommentPlan; enqueueMentionTaskWithCommentPlan"
  role: "Issue assignment 与 comment trigger 分别构造带来源字段的 issue-linked queued task"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/handler/chat.go
  symbol: "(*Handler).SendChatMessage"
  role: "直接 Chat 在权限与 readiness preflight 后交给 TaskService 原子保存用户 turn 与 task"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/service/task.go
  symbol: "(*TaskService).SendDirectChatMessage"
  role: "在事务中创建 issue_id 为 NULL、chat_session_id 有值的 task，并绑定该 turn 的输入消息"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/service/autopilot.go
  symbol: "(*AutopilotService).DispatchAutopilot; dispatchCreateIssue; dispatchRunOnly"
  role: "把 manual / schedule / webhook 等来源分派到 create-issue 或 run-only 两种执行模式"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/pkg/db/queries/agent.sql
  symbol: "CreateAgentTask"
  role: "Issue assignment 与 comment family 写入共同的 agent_task_queue，保留 issue / comment / squad / attribution 字段"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/pkg/db/queries/chat.sql
  symbol: "CreateChatTask"
  role: "直接 Chat 写入同一 agent_task_queue，但以 chat_session_id 而非 issue_id 锚定上下文"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/pkg/db/queries/autopilot.sql
  symbol: "CreateAutopilotRun; CreateAutopilotTask"
  role: "Autopilot 先保留 run/source，run-only 再创建以 autopilot_run_id 为锚点的 queued task"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "52b26900c51f759b87707b4ea35fa9f141b83b52"
  file: server/internal/service/task.go
  symbol: "(*TaskService).NotifyTaskEnqueued; notifyTaskAvailable; notifyRuntimeMayHaveWork"
  role: "所有成功的新 task 最终使空 claim cache 失效，并对其 runtime_id 发出 best-effort wakeup"
  evidence: SOURCE
```

## Behavior-first Paths

### 1. Issue 分配 / 激活

```text
CreateIssue / UpdateIssue / batch update
  → IssueService.WillEnqueueRun
    → create or assignee change on non-backlog
      OR fixed backlog → active status promotion
    → resolve direct Agent or Squad leader
  → Handler.dispatchIssueRun
  → EnqueueTaskForIssueWithHandoff
      OR EnqueueTaskForSquadLeaderWithHandoff
  → enqueueIssueTaskWithCommentPlan
      OR enqueueMentionTaskWithCommentPlan
  → CreateAgentTask(status=queued, issue_id, runtime_id, provenance...)
  → task:queued → NotifyTaskEnqueued(runtime_id)
```

`WillEnqueueRun` 是 Issue write 与 preview 共用的判定。固定 `backlog` 是停车场；创建 / 分配到 backlog 不启动，离开 backlog 到非终态可以启动。Agent 必须未归档且有 Runtime；Squad 解析到 leader。仅仅 runtime offline 不等于无 Runtime，服务允许工作先排队。**`SOURCE`**

### 2. 评论 mention / 继续讨论

```text
CreateComment
  → triggerTasksForComment
  → computeCommentAgentTriggers
    → explicit @agent
       OR @squad → leader
       OR reply to agent/thread conversation owner
       OR plain top-level assignee fallback
  → resolveCommentTriggerEnqueue
    → merge into queued task / defer behind active work / create fresh task
  → enqueueSingleCommentTrigger
  → EnqueueTaskForMention | EnqueueTaskForThreadParent
       | EnqueueTaskForIssue | EnqueueTaskForSquadLeader
  → CreateAgentTask(status=queued, issue_id, trigger_comment_id, ...)
  → task:queued → NotifyTaskEnqueued(runtime_id)
```

评论族不是只有 `@mention` 语法：显式 mention、reply、conversation continuation 与 assignee fallback 都先解析为实际执行 Agent；`/note` 则明确不触发。相同 `(issue, agent)` 已有待处理工作时，新评论可以被合并或登记为后继义务，而不是机械创建重复 task。**`SOURCE`**

### 3. 直接 Chat

```text
Handler.SendChatMessage
  → load active chat_session + agent
  → AgentReadiness + canInvokeAgent
  → TaskService.SendDirectChatMessage
  → transaction:
       lock/reload chat session + Agent
       CreateChatTask(status=queued, issue_id=NULL, chat_session_id)
       SetChatTaskInputOwnerSelf
       CreateChatMessage(task_id=task.id)
       bind attachments + touch session
  → commit
  → task:queued → NotifyTaskEnqueued(runtime_id)
```

Chat 的消息与 owning task 在同一事务中绑定，通知发生在 commit 之后。它与 Issue trigger 汇入同一 task queue / Runtime 边界，但没有 `issue_id`，上下文锚点是 `chat_session_id` 和该 task 自己拥有的输入 batch。**`SOURCE`**

### 4. Autopilot

```text
manual / schedule / webhook dispatch
  → AutopilotService.DispatchAutopilot* 
  → CreateAutopilotRun(source, trigger_id, payload, planned_at...)
  → execution_mode switch
    create_issue:
      → create Issue(origin_type=autopilot)
      → ordinary Agent/Squad issue enqueue path
      → CreateAgentTask(issue_id, ...)
    run_only:
      → dispatchRunOnly
      → CreateAutopilotTask(status=queued,
                            issue_id=NULL,
                            autopilot_run_id)
      → link task back to autopilot_run
  → NotifyTaskEnqueued(runtime_id)
```

Autopilot 是第四类产品 trigger，不是每个 schedule / webhook / manual 子来源各算一类。`create_issue` 复用 Issue 路径；`run_only` 直接写同一 queue，并以 `autopilot_run_id` 保留来源。两者都先有 `autopilot_run` 作为 automation 级记录。**`SOURCE + DOCS`**

## Convergence Model

```text
Issue assignment ─┐
Comment family ───┼─ target + admission + context/provenance
Direct Chat ──────┤        → agent_task_queue row
Autopilot ────────┘        → runtime_id-scoped queued work
                              → queue bookkeeping + best-effort wakeup
                              → [M06] poll / claim / ownership
                              → [M03/M08–M10] local execution
```

这个模型中，严格可证的共同边界有四项：

1. 每条被接纳的路径都确定实际 `agent_id` 与其 `runtime_id`；评论族还可能把新输入归并到该目标已有的 pending task。**`SOURCE`**
2. fresh enqueue 路径都在 `agent_task_queue` 形成新记录；即时执行以 `queued` 开始，少数媒体门控变体可先为 `deferred`。评论 coalescing / deferral 复用或安排后继义务，不要求每条评论各插一行。**`SOURCE`**
3. 新记录保留入口锚点：`issue_id` / `trigger_comment_id`、`chat_session_id` 或 `autopilot_run_id`，另有统一的 `trigger_evidence_kind/ref_id` 与 attribution 字段；合并评论另以 planned / coalesced ids 保留覆盖关系。**`SOURCE`**
4. fresh queued insert 最终都会直接或经 TaskService 调用 `NotifyTaskEnqueued`；该方法记录 queued telemetry，使 empty-claim cache 失效，并对目标 Runtime 发出 best-effort wakeup。Issue / comment / Chat 路径还显式广播 queued event；run-only Autopilot 不经同一个 broadcast helper。通知不是 claim，也不授予执行权。**`SOURCE`**

因此“汇流”是 **共同的 durable executable-record + Runtime notification 边界**，不是“同一 handler”“同一事务”“同一上下文”或“同一个 `CreateAgentTask` query”。**`SOURCE + INFERENCE`**

## Findings

### A. 四类是产品层 taxonomy

1. 官方文档 `How Multica works` 明列 assigning an issue、@-mention in comment、direct chat、Autopilot 四类；`Put agents to work` 同样以四行表解释用途。**`DOCS`**
2. Comment reply / continuation 是 comment family 内的自动路由；status promotion 是 Issue assignment family 的恢复启动条件；schedule / webhook / manual 是 Autopilot 子来源。它们不需要扩成第五、六类。**`DOCS + SOURCE + INFERENCE`**
3. Agent 没有成员 inbox；mention 对 Agent 是执行 trigger，不是通知。**`DOCS`**

### B. 入口先分流，之后才汇合

1. Issue path 用 post-write Issue shape 和状态变化判断是否入队；Comment path 从内容、thread 与 conversation owner 解析目标；Chat path 以 session / sender message 为原子输入；Autopilot path 先产生 automation run 再选择 execution mode。**`SOURCE`**
2. 四类共享 Agent readiness / invocation 的概念，但检查位置与结果表达不同。不能画成所有入口先调用一个统一 `TriggerAgent()`。**`SOURCE`**
3. Squad 可出现在 Issue、Comment、Autopilot 中，但真正 task 的 `agent_id` 是 leader，task 另存 `squad_id` / `is_leader_task` 以保留执行上下文。**`SOURCE`**

### C. 同一 queue 不抹平来源

1. Issue / Comment 用 `CreateAgentTask`，Chat 用 `CreateChatTask`，run-only Autopilot 用 `CreateAutopilotTask`；三条 SQL 都写 `agent_task_queue`。**`SOURCE`**
2. Issue / Comment 行通常有 `issue_id`；Comment 还写 `trigger_comment_id` 与 coalesced comment ids。Chat 和 run-only Autopilot 的 `issue_id` 为 NULL，分别写 `chat_session_id` 与 `autopilot_run_id`。**`SOURCE`**
3. `originator_source`、`trigger_evidence_kind` / `ref_id`、accountable / originator identity 让 downstream 不必从空值或 UI 猜触发来源。**`SOURCE`**
4. 这些差异说明“一种 Run”可以有多种来源锚点；M05 应进一步解释 durable task，而不是在 M04 展开所有列。**`SOURCE + INFERENCE`**

### D. “开始工作”不是单一瞬间

1. 产品动作先通过路由 / 准入；随后 task 才被持久化为 queued（或特定媒体门控下 deferred）；再通知 Runtime；最后由 M06 研究的 claim 交付执行权。**`SOURCE`**
2. Runtime 暂时 offline 时，普通 Agent 触发仍可排队；无 Runtime、Agent archived、权限不允许或 triage / backlog gate 则可能不产生立即可执行 task。**`SOURCE`**
3. 所以教程应把“Agent 开始工作”拆成：**触发产生意图 → Server 接纳并记录 → Runtime 获得执行权 → Coding Agent 进程真正运行**。本章回答前两段并指出边界，后两段交给 M06 与本地执行章节。**`SOURCE + INFERENCE`**

### E. 评论与自动化的内部复杂度不能吞掉本章

1. 评论路径包含 preview、权限、explicit mention、thread / conversation routing、pending coalescing、running-task steering 与 completion reconciliation。M04 只需证明这些子机制最后解析为目标 Agent 和 task obligation。**`SOURCE`（范围限制）**
2. Autopilot 包含 manual / schedule / webhook / API、create-issue / run-only、幂等、quota 与 crash repair。M04 只需解释它作为一类系统 trigger 的两种下游模式；完整 automation 留给 M17。**`SOURCE`（范围限制）**

## Evidence Table

| Claim | Label | Primary evidence | Limitation |
| --- | --- | --- | --- |
| 产品定义四类 trigger | `DOCS` | `triggering-agents`; `how-multica-works`; `tasks` | 文档 taxonomy 不代替实现路径 |
| Issue create / assign / promotion 可触发 Agent 或 Squad leader | `SOURCE` | `WillEnqueueRun`; `dispatchIssueRun` | backlog / triage / access 等 gate 会拒绝 |
| mention、reply、conversation、assignee fallback 属于 comment family | `SOURCE + DOCS` | comment trigger resolver；mention docs | 完整 coalescing 恢复不在本章证明 |
| 直接 Chat 原子写 task + message | `SOURCE` | `SendChatMessage`; `SendDirectChatMessage`; `CreateChatTask` | channel chat 还有 media/debounce 变体 |
| Autopilot 有 create-issue 与 run-only 两条下游路径 | `SOURCE + DOCS` | `dispatchCreateIssue`; `dispatchRunOnly`; autopilot docs | scheduler/webhook 细节留给 M17 |
| 四类 fresh enqueue 最终写入 `agent_task_queue` | `SOURCE` | 三个 create query + issue enqueue path | 评论可 coalesce；也不是同一个 insert helper |
| task 保留不同来源锚点与 provenance | `SOURCE` | queue model / insert params | M05 再解释完整 durable model |
| enqueue 后按 `runtime_id` 发 wakeup | `SOURCE` | `NotifyTaskEnqueued`; `notifyRuntimeMayHaveWork` | wakeup 不等于 claim；留给 M06 |

## Documentation Sources and Differences

- [Put agents to work](https://multica.ai/docs/triggering-agents)：定义四类触发与共同权限 / backlog 规则。**`DOCS`**
- [How Multica works](https://multica.ai/docs/how-multica-works)：说明四类 trigger 最终创建 run，并由 Runtime claim。**`DOCS`**
- [@-mention agents in comments](https://multica.ai/docs/mentioning-agents)：说明 assignment 与 mention 的责任差异、plain reply 自动路由及 coalescing。**`DOCS`**
- [Runs](https://multica.ai/docs/tasks)：说明不同入口提供不同 context，但执行侧遵循 create run → Runtime claim → invoke tool。**`DOCS`**
- [Autopilots](https://multica.ai/docs/autopilots)：说明 trigger 可为 schedule / webhook / manual，execution mode 可 create issue 或 run only。**`DOCS`**

文档与固定提交没有发现直接冲突，但存在三处抽象压缩：

1. 文档把 comment mention 作为产品入口名；源码同一 family 还覆盖 reply、conversation continuation 与 assignee fallback。**`DOCS + SOURCE`**
2. 文档说“每个 trigger 创建一个 run”；源码层可能把连续评论 coalesce 到待处理 task，或把义务延后到 successor，因此教程应把产品 run 语义与 insert 数量区别开。**`DOCS + SOURCE`**
3. 文档把四类说成共享执行规则；源码确认共同 queue / Runtime 出口，但并不共享单一入口函数或完全一致的事务。**`DOCS + SOURCE`**

## Experiments

未运行端到端实验。静态源码已经能区分四类入口、三个 insert query、来源字段与共同 Runtime notify；真实触发实验需要 workspace、Agent、Runtime、Autopilot 与 webhook / schedule 条件，不会为本章核心分类增加必要证据。

完成的只读定位检查不计为 `EXPERIMENT`：

```text
scope: multica-ai/multica@52b26900c51f759b87707b4ea35fa9f141b83b52
path: product action → handler/service → queue insert → runtime notify
result: four product trigger families verified; three queue insert shapes;
        common agent_task_queue + runtime_id wakeup boundary verified
```

## Evidence Boundaries and Open Questions

1. M04 不证明 queue 的事务持久性、所有状态转换或 product Run 与 task 的全部映射；M05 必须独立研究。
2. M04 不证明 wakeup 必达、polling fallback、claim fairness、exactly-once execution 或并发上限；M06 必须独立研究。
3. 评论 completion reconciliation 与 steering 分支很多；本研究确认路由与新 / 合并义务的存在，没有把每个 race / recovery path 形式化验证。
4. Channel-backed Chat 复用 `CreateChatTask` 但增加 debounce、media gate 与 delivery snapshot；教程主线应以 direct Chat 为代表，并注明变体存在。
5. Autopilot schedule / webhook 的 admission principal、签名、quota、crash repair 与 idempotency 不属于本章；不可把“自动触发”简化为 cron 直接调用 Agent。
6. `trigger_evidence_kind` 是开放文本并可扩展；本章只能列出固定提交中验证的代表来源，不能宣称穷尽未来 trigger。
7. 同一 Agent / Issue 上的 pending dedup 与 comment coalescing 会影响“一个动作对应几个 task”；教程不能承诺严格一触发一行。

## Editorial / Architecture Findings

1. **Reader Question、Part 与 M04/M05/M06 边界与源码相容，`editorial_escalation: none`。**
2. “四类”应严格写为 Issue assignment、comment mention / continuation、direct Chat、Autopilot；不要把 reply、status promotion、schedule 或 webhook 平铺为额外同级类别。
3. 核心教学句应为：“入口不同，先各自完成路由与准入；成功后形成同类可执行记录，并从 Runtime 通知边界进入共同主线。”
4. 必须紧跟限制：“同类记录不表示同一入口函数或同一 context；来源锚点仍被保存。”
5. 章节终点停在 queued task + Runtime wakeup；claim / ownership 是 M06 的下一层，不在 M04 提前解释。

## Tutorial Implications

- 开场用反例：“Agent 不是一直在线读 inbox；必须有显式 action 形成一次执行。”
- 第一张 `TEACHING` 图画四个入口，分别标记 Issue、Comment、Chat session、Autopilot run 的上下文锚点，再汇到 queued work / target Runtime；不要虚构统一 `TriggerAgent()`。
- 用一张对比表解释每类最佳用途、目标解析、是否需要 Issue、主要 provenance 与代表 enqueue path。
- Comment family 只用一个小例子解释 mention 与 reply continuation；复杂 coalescing 作为边界说明。
- Autopilot 同一框内分 create-issue 与 run-only，强调两条路最终都进入 queue，但只有前者产生 Issue。
- 用四阶段语言校正“开始”：触发 → 接纳 / 持久化 → claim → 本地进程；本章高亮前两段。
- Source appendix 导航到 `WillEnqueueRun`、comment resolver、`SendDirectChatMessage`、`dispatchCreateIssue` / `dispatchRunOnly`、三个 create query 与 `NotifyTaskEnqueued`。
