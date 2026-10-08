# 图示证据规则

## 实现图的基线

把 `IMPLEMENTATION` 图绑定到它使用的 Research Note 和固定的上游完整 commit
SHA。该 commit 是当前图的实现事实基线；较新的文档、印象或另一版本源码不能静默
覆盖它。绘图前检查 Research Note 的 Source Map、Execution / Call Chain、Evidence
Table 和 Open Questions。

若 commit、关键源码或研究产物不可用，停止绘制相关实现结论并报告缺口。不要用合理猜测填满画布。

## 节点证据与边证据分开

节点存在和节点之间的关系是不同主张：

```text
SOURCE 1：证明组件 A 存在。
SOURCE 2：证明组件 B 存在。
未证明：A 调用 B。
```

只有 call site、显式依赖、状态转换、数据写入、消息发送/接收、测试或受控实验等证据支持关系时，才能把 `A → B` 画成实现边。每条实现箭头都应能回答“哪份证据证明这个方向、动作和语义？”

证据审查至少覆盖：

- **节点**：名称、角色、边界或状态值是否由当前基线支持；
- **边**：起点、终点、方向、动作、协议或转换是否由关系证据支持；
- **顺序**：sequence diagram 中的先后是否有 call chain 或事件证据；
- **转换**：state diagram 的事件、guard 与目标状态是否由实现支持。

## 教学图与实现图

允许使用 `TEACHING` 图建立心智模型或解释语义阶段，但必须在图附近明确标注。教学节点无需逐一对应源码 symbol，也不能在没有说明的情况下与真实 function、table 或 API 混用。教学图可以合并不影响当前结论的实现步骤，但角色、方向、状态与因果仍须与研究一致，并在邻近正文说明重要抽象。

`IMPLEMENTATION` 图必须使用当前 commit 下准确的源码术语，并保存对关键节点和边的
证据引用。教学图不能作为实现关系的 SOURCE 证据。

## 保留不确定性

`INFERENCE` 不能静默变成已验证的实现边。遇到推断或证据冲突时：

1. 优先从 source-verified 图中省略该边；
2. 在 review 记录中列出需要继续研究的证据缺口；
3. 只有当不确定性本身是教学对象时，才用显式文字或约定线型标出，并在 fallback 中解释；
4. 不要仅靠颜色表示不确定性。

Research Note 的 Open Questions 是图示边界。除非新增研究解决并更新了问题，否则图不能把其中的未决关系表现为确定事实。

## 证据记录

对重要实现图记录以下内容：

- Research artifact 路径；
- upstream repository 与完整 commit SHA；
- 支持节点的 file、symbol 或状态定义；教学图另记节点代表的架构含义；
- 支持边的 call site、transition、协议、数据操作或实验；
- 仍保留的 Open Questions / `INFERENCE`；
- 证据与图不一致时的 reviewer verdict。

成功渲染只证明语法与 renderer 兼容，不证明技术含义正确。
