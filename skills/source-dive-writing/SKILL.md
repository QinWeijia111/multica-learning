---
name: source-dive-writing
description: Transform verified Multica source research into clear Chinese source-code learning material. Use when drafting or revising Multica Learning tutorials, chapters, or explanations for Chinese-speaking programmers who need a source-grounded introduction to Agent runtimes, distributed systems, backend infrastructure, or a large production codebase.
---

# Source Dive Writing

把已验证的研究证据转化为自然、易懂且可追溯的简体中文教程。首要目标是让读者先理解架构问题、机制与设计取舍，再按需追踪准确源码；不是让读者先记忆 symbol。写作前阅读 [references/teaching-flow.md](references/teaching-flow.md) 与 [references/chinese-technical-style.md](references/chinese-technical-style.md)，新建章节时复制 [templates/chapter-outline.md](templates/chapter-outline.md) 作为起点。

## 1. 从已验证的研究开始

优先从已有研究产物开始，通常是 `research/<topic>/research-note.md`。动笔前确认并阅读：

- 上游 `multica-ai/multica` 的完整 commit SHA；
- Research Question；
- Source Map；
- 已验证的 Execution / Call Chain；
- Evidence Table；
- Documentation Differences；
- Open Questions；
- Tutorial Implications。

把 `SOURCE`、`DOCS`、`EXPERIMENT` 和 `INFERENCE` 当作证据等级，而不是行文装饰。若重要教学结论缺少研究支持，明确报告证据缺口；不要用听起来合理的实现细节补齐它。缺失基线、关键源码不可用或存在无法消除的冲突时，停止扩写相关结论并保留未决问题。

## 2. 先铺垫，再提出可观察问题

先用具体场景讲清本章讨论的系统用途、必要概念、主要角色及其职责，再进入问题驱动。对于零基础入门章，整体架构图与端到端旅程应在机制问答之前出现；后面的架构综合只能深化前置图，不能承担首次展示全貌的责任。问题出现前，读者应已理解其中的对象、操作和约束。

可观察问题用于推进已经建立的上下文，例如“任务已经保存，为什么通知还不授予执行权？”。回答要连贯说明发生了什么、为何需要该机制、它怎样连接前后步骤；不要用连续自问自答和一句话短答案代替基础讲解，也不要以目录树、类型声明或函数调用链开场。

## 3. 先建立最小心智模型

在展示生产源码前，给出能解释问题的最小教学模型，例如：

```text
Issue → Run → Runtime → Daemon → Coding Agent
```

明确标注这是“教学模型”，标签优先使用自然简体中文表达架构含义。除非已由源码验证，不要暗示概念名称就是实际 symbol、type、service、table 或 API 名称。

## 4. 让具体旅程先于源码坐标

按主题需要采用以下主线：

```text
具体场景与必要概念
→ 前置架构图与角色职责
→ 一个端到端具体旅程
→ 有上下文的可观察问题与真实约束
→ 逐个机制解释
→ 架构综合
→ 设计含义
→ 易混点与快速复习
→ 可选的源码导航附录
→ 精确调用链 / Source Map
→ 源码基线与证据
```

端到端旅程使用“保存待执行任务 → 提醒 Daemon → 请求领取 → 数据库确认执行权”一类语义阶段，不用长串精确 symbol 代替解释。先讲清 happy path，再补充可选分支与失败分支。Source Map 与完整函数调用链默认放在章节末尾，作为源码导航；只有精确调用顺序本身是学习目标时才提前。具体取舍遵循 `references/teaching-flow.md`。

## 5. 保持源码事实不变

- 让所有实现陈述与已验证的研究基线一致。
- 准确保留上游 commit、路径、symbol、状态值、协议名和 API 名称。
- 不把 `INFERENCE` 升级为已验证事实。
- 排除缺乏支持的未决结论，或明确把它们标为 unresolved。
- 若官方文档和源码不同，同时说明两者，并指出结论对应的 commit。

## 6. 控制术语预算

只在概念成为理解障碍时引入术语，不在同一段集中投放大量英文或后端词汇。首次重要使用时写“原子认领（atomic claim）”这类中文含义加英文检索词；后文优先简称“认领”。WebSocket、polling、heartbeat、database transaction、queue、worker、concurrency、process、stdin/stdout、JSON-RPC、source of truth 和 best-effort notification 等词也只解释读懂当前机制所需的部分。源码标识符保持原样。

## 7. 渐进披露源码

机制小节先用自然语言解释，按需接教学图、简化伪代码和聚焦的真实源码，最后才给简短的源码定位。优先采用三层解释：

1. 自然语言解释；
2. 教学伪代码；
3. 聚焦的真实源码片段。

不是每节都需要三层。教学伪代码用于暴露控制流、状态转换、分支、循环、数据移动或角色交互，可以省略校验、日志、兼容分支、重复错误处理、管道代码和无关配置，但必须显著标注为“简化伪代码”或“教学伪代码”，保持已验证语义且不得发明行为。

教学伪代码使用英文变量名、函数名和控制流关键字，配中文 `#` 注释解释语义，例如 `task = save_pending_work()  # 保存待执行工作`；不要使用中文标识符。教学函数名不冒充真实源码 symbol。

真实源码只在能证明或深化一个具体教学点时出现。展示前先告诉读者要观察什么；通常以约 5–25 行为参考，不把行数当硬规则。不要复制大型生产函数，也不要要求读者自行从代码反推架构。完整 Source Map 和精确调用链保留在源码导航附录，不得删除。

## 8. 区分产品概念与实现术语

当两者不同，先教授产品或架构含义，再按需建立源码映射。例如先解释“一次 Agent 执行”，再指出它与研究确认的当前实现术语（如 `AgentTaskQueue`、`agent_task_queue`、`TaskService`、`task_id`）之间的关系。只有研究证据支持时才使用这些实现术语，并说明它们是源码阅读坐标，不是初次理解架构必须背诵的词汇。

## 9. 谨慎解释设计原因

优先采用源码注释、测试、官方文档或架构约束能支持的理由。其他合理解释标为“工程解释”或 `INFERENCE`，并给出推理边界。不要在没有证据时把动机归因给 Multica 作者。

## 10. 使用自然的简体中文

默认使用自然、直接的简体中文和聚焦的解释段落。源码标识符保持原样；标准英文技术词可保留，并在首次重要出现时用中文解释。避免直译腔、学术腔、营销话术、连续反问、重复总结、通用 AI 套话，以及为源码标识符编造中文名称。具体示例与检查项见 `references/chinese-technical-style.md`。

## 11. 完成章节与证据复核

章节正文通常以以下信息收束，标题可略作调整：

- 核心结论；
- 易混点；
- 5 分钟快速复习；
- 可选的源码导航附录；
- Source Map 与精确执行 / 调用链；
- 源码基线 / 研究依据。

交付前逐项核对：问题之前的概念、角色职责和架构铺垫是否足够；伪代码是否使用英文标识符与中文注释；不记函数名能否解释架构；每个机制为何存在是否清楚；陌生术语是否按需引入；图是否解释概念而非仅展示标识符；伪代码是否保持已验证语义；真实源码是否只证明或深化一个明确教学点；精确 symbol 是否能在附录查到；实现结论能否回到研究证据；未决问题是否被夸大；完整 commit SHA、研究产物路径、关键路径与 symbol 是否准确。

若新读者必须先记忆源码函数名才能理解系统行为，章节评审必须失败。若读者必须自行逆向一个大型生产函数才能理解机制，渐进披露也失败。
