# Multica Learning Squad 操作协议

本文定义普通章节从选择到人类合并的版本控制协议。Squad 是 Leader 路由的顺序协作机制，不是自动 fan-out；章节状态来自 `ROADMAP.md`，课程边界来自 `book/BOOK_ARCHITECTURE.md`。

核心规则：**MERGE IS AN INTEGRATION EVENT, NOT A STAGE-COMPLETION EVENT.**

普通线性章节的默认交付单元是：**一个章节、一个 Multica Parent Chapter Issue、一个共享 Git 分支、一个 canonical GitHub PR、一次最终人类合并**。不得把研究完成、教程完成、审查完成或 Issue 状态变化当成中间合并理由。

## 成员与职责

| 角色 | 责任 | 明确边界 |
| --- | --- | --- |
| Leader / Editorial Coordinator | 从仓库状态解析下一阶段，顺序路由、验证 handoff、维护 Parent Issue 和最终集成状态 | 不研究、不写教程、不审自己的章节、不合并 PR、不静默改变课程结构 |
| Source Analyst | 固定完整上游 commit，建立 Source Map、证据边界和研究产物，并创建 / 推进 canonical Draft PR | 不写最终教程，不建独立 research PR，不改变课程结构 |
| Tutorial Writer | 在同一分支 / PR 把已验证研究转成中文教学内容与必要技术图 | 不建立新实现事实，不建新 PR，不绕过证据 gate |
| Technical Reviewer | 对准确的未合并 commit 执行 `FULL_AUDIT` 或 `FOCUSED_DELTA`，给出结构化 verdict | 不改稿、不合并、不要求人工关闭 Issue 或人工切状态后才评审 |
| Frontend Engineer | 仅在需要展示基础设施、布局、可访问性或响应式能力时加入同一 PR | 不改变技术语义、证据、课程边界或章节 PR 拓扑 |

## “完成下一个章节”解析

Leader 收到 `完成下一个章节` 后必须：

1. 读取仓库 `AGENTS.md`；
2. 读取 `ROADMAP.md` 的 `Current Focus`，从仓库状态而不是旧聊天解析下一项允许动作；
3. 若目标章节同时是 Production `NEXT` 与 Architecture `NEAR_TERM_FROZEN`，读取 `book/BOOK_ARCHITECTURE.md`，建立或确认符合 `book/CHAPTER_CONTRACT.md` 的 Chapter Contract；
4. 确认 / 建立 Parent Chapter Issue，并在该 Parent Issue 中 mention 唯一合适成员来路由下一阶段；
5. 若状态是 `EDITORIAL_REVIEW_REQUIRED`，停止并请求人类课程决定；
6. 永不自主选择 `PLANNED / PROVISIONAL` 章节。

当前仓库状态应解析到 M03，但该事实由 `ROADMAP.md` 拥有；本协议不复制当前章节状态。

## 一个 Issue / 分支 / PR 生命周期

```text
Human: 完成下一个章节
  → Leader reads AGENTS + ROADMAP
  → resolve NEXT / NEAR_TERM_FROZEN chapter
  → confirm Chapter Contract + Parent Chapter Issue
  → Source Analyst: shared branch + research + canonical Draft PR
  → STAGE_COMPLETE / SOURCE_RESEARCH
  → Tutorial Writer: same branch + same PR
  → STAGE_COMPLETE / TUTORIAL_PRODUCTION
  → Technical Reviewer: FULL_AUDIT on exact unmerged commit
  → REQUEST_CHANGES? bounded fixes on same PR → FOCUSED_DELTA
  → PASS
  → Leader: synchronization + CI + Parent in_review + PR ready
  → one final human merge
```

默认不创建 child Issue。只有真正独立的调查、基础设施工作或可安全并行的实验才使用 child Issue，并说明为什么它不破坏单章线性所有权。普通阶段 handoff 使用 Parent Issue 上的结构化回复；worker 对 Squad-assigned Parent 的回复会唤醒 Leader，不需要重复 `@mention`。

## 共享分支与 canonical PR

- 首个产生仓库内容的 worker 创建包含 Parent Issue key 的章节分支，例如 `navi-xx-m03-control-execution-plane`。
- Source Analyst 在第一个有用的 research commit 后创建唯一 Draft PR；标题包含 Parent Issue key 和章节，例如 `NAVI-XX M03 — Why Server Does Not Run Agents Directly`，正文包含 `Closes NAVI-XX`。
- `parent_issue_key`、`chapter_branch`、`chapter_pr` 一旦确立，后续 Writer、修复 worker 和 Reviewer 都必须复用；不得创建角色专属分支或替代 PR。
- Parent Issue ↔ PR 关联由分支名、PR 标题和 closing keyword 共同保证。
- PR 在 Reviewer `PASS` 前保持 Draft；Leader 完成集成核验后可将其设为 ready for human review。

## 结构化阶段交接

生命周期摘要中的 `RESEARCH_READY` 指下方 `STAGE_COMPLETE / SOURCE_RESEARCH / READY`，`TUTORIAL_READY` 指 `STAGE_COMPLETE / TUTORIAL_PRODUCTION / READY`；结构化消息本身使用下方固定字段，避免依赖自由文本。

