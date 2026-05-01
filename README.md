# ScopeDiff

Let AI write code without letting it rewrite your project.

ScopeDiff checks whether AI-generated code changes stay within the intended task scope.

It runs locally, requires no API key, and works with Cursor, Codex, Claude Code, and other AI coding workflows.

Most AI code review tools ask:

> Is this code good?

ScopeDiff asks:

> Was this code supposed to change?

## Why ScopeDiff

AI coding agents are useful, but they can drift: touching unrelated modules, changing dependencies, deleting tests, or rewriting build files while solving a narrow task.

ScopeDiff is a small local CLI for catching obvious scope drift before you finish a task or open a pull request.

## What It Checks

ScopeDiff v0.1 focuses on local rule-based checks:

- dependency, build, lockfile, migration, CI, and env file changes
- test deletion and large production-code deletion
- out-of-scope module changes based on task context
- cross-domain diffs, large diffs, and too many changed files
- docs-only and test-update informational findings

## What It Is Not

ScopeDiff v0.1 is not an AI code review tool, bug detector, security scanner, auto-fixer, PR bot, web SaaS, or enterprise governance platform.

It only asks whether a diff appears to stay within the intended task scope.

## Installation

```bash
npm install -g @scopediff-dev/cli
```

Or run without installing:

```bash
npx @scopediff-dev/cli check
```

## Quick Start

Check the current unstaged git diff:

```bash
scopediff check
```

Check staged changes:

```bash
scopediff check --staged
```

Compare with a base ref:

```bash
scopediff check --base main
```

## Scope Mode

When you provide task context, ScopeDiff checks whether changed files appear related to the task:

```bash
scopediff check --prompt "fix login empty password returns 400"
```

Or:

```bash
scopediff check --prompt-file task.md
```

Example output:

```text
ScopeDiff Report

Mode:
  scope

Context:
  source: prompt
  confidence: high
  summary: fix login empty password returns 400

Diff:
  source: git diff HEAD
  tip: This check includes all tracked changes relative to HEAD. Use --staged to check only selected files.

Summary:
  1 high, 1 medium, 1 info
  4 files, 127 changed lines

High Risk:
  [SD001] Dependency/build file changed without task mention
  file: package.json
  reason: Build/dependency file changed, but task context does not mention dependency, package, build, or upgrade.
  blocking: true

Potential Scope Drift:
  [SD008] Potential scope drift: file may be outside task scope
  file: src/payment/PaymentService.ts
  reason: Task context mentions auth, but this file appears related to payment.

Info:
  [SD017] Test added/updated
  file: src/auth/LoginController.test.ts
  reason: Test changes are allowed and should be reviewed with the related implementation.

Result:
  failed because 1 blocking finding(s) were found.
```

## Risk Mode

When no task context is found, ScopeDiff switches to risk-only mode:

```bash
scopediff check
```

Risk Mode does not judge task scope. It only flags high-risk diff patterns.

## Agent Workflows

Generate agent instructions:

```bash
scopediff init cursor
scopediff init codex
scopediff init claude
```

These commands add ScopeDiff checks to:

- `.cursor/rules/scopediff.mdc`
- `AGENTS.md`
- `CLAUDE.md`

## Configuration

Create a default config:

```bash
scopediff init
```

ScopeDiff reads `scopediff.yml` from the current project.

## Privacy

ScopeDiff runs locally by default.

Your code, diffs, and task context are not uploaded. No API key is required. No LLM is used in v0.1.

## Roadmap

- v0.1: CLI, local rules, config, Scope Mode, Risk Mode, Cursor/Codex/Claude Code Agent Pack
- v0.2: GitHub Action, more rules, better agent docs, improved Chinese support
- v0.3: MCP server, optional BYOK LLM, local LLM experiments
- v1.0: PR bot, team policies, dashboard, private repo CI pricing

## License

MIT
