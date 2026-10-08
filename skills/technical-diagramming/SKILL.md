---
name: technical-diagramming
description: Create or review source-grounded technical diagrams for Multica Learning tutorials, primarily with Mermaid. Use when a Tutorial Writer or Technical Reviewer must select a diagram type, turn verified Multica research into a conceptual or implementation diagram, validate diagram evidence and readability, or review a diagram for technical accuracy and Chinese teaching quality.
---

# Technical Diagramming

把技术图当作教学或技术论证的一部分，而不是装饰。教学图先帮助读者理解架构含义，实现图再提供精确关系。让实现图中的重要节点、状态、边界和箭头与教程使用的已验证研究保持一致。能成功渲染但错误描述系统的图仍是技术错误；技术正确但只能读成 symbol 调用图，也可能是教学失败。

## 1. 先写出读者问题

在画图前，用一句话写出这张图唯一要回答的问题，例如：

- “一次任务是怎样从 Server 到达 Daemon 的？”
- “queued 为什么不会在 wakeup 时直接变成 running？”
- “一次执行在哪几个角色之间依次发生？”
- “Task 有哪些主要状态，什么事件触发状态转换？”

如果问题包含几条无关主线，拆成多张图。优先让一张主教学图只保留约 5–9 个有意义的节点；这是一条可读性指导，不是机械的通过条件。图变密时，拆图、折叠无关细节，或把可选与失败分支移到另一张图，不要靠缩小字体或制造超宽画布解决。

## 2. 选择正确的图类型

根据读者意图选择，而不是默认使用最熟悉的 flowchart：

- `flowchart`：用于架构概览、处理流水线、职责边界，以及因果或步骤关系。
- `sequenceDiagram`：用于回答“谁在什么时候调用谁？”，包括 Server ↔ Daemon ↔
  Provider 交互、API / RPC 流程与事件传播。
- `stateDiagram-v2`：用于回答“一个对象有哪些状态，什么使它转换？”，包括 task、run 与恢复生命周期。

在选择或复核类型时读取
[references/diagram-selection.md](references/diagram-selection.md)。除非章节确实需要，
不要引入更高级的 Mermaid 类型。

## 3. 明确图的类别与语言层

给每张重要图明确标注以下一种类别：

- `TEACHING`：优化首次理解，解释架构角色、语义阶段、因果或状态含义。主要标签使用自然简体中文；准确源码标识符只在确有帮助时作为次要注释。教学标签不必与源码 symbol 一一对应，但教程必须明确说明这是教学图，并且所有行为仍须与已验证研究一致。
- `IMPLEMENTATION`：表示当前已验证的 Multica 实现。按需使用准确的 type、
  function、数据库对象、生命周期状态值和 API / RPC 名称，并与固定的上游
  commit 保持一致。

不要把教学节点与真实源码 symbol 静默混成同一抽象层级。也不要在同一图中并列
系统组件、函数调用、数据库行和外部 Agent，除非它们确实回答同一层级的问题；
通常应拆成教学图、实现流程图和详细 sequence/state 图。

`TEACHING` / `IMPLEMENTATION` 描述图的教学目的，不等于 Mermaid 类型。两类图都可以使用最适合问题的 flowchart、sequence 或 state diagram。教学图也不得为简洁而画出错误关系；实现图也不得以精确为由忽略目标读者的可读性。

## 4. 建立证据边界

绘制 `IMPLEMENTATION` 图前，先记录：

- 研究产物路径；
- 上游仓库；
- 上游完整 commit SHA；
- 相关 Source Map 与 Execution / Call Chain；
- Research Note 中与该图有关的 Open Questions。

把每一条实现箭头视为技术主张。证明 A 存在的 `SOURCE` 加上证明 B 存在的
`SOURCE`，并不能证明 `A → B`；还必须有证据支持这次调用、转换或依赖本身。
绝不因为某条边让架构“看起来合理”就添加它。

