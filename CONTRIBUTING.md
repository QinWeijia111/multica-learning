# 参与贡献

## 工作流程

开始前先读 `AGENTS.md` 和 `ROADMAP.md`。普通任务：

1. 从最新的 `main` 创建包含 Issue key 的功能分支。
2. 完成一组范围明确、可独立审查的修改。
3. 提交修改并推送功能分支。
4. 创建目标为 `main` 的拉取请求，等待审查；不要直接推送到 `main`。

正常章节不按角色创建多个 PR，而是遵守 `book/LEARNING_SQUAD.md`：一个 Parent Chapter Issue、共享章节分支、canonical Draft PR，研究、写作、评审与修复都在同一 PR，最终只由人类合并一次。

## 本地开发

站点使用 npm 管理依赖：

```bash
cd site
npm install
npm run dev
```

Astro 会在终端中输出本地预览地址。

## 教程中的 Mermaid 图

教程 MDX 可以直接使用 `mermaid` fenced code block。站点在构建时把它转换为
Mermaid 容器，并在浏览器中使用随站点打包的 Mermaid 渲染 SVG；不会调用远程
渲染服务。站点统一提供亮色主题，图内不要硬编码装饰色。

非平凡图必须配有邻近正文，并建议用 `figure` / `figcaption` 标明图的类别与核心
结论。普通图会在文章宽度内响应式缩放；确实需要保持宽度时，可用
`<figure data-wide>` 包裹 fenced block，让图容器自身横向滚动。不要依赖图形作为
关键结论的唯一表达。

Mermaid 使用客户端渐进增强：JavaScript 不可用时，读者仍可看到原始 DSL；单图
语法错误会在该图位置显示错误，且不会阻断周围文章。当前阅读统计会排除
`mermaid` fence 的 DSL 行，因为“代码行数”只统计教程讲解的程序/源码。

## 生产构建

```bash
cd site
npm run build
```

提交拉取请求前应确认构建成功。

## 持续集成

拉取请求及推送到 `main` 时，GitHub Actions 会在 Node.js 24 上执行：

```bash
cd site
npm ci
npm run check
npm test
npm run build
```
