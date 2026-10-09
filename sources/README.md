# 源码追踪

此目录负责记录学习内容与上游 Multica 源码之间的版本关系，包括：

- 上游 Multica 仓库版本
- 提交快照
- 源码映射
- 章节与源码的对应关系

每个章节必须在研究产物中固定上游完整 commit SHA。需要集中 registry 时，记录应按章节追加，保留各章独立基线；新章节不得覆盖旧章节的 commit。当前没有独立 registry 文件时，以 `research/<chapter>/research-note.md` 中的完整 SHA 为权威基线，不得凭 ROADMAP 或教程发布日期推断源码版本。
