# Research Note: Issue Assignment to Local Coding-Agent Execution

Use evidence labels from `SOURCE`, `DOCS`, `EXPERIMENT`, and `INFERENCE` throughout this note. Combined labels are written explicitly where appropriate.

## Research Question

When a Multica Issue is assigned to an Agent and execution is started, how does that action become durable, claimable work on a connected runtime, how does the local daemon prepare and launch the configured Coding Agent, and where do progress and final results begin flowing back to the server?

## Upstream Baseline

- Repository: `multica-ai/multica`
- Commit: `b4ca5b4a23e68b26292a680dca7689a952bb1cd5`
- Checked out state or relevant environment: clean managed checkout at the full commit above; source was inspected read-only on 2026-10-06, with the claim/capacity path rechecked on 2026-10-08. No upstream files, branches, or remotes were modified.

## Scope

### Included

- Direct assignment of an existing Issue to an Agent through the canonical issue update API.
- The decision to start or suppress a run after assignment.
- Persistence and core lifecycle of the internal `agent_task_queue` record.
- Runtime binding, best-effort daemon notification, WebSocket-first claim with HTTP/polling fallback, runtime heartbeat/freshness gates, and atomic claim.
- Local daemon capacity admission, local-directory handling, execution-environment preparation, task start acknowledgement, provider resolution, and the concrete Codex launch path.
- The first progress/message and terminal-result handoff back to the server.
- Official documentation used to compare product terminology with implementation terminology.

### Excluded

- Squad leader/member routing beyond identifying the branch at `dispatchIssueRun`.
- Mention, chat, quick-create, wakeup, and Autopilot trigger details.
- Skill and MCP materialization internals.
- Complete realtime client fanout and UI cache behavior.
- Full retry, timeout, cancellation, stale-claim recovery, provider-specific session, and failure-classification semantics.
- Provider implementations other than following the concrete Codex boundary far enough to verify process launch.

## Source Map

```yaml
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/cmd/server/router.go
  symbol: chi routes /api/issues/{id} and /api/daemon
  role: "Maps PUT /api/issues/{id} to Handler.UpdateIssue and exposes daemon claim, start, progress, messages, complete, and fail endpoints"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/handler/issue.go
  symbol: (*Handler).UpdateIssue
  role: "Persists the assignee update, computes assigneeChanged, asks WillEnqueueRun, and dispatches the resulting run unless suppress_run is set"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/issue_trigger.go
  symbol: (*IssueService).WillEnqueueRun
  role: "Canonical trigger predicate for assignment and backlog-exit writes; resolves the target Agent and runtime readiness"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/handler/issue_trigger.go
  symbol: (*Handler).dispatchIssueRun
  role: "Routes a direct Agent trigger to EnqueueTaskForIssueWithHandoff and a Squad trigger to the leader path"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/task.go
  symbol: (*TaskService).enqueueIssueTaskWithCommentPlan
  role: "Resolves Agent runtime/attribution, creates the task row, broadcasts task:queued, and notifies the bound runtime"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/pkg/db/queries/agent.sql
  symbol: CreateAgentTask
  role: "Inserts the durable agent_task_queue row with status queued and persisted agent_id, runtime_id, issue_id, priority, attribution, and context fields"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/task.go
  symbol: (*TaskService).notifyRuntimeMayHaveWork
  role: "Invalidates the empty-claim cache before issuing a best-effort task-available wakeup for the persisted runtime"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemonws/hub.go
  symbol: (*Hub).NotifyTaskAvailable
  role: "Pushes daemon:task_available to connections watching the target runtime; notification is explicitly best-effort"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemon/daemon.go
  symbol: (*Daemon).pollLoop and (*Daemon).runBatchPoller
  role: "Consumes task wakeups and runtime-set changes, reserves daemon-local execution slots before sending a claim request, releases every unused slot after an empty or partial response, periodically safety-polls, and hands claimed tasks to handleTask"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemon/wsrpc.go
  symbol: (*Daemon).claimTasksWSFirst
  role: "Uses tasks.claim over negotiated daemon WebSocket RPC first, falls back to POST /api/daemon/tasks/claim, and retains a legacy per-runtime fallback"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/task.go
  symbol: (*TaskService).ClaimTasksForRuntimes and (*TaskService).claimTask
  role: "Routes batch candidates through the runtime-scoped claim helper; claimTask locks the Agent row, checks runtime binding and CountRunningTasks against agent.MaxConcurrentTasks, then invokes ClaimAgentTask"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/pkg/db/queries/agent.sql
  symbol: ClaimAgentTask
  role: "Selects and locks one eligible queued row with runtime binding, online, heartbeat-freshness, wakeup, and serialization predicates, then atomically changes it to dispatched; it does not enforce the Agent concurrency limit"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemon/daemon.go
  symbol: (*Daemon).handleTask and (*Daemon).runTask
  role: "Routes a claimed task to its local runtime provider, guards local paths, prepares/reuses the work environment, acknowledges task start, builds context, and invokes the provider backend"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemon/execenv/execenv.go
  symbol: Prepare
  role: "Materializes the task execution environment and work directory used by the Coding Agent"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/task.go
  symbol: (*TaskService).StartTaskForClaim and (*TaskService).taskStarted
  role: "Fences the claim generation, changes dispatched or waiting_local_directory to running, and emits the running lifecycle event"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/pkg/agent/agent.go
  symbol: Backend, New, and ExecOptions
  role: "Defines the common provider execution boundary and maps a protocol family to a concrete backend"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/pkg/agent/builtin_runtimes.go
  symbol: ResolveBackend
  role: "Resolves a built-in runtime identity or protocol family to the common provider backend"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/pkg/agent/codex.go
  symbol: codexBackend.Execute, codexBackend.executeOnce, and buildCodexArgs
  role: "Concrete Codex implementation that starts codex app-server --listen stdio:// and communicates over JSON-RPC on stdin/stdout"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/daemon/daemon.go
  symbol: (*Daemon).executeAndDrain and (*Daemon).reportTaskResult
  role: "Streams provider messages to the server and sends the durable completed/failed disposition"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/handler/daemon.go
  symbol: (*Handler).ReportTaskMessages, (*Handler).CompleteTask, and (*Handler).FailTask
  role: "Persists daemon-reported transcript batches and invokes terminal task transitions"
  evidence: SOURCE
- repository: multica-ai/multica
  commit: "b4ca5b4a23e68b26292a680dca7689a952bb1cd5"
  file: server/internal/service/task.go
  symbol: (*TaskService).CompleteTaskWithTransition and (*TaskService).FailTaskWithTransition
  role: "Performs idempotent terminal state writes and publishes completed/failed lifecycle events"
  evidence: SOURCE
```

