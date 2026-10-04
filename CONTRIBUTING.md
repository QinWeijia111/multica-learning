# 参与贡献

## 工作流程

1. 从最新的 `main` 创建功能分支。
2. 完成一组范围明确、可独立审查的修改。
3. 提交修改并推送功能分支。
4. 创建目标为 `main` 的拉取请求，等待审查；不要直接推送到 `main`。

## 本地开发

站点使用 npm 管理依赖：

```bash
cd site
npm install
npm run dev
```

Astro 会在终端中输出本地预览地址。

## 生产构建

```bash
cd site
npm run build
```

提交拉取请求前应确认构建成功。
