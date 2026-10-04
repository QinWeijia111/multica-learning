# Multica Learning

Multica Learning 是一个以真实源代码为依据的中文学习项目，用于理解 Multica 的架构、运行时、编排机制和具体实现。

当前仓库处于基础设施搭建阶段，包含一个最小可运行的 Astro 文档站点，以及为后续源码研究和版本追踪预留的目录。

## 仓库结构

- `site/`：Astro、React 与 MDX 构建的学习网站
- `research/`：源码研究、调用链分析和实验记录
- `sources/`：上游版本、源码映射和章节关联信息
- `.github/`：GitHub 协作配置的预留目录

## 快速开始

```bash
cd site
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

详细协作方式见 `CONTRIBUTING.md`。