## Execution / Call Chain

```text
PUT /api/issues/{id}
  [SOURCE: router.go → Handler.UpdateIssue]
→ persist assignee fields; calculate assigneeChanged
  [SOURCE: Handler.UpdateIssue]
→ IssueService.WillEnqueueRun
  [SOURCE: direct Agent, not triage/backlog, has a bound non-archived runtime, access/self-loop gates pass]
→ Handler.dispatchIssueRun
  [SOURCE]
→ TaskService.EnqueueTaskForIssueWithHandoff → enqueueIssueTaskWithCommentPlan
  [SOURCE]
→ CreateAgentTask inserts agent_task_queue(status='queued', agent_id, runtime_id, issue_id, ...)
  [SOURCE]
→ publish task:queued → EmptyClaim.Bump → daemonws.NotifyTaskAvailable(runtime_id, task_id)
  [SOURCE: notification is best-effort acceleration]
→ daemon taskWakeupLoop/pollLoop → runBatchPoller
  [SOURCE: wakeup-triggered and periodic safety polling]
→ reserve one or more daemon-local execution slots from sem
  [SOURCE: local slot reservation precedes the claim request]
→ claimTasksWSFirst → WS RPC tasks.claim, else POST /api/daemon/tasks/claim
  [SOURCE]
→ Handler.ClaimTasksByRuntime → TaskService.ClaimTasksForRuntimes → claimTask
  [SOURCE: lock Agent row; validate runtime binding; CountRunningTasks vs agent.MaxConcurrentTasks]
→ ClaimAgentTask atomically queued → dispatched
  [SOURCE: database candidate predicates, row locking, serialization, and state transition]
→ daemon handleTask → runTask → execenv.Prepare/Reuse
  [SOURCE]
→ POST /api/daemon/tasks/{taskId}/start → StartTaskForClaim
  [SOURCE: dispatched|waiting_local_directory → running]
→ agent.ResolveBackend(provider, Config) → agent.Backend.Execute
  [SOURCE]
→ Codex: codexBackend.Execute → executeOnce → spawn `codex app-server --listen stdio://`
  [SOURCE]
