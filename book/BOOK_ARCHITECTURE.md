# Multica Learning Book Architecture v0.1

本文定义 Multica Learning 的编辑架构：教什么、按什么顺序教，以及为什么这样组织。它不是源码事实清单，也不是固定到具体目录、symbol、表或 API 的实现蓝图。每章的实现结论仍须绑定明确的上游 Multica commit，并按研究证据验证。

配套参考各司其职：

- `skills/source-dive-writing` 定义教学方法；
- `skills/technical-diagramming` 定义图示方法；
- M01 是已经实现的 Golden Chapter，提供具体质量范例；
- 本文定义全书的知识边界、学习顺序和章节责任。

## 全书学习旅程

全书遵循 **map → journey → zoom-in → synthesis（地图 → 旅程 → 放大 → 综合）**：

1. **地图与旅程**：先跟随一次 Issue 到本地 Codex 的纵向旅程，看见整台机器如何协作，而不是从源码目录或术语表开始。
2. **逐层放大**：沿着同一台机器，依次放大产品与运行时对象、调度、本地 Runtime/Daemon 执行、消息/状态/可靠性、Agent 上下文与能力、Squad/Autopilot 协作。
3. **反复回到全局**：每次放大都说明它对应 M01 架构地图的哪一部分、依赖此前什么认识、解决什么误解。
4. **系统综合**：最后重新串联 Issue、Run、Agent、Runtime、协作、权限与 PR，形成可用于分析和建设 Agent 系统的完整工程模型。

章节边界由一个主要读者问题决定，而不是由 source package 决定。当一个问题引入独立心智模型，或会让另一章承担过多概念、证据与机制时，应成为独立章节。每章必须说明：读者已有知识、继承的未决问题或误解、新建立的模型，以及它为后文解锁什么。后续章节应指出自己放大 M01 地图的哪一部分，但不要求复制 M01 的 Mermaid 图。

## 导读的责任

未来的导读负责说明目标读者、以源码为证据的写作方式、为何先讲架构再讲 symbol、Source Map 为什么通常放在附录，以及 M01 为何是 Golden Chapter。v0.1 只保留这一责任定义，不创建导读正文。

## Part I — 看见整台机器

本 Part 从一次完整旅程建立全局地图，再为其中的核心对象和架构边界命名。完成后，读者应能用稳定但不过度承诺实现细节的词汇讨论 Multica 的协调侧与执行侧。

### M01 — 从 Issue 分配到本地 Codex 执行

**状态：`GOLDEN`**

- **主要问题**：为什么把 Issue 分配给 Agent，最终会在本地启动 Codex？
- **责任**：用一条纵向旅程建立第一张整机地图，让读者先看到协作、调度、本地执行与结果返回如何连成一体。
- **边界**：已经实现于 `site/src/content/tutorials/run-lifecycle.mdx`；本架构不重写该章。

### M02 — Multica 里到底有哪些“东西”？——从产品对象到源码对象

**状态：`NEAR_TERM_FROZEN`**

- **主要问题**：Issue、Run/task、Agent、Runtime、Workspace、Project 如何关联，为什么产品词汇与源码词汇不同？
- **前置知识**：M01 的整机旅程模型。
- **学习结果**：读者能把遇到的对象粗略归为协作对象、编排身份/配置、执行记录、执行资源或组织范围，同时不提前断言未经研究的精确映射。
- **新模型**：同一系统可同时具有产品概念、源码/内部表示、持久状态和执行资源；它们有关联，但不是天然一一对应。
- **非目标**：调度算法、Daemon 生命周期、provider 实现、实时通信、Squad、Autopilot。
- **为何独立于 M01**：M01 优先保持旅程连续，M02 才对旅途中出现的对象命名并梳理关系。
- **为何先于 M03**：讨论架构边界前，需要先稳定 Agent、Runtime 与 Run/task 的工作词汇。
- **连接全书**：放大 M01 地图中的“参与者与记录”，为 M03 的控制面/执行面边界和后续调度章节提供词汇基础。

以上是研究契约摘要，不是教程内容；准确映射、symbol 与持久化结构必须由后续源码研究决定。

### M03 — 为什么 Server 不直接运行 Agent？——Control Plane 与 Execution Plane

**状态：`NEAR_TERM_FROZEN`**

