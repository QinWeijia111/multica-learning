# M05 Diagram Evidence

本文档把 `site/src/content/tutorials/durable-task.mdx` 中的 Mermaid 图映射回 `research/durable-task/research-note.md`。它不建立新的实现事实；所有实现关系固定到上游 `multica-ai/multica@231dedb55287ab6e40fd103634a024e4d9d1baeb`。

## Diagram 1 — `issue-run-history`

- **Diagram question:** 一项 Issue 为什么可以拥有多条独立 Run，retry / rerun 为什么不会覆盖旧历史？
- **Diagram category:** `CONCEPTUAL`
- **Research artifact:** `research/durable-task/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** Verified Conclusions A、C、E 支持 Issue 与 Run 的一对多关系，以及第一次执行、自动 retry、人工 rerun 都表现为独立记录。
- **Edge evidence:** `ListTasksByIssue` 支持 Issue execution history；`CreateRetryTask` 的 `retry_of_task_id` 与 rerun enqueue 的 `rerun_of_task_id` 支持两类 lineage。
- **Uncertainty preserved:** 图使用自然语言节点并明确标为概念图；没有把 Issue / Run 冒充为单一源码 type，也没有画 claim 或完整恢复关系。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，Astro / Mermaid 未报告语法错误。
- [x] **Mobile/readability check:** 纵向四节点结构适合窄文章栏；正文列表与 caption 提供完整 fallback。
- [x] **Exact identifiers:** 概念节点未伪装成源码 symbol；`retry`、`rerun` 用词与研究的产品 / 实现对照一致。
- [x] **Text fallback:** 图前定义 Issue / Run，图后逐条说明终态、独立记录和历史不覆盖。

## Diagram 2 — `single-run-state-skeleton`

- **Diagram question:** 单条 durable Run 允许经过哪些主要状态，哪些状态结束这次执行？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/durable-task/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `stateDiagram-v2`

### Evidence

- **Node evidence:** `CreateDeferredChannelIssueTask` / `CreateAgentTask` 支持初始 `deferred` / `queued`；`AgentTaskQueue` 与 lifecycle SQL 支持 `dispatched`、`waiting_local_directory`、`running`、`completed`、`failed`、`cancelled`。
- **Edge evidence:** promotion query 支持 `deferred → queued`；`ClaimAgentTask` 支持 `queued → dispatched`；`MarkAgentTaskWaitingLocalDirectory`、`StartAgentTask`、`CompleteAgentTask`、`FailAgentTask` 与 cancellation SQL 支持图中的转换及来源状态限制。
- **Uncertainty preserved:** `queued → dispatched` 明确标为“M06 claim 边界”，没有画候选排序、锁或并发正确性；图没有把终态画到 Issue 状态，也没有展开 M13 failure recovery。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，Astro / Mermaid 未报告语法错误。
- [x] **Mobile/readability check:** 使用 `data-wide` 容器保留状态标签可读性；相邻列表逐条复述关键转换作为 fallback。
- [x] **Exact identifiers:** 全部八个状态值及 `waiting_local_directory` 拼写已对照固定基线研究。
- [x] **Text fallback:** caption 明确终态只结束本次执行；正文列出 start / complete / fail / cancel 的来源状态。

## Diagram 3 — `retry-rerun-lineage`

- **Diagram question:** 自动 retry 与人工 rerun 怎样新增记录并保存不同血缘？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/durable-task/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** `CreateRetryTask` 支持 failed parent 与 attempt + 1 的 queued / deferred child；`enqueueRerunTask` 支持 direct-human queued rerun row。
- **Edge evidence:** `CreateRetryTask` 把 `retry_of_task_id = parent.id` 写在新建 child row 上，因此 retry 边由 child 指向 parent；rerun enqueue 把 `rerun_of_task_id = selected source task` 写在新建 rerun row 上，因此 rerun 边由新 row 指向 selected source。Research Note Behavior-first Paths 4–5 支持两者均保留 source row。
- **Uncertainty preserved:** 图没有画 retry eligibility、backoff、exhaustion 或 session / workdir 复用算法；正文明确这些分别属于 M13 或后续 claim 准备策略。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，Astro / Mermaid 未报告语法错误。
- [x] **Mobile/readability check:** 三节点纵向分叉简短可读；caption 与相邻两节完整解释两条边。
- [x] **Exact identifiers:** `attempt`、`retry_of_task_id`、`rerun_of_task_id` 与 `direct_human` 已对照固定基线研究；两条 lineage pointer 均从保存字段的新 row 指向来源 row。
- [x] **Text fallback:** 正文分别解释系统恢复尝试与新的用户意图，并说明旧终态记录不覆盖。

## Reviewer verdict

- **Verdict:** `PASS`
- **Reviewer:** Tutorial Writer self-check（交付后仍需 Technical Reviewer `FULL_AUDIT`）
- **Findings / required changes:** `M05-D1` 已修正：实现图不再把创建方向误标为 lineage pointer 方向；节点与边均可回到 Research Note，M06 / M13 与 session / workdir 不确定性未被画成确定关系。