→ daemon executeAndDrain → POST .../messages (and .../progress)
  [SOURCE]
→ daemon reportTaskResult → POST .../complete or .../fail
  [SOURCE]
→ CompleteTaskWithTransition / FailTaskWithTransition → completed or failed + realtime lifecycle event
  [SOURCE]
```

## Findings

### A. Entry point and trigger decision

1. **The canonical server entry for assigning an existing issue is `PUT /api/issues/{id}` handled by `(*Handler).UpdateIssue`.** The handler parses paired `assignee_type`/`assignee_id`, validates the target and invocation permission, persists the updated issue, computes `assigneeChanged`, then calls the shared `IssueService.WillEnqueueRun` predicate. `suppress_run` (used by “assign without starting”/`--no-start`) prevents the enqueue after the ownership write. **`SOURCE`**

2. **Assignment is not synonymous with execution in every state.** `WillEnqueueRun` rejects missing assignees, triage entries, the fixed `backlog` status, agents without a runtime, archived agents, access failures, and some self-loop/pending cases. Direct assignment to an eligible Agent returns an `IssueRunTrigger` with source `assign`. Moving an already assigned issue out of `backlog` is a separate supported trigger. **`SOURCE`**

3. **The frontend confirmation dialog is not required to understand the durable execution boundary.** Official documentation describes “Assignee → Start,” while source establishes the authoritative backend path above. **`DOCS + SOURCE`**

### B. Internal execution representation and initial persistence

1. **The implementation object behind the product term Run is `db.AgentTaskQueue`, persisted in the `agent_task_queue` table.** The official developer architecture explicitly says product “Run” corresponds to internal `TaskService`/`task_id` terminology. **`SOURCE + DOCS`**

2. **A normal assignment creates a new row in status `queued`.** `enqueueIssueTaskWithCommentPlan` resolves the assigned Agent, copies its current `runtime_id`, builds attribution and optional runtime MCP overlay fields, and calls SQL `CreateAgentTask`. Important persisted fields include `id`, `agent_id`, `runtime_id`, `issue_id`, `status`, `priority`, trigger/attribution fields, and creation time. **`SOURCE`**

3. **The runtime is bound at enqueue time rather than selected dynamically by an arbitrary worker.** The row stores the assigned Agent’s `runtime_id`; later claim SQL also verifies the Agent is still bound to that runtime. Official docs state that a queued run does not move to another machine. **`SOURCE + DOCS`**

4. **Offline does not necessarily prevent enqueue.** The assignment readiness path blocks unusable configuration but explicitly allows a merely offline machine to queue. Actual claim requires the runtime row to be `online` with a fresh heartbeat timestamp. **`SOURCE`**

5. **Normal direct assignment is immediately `queued`; `deferred` is not on this ordinary path.** Deferred rows are used by scheduled/media-gated paths and later promoted to queued. **`SOURCE`**

### C. Runtime notification, polling, heartbeat, and claim

1. **Notification and polling are complementary, not competing queue transports.** After the durable insert and queued event, `NotifyTaskEnqueued` first invalidates the runtime’s empty-claim cache, then calls `NotifyTaskAvailable`. `daemonws.Hub.NotifyTaskAvailable` sends a best-effort `daemon:task_available` wakeup to daemons watching that runtime. The notification contains a hint; it does not transfer ownership of the row. **`SOURCE`**

2. **The daemon still claims from server state.** A wakeup nudges `pollLoop`; the same loop also wakes on runtime-set changes and periodically polls as a missed-event safety net. With negotiated RPC support, `claimTasksWSFirst` calls `tasks.claim` over the existing daemon WebSocket. It falls back to `POST /api/daemon/tasks/claim` on safe transport/server failures, with a legacy per-runtime HTTP route for old servers. **`SOURCE`**

3. **Daemon local execution capacity is reserved before the claim request.** On the inspected `runBatchPoller` path, receiving indices from the local `sem` reserves one or more daemon-wide task slots, bounded by `d.cfg.MaxConcurrentTasks`; only afterward does the daemon call `claimTasksWSFirst` with `len(slots)` as the maximum requested row count. This local admission step prevents this daemon from claiming more work than it has local execution slots for. If the server returns no tasks, `dispatched` remains zero and `releaseSlots(slots[dispatched:])` returns every reserved slot to `sem`; a partial response similarly releases only the unused tail. This is a daemon-local mechanism, not the Server-side per-Agent concurrency limit. **`SOURCE`**

4. **Server-side Agent concurrency is enforced in `(*TaskService).claimTask`, before the SQL claim.** Inside one service transaction, `GetAgentForClaimUpdate` locks the Agent row, the method resolves and validates the runtime binding, and `CountRunningTasks` counts that Agent's `dispatched`, `running`, and `waiting_local_directory` rows. If the count is at least `agent.MaxConcurrentTasks`, `claimTask` returns without invoking `ClaimAgentTask`; otherwise it calls `ClaimAgentTask`. This per-Agent limit is distinct from the daemon-wide local semaphore. **`SOURCE`**

5. **`ClaimAgentTask` owns database candidate eligibility, locking, serialization, and the atomic state transition—not the Agent concurrency limit.** Its candidate query requires `queued`, matching `agent_id` and persisted `runtime_id`, a still-current Agent→runtime binding, an online runtime with fresh `last_seen_at`/`updated_at`, a valid wakeup revision when applicable, and no conflicting active row under its per-(issue, agent), chat-session, or quick-create serialization rules. `FOR UPDATE SKIP LOCKED` locks the selected candidate without waiting on an already locked candidate; the outer `UPDATE` writes `status='dispatched'`, `dispatched_at`, and the prepare lease atomically. No predicate in this SQL compares active task count with `agent.max_concurrent_tasks`. **`SOURCE`**

The claim path therefore has three separate admission layers:

| Layer | Enforced by | Verified responsibility |
| --- | --- | --- |
| Daemon local capacity | `server/internal/daemon/daemon.go`, `(*Daemon).runBatchPoller` | Reserve local `sem` slots before sending a claim request; release slots not paired with returned tasks |
| Server-side Agent concurrency | `server/internal/service/task.go`, `(*TaskService).claimTask` | Lock the Agent row; compare `CountRunningTasks` with `agent.MaxConcurrentTasks`; only then call the SQL claim |
| Database claim eligibility and ownership transition | `server/pkg/db/queries/agent.sql`, `ClaimAgentTask` | Filter an eligible queued candidate, apply row locking and serialization predicates, and atomically write `queued → dispatched` |

6. **Heartbeat freshness participates directly in database claim eligibility.** `ClaimAgentTask` requires a fresh runtime record, while docs describe regular daemon heartbeats and periodic polling as the recovery/backstop mechanism. **`SOURCE + DOCS`**

### D. Daemon-side preparation and start transition

1. **Claimed tasks are routed locally by `Task.RuntimeID`.** `handleTask` verifies that this daemon still tracks the runtime and reads the provider from its runtime registry. An untracked runtime is failed back rather than executed with an empty/incorrect provider. **`SOURCE`**

2. **Local-directory contention can add an intermediate state.** For an in-place `local_directory`, the daemon may call `MarkTaskWaitingLocalDirectory`, producing `dispatched → waiting_local_directory`; it returns to the normal start path after acquiring the local path lock. Worktree mode instead creates an isolated worktree and does not hold the in-place path mutex for the full run. **`SOURCE`**

3. **The work environment exists before the task becomes `running`.** `runTask` uses `execenv.Prepare` or reuse logic to resolve/materialize the environment, repositories/worktree, provider-specific task state, runtime brief, skills/context sidecars, and work directory. Only after preparation does the daemon call `POST /api/daemon/tasks/{taskId}/start`. **`SOURCE`**

4. **Start is generation-fenced.** Current daemons send the claimed `runtime_id` and `dispatched_at`; `StartTaskForClaim` locks that exact claim generation and transitions `dispatched` or `waiting_local_directory` to `running`. A stale delivery is rejected rather than launching against a newer owner. **`SOURCE`**

5. **The daemon injects task-scoped identity and control data into the local process environment.** The inspected path sets a task token plus task, Agent, Workspace, server, daemon, slot, and temporary-directory context before provider launch. Official docs classify five core variables (`MULTICA_TOKEN`, `MULTICA_TASK_ID`, `MULTICA_AGENT_ID`, `MULTICA_WORKSPACE_ID`, `MULTICA_SERVER_URL`) as the integration contract. **`SOURCE + DOCS`**

### E. Provider boundary and concrete Codex launch

1. **`agent.Backend` is the main provider abstraction.** It exposes `Execute(context.Context, prompt, ExecOptions) (*Session, error)`. `runTask` calls `agent.ResolveBackend(provider, agent.Config{...})`, which resolves a built-in runtime identity through `NewRuntime` or a protocol family through `New`. **`SOURCE`**

2. **The configured provider comes from the claimed runtime, not from the issue.** `handleTask` looks up `RuntimeID` in the daemon’s runtime registry and passes that entry’s `Provider` to `runTask`. Custom runtime profiles may override executable path/fixed arguments while retaining a supported protocol family. **`SOURCE`**

3. **`runTask` is the crossing point from Multica orchestration to provider code.** After selecting model/options and building the prompt and environment, it calls `executeAndDrain`, which calls `backend.Execute`. **`SOURCE`**

4. **For Codex, `agent.New("codex", ...)` returns `*codexBackend`.** `codexBackend.Execute` enters `executeOnce`; `buildCodexArgs` fixes the protocol command to `app-server --listen stdio://`, and `executeOnce` resolves the executable (default `codex`), creates an owned process, starts it, and communicates over JSON-RPC 2.0 through stdin/stdout. **`SOURCE`**

