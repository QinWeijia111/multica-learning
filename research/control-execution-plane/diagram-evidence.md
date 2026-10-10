# M03 Diagram Evidence

本文档把 `site/src/content/tutorials/control-execution-plane.mdx` 中的 Mermaid 图映射回 `research/control-execution-plane/research-note.md`。它不建立新的实现事实；所有实现关系固定到上游 `multica-ai/multica@10a7e519da96e8e1819934c24f89bc55a71f88b5`。

## Diagram 1 — `two-plane-boundary`

- **Diagram question:** 耐久协调、本地执行与外部依赖分别位于什么边界？
- **Diagram category:** `CONCEPTUAL`
- **Research artifact:** `research/control-execution-plane/research-note.md`
- **Upstream commit:** `10a7e519da96e8e1819934c24f89bc55a71f88b5`
- **Diagram type:** `flowchart`

### Evidence

- **Node evidence:** Findings A–E 区分 Server / PostgreSQL 的耐久协调、`AgentRuntime` 记录、Daemon 主机中的 workdir / tools、provider-specific worker，以及边界外的 Git / model services。Control Plane / Execution Plane 两个 subgraph 明确是教学职责，不是源码模块。
- **Edge evidence:** `enqueueIssueTaskWithCommentPlan` 与 `AgentTaskQueue` 支持 Server ↔ PostgreSQL；Runtime registration、`runtimeIndex` 与 `handleTask` 支持 Runtime 记录由 Daemon 能力兑现；`execenv.Prepare` 与 `Backend.Execute` 支持 Daemon → 本地资源 / worker；Daemon client report methods 支持 Server ↔ Daemon 的双向数据流。Git / model service 箭头只表达研究已明确保留的潜在外部网络边界，不宣称固定协议或必经调用。
- **Uncertainty preserved:** 图注与正文明确两个 plane 是 `SOURCE + INFERENCE` 教学映射；外部箭头使用“按需 / 取决于 provider”，没有把 README 的 “Code never leaves it” 升级为全局隐私保证。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功；headless Chrome 本地预览生成 `flowchart-v2` SVG，未出现 Mermaid error。
- [x] **Mobile/readability check:** 在 390 px viewport 复核；使用 `TD`、两个职责 subgraph 和短标签，正文栏内可辨认，关键结论另有 caption / fallback。
- [x] **Exact identifiers:** `Server`, `PostgreSQL`, `Runtime`, `Daemon`, `Coding Agent` 与研究术语一致；概念区使用自然语言而非虚构 symbol。
- [x] **Text fallback:** 图前后正文逐条解释 plane、Runtime / Daemon 和外部服务边界。

## Diagram 2 — `minimum-cross-boundary-path`

- **Diagram question:** 一项普通 Issue 执行怎样从服务端耐久事实跨到本地 Coding Agent 进程，再把结果送回？
- **Diagram category:** `IMPLEMENTATION`
- **Research artifact:** `research/control-execution-plane/research-note.md`
- **Upstream commit:** `10a7e519da96e8e1819934c24f89bc55a71f88b5`
- **Diagram type:** `sequenceDiagram`

### Evidence

- **Node evidence:** Source Map 中 `TaskService` / `AgentTaskQueue`、Daemon `handleTask` / `runTask`、`Backend` / `ResolveBackend` 与 Codex `executeOnce` 支持 Server、PostgreSQL、Daemon、provider Backend 与 Coding Agent 五个参与者。
- **Edge evidence:** `enqueueIssueTaskWithCommentPlan` → `CreateAgentTask` 支持创建 `queued` task；`ClaimAgentTask` 支持 `queued → dispatched`；`Task` / `AgentData` 支持 claim payload；`handleTask`、`runTask` 与 `execenv.Prepare` 支持本地路由 / workdir；`ResolveBackend`、`Backend.Execute` 与 `codexBackend.executeOnce` 支持 backend 启动 worker；Daemon client report methods 与 terminal handlers 支持过程 / 终态返回并持久化结果。
- **Uncertainty preserved:** 图与 caption 明确折叠 wakeup、polling、claim 算法、execution environment 内部和 provider protocol；Codex-specific stdio 不进入主图。序列只代表普通 Issue 路径，不泛化到所有 trigger。

### Validation

- [x] **Mermaid render validation:** `npm run build` 成功；headless Chrome 本地预览生成 `sequence` SVG，未出现 Mermaid error。
- [x] **Mobile/readability check:** 390 px viewport 初检显示整体缩放过小；已改用站点 `data-wide` 横向滚动容器，保留五个必要参与者与可读字号，caption / 五步文字路径提供 fallback。
- [x] **Exact identifiers:** `queued`, `dispatched`, `runtime_id`, `ResolveBackend`, `Execute` 与研究基线一致。
- [x] **Text fallback:** 图前五个语义阶段与图后边界解释完整复述关键路径。

## Reviewer verdict

- **Verdict:** `PASS`
- **Reviewer:** Tutorial Writer self-check（交付后仍需 Technical Reviewer `FULL_AUDIT`）
- **Findings / required changes:** 实现箭头均能回到既有 Source Map / Execution Path；没有把 Open Questions 画成确定事实。构建验证完成后回填两个待验证项。
