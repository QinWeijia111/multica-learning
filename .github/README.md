# GitHub configuration

`workflows/ci.yml` 是仓库的基础持续集成工作流。它在所有拉取请求及推送到
`main` 时使用 Node.js 24 安装锁定依赖，并依次执行 Astro 检查和生产构建。

工作流仅授予仓库内容读取权限；同一分支出现更新时，较旧的运行会自动取消。
