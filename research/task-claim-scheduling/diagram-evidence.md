# M06 Diagram Evidence

本文档把 `site/src/content/tutorials/task-claim-scheduling.mdx` 中的 Mermaid 图映射回 `research/task-claim-scheduling/research-note.md`。它不建立新的实现事实；所有实现关系固定到上游 `multica-ai/multica@231dedb55287ab6e40fd103634a024e4d9d1baeb`。

## Diagram 1 — `hint-to-ownership`

- **Diagram question:** 一条 durable task 怎样从“可被发现”走到“已被领取”？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/task-claim-scheduling/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `sequenceDiagram`

### Evidence

- **Node evidence:** Research Note Behavior-first Paths 1–5 支持 Server、PostgreSQL、Daemon、durable queued row、machine-level batch poller 与 batch claim handler。
- **Edge evidence:** `notifyTaskAvailable` 支持 queued commit 后先 `EmptyClaim.Bump` 再 `NotifyTaskAvailable`；`readTaskWakeupMessagesForConnection` / `pollLoop` 支持 hint 与 polling 汇流；`runBatchPoller` 支持 slot-before-claim；`ClaimTasksByRuntime → ClaimTasksForRuntimes → claimTask → ClaimAgentTask` 支持事务检查与 `queued → dispatched`。
- **Uncertainty preserved:** 图没有把 relay delivery 画成可靠交付，也没有展开 Runtime heartbeat / freshness 来源；caption 明确只有数据库状态转换授予所有权。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，astro-mermaid 已转换本章全部三张图且未报告 Mermaid 语法错误。
- [x] **Mobile/readability check:** 三参与者纵向 sequence，标签保持短句；相邻正文逐步复述全部时序作为 fallback。
- [x] **Exact identifiers:** `queued`、`dispatched`、`task_available`、batch claim 与 `EmptyClaim.Bump` 已对照固定研究基线。
- [x] **Text fallback:** 图前后的端到端旅程明确说明 insert、bump、hint、slot、claim 和状态转换。

## Diagram 2 — `four-claim-gates`

- **Diagram question:** 哪四种不同作用域的约束共同决定 task 是否能被领取？
- **Diagram category:** `CONCEPTUAL`
- **Research artifact:** `research/task-claim-scheduling/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** Verified Conclusions B 与 Behavior-first Paths 3、5、6 支持 machine slot、Agent capacity、per-Agent / per-target serialization 与 task row winner 四种约束。
- **Edge evidence:** 图的顺序用于教学组织：Daemon 在请求前预留 slot；Server 随后进入 Agent transaction、目标资格与 row claim。具体实现不是名为“四道门”的统一 pipeline，正文已明确这是 `INFERENCE` 教学模型。
- **Uncertainty preserved:** 图不声称四道门是源码 abstraction，不把 per-target fence 画成全局 Issue lock，也没有承诺候选长期无饥饿。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，astro-mermaid 已转换本章全部三张图且未报告 Mermaid 语法错误。
- [x] **Mobile/readability check:** 单列六节点 flowchart 适合窄文章栏；四个正文小节分别解释作用域和 fallback。
- [x] **Exact identifiers:** 概念标签未伪装成 symbol；相邻正文准确定位 `runBatchPoller`、`CountRunningTasks` 与 `ClaimAgentTask`。
- [x] **Text fallback:** caption 与随后四个小节完整说明每层约束及其不能替代的下一层。

## Diagram 3 — `claim-generation-recovery`

- **Diagram question:** claim response 丢失后，旧 generation 怎样失效而不与新 generation 同时成为合法 owner？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/task-claim-scheduling/research-note.md`
- **Upstream commit:** `231dedb55287ab6e40fd103634a024e4d9d1baeb`
- **Diagram type:** `stateDiagram-v2`

### Evidence

- **Node evidence:** Behavior-first Path 7 支持 `queued`、`dispatched`、`running`，以及由 `dispatched_at` 区分的 G1 / G2 claim generation。
- **Edge evidence:** `RequeueAgentTaskAfterClaimFailure` 支持 finalization failure 时按 G1 CAS 回到 queued；`StartTaskForClaim` / `LockAgentTaskStartClaim` 支持 response 到达后的 generation 校验；`ReclaimStaleDispatchedTasksForRuntimes` 支持满足 recovery / lease 条件后刷新 generation 并重新交付。
- **Uncertainty preserved:** G1 / G2 只标在 start 转换上，落点保持真实数据库状态值 `running`；图不展开 dispatch timeout、Daemon offline settlement、terminal replay、retry 或 backoff，也不声称外部 side effect exactly-once。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功，astro-mermaid 已转换本章全部三张图且未报告 Mermaid 语法错误。
- [x] **Mobile/readability check:** 状态数受控，长条件换行；相邻编号列表与 caption 提供文本 fallback。
- [x] **Exact identifiers:** `queued`、`dispatched`、`running`、`dispatched_at`、`RequeueAgentTaskAfterClaimFailure`、`ReclaimStaleDispatchedTasksForRuntimes` 与 `LockAgentTaskStartClaim` 已核对研究。
- [x] **Text fallback:** 图前列出 finalization failure、response success、lost response 三种结果，图后解释教学标签与 M13 边界。

## Reviewer verdict

- **Verdict:** `PASS`
- **Reviewer:** Tutorial Writer self-check（交付后仍需 Technical Reviewer `FULL_AUDIT`）
- **Findings / required changes:** 图 1 的每条时序边均可回到 Research Note；图 2 明确保留“四道门”的 `INFERENCE` 性质；图 3 没有把 generation 扩写成完整 M13 recovery 或 exactly-once 承诺；三张图均已通过本地构建验证。
