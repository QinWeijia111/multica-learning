# GitHub configuration

`workflows/ci.yml` 是仓库的基础持续集成工作流。它在所有拉取请求及推送到
`main` 时使用 Node.js 24 安装锁定依赖，并依次执行 Astro 检查和生产构建。

工作流仅授予仓库内容读取权限；同一分支出现更新时，较旧的运行会自动取消。

`workflows/deploy-pages.yml` 是独立的 GitHub Pages 持续部署工作流。它只在变更
进入 `main` 后或由维护者手动触发时构建 `site/`，上传 `site/dist`，再通过
GitHub Pages environment 部署。部署 job 使用 Pages 和 OIDC 所需的最小写权限，
不会在普通拉取请求分支上运行。