### F. Verified state transitions

The primary normal assignment path is:

```text
∅ → queued → dispatched → running → completed | failed
```

- `∅ → queued`: `CreateAgentTask` insert. **`SOURCE`**
- `queued → dispatched`: `ClaimAgentTask` atomic claim. **`SOURCE`**
- `dispatched → running`: `StartAgentTask`/`StartTaskForClaim`, after local preparation. **`SOURCE`**
- `running → completed`: `CompleteAgentTask` inside `CompleteTaskWithTransition`. **`SOURCE`**
- `running → failed`: `FailAgentTask` inside `FailTaskWithTransition`. **`SOURCE`**

Verified optional branches in scope:

```text
dispatched → waiting_local_directory → running
running/queued/dispatched/waiting_local_directory/deferred → cancelled (explicit stop paths)
```

`deferred → queued` exists for scheduled/media-gated paths but is not the normal direct-assignment transition. The complete active/terminal/retry graph is intentionally left for a later investigation. **`SOURCE`**

The task lifecycle is separate from Issue status. Completion does not automatically set the Issue to `in_review` or `done`; the Coding Agent is instructed to update the Issue through the CLI when its work changes the Issue state. **`SOURCE + DOCS`**

### G. Progress and result handoff

1. **Provider messages begin flowing back while the run is active.** `executeAndDrain` drains `agent.Session.Messages`, batches transcript records on a 500 ms ticker (and first-visible flush), and calls `POST /api/daemon/tasks/{taskId}/messages`. `Handler.ReportTaskMessages` redacts/sanitizes, persists a batch, and publishes task-message events for issue/chat-backed tasks. **`SOURCE`**

