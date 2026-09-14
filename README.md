# mcpcheck-action

Runs [mcpcheck](https://github.com/rajanaggarwal11/mcpcheck) against your MCP server in CI: prompt-injection lint over every description the model reads, contract drift against a committed snapshot, tools that hand the model a shell, annotations that contradict the tool's name. **It never calls a tool.**

```yaml
- uses: actions/checkout@v7
- uses: actions/setup-node@v7
  with: { node-version: 22 }
- run: npm ci && npm run build
- uses: rajanaggarwal11/mcpcheck-action@v1
  with:
    server: node ./dist/server.js
```

The step fails when findings remain, writes a table to the job summary, and exposes counts as outputs.

## Contract drift

The first run writes `mcpcheck.snapshot.json`. Commit it. From then on a renamed parameter, a removed tool, or a changed description fails the build with a readable diff, and accepting the change is a reviewable edit to that file in the same PR. Set `snapshot: ""` to skip this rule.

## Inputs

| Input               | Default                  | What it does                                                                                   |
| ------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `server`            | _required_               | Command that starts the server over stdio, or an http(s) URL. Split on whitespace; no quoting. |
| `snapshot`          | `mcpcheck.snapshot.json` | Contract snapshot path. Empty skips `contract-drift`.                                           |
| `strict`            | `false`                  | Fail on warnings too.                                                                          |
| `only` / `ignore`   |                          | Comma-separated rule ids.                                                                      |
| `timeout`           | `15000`                  | Handshake timeout, ms.                                                                         |
| `fail-on-findings`  | `true`                   | `false` reports without blocking. A server that cannot be inspected still fails the step.      |
| `version`           | `latest`                 | mcpcheck version or dist-tag, or the path of a packed tarball.                                 |
| `working-directory` | `.`                      |                                                                                                |

## Outputs

`total`, `errors`, `warnings`, `tools`, `server` (name and version as reported), `report` (path to the JSON on the runner).

```yaml
- id: mcp
  uses: rajanaggarwal11/mcpcheck-action@v1
  with: { server: node ./dist/server.js, fail-on-findings: false }
- run: echo "${{ steps.mcp.outputs.server }} advertises ${{ steps.mcp.outputs.tools }} tools, ${{ steps.mcp.outputs.errors }} errors"
```

## Exit codes

`0` nothing to report · `1` findings remain (only with `fail-on-findings: true`) · `2` the server could not be inspected — it exited, timed out, or answered with something that is not MCP. The server's own stderr is shown in the log so you can see why.

## License

[MIT](./LICENSE) © Rajan Aggarwal