Source Analyst 完成研究时在 Parent Issue 回复：

```text
STAGE_COMPLETE
stage: SOURCE_RESEARCH
status: READY
chapter_branch: ...
chapter_pr: ...
commit: ...
upstream_commit: ...
evidence_gap: none
editorial_escalation: none
next_recommended_stage: TUTORIAL_PRODUCTION
```

如研究暴露课程边界问题，设置 `editorial_escalation` 并停止；正常 `evidence_gap: none` 不需要额外人类 evidence gate 或中间合并。

Tutorial Writer 完成写作时回复：

```text
STAGE_COMPLETE
stage: TUTORIAL_PRODUCTION
status: READY
chapter_pr: ...
commit: ...
research_commit: ...
next_recommended_stage: FULL_AUDIT
```

Reviewer 对准确 commit 返回：

```text
REVIEW_COMPLETE
mode: FULL_AUDIT
reviewed_commit: ...
verdict: PASS | REQUEST_CHANGES

blocker:
must_fix:
should_fix:
nit:
```

Reviewer 判断质量，Leader 拥有工作流状态转换。Reviewer 不依赖手动 Issue closure 或人类状态切换。

## 修复与 `FOCUSED_DELTA`

`REQUEST_CHANGES` 时，Leader 把每项有界修复交给最合适 worker；修复仍在同一 `chapter_branch` / `chapter_pr`。Worker 回复 `FIXES_READY` 并提供当前 commit 与已处理 finding。

Leader 随后请求 Reviewer `FOCUSED_DELTA`，必须提供：

- `previous_reviewed_commit`
- `current_commit`
- `findings_to_verify`
- `regression_invariants`

Reviewer 主要检查 commit delta、原 finding 和直接相关 invariants。若范围或证据基线扩大，则解释原因并升级为 `FULL_AUDIT`；无论哪种模式都不创建新分支、PR 或中间合并。

## 状态文档同步

状态文档是交付物的一部分，不是最后可选清理。章节生产状态按以下顺序变化：

```text
NEXT → IN_RESEARCH → IN_WRITING → IN_REVIEW
```

Reviewer `PASS` 后仍保持 `IN_REVIEW`，直到人类合并；合并后才能改为 `COMPLETE` 并解析下一动作。不得把 provisional 章节自动提升为 `NEAR_TERM_FROZEN`。

每一阶段只有在主产物与受影响的权威状态文档同步后才算完成。最终集成阶段必须检查：

- `ROADMAP.md`
- `CHANGELOG.md`
- `README.md`
- `AGENTS.md`
- `book/BOOK_ARCHITECTURE.md`
- `book/CHAPTER_CONTRACT.md`
- `book/LEARNING_SQUAD.md`
- `sources/*`

只更新职责确实受影响的文件：

- 每个正常章节 PR 更新 ROADMAP 的 Current Focus / production state，并在 `[Unreleased]` 添加有意义的 CHANGELOG 项；
- README 只在项目身份、公开能力、高层进度、结构、onboarding 或导航发生实质变化时更新；
- AGENTS 只在路由或操作规则变化时更新；
- Book Architecture 只在获批的 split / merge、Part 顺序、Reader Question 或 architecture status 变化时更新；
- Chapter Contract 的非结构性澄清可在章内完成，Reader Question、章节边界、Part、split / merge 仍需人类批准；
- 新上游 commit 的完整 SHA 写入研究产物和设计好的章节 metadata / source registry，不覆盖其他章节基线。

## Reviewer `PASS` 后的 Leader 清单

Leader 必须验证：

1. canonical PR 的 head 正是 `reviewed_commit`，或只有明确核验过的集成同步 commit；
2. primary artifact 完整，CI 状态已检查；
3. ROADMAP 为 `IN_REVIEW`，且 `[Unreleased]` 有有意义条目；
4. README 已按需更新或明确 `not required`；
5. AGENTS、BOOK_ARCHITECTURE 和 source registry 没有陈旧或未经批准的变化；
6. 所有同步变更都在 canonical PR；
7. Parent Chapter Issue 切为 `in_review`，Draft PR 在适当时转为 ready；
8. 最终集成摘要逐项报告 ROADMAP、CHANGELOG、README、AGENTS、BOOK_ARCHITECTURE、source registry 为 `updated` 或 `not required`。

然后停止。Leader 不把 Parent 标为 `done`，也不合并；人类执行正常章节唯一一次 merge。后续 Leader invocation 可在 merge 后对 `main` 做状态 reconciliation。

## 人类 gate 与防重复

- Part 重排、章节拆分 / 合并、增删主要章节、Reader Question 和 Architecture status 变更需人类课程负责人批准。
- 对同一工作只使用一种委派方式；Parent Issue reply 已会唤醒 Leader时，不添加礼貌性 mention。
- 不创建 Weekly Upstream Watch、Autopilot 或其他推测性基础设施，除非独立 Issue 明确要求。
- Frontend Engineer 不是每章必经阶段；普通 MDX 和 Mermaid 属于 Tutorial Writer。
