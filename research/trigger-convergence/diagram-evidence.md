# M04 Diagram Evidence

本文档把 `site/src/content/tutorials/trigger-convergence.mdx` 中的 Mermaid 图映射回 `research/trigger-convergence/research-note.md`。它不建立新的实现事实；所有实现关系固定到上游 `multica-ai/multica@52b26900c51f759b87707b4ea35fa9f141b83b52`。

## Diagram 1 — `four-trigger-convergence`

- **Diagram question:** 四类 Trigger 怎样保留各自上下文，又进入共同的 queued-work / Runtime 通知边界？
- **Diagram category:** `CONCEPTUAL`
- **Research artifact:** `research/trigger-convergence/research-note.md`
- **Upstream commit:** `52b26900c51f759b87707b4ea35fa9f141b83b52`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** Research Note 的 Behavior-first Paths 与 Findings A–D 支持 Issue、Comment、Direct Chat、Autopilot 四类产品入口，分别以 Issue / Comment、Chat session、Autopilot run 保存上下文，并在 accepted work、target Runtime 与 wakeup 边界汇合。
- **Edge evidence:** `WillEnqueueRun` / `dispatchIssueRun` 支持 Issue 路由；comment resolver 支持 mention / thread / conversation 路由；`SendChatMessage` / `SendDirectChatMessage` 支持 Chat 准入；`DispatchAutopilot` 支持 automation mode 路由。三类 create query 与 `NotifyTaskEnqueued` 支持形成 queued work 后提醒目标 Runtime。
- **Uncertainty preserved:** “形成可执行工作”明确标为教学语义，不冒充统一函数；caption 说明 Chat / run-only Autopilot 没有 Issue、comment 可以 coalesce、wakeup 不授予执行权。图没有展开 M05 durable-task 或 M06 claim 关系。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，Astro / Mermaid 未报告语法错误。
- [x] **Mobile/readability check:** 390 px 页面渲染复核通过；`data-wide` 容器保留可读字号并允许横向滚动，正文与 caption 提供完整 fallback。
- [x] **Exact identifiers:** `Issue`, `Comment`, `Chat session`, `Autopilot run`, `Runtime`, `poll`, `claim`, `ownership` 与研究术语一致；概念节点没有伪装成源码 symbol。
- [x] **Text fallback:** 图前定义四类 trigger，图后逐项解释“先分流、后汇流”和通知边界。

## Diagram 2 — `three-insert-shapes`

- **Diagram question:** 四类 Trigger 的 fresh enqueue 为什么能汇到同一队列，又不代表使用同一个写入函数？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/trigger-convergence/research-note.md`
- **Upstream commit:** `52b26900c51f759b87707b4ea35fa9f141b83b52`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** Source Map 中 `CreateAgentTask`、`CreateChatTask`、`CreateAutopilotTask` 支持三种 insert；三者都写 `agent_task_queue`。`NotifyTaskEnqueued`、queued telemetry、empty-claim cache invalidation 与 runtime wakeup 来自共同通知边界。
- **Edge evidence:** Issue / fresh Comment enqueue 调用 `CreateAgentTask`；Direct Chat transaction 调用 `CreateChatTask`；`dispatchRunOnly` 调用 `CreateAutopilotTask`；`dispatchCreateIssue` 先创建 Issue 并进入普通 Issue 路径。fresh enqueue 路径最终直接或经 TaskService 调用 `NotifyTaskEnqueued(runtime_id)`。
- **Uncertainty preserved:** 图注明确只画 fresh enqueue；comment coalescing / deferral 不保证 insert。图停在 best-effort wakeup，没有把通知画成 claim 或状态所有权，也没有把 run-only Autopilot 画成使用 Issue broadcast helper。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，Astro / Mermaid 未报告语法错误。
- [x] **Mobile/readability check:** 390 px 页面渲染复核通过；纵向主路径配合 `data-wide` 横向滚动容器保留可读字号，来源字段对比表与 caption 提供 fallback。
- [x] **Exact identifiers:** `CreateAgentTask`, `CreateChatTask`, `CreateAutopilotTask`, `agent_task_queue`, `NotifyTaskEnqueued`, `runtime_id` 已对照固定基线 Source Map。
- [x] **Text fallback:** 图前解释三种 query，图后用表格列出每类来源锚点与 Issue 可空差异。

## Reviewer verdict

- **Verdict:** `PASS`
- **Reviewer:** Tutorial Writer self-check（交付后仍需 Technical Reviewer `FULL_AUDIT`）
- **Findings / required changes:** None；实现箭头均能回到 Research Note 的 Source Map / Behavior-first Paths，Open Questions 未被画成确定关系。
