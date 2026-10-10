# Chapter Contract

本契约在广泛源码研究前锁定 M03 的读者问题与章节责任。它不预填未经验证的实现结论；研究发现可以细化内部结构，架构级变更仍遵循 `BOOK_ARCHITECTURE.md` 的审批规则。

## Identity

- **Module**：M03
- **Working title**：为什么 Server 不直接运行 Agent？——Control Plane 与 Execution Plane
- **Part**：Part I — 看见整台机器
- **Architecture status**：`NEAR_TERM_FROZEN`

## Reader Question

为什么 Multica 不让 Server 直接运行 Agent，而要把协调与本地执行分开？

## Prerequisites

- 读者已经从 M01 看过一次 Issue 从分配到本地 Coding Agent 执行、再返回结果的纵向旅程。
- 读者已经从 M02 建立产品概念、源码表示、持久记录与执行资源并非天然一一对应的对象模型，并能区分 Issue、Run/task、Agent、Runtime、Workspace 与 Project。

## Learning Outcome

读者完成本章后，应能解释协调侧与执行侧为何分离，区分 Server、Runtime、Daemon 与 Coding Agent 在这条边界两侧的责任，并据此推理为什么仓库、工具、进程与凭据应尽量留在实际执行工作的一侧，而不是把 Server 想象成远程 shell 或 Agent 进程宿主。

## New Mental Model

本章建立的最小模型是：Control Plane 决定并协调“应执行什么”，Execution Plane 在本地资源与进程边界内完成“如何执行”。它取代“Server 收到 Issue 后亲自启动 Coding Agent，Runtime/Daemon 只是一个远程入口”的常见误解，同时不把这两个 plane 预设为一组未经源码验证的固定组件清单。

## Connection to the Book

- **Previous chapter**：M02 — Multica 里到底有哪些“东西”？——从产品对象到源码对象
- **Inherited unresolved question / misconception**：即使已经认识 Agent、Runtime 与 Run/task，读者仍可能把它们想成全都由 Server 内部直接执行，或把 Runtime、Daemon 与 Coding Agent 当成同一个东西。
- **M01 map area magnified**：Server 与本地 Daemon / Coding Agent 之间的网络、主机和进程边界，以及这条边界两侧各自保留的状态与资源。
- **Next chapter**：未冻结；M03 完成后进入人类课程复核，不自动启动 M04。
- **What this unlocks**：为后续研究 trigger、durable task、wakeup / polling / claim、Runtime / Daemon 生命周期、execution environment 与 provider adapter 提供共同的架构边界，避免把调度机制和本地执行机制混为一谈。

## Source Research Questions

- 哪些服务端入口与服务负责把用户意图转成可协调、可持久化的工作，而不是直接启动 provider 进程？
- Server 通过哪些协议、接口或持久状态与执行侧衔接；这条衔接传递什么，不传递什么？
- Runtime 在服务端数据模型中标识或配置哪些执行能力，它与实际运行的 Daemon 是什么关系？
- Daemon 在本地从领取到执行的最短主路径上承担哪些编排责任，Coding Agent 进程由谁启动？
- 仓库工作区、命令行工具、环境变量或凭据分别在何处被解析、准备或使用；哪些“数据留在本地”的说法能由源码直接证明，哪些只能作为受限推断？
- Server、Daemon 与 provider-specific Coding Agent 之间有哪些可验证的进程边界和调用边界？
- 当前源码以什么语义使用 control plane / execution plane 术语；它们是否构成正式的成对架构定义，教学模型应怎样映射到已验证职责？
- 哪些相邻实现细节必须留给 M05–M10，尤其是 heartbeat、polling loop、claim 竞争、execution environment 内部机制、retry 与 provider protocol？

## Likely Source Areas (Optional Hypotheses)

- 服务端 Issue / task 编排与持久化服务；这是查找“协调而不直接执行”证据的导航假设。
- Daemon 通信边界与本地任务执行入口；这是查找跨边界消息和本地进程创建责任的导航假设。
- Runtime / Daemon 数据模型与 provider / execution-environment 接口；仅用于定位职责关系，不预设其精确映射。
- 数据库 schema / query 与 daemon-side task runner；用于区分耐久协调状态、本地瞬时状态和资源所有权。

## Non-goals