2. **Coarse progress uses a separate endpoint.** The daemon calls `POST .../progress`; the server broadcasts progress through `TaskService.ReportProgress`. **`SOURCE`**

3. **Terminal results use durable callbacks.** `reportTaskResult` routes only an explicit `completed` result to `/complete`; other outcomes go to `/fail` with a classified reason. The daemon persists/retries terminal reports locally before giving up, and server handlers perform idempotent terminal transactions. **`SOURCE`**

4. **The server publishes lifecycle events after committed transitions.** Completion and failure services reconcile Agent status and publish `task:completed` or `task:failed`; completion may also synthesize an Agent comment when an issue run produced output but posted no comment itself. This is the verified handoff point for a future realtime/event-system investigation. **`SOURCE`**

## Evidence Table

| Claim | Label | Evidence | Limitations |
| --- | --- | --- | --- |
| Existing-Issue assignment enters through `PUT /api/issues/{id}` | `SOURCE` | `server/cmd/server/router.go`, `/api/issues/{id}` route; `server/internal/handler/issue.go`, `(*Handler).UpdateIssue` | Other creation/batch/CLI routes converge differently before the shared trigger logic |
| Assignment starts a run only when the canonical trigger predicate admits it | `SOURCE` | `server/internal/service/issue_trigger.go`, `(*IssueService).WillEnqueueRun`; `server/internal/handler/issue.go`, call site | Readiness/access helpers have additional details not exhaustively enumerated here |
| The internal Run record is `agent_task_queue` / `db.AgentTaskQueue` | `SOURCE + DOCS` | `server/pkg/db/generated/models.go`, `AgentTaskQueue`; `apps/docs/content/docs/developers/architecture.zh.mdx`, product Run vs internal task terminology | Generated struct reflects current schema but not historical migrations by itself |
| Direct assignment persists `queued` with a specific runtime binding | `SOURCE` | `server/internal/service/task.go`, `enqueueIssueTaskWithCommentPlan`; `server/pkg/db/queries/agent.sql`, `CreateAgentTask` | Squad and non-issue task shapes differ |
| Notification is best-effort; claim/polling preserves liveness | `SOURCE + DOCS` | `server/internal/service/task.go`, `notifyRuntimeMayHaveWork`; `server/internal/daemonws/hub.go`, `NotifyTaskAvailable`; `server/internal/daemon/daemon.go`, `runBatchPoller`; daemon runtime docs | This note does not quantify loss/reconnect timing experimentally |
| WebSocket notification is not the claim itself | `SOURCE` | Wakeup path only nudges poller; `ClaimAgentTask` performs `queued → dispatched` | Terminology can be confused because WS also supports the separate `tasks.claim` RPC |
| Claims are WS-RPC first, HTTP fallback, with periodic safety polling | `SOURCE` | `server/internal/daemon/wsrpc.go`, `claimTasksWSFirst`; `server/internal/daemon/client.go`, `claimTasksWithHints`; `server/internal/daemon/daemon.go`, `taskClaimPollInterval` | Legacy-server compatibility details are summarized only |
| Daemon local slots are reserved before claim and unused slots are released after an empty or partial response | `SOURCE` | `server/internal/daemon/daemon.go`, `(*Daemon).runBatchPoller`, `waitForTaskSlot`, `drainAvailableSlots`, and `releaseSlots` | Verified for the current machine-level batch poller path; not asserted as a universal property of every historical or alternate claim path |
| Agent concurrency is checked in the Server service before SQL claim | `SOURCE` | `server/internal/service/task.go`, `(*TaskService).claimTask`; `server/pkg/db/queries/agent.sql`, `GetAgentForClaimUpdate` and `CountRunningTasks` | This is the per-Agent `agent.MaxConcurrentTasks` limit, not daemon-local execution capacity |
| SQL claim requires queued state, binding, online/fresh runtime, wakeup validity when applicable, and serialization eligibility | `SOURCE` | `server/pkg/db/queries/agent.sql`, `ClaimAgentTask` | `ClaimAgentTask` does not enforce the Agent concurrency limit; full recovery and timeout rules remain excluded |
| Environment preparation precedes `running` | `SOURCE` | `server/internal/daemon/daemon.go`, `runTask`; `server/internal/daemon/execenv/execenv.go`, `Prepare`; `server/internal/service/task.go`, `StartTaskForClaim` | Preparation internals are summarized rather than individually traced |
| `agent.Backend` is the provider execution abstraction | `SOURCE` | `server/pkg/agent/agent.go`, `Backend`, `New`; `server/internal/daemon/daemon.go`, `agent.ResolveBackend` call | Some built-in runtime identities resolve through `NewRuntime` rather than `New` directly |
| Codex launches `codex app-server --listen stdio://` | `SOURCE` | `server/pkg/agent/codex.go`, `codexBackend`, `buildCodexArgs`, `Execute`, `executeOnce` | Codex protocol/session behavior beyond process entry is excluded |
| Messages and terminal results return through daemon task endpoints | `SOURCE` | `server/internal/daemon/daemon.go`, `executeAndDrain`, `reportTaskResult`; `server/internal/handler/daemon.go`, message/complete/fail handlers | Full realtime/UI fanout is future scope |
| Run status does not automatically determine Issue status | `SOURCE + DOCS` | `TaskService.CompleteTask` comment and behavior; `apps/docs/content/docs/assigning-issues.mdx` | Agent-authored Issue status policy is prompt/workflow behavior, not a DB trigger |

