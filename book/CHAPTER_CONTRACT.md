# Chapter Contract

本文件是可复用模板，不是任何具体章节的 Contract。在广泛源码研究开始前，必须把本模板实例化为 `book/contracts/<MODULE>.md`（例如 `book/contracts/M03.md`），并在该文件中填写章节契约；**禁止原地填写或用具体章节内容替换本模板**。

具体章节的研究、写作与评审始终以对应的 `book/contracts/<MODULE>.md` 为单章责任权威。契约用读者问题锁定章节责任，但不预填未经验证的实现结论；研究发现可以细化内部结构，架构级变更遵循 `BOOK_ARCHITECTURE.md` 的审批规则。

## Identity

- **Module**：Mxx
- **Working title**：
- **Part**：
- **Architecture status**：`GOLDEN` / `NEAR_TERM_FROZEN` / `PLANNED`

## Reader Question

本章只负责回答的一个主要读者问题是什么？

## Prerequisites

读者已经从哪些章节获得了哪些必要模型？不要列源码 symbol。

## Learning Outcome

读者完成本章后，应能用自己的话解释、区分或推理什么？

## New Mental Model

本章新增或修正哪个最小心智模型？它取代什么常见误解？

## Connection to the Book

- **Previous chapter**：
- **Inherited unresolved question / misconception**：
- **M01 map area magnified**：
- **Next chapter**：
- **What this unlocks**：

## Source Research Questions

列出必须通过源码、文档或实验回答的问题。使用问句，不填写猜测性结论。

- （待填写）

## Likely Source Areas (Optional Hypotheses)

仅记录导航假设，例如可能相关的服务、包或目录。它们不是证据，研究后可以被推翻或删除。

- （待填写）

## Non-goals

明确本章不解释什么，以及相关问题留给哪一章。

- （待填写）

## Terminology Budget

列出读者必须新掌握的少量术语；默认保持小规模，并说明为什么不可避免。

- （待填写）

## Diagram Questions

图需要帮助读者看清什么关系、顺序、边界或状态？先写问题，不在研究前固定 Mermaid 拓扑。

- （待填写）

## Evidence Requirements

- **SOURCE**：实现主张须绑定固定的上游完整 commit SHA，并定位到支持节点、关系或状态的具体源码证据。
- **DOCS**：说明文档来源、适用版本和它支持的产品语义；不得用文档替代相冲突的实现证据。
- **EXPERIMENT**：记录可复现实验环境、步骤、输入、观察和限制；不得把单次观察推广成未验证的通则。
- 教学模型、伪代码和 `INFERENCE` 必须显式标注，不得伪装为上述三类证据。
- 研究产物应保留 Source Map、证据边界和 unresolved questions；图中的实现关系也需要关系证据。

## Completion Test

设计一个不依赖背诵文件名、函数名或表名的解释题。读者应能说明机制如何工作、为什么存在、边界在哪里，以及遇到新版本时如何继续验证。

## Editorial Notes

记录尚待人类编辑决定的标题措辞、范围风险、拆分/合并问题或与相邻章节的重叠。不要在这里静默改变全书架构。

- （待填写）
