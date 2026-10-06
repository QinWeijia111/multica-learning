---
name: source-dive-writing
description: Transform verified Multica source research into clear Chinese source-code learning material. Use when drafting or revising Multica Learning tutorials, chapters, or explanations for Chinese-speaking programmers who need a source-grounded introduction to Agent runtimes, distributed systems, backend infrastructure, or a large production codebase.
---

# Source Dive Writing

把已验证的研究证据转化为自然、易懂且可追溯的简体中文教程。写作前阅读 [references/teaching-flow.md](references/teaching-flow.md) 与 [references/chinese-technical-style.md](references/chinese-technical-style.md)，新建章节时复制 [templates/chapter-outline.md](templates/chapter-outline.md) 作为起点。

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

## 2. 从具体问题进入主题

每章先提出一个具体工程问题或可观察行为，例如“把一个 Issue 分配给 Agent 以后，为什么我的 Mac 会开始运行 Codex？”。先让读者知道要解释什么，再逐步引入机制；不要以抽象定义、目录树或一组类型声明开场。

## 3. 先建立最小心智模型

在展示生产源码前，给出能解释问题的最小概念模型，例如：

```text
Issue → Run → Runtime → Daemon → Coding Agent
```

明确标注这是“概念模型”，再逐步映射到当前 Multica 实现。除非已由源码验证，不要暗示概念名称就是实际 symbol、type、service、table 或 API 名称。

## 4. 从概念走进实现

按主题需要采用以下主线：

```text
具体问题
→ 为什么需要
→ 最小心智模型
→ 真实 Multica 实现
→ Source Map
→ 主执行 / 调用链
→ 关键代码
→ 为什么这样设计
→ 易混点
→ 工程启示
→ 快速复习
```

先讲清 happy path，再补充可选分支与失败分支。不要在读者理解问题之前倾倒目录结构、大型调用图或所有边界情况。具体取舍遵循 `references/teaching-flow.md`。

## 5. 保持源码事实不变

- 让所有实现陈述与已验证的研究基线一致。
- 准确保留上游 commit、路径、symbol、状态值、协议名和 API 名称。
- 不把 `INFERENCE` 升级为已验证事实。
- 排除缺乏支持的未决结论，或明确把它们标为 unresolved。
- 若官方文档和源码不同，同时说明两者，并指出结论对应的 commit。

## 6. 按需解释后端概念

首次需要时，用当前 Multica 机制简短解释 WebSocket、polling、heartbeat、database transaction、atomic claim、queue、worker、concurrency、process、stdin/stdout、JSON-RPC、source of truth 和 best-effort notification 等概念。只解释读懂当前实现所需的部分，不把章节扩写成通用后端教材。

## 7. 选择性展示源码

优先使用短小且相关的源码片段、简化伪代码、Source Map、调用链图和状态转换图。对伪代码或简化表示作显著标注。不要复制大段源码，也不要制造代码后声称它来自上游。

## 8. 区分产品概念与实现术语

当两者不同，分别教授并建立映射。例如可把产品概念 `Run` 与研究确认的当前实现术语（如 `AgentTaskQueue`、`agent_task_queue`、`TaskService`、`task_id`）并列解释。只有研究证据支持时才使用这些实现术语，并说明读者为什么需要同时理解两套词汇。

## 9. 谨慎解释设计原因

优先采用源码注释、测试、官方文档或架构约束能支持的理由。其他合理解释标为“工程解释”或 `INFERENCE`，并给出推理边界。不要在没有证据时把动机归因给 Multica 作者。

## 10. 使用自然的简体中文

默认使用自然、直接的简体中文和聚焦的解释段落。源码标识符保持原样；标准英文技术词可保留，并在首次重要出现时用中文解释。避免直译腔、学术腔、营销话术、连续反问、重复总结、通用 AI 套话，以及为源码标识符编造中文名称。具体示例与检查项见 `references/chinese-technical-style.md`。

## 11. 完成章节与证据复核

章节通常以以下信息结束，标题可略作调整，但不得丢失内容：

- 核心结论；
- 易混点；
- 工程启示；
- 5 分钟快速复习；
- 源码基线 / 研究依据。

交付前逐项核对：实现结论能否回到研究证据；概念模型是否被误写为源码事实；代码是否确为原文或已标注为简化表示；未决问题是否被夸大；完整 commit SHA、研究产物路径、关键路径与 symbol 是否准确。
