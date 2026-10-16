# Current Focus

- **State semantics**：`main` 已包含 M04 的完成态；本文件在 NAVI-31 canonical PR 分支上记录 M05 的当前生产工作状态
- **Current phase**：Phase 9B.1 — repository-driven chapter production
- **Current Part**：Part II — 一次 Run 如何被调度
- **Current focus**：M05 — Run 在源码里究竟是什么？——TaskService 与 Durable Task（`IN_RESEARCH`）
- **Completed chapter**：M04 — Agent 为什么开始工作？——四类 Trigger 如何汇入执行主线（`COMPLETE`）
- **Next allowed action**：基于固定上游 commit `231dedb55287ab6e40fd103634a024e4d9d1baeb` 完成 M05 `SOURCE_RESEARCH` 交接，随后在同一 canonical 分支 / PR 进入 `TUTORIAL_PRODUCTION`
- **Next human gate**：M05 canonical PR 在研究、写作、技术审查与最终集成完成后的唯一人类 merge；当前无需中间 merge 或额外 evidence gate

本文件是“下一步做什么”的唯一权威来源。聊天记录、旧 Issue、PR 描述和 Book Architecture 中的章节顺序不能替代这里的当前生产状态。

## 状态词汇

Architecture status 与 Production status 是两条独立轴：

- Architecture：`GOLDEN`、`NEAR_TERM_FROZEN`、`PLANNED / PROVISIONAL`；
- Production：`NOT_STARTED`、`NEXT`、`IN_RESEARCH`、`IN_WRITING`、`IN_REVIEW`、`COMPLETE`、`BLOCKED`、`EDITORIAL_REVIEW_REQUIRED`。

`NEAR_TERM_FROZEN` 表示章节责任可进入生产，不表示已经开始或完成。`PLANNED / PROVISIONAL` 不能由 Agent 自动提升或启动。

## 章节进度

| Module | 标题 | Part | Architecture status | Production status | 下一动作 / gate |
| --- | --- | --- | --- | --- | --- |
| M01 | 从 Issue 分配到本地 Codex 执行 | I | `GOLDEN` | `COMPLETE` | 作为 Golden Chapter 保持可追溯 |
| M02 | Multica 里到底有哪些“东西”？——从产品对象到源码对象 | I | `NEAR_TERM_FROZEN` | `COMPLETE` | 无；已完成研究与教程 |
| M03 | 为什么 Server 不直接运行 Agent？——Control Plane 与 Execution Plane | I | `NEAR_TERM_FROZEN` | `COMPLETE` | 研究、教程与审查已完成；随 canonical PR #23 合并成为 `main` 的权威状态 |
| M04 | Agent 为什么开始工作？——四类 Trigger 如何汇入执行主线 | II | `NEAR_TERM_FROZEN` | `COMPLETE` | 研究、教程、图示与审查已完成；随 canonical PR #26 合并成为 `main` 的权威状态 |
| M05 | Run 在源码里究竟是什么？——TaskService 与 Durable Task | II | `NEAR_TERM_FROZEN` | `IN_RESEARCH` | Contract 已实例化；在 NAVI-31 canonical PR 上完成 source research 后进入教程写作 |
| M06 | 到底是谁获得了任务？——Wakeup、Polling、Claim 与并发控制 | II | `NEAR_TERM_FROZEN` | `NOT_STARTED` | 已冻结但不启动；等待 M05 完成与 Reviewer `PASS` |
| M07 | 一台电脑为什么能成为 Runtime？——Daemon、Runtime 与 Heartbeat | III | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M08 | Agent 在哪里工作？——Execution Environment、Workdir 与本地资源 | III | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M09 | Coding Agent 最终到底“看见”了什么？——Context Assembly | III | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M10 | Multica 为什么能接 20 多种 Coding Agent？——Provider Adapter | III | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M11 | Agent 的输出怎样回到网页？——Messages、Progress 与 Result Pipeline | IV | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M12 | 为什么 Multica 有两套 WebSocket？——Realtime 与 DaemonWS | IV | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M13 | 机器断网、Daemon 崩了怎么办？——Failure、Retry 与 Recovery | IV | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M14 | Agent 如何持续对话？——Mention、Comment、Chat 与 Steering | V | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M15 | 一个 Skill 是怎样真正进入 Agent 的？——从 Workspace Knowledge 到 Runtime | V | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M16 | Squad 到底是不是“多智能体并行”？——Leader Routing 与协作协议 | V | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M17 | Autopilot 是怎么让 Agent 系统自己运行的？——Schedule、Webhook 与 Durable Automation | V | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M18 | Multica 怎样守住系统边界？——Workspace、Access 与 Task-scoped Identity | VI | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |
| M19 | 从 Issue 到 PR：把所有机制重新串起来 | VI | `PLANNED / PROVISIONAL` | `NOT_STARTED` | 等待未来滚动课程复核 |

## 滚动课程规则

冻结窗口耗尽后，Leader 不得按编号自动开始 provisional 章节。人类课程负责人已在 NAVI-30 批准 M04–M06 为当前滚动窗口；M04 完成后，M05 按批准顺序成为 `NEXT`，M06 保持 `NOT_STARTED`，仍须等待 ROADMAP 的前序 gate，不能并行自动开工。

## 非章节工程工作

| 工作流 | 当前状态 | 下一动作 / gate |
| --- | --- | --- |
| Repository operating model | `IN_REVIEW` | Phase 9B.1 PR 等待人类审查与合并 |
| Learning Squad | `IN_REVIEW` | 连续交接协议随 Phase 9B.1 PR 审查；合并后生效 |
| Upstream watch | `NOT_STARTED` | 本阶段不创建 Weekly Watch；需独立批准 |
| Publishing / release | `ACTIVE` | `main` 上的站点变更由 GitHub Pages workflow 发布；发布仍需合并后验证 |