读取
[references/source-evidence-rules.md](references/source-evidence-rules.md)
后逐项核对节点和边。不要把 `INFERENCE` 画成已验证的实线关系。缺乏证据时，
优先从 source-verified 图中省略该关系并报告研究缺口；只有在不确定性本身是教学
内容时，才明确标出它。

`TEACHING` 图可以抽象源码边界和名称，但不能发明参与者、状态变化或因果。对主要关系使用同一 Research Note 复核；若图刻意合并多个实现步骤，在邻近正文说明这一抽象。

## 5. 编写 Mermaid

优先使用受版本控制的 Mermaid 表达严格技术流程。读取 [references/mermaid-style.md](references/mermaid-style.md)，并遵循以下核心规则：

- 分离短小稳定的 node ID 与展示标签；
- `TEACHING` 图的主要标签表达中文架构含义，准确源码标识符仅作次要坐标；`IMPLEMENTATION` 图按问题需要让准确状态、协议或 symbol 成为主标签；
- 为不显然的箭头标出 call、HTTP、WebSocket、RPC、数据库写入、状态转换、通知或依赖等语义；
- 不在单张图里硬编码装饰性色彩，优先让站点 renderer 负责主题；
- 针对窄文章栏优化；`flowchart LR` 过宽时改用 `TD`、缩短标签或拆图；
- 使用 subgraph 只表达真实边界或有意义的分组。

只有研究证据支持对应关系时，才使用这类明确的箭头标签：

```text
Server -- best-effort wakeup --> Daemon
Daemon -- claim request --> Server
ClaimAgentTask -- queued → dispatched --> agent_task_queue
```

例如教学图可写“数据库确认执行权”，把 `ClaimAgentTask` 留给邻近源码定位；实现图则可保留 `ClaimAgentTask` 并用“权威认领”解释其作用。不要发明 `认领智能体任务函数` 这样的中文源码 symbol。

## 6. 提供文本 fallback

在每张非平凡图附近添加简洁 caption 或文字说明，直接陈述读者应学到的结论。即使 Mermaid 无法渲染或读者无法检查图形，正文仍须包含关键技术事实。图用于补充教程，不能成为关键结论唯一出现的位置。

## 7. 验证与评审

交付前复制 [templates/diagram-review.md](templates/diagram-review.md) 进行复核，并确认：

1. Mermaid 语法能够解析并成功渲染。
2. 节点和箭头语义与固定 commit 下的研究证据一致。
3. `TEACHING` / `IMPLEMENTATION` 类别已明确，语言层符合该类别。
4. 源码标识符、状态值和协议名准确。
5. 图在目标文章宽度与移动端仍可读。
6. 附近存在文字摘要或 caption。
7. 未决问题和 `INFERENCE` 没有被视觉确定性掩盖。
8. 教学图不要求读者先记 symbol 才能说明图意；实现图的精确性没有造成无法阅读的原始调用图。

语法正确只是必要条件，不是充分条件。Reviewer verdict 只能为 `PASS` 或
`REQUEST_CHANGES`；任何关键边缺乏证据、实现术语错误、图无法在目标表面阅读，或教学图只是可视化一串标识符时，使用 `REQUEST_CHANGES`。

## 设计参考

本 Skill 的方法参考了以下 MIT-licensed Agent Skills，并针对 Multica Learning 的
源码验证、简体中文教程和 Research Note 流程重新设计；它们不是项目运行时依赖，
也未原样复制其内容：

- `arjunprabhulal/agent-skills`, `skills/docs/diagramming`, commit
  `42dd24080fce6d731d00e2a1134f398c3da4171b`（MIT，Arjun Prabhulal）。
- `magnus919/agent-skills`, `mermaid-diagrams`, commit
  `96fbe0780a2fc2b7d063b613bfc1a5767e11b5d7`（MIT，Magnus Hedemark）。