## Experiments

No runtime experiment was necessary. Static source inspection closed the requested chain through explicit routes, service calls, SQL state transitions, daemon scheduling, provider construction, OS process launch, and result callbacks. Running a real Coding Agent smoke test would require local provider credentials and would add little evidence for these already explicit boundaries; it was therefore not performed.

## Documentation Differences

1. **Terminology, not a behavioral conflict.** Product documentation consistently calls one execution a **Run**; source names the durable object `agent_task_queue`, the Go model `AgentTaskQueue`, and services/endpoints “task.” The official developer architecture explicitly documents this compatibility terminology. **`DOCS + SOURCE`**

2. **The high-level seven-step developer architecture matches the inspected source.** It says `TaskService` creates queued work, notifies the runtime, the daemon claims via daemon API, receives task credentials, prepares a directory, calls the provider backend, uploads messages/results, and the server broadcasts changes. The implementation adds material details omitted from docs: WebSocket-RPC-first claim, empty-claim cache invalidation order, slot-before-claim, heartbeat predicates, claim-generation fencing, and the optional `waiting_local_directory` state. **`DOCS + SOURCE`**

3. **“Server notifies; daemon also polls” is accurate but compressed.** Source distinguishes a best-effort `daemon:task_available` wakeup from the claim transport. A healthy daemon may execute `tasks.claim` as a WebSocket RPC; HTTP is a fallback, and periodic polling is the missed-event safety net. The docs do not incorrectly claim that the notification itself carries ownership. **`DOCS + SOURCE`**