- **主要问题**：为什么 Multica 把协调与本地执行分开？
- **前置知识**：M01 的纵向旅程，以及 M02 建立的对象词汇。
- **学习结果**：读者能解释 Server 负责协调、Runtime 标识/配置执行能力、Daemon 承载本地执行、Coding Agent 是 provider-specific worker，以及仓库、工具与凭据为何留在执行侧。
- **新模型**：Control Plane 决定与协调“应执行什么”，Execution Plane 在本地资源和进程边界内完成“如何执行”。
- **非目标**：heartbeat 实现、Daemon polling loop、execution environment 内部机制、retry、provider protocol。
- **为何独立于 M07**：M03 解释分层的架构理由；M07 才研究 Runtime/Daemon 的具体基础设施与生命周期。
- **连接全书**：放大 M01 地图中的网络与进程边界，为调度章节和本地执行章节建立共同边界。

以上是研究契约摘要，不预先规定文件、函数、数据表或 API 路由。

## Part II — 一次 Run 如何被调度

本 Part 放大 M01 地图中的服务端编排主线：工作如何产生、成为耐久记录、被发现并获得唯一执行权。标题与拆分仍可能随研究调整。

### M04 — Agent 为什么开始工作？——四类 Trigger 如何汇入执行主线

**状态：`PLANNED / PROVISIONAL`**

解释不同用户/系统触发如何形成可执行工作，并建立“触发来源不同、执行主线可汇合”的模型；当前不冻结触发种类的具体实现细节。

### M05 — Run 在源码里究竟是什么？——TaskService 与 Durable Task

**状态：`PLANNED / PROVISIONAL`**

解释为什么执行需要耐久记录，以及产品语境中的 Run 为什么可能落到 task-oriented 的实现概念；精确映射等待研究验证。

### M06 — 到底是谁获得了任务？——Wakeup、Polling、Claim 与并发控制

**状态：`PLANNED / PROVISIONAL`**

解释任务发现、唤醒、轮询、所有权与并发控制，重点区分“知道有任务”和“获得执行权”；详细 claim 机制以未来研究基线为准。

## Part III — 任务到了我的电脑以后发生什么

本 Part 放大 M01 地图的本地执行侧，从机器如何成为 Runtime，一直追到工作目录、上下文和 provider 边界。以下章节只定义读者问题，不承诺未研究的源码路径或事实。

### M07 — 一台电脑为什么能成为 Runtime？——Daemon、Runtime 与 Heartbeat

**状态：`PLANNED / PROVISIONAL`**

解释机器身份、Daemon 生命周期与可用性信号如何共同构成 Runtime；承接 M03 的架构理由，进入具体基础设施。

### M08 — Agent 在哪里工作？——Execution Environment、Workdir 与本地资源

**状态：`PLANNED / PROVISIONAL`**

解释一次任务如何获得隔离或受控的工作位置，以及仓库、工具和本地资源如何进入执行环境。

### M09 — Coding Agent 最终到底“看见”了什么？——Context Assembly

**状态：`PLANNED / PROVISIONAL`**

解释任务、指令、项目知识与运行时信息如何组成 Agent 可见上下文，同时区分来源、优先级和证据边界。

### M10 — Multica 为什么能接 20 多种 Coding Agent？——Provider Adapter

**状态：`PLANNED / PROVISIONAL`**

解释稳定编排语义如何跨越不同 Coding Agent 的进程、输入输出与能力差异；具体 provider 协议等待研究。

## Part IV — 一个分布式 Agent 系统如何保持可靠

本 Part 放大 M01 地图中的返回路径、实时通道和故障路径。目标是把 Multica 教成一个可观测、可恢复的分布式运行时，而不只是 happy-path launcher。

### M11 — Agent 的输出怎样回到网页？——Messages、Progress 与 Result Pipeline

**状态：`PLANNED / PROVISIONAL`**

解释执行过程中的消息、进度与最终结果如何跨边界传播、被记录并呈现给用户。

### M12 — 为什么 Multica 有两套 WebSocket？——Realtime 与 DaemonWS

**状态：`PLANNED / PROVISIONAL`**

解释面向用户的实时更新与面向执行侧的通信为何承担不同责任，避免把“实时”误解为单一通道。

### M13 — 机器断网、Daemon 崩了怎么办？——Failure、Retry 与 Recovery

**状态：`PLANNED / PROVISIONAL`**

解释故障如何被观察、状态如何保持可信、工作如何重试或恢复，以及系统如何避免把瞬时失败当成不可逆结果。

## Part V — Agent 不再是一个孤立的 CLI

本 Part 放大 Agent 的持续上下文、可复用能力与协作层，说明本地 worker 如何进入长期对话和自动化系统。

### M14 — Agent 如何持续对话？——Mention、Comment、Chat 与 Steering

