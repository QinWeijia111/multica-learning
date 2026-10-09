# Multica Learning Squad 操作协议

本文是 `Multica Learning Squad` 的版本控制操作协议。Squad 是章节生产的协调机制，不是把一个 Issue 自动分发给所有成员的并行执行器。默认采用顺序路由和显式阶段边界；证据质量、教学一致性与人类决策优先于自动化程度。

课程边界以 `book/BOOK_ARCHITECTURE.md` 为准；每章开始广泛研究前必须确认一份符合 `book/CHAPTER_CONTRACT.md` 的章节契约。写作与核验方法分别遵循 `skills/source-dive-writing`、`skills/technical-diagramming`、`skills/multica-source-verification` 和 `skills/repository-workflow`。M01（`site/src/content/tutorials/run-lifecycle.mdx`）是教学质量范例，不是固定标题模板。

## 成员与职责

| 角色 | 责任 | 明确边界 |
| --- | --- | --- |
| Leader / Editorial Coordinator | 判断当前阶段，只把下一项有边界的工作交给恰当成员，然后停止 | 不亲自研究、写教程、审自己的章节、修改代码或文档、合并 PR、静默更改全书架构 |
| Source Analyst | 固定完整上游 commit SHA，回答 Source Research Questions，建立 Source Map、证据边界和研究产物 | 不写最终教程，不为迎合标题发明结论，不改变课程结构 |
| Tutorial Writer | 把已验证研究转成清晰的中文教学内容与必要 Mermaid 图 | 不独立补做源码研究，不把 `INFERENCE` 升格为事实，不机械复制 M01 标题结构 |
| Technical Reviewer | 独立检查证据、技术语义、图示和教学质量，按显式模式给出结论 | 不在初审中替 Writer 改稿，不合并 PR，不把无关偏好升级为阻塞问题 |
| Frontend Engineer | 负责展示基础设施、响应式布局、可访问性、导航与阅读体验 | 不独立改变技术主张、Source Map、图示语义或章节架构 |

Frontend Engineer 不是每章必经阶段。普通 MDX 写作和 Mermaid 教学图属于 Tutorial Writer；只有出现新的站点展示行为、布局、可视化基础设施，或正常 MDX 无法解决的可访问性 / 响应式问题时才升级给 Frontend Engineer。

## Leader 协议

每次收到父级章节 Issue 后，Leader 必须：

1. 读取父 Issue、`BOOK_ARCHITECTURE.md` 和该章 Chapter Contract。
2. 根据已有交付物与评审结果识别唯一的当前生产阶段。
3. 按下表选择恰好一个合适成员或人类 gate。
4. 使用独立 child / stage Issue 委派下一项可验证、有边界的工作。
5. 完成委派后停止；只有新证据、worker 结果或人类决定到来时才重新评估。

| 当前需要 | 路由目标 |
| --- | --- |
| 证据缺失、薄弱或与契约冲突 | Source Analyst |
| 研究已验证、教程尚未完成 | Tutorial Writer |
| 新章首次正式评审或重大变化 | Technical Reviewer / `FULL_AUDIT` |
| full audit 后的有界修复已完成 | Technical Reviewer / `FOCUSED_DELTA` |
| 仅涉及站点展示、布局、可访问性或响应式 | Frontend Engineer |
| 涉及课程边界 | 人类课程负责人 |

不要因为成员存在就“以防万一”全部路由。只有任务真正独立、不会产生互相冲突的证据或教学决策时才允许并行。

## 章节生产生命周期

父级 chapter-production Issue 是协调容器，不要求直接对应单一 GitHub PR。研究、教程生产与其他可追踪交付应按需使用独立 child / stage Issue：

```text
Parent Chapter Issue
        ↓
Chapter Contract confirmed
        ↓
Source Research Issue → Source Analyst
        ↓
research artifact + review-only PR
        ↓
human merge / evidence gate
        ↓
Tutorial Production Issue → Tutorial Writer
        ↓
tutorial + diagrams + review-only PR
        ↓
Technical Reviewer FULL_AUDIT
        ↓
Writer fixes
        ↓
Technical Reviewer FOCUSED_DELTA
        ↓
human merge
        ↓
chapter ready for integration
```