4. **No source/documentation contradiction was found in the investigated happy path.** Documentation intentionally omits several concurrency, recovery, and compatibility fences visible in source. Those omissions should not be treated as discrepancies.

## Open Questions

1. The full `FinalizeTaskClaim` transaction (task-scoped token, delivery receipt, issue snapshot, and payload construction) deserves its own security/claim-delivery investigation; this note verifies its position but does not exhaust every field and authorization fence.
2. Multi-instance daemon wakeup relaying and Redis-backed invalidation semantics were not traced beyond the notifier boundary.
3. Runtime registration, heartbeat batching, offline detection, stale-dispatch reclaim, queued expiry, and automatic retry form a separate recovery lifecycle that should be researched vertically.
4. `execenv.Prepare` contains substantial repository-cache, Git worktree, local-directory, provider-home, skill, and runtime-config behavior. This note verifies when it runs and what boundary it establishes, not every preparation branch.
5. The complete realtime path from service bus event through user WebSocket subscription and Web/Desktop/Mobile cache updates remains the next event-system investigation.
6. Provider selection for custom runtime profiles has a two-part identity (runtime/provider protocol family plus executable/fixed arguments). A later provider study should document this configuration model independently of the run lifecycle.

## Tutorial Implications

- Teach **Run** as the product concept and immediately map it to the current internal `agent_task_queue`/Task terminology so readers can search source without assuming there is a `Run` type.
- Show notification and claiming as distinct steps: the server persists first, sends a best-effort wakeup second, and the daemon claims authoritative database state over WS RPC or HTTP with polling as a safety net.
- For MUST_FIX 1, show the inspected `runBatchPoller` order as **reserve daemon-local slot(s) → send claim request → pair returned task(s) with slots**. If claim returns no task, show the reserved local slots being returned; for a partial batch, only unused slots are returned. Keep this scoped to the current batch-poller path rather than claiming a platform-wide invariant.
- For MUST_FIX 2, do not describe Agent concurrency as an omitted `ClaimAgentTask` predicate. Explain that `(*TaskService).claimTask` first compares `CountRunningTasks` with `agent.MaxConcurrentTasks`, while `ClaimAgentTask` separately performs database candidate filtering, `FOR UPDATE SKIP LOCKED`, serialization, and the atomic `queued → dispatched` write.
- Explain that runtime selection is normally inherited from the assigned Agent and persisted on the task; it is not a generic work-stealing queue across machines.
- Use the verified state model `queued → dispatched → running → completed|failed`, with `waiting_local_directory` and `deferred` presented as explicit optional branches rather than universal stages.
- Emphasize that the daemon creates the environment before acknowledging `running`; this is an important correctness boundary, not incidental setup.
- Present `agent.Backend` as the stable provider seam and Codex’s `app-server --listen stdio://` launch only as one concrete implementation.
- Keep Issue status and Run status visually separate. A completed run does not mechanically complete the Issue.
- Avoid tutorial claims about retry counts, recovery deadlines, complete event fanout, or all preparation behavior until the open questions above have their own source notes.
