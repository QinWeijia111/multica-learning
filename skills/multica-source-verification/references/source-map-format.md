# Source Map Format

Use a lightweight YAML list to record the upstream symbols that support an investigation. Each entry must contain fields equivalent to:

- `repository`: upstream repository name;
- `commit`: full commit SHA inspected;
- `file`: repository-relative file path;
- `symbol`: function, type, method, constant, or other identifiable code region;
- `role`: why the symbol matters to the research question;
- `evidence`: one or more labels from [evidence-levels.md](evidence-levels.md).

Example:

```yaml
- repository: multica-ai/multica
  commit: "<full-sha>"
  file: server/internal/example/example.go
  symbol: ExampleFunction
  role: "Short explanation of why this symbol matters"
  evidence: SOURCE
```

The example path and symbol are placeholders. Never copy them into real research without verifying them against the recorded upstream commit.

Prefer stable, symbol-based references with semantic context over fragile line-number-only references. A line number may be added as a convenience, but it must not replace the symbol or explanation of what the code demonstrates.
