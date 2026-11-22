// Turns mcpcheck's JSON report into step outputs and a job summary.
//
// Much of the report comes from the server under test: its name and version, tool names,
// and finding messages that quote what it advertises. A hostile server controls all of
// that, so nothing from the report is written raw:
//   - outputs use the heredoc form with a random delimiter, and every value is one line,
//     so a newline in a server name cannot add a line like `total=0`;
//   - the summary escapes HTML and Markdown, so a message cannot inject markup or links.
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

const file = process.argv[2];
const r = JSON.parse(readFileSync(file, "utf8"));
const s = r.summary ?? {};
const tools = Array.isArray(r.tools) ? r.tools : [];
const findings = Array.isArray(r.findings) ? r.findings : [];

const count = (v) => (Number.isSafeInteger(Number(v)) && Number(v) >= 0 ? Number(v) : 0);
// One line: no control characters (CR and LF included) and no Unicode line separators.
const oneLine = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").trim();
// Safe inside Markdown text and table cells: HTML entities first, then a backslash before
// every character Markdown gives a meaning to (| included, for tables).
const md = (v) =>
  oneLine(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\\`*_{}[\]()#+\-.!|~:@]/g, "\\$&");
const code = (v) => `<code>${md(v)}</code>`;

const total = count(s.total);
const errors = count(s.errors);
const warnings = count(s.warnings);
const server = oneLine(`${r.server?.name ?? ""} ${r.server?.version ?? ""}`);

if (process.env.GITHUB_OUTPUT) {
  const delimiter = `ghadelimiter_${randomBytes(16).toString("hex")}`;
  const outputs = { total, errors, warnings, tools: tools.length, server, report: oneLine(file) };
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs)
      .map(([k, v]) => `${k}<<${delimiter}\n${v}\n${delimiter}\n`)
      .join(""),
  );
}

const lines = ["## mcpcheck", "", `${code(server)} · ${tools.length} tool(s)`, ""];
if (total === 0) {
  lines.push("No problems found.");
} else {
  lines.push(`**${total} finding(s)** — ${errors} error(s), ${warnings} warning(s).`, "");
  lines.push("| | Rule | Tool | Problem |", "| --- | --- | --- | --- |");
  const shown = findings.filter((f) => f.severity === "error" || f.severity === "warn").slice(0, 40);
  for (const f of shown) {
    const icon = f.severity === "error" ? "🔴" : "🟡";
    lines.push(`| ${icon} | ${code(f.rule)} | ${f.tool ? code(f.tool) : "_server_"} | ${md(f.message)} |`);
  }
  if (total > shown.length) lines.push(`| | | | …and ${total - shown.length} more |`);
}
const info = findings.filter((f) => f.severity === "info");
if (info.length) lines.push("", ...info.map((f) => `ℹ️ ${md(f.message)}`));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