真实生产开始时，Leader 可以把 Squad 负责的父 Issue 移到 `in_progress`。child / stage Issue 应持续反映 worker 活动。只有整章已准备好由人类集成时，Leader 才把父 Issue 移到 `in_review`；Leader 不把父 Issue 标为 `done`。

## 证据协议与缺口回传

Source Analyst 沿行为优先的纵向路径研究，产物写入 `research/`，并明确区分 `SOURCE`、`DOCS`、`EXPERIMENT` 与 `INFERENCE`。研究必须保留文档与源码差异、未决问题和证据适用边界，避免宽泛的 package-by-package 浏览。

Tutorial Writer 必须先读 Chapter Contract、权威研究产物、当前写作与图示 Skill，以及作为范例的 M01。推荐教学顺序是：

```text
reader question
→ architecture / semantic model
→ concrete journey or example
→ teaching pseudocode（需要时）
→ focused production source（需要时）
→ source navigation appendix
```

Writer 遇到研究不能支持的重要实现主张时，必须停止该主张、记录具体缺口并交还 Leader / Source Analyst；不得自行绕过研究 gate 补出结论。

## Technical Reviewer 模式

每个评审请求与结果都必须显式标注模式。

### `FULL_AUDIT`

适用于新章首次正式评审、重大教学改写、研究基线变化、主要图示变化或生产源码摘录的重大变化。Reviewer 可以检查 Chapter Contract、研究产物、教程、图示、源码 spot-check、证据边界、教学质量，以及与范围相称的确定性检查 / CI。

finding 严重度固定为 `BLOCKER`、`MUST_FIX`、`SHOULD_FIX`、`NIT`；verdict 固定为 `PASS` 或 `REQUEST_CHANGES`。只有尚未解决的 `BLOCKER` / `MUST_FIX` 触发 `REQUEST_CHANGES`。

### `FOCUSED_DELTA`

仅用于已有 `FULL_AUDIT` 评审过较早 commit，且后续变化是有界修复的情况。请求必须提供：

- `previous_reviewed_commit`
- `current_commit`
- `findings_to_verify`
- `regression_invariants`

Reviewer 主要检查 `previous_reviewed_commit..current_commit`，确认原 finding 已修复、直接相关 invariants 仍成立、范围没有扩张。若 GitHub CI 已绿色、变更不涉及构建基础设施且证据基线未改变，不自动重读整章、重审全部图、重查全部上游源码或重跑完整本地构建。

如果 delta 暴露新的证据范围、固定 commit 变化、大量无关修改或架构扩张，Reviewer 必须解释原因并升级为 `FULL_AUDIT`。`FOCUSED_DELTA` 输出保持简短，至少包含模式、verdict、已验证 findings / invariants 与是否出现新的 `BLOCKER` / `MUST_FIX`。

## 人类 gate

- **课程 gate**：Part 重排、章节拆分 / 合并、增加 / 删除主要章节、改变章节主要 Reader Question，均须人类课程负责人批准。
- **证据 gate**：研究证据由 Source Analyst 建立；Writer 不得静默引入未支持的实现事实。
- **合并 gate**：Agent 只创建 review-only PR，永不合并；合并由人类决定。
- **Golden / architecture gate**：Agent 可以建议 `GOLDEN`、`NEAR_TERM_FROZEN`、拆分 / 合并或架构更新，只有人类课程负责人可以批准。

## 防重复委派

同一工作单元只使用一种委派机制。若工作已有专属 child Issue，则以 assignment 为主要委派方式，不再用 `@mention` 要求同一 Agent 执行相同任务。Mention 只用于讨论、澄清或不会复制现有 assignment 的显式 handoff。

把 Issue 分配给 Squad 只会路由给 Leader，不表示所有成员自动 fan-out。Leader 必须按当前阶段顺序委派，不得创建“全员启动”的验证任务。
