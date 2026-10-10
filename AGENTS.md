# Repository Agent Guidelines

本文件是 Agent 进入仓库后的路由器，不是项目介绍或进度副本。

## 开始工作

在任何实质性工作前：

1. 先读 `ROADMAP.md`，从仓库而不是旧聊天、旧 Issue 或 PR 描述确认当前阶段、下一项允许动作和人类 gate。
2. 判断任务类型，按下表选择权威入口。
3. 只读取完成该任务所需的最小文档集，再检查相关实现。

**Do not scan the entire repository “just in case”. Route first, then inspect.**

## 权威路由

| 需要了解或完成 | 权威入口 |
| --- | --- |
| 当前阶段 / 下一项工作 | `ROADMAP.md` |
| 全书课程结构 | `book/BOOK_ARCHITECTURE.md` |
| 新章节 Contract 模板 | `book/CHAPTER_CONTRACT.md` |
| 已实例化的单章责任 | `book/contracts/<MODULE>.md` |
| Squad 协作流程 | `book/LEARNING_SQUAD.md` |
| 源码研究 | `skills/multica-source-verification/` |
| 教程写作 | `skills/source-dive-writing/` + M01 Golden Chapter |
| 技术图 | `skills/technical-diagramming/` |
| Git / 分支 / PR 流程 | `skills/repository-workflow/` |
| 已有证据 | `research/` |
| 上游版本 | `sources/` |
| 站点实现 | `site/` |
| 有意义的历史变化 | `CHANGELOG.md` |

任务专属文件拥有其领域事实；不要在其他文档复制详细、易变的状态。人类项目入口是 `README.md`，但当前工作状态始终以 `ROADMAP.md` 为准。

## 全局不变量

- 面向读者的研究、教程和界面文案默认使用简体中文；精确源码标识符、代码与命令不翻译。
- 技术结论必须能追溯到固定的上游 Multica commit 和已验证证据。
- 常规功能工作不直接进入 `main`；使用功能分支和 review-only PR。
- 正常章节使用一个 Parent Chapter Issue、一个共享章节分支和一个 canonical PR；Agent 不合并章节 PR。
- 课程结构或冻结状态的人类 gate 不得由 Agent 静默绕过。
- 可确定执行的检查应尽可能进入 CI；本地检查与 CI 证据边界必须明确。

## 状态责任

- 当前工作状态：`ROADMAP.md`
- 课程结构与排序理由：`book/BOOK_ARCHITECTURE.md`
- 单章 Contract 模板：`book/CHAPTER_CONTRACT.md`
- 已实例化的单章责任：`book/contracts/<MODULE>.md`
- Squad 协作：`book/LEARNING_SQUAD.md`
- 仓库路由：`AGENTS.md`
- 具体工作方法：`skills/`
- 历史重要变化：`CHANGELOG.md`
- 人类项目入口：`README.md`
