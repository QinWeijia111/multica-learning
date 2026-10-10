# Multica Learning

Multica Learning 是一个以真实源码为证据的中文学习项目，帮助工程师理解 Multica 的架构、运行时、编排机制与实现取舍，而不是只记住一组文件名或 API。

公开学习站点：[qinweijia111.github.io/multica-learning](https://qinweijia111.github.io/multica-learning/)

## 为什么做这个项目

Multica 横跨 Web 产品、持久化调度、本地 Daemon、Coding Agent provider 与多人协作。单独阅读目录很难建立整体模型。本项目把经过验证的源码研究转化为可阅读、可复查的教程，并明确区分源码事实、文档语义、实验观察与推断。

全书采用 **map → journey → zoom-in → synthesis（地图 → 旅程 → 放大 → 综合）**：先通过一次完整旅程建立整机地图，再沿关键边界逐层放大，最后把对象、运行时、可靠性和协作重新连接为完整工程系统。

## 当前进度

- M01 Golden Chapter：已完成；
- M02 产品对象 / 源码对象模型：已完成；
- M03 Control Plane 与 Execution Plane：已完成；
- 下一滚动冻结窗口：等待人类课程复核，尚未选择或启动下一章。

详细生产状态、下一项允许动作与人类 gate 只在 [`ROADMAP.md`](ROADMAP.md) 维护。

## 全书与生产方式

[`book/BOOK_ARCHITECTURE.md`](book/BOOK_ARCHITECTURE.md) 定义全书结构、章节顺序和滚动课程规则；M01 是教学质量范例，而不是要求后续章节复制的标题模板。

正常章节由 Learning Squad 顺序生产：同一个 Parent Chapter Issue、共享章节分支和 canonical Draft PR 依次承载源码研究、教程、审查与修复，Technical Reviewer `PASS` 后才交给人类进行唯一一次合并。完整协议见 [`book/LEARNING_SQUAD.md`](book/LEARNING_SQUAD.md)。

## 源码证据治理

- 每章研究固定一个完整的上游 Multica commit SHA；
- `research/` 保存 Source Map、调用 / 状态路径、证据边界和未决问题；
- `sources/` 记录上游版本与章节基线，不用新章节覆盖旧章节基线；
- 教程中的重要实现主张必须能回到已验证研究；
- `SOURCE`、`DOCS`、`EXPERIMENT` 与 `INFERENCE` 始终分开表达。

## 仓库结构

- `site/`：Astro、React 与 MDX 构建的学习网站和教程；
- `book/`：Book Architecture、Chapter Contract 与 Learning Squad 协议；
- `research/`：按章节保存的源码研究与实验；
- `sources/`：上游版本和章节源码基线；
- `skills/`：可版本控制、可审查的 Agent 工作方法；
- `.github/`：拉取请求 CI 与合并到 `main` 后的 GitHub Pages 部署工作流；
- `ROADMAP.md`：当前阶段、章节生产状态和下一项允许动作；
- `CHANGELOG.md`：有意义的项目变化，不是 commit 日志。

## 本地开发

需要 Node.js 24。安装锁定依赖并启动开发服务器：

```bash
cd site
npm ci
npm run dev
```

提交前运行与 CI 对齐的检查：

```bash
cd site
npm run check
npm test
npm run build
```

## 参与贡献

开始前先读 [`AGENTS.md`](AGENTS.md) 和 [`ROADMAP.md`](ROADMAP.md)，再按任务类型进入最小权威文档集。普通改动使用功能分支和 review-only PR；章节工作还必须遵守共享章节 PR 生命周期。详细工程约定见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 重要文档

- [`ROADMAP.md`](ROADMAP.md)：现在做什么、下一步是什么；
- [`AGENTS.md`](AGENTS.md)：Agent 进入仓库后的路由；
- [`book/BOOK_ARCHITECTURE.md`](book/BOOK_ARCHITECTURE.md)：全书课程结构；
- [`book/CHAPTER_CONTRACT.md`](book/CHAPTER_CONTRACT.md)：研究前的章节责任契约；
- [`book/LEARNING_SQUAD.md`](book/LEARNING_SQUAD.md)：连续章节生产协议；
- [`CHANGELOG.md`](CHANGELOG.md)：历史重要变化；
- [`CONTRIBUTING.md`](CONTRIBUTING.md)：贡献与本地验证。