**状态：`PLANNED / PROVISIONAL`**

解释后续输入如何进入已存在的工作上下文，以及协作对象与运行中控制之间的边界。

### M15 — 一个 Skill 是怎样真正进入 Agent 的？——从 Workspace Knowledge 到 Runtime

**状态：`PLANNED / PROVISIONAL`**

解释可复用知识如何被组织、选择并带入运行时上下文，同时保持来源与作用域清晰。

### M16 — Squad 到底是不是“多智能体并行”？——Leader Routing 与协作协议

**状态：`PLANNED / PROVISIONAL`**

建立边界：Squad 主要通过 leader 做协调与路由，不等同于自动并行 fan-out。本架构仅保存这一已验证边界，不扩写章节实现内容。

### M17 — Autopilot 是怎么让 Agent 系统自己运行的？——Schedule、Webhook 与 Durable Automation

**状态：`PLANNED / PROVISIONAL`**

解释计划与外部事件如何驱动可持续、可追踪的自动化工作，而不是把自动化简化成一次性脚本。

## Part VI — 从 Agent Runtime 回到完整工程系统

本 Part 把此前的对象、边界、执行、可靠性和协作重新组合为工程系统，并检验读者能否从架构问题追到可验证证据与交付结果。

### M18 — Multica 怎样守住系统边界？——Workspace、Access 与 Task-scoped Identity

**状态：`PLANNED / PROVISIONAL`**

解释组织范围、访问控制与任务级身份如何共同限制 Agent 能看见和能执行的内容。

### M19 — 从 Issue 到 PR：把所有机制重新串起来

**状态：`PLANNED / PROVISIONAL`**

用一个端到端工程交付重新串联全书机制，形成综合模型；它不是另一个孤立子系统的深挖。

## 稳定性模型与滚动课程规则

- **`GOLDEN`**：已实现、已评审，并作为质量范例使用。当前仅 M01。
- **`NEAR_TERM_FROZEN`**：主要读者问题、章节责任、学习结果和非目标已足够稳定，可立即研究与生产；源码发现仍可改变内部小节。当前仅 M02–M03。
- **`PLANNED / PROVISIONAL`**：可能成立的知识边界；标题、拆分/合并、顺序和源码路径都可能改变。当前为 M04–M19。在填写 `CHAPTER_CONTRACT.md` 时使用架构状态 `PLANNED`，正文展示时明确其 provisional 性质。

课程按滚动窗口维护：任何时候只细化并冻结接下来的 2–3 章。完成一到两章后，编辑者必须回看读者已经掌握的知识与最新上游研究，重新评估顺序和边界，再冻结下一小批；不得机械执行 M01 → M19。Learning Squad 可以提出调整建议，但不得静默改写架构；重大调整需要人类课程负责人明确批准。

## Golden Chapter 政策

M01 是教学原则的实例，不是必须复制的标题或目录模板。后续章节应继承这些原则：渐进披露；先架构后 symbol；用教学图和明确标注的伪代码搭建模型；只引用聚焦、必要的生产源码片段；控制术语预算；把 Source Map 放在适合导航而非打断教学的位置；明确区分 SOURCE、DOCS、EXPERIMENT 与推断的证据边界。

具体章节可以根据自己的读者问题改变叙事结构、图的类型和小节安排。评价标准是读者能否解释机制、边界与设计原因，而不是形式上像 M01。

## 章节变更政策

章节生产过程中可以提出标题措辞、内部小节和更明确的非目标，并在评审中记录。以下变化必须提交显式提案并获得人类课程负责人批准：

- Part 重排；
- 合并或拆分章节；
- 新增或删除主要章节；
- 改变章节的主要读者问题。

上游变化可以触发重新评估，但不能静默重写本架构。任何获批调整都应更新版本控制中的本文及受影响章节契约。

## Phase 9 Learning Squad 评审要求

该要求记录自 M01 的生产经验，不在此实现 Reviewer Agent 变更：

- **`FULL_AUDIT`**：用于新章节第一次正式评审、大规模教学重写、研究基线变化，或主要图示/源码证据变化。完整检查章节、来源、图示与构建结果。
- **`FOCUSED_DELTA`**：用于已完成 full audit 之后的修复。审查从已评审 commit 开始的 diff、原有具体 findings，以及少量相关 invariants。当 CI 为绿色且范围未扩张时，不自动重跑整章、全部源码与完整构建审计。

评审模式必须在评审请求和结果中明确标注；若 delta 暴露范围扩大或证据基线变化，应升级为 `FULL_AUDIT`。