- 不解释 heartbeat、在线 / 离线判定、Daemon 注册与完整 Runtime 生命周期；留给 M07。
- 不展开 Daemon polling loop、wakeup、claim 竞争、任务所有权与并发控制；留给 M06。
- 不解释 execution environment 的隔离、工作目录准备和完整资源注入机制；留给 M08。
- 不解释 provider protocol、各 Coding Agent adapter 的输入输出差异或二十多种 provider 的实现；留给 M10。
- 不解释 retry、故障恢复、stale task 或断网后的状态修复；留给 M13。
- 不枚举所有 trigger，也不完整展开 durable task、context assembly、消息 / 结果管线；分别留给后续相应章节。

## Terminology Budget

- **Control Plane（控制面）**：回答“决定与协调应执行什么”；这是本章命名架构边界的核心术语。
- **Execution Plane（执行面）**：回答“在本地资源与进程边界内如何执行”；必须与控制面成对出现。
- **Daemon**：指承载本地编排和执行衔接的常驻进程；需要与 M02 的 Runtime、与实际 Coding Agent 进程区分。
- **Coding Agent / provider-specific worker**：指最终承担代码工作的具体外部工具或进程；用于避免把产品 Agent、Daemon 和 worker 混为一体。

Runtime、Agent、Run/task、Issue、Workspace 与 Project 沿用 M02，不计为本章新增术语。具体协议名、函数名和状态名只在源码导航或必要证据中出现，不进入核心术语预算。

## Diagram Questions

- 哪一张最小边界图能同时显示 Server、持久协调状态、本地 Daemon、Coding Agent 与本地资源分别位于哪里，而不把教学 plane 冒充源码模块？
- 哪一条最短序列能说明 Server 只协调工作、Daemon 在本地接续并启动 provider-specific worker，同时不展开 polling / claim 的内部算法？
- 如何在图中标出仓库、工具与凭据的证据强度：哪些关系是 `SOURCE`，哪些只是教学抽象或 `INFERENCE`？

## Evidence Requirements

- **SOURCE**：实现主张须绑定固定的上游完整 commit SHA，并定位到支持节点、关系或状态的具体源码证据。
- **DOCS**：说明文档来源、适用版本和它支持的产品语义；不得用文档替代相冲突的实现证据。
- **EXPERIMENT**：记录可复现实验环境、步骤、输入、观察和限制；不得把单次观察推广成未验证的通则。
- 教学模型、伪代码和 `INFERENCE` 必须显式标注，不得伪装为上述三类证据。
- 研究产物应保留 Source Map、证据边界和 unresolved questions；图中的实现关系也需要关系证据。
- “本地资源留在执行侧”必须拆成可核验的小主张；不得从单个路径或环境变量的存在推广为所有仓库、工具和凭据永不离开本机。
- Control Plane / Execution Plane 若不是上游正式、成对的架构定义，必须标为教学架构模型，并逐条映射到已验证职责；零散注释中的单词命中不能升级为正式模块名。

## Completion Test

给读者一个新版本中的任务执行场景：Server 保存了应执行的工作，本地机器最终启动某个 Coding Agent。读者应能不用背诵文件名解释为什么这两个动作跨越协调侧与执行侧，分别指出 Server、Runtime、Daemon、Coding Agent 与本地资源的责任和边界，说明这种拆分解决了什么问题、没有解释哪些生命周期 / 调度细节，并列出升级版本后需要重新核验的证据类型。

## Editorial Notes

- 标题、主要读者问题、Part、学习结果与非目标沿用已冻结的 Book Architecture 边界；当前无需课程级升级。
- “Control Plane / Execution Plane”首先是教学模型；研究已发现两处注释以 `control plane` 指 Server 侧 skill-bundle 来源，但没有成对正式定义，因此仍须避免把概念边界硬等同于目录或单一进程。
- M03 只解释分层责任与架构理由；任何 heartbeat、polling、claim、execution environment 内部或 provider protocol 细节只保留足以证明边界的最小证据，不扩写成生命周期章节。
- M03 耗尽当前滚动冻结窗口；完成并经 Reviewer `PASS` 后应由 Leader 把合并后投影状态设为 `EDITORIAL_REVIEW_REQUIRED`，不得自动启动 provisional M04。
