# ScopeDiff

[![npm](https://img.shields.io/npm/v/@scopediff-dev/cli.svg)](https://www.npmjs.com/package/@scopediff-dev/cli)
[![CI](https://github.com/kestiny18/scopediff/actions/workflows/ci.yml/badge.svg)](https://github.com/kestiny18/scopediff/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@scopediff-dev/cli.svg)](LICENSE)

> Status: early (v0.2). Useful today; the CLI surface and rules may still change.

Let AI write code without letting it rewrite your project.

ScopeDiff reports when AI-generated code changes drift outside the scope a task
declared. It runs locally, requires no API key, and works with Cursor, Codex,
Claude Code, and other AI coding workflows.

Most AI code review tools ask:

> Is this code good?

ScopeDiff asks:

> Was this code supposed to change?

## How it answers that

ScopeDiff does **not** try to guess your intent from a prompt. Instead, the task
declares its scope up front — the paths it expects to touch — and ScopeDiff
compares the actual diff against that declaration. It is an **attention router**:
it points you (or your agent) at the few changes that fall outside the declared
scope, and gets out of the way for everything that's in scope.

Its guiding principle is **trust over coverage**: only high-confidence facts
(an undeclared dependency/lockfile/migration/CI/secret change) ever *block*.
Fuzzy, inferred findings are surfaced for review but never block.

## Why ScopeDiff

AI coding agents are useful, but they drift: touching unrelated modules,
changing dependencies, deleting tests, or rewriting build files while solving a
narrow task. ScopeDiff catches that drift before you finish a task or open a PR.

## Installation

Requires **Node.js ≥ 20** and **git**.

```bash
npm install -g @scopediff-dev/cli
```

Or run without installing:

```bash
npx @scopediff-dev/cli check
```

## Declared scope (recommended)

At the start of a task, declare what it should touch:

```bash
scopediff intent --task "fix login empty password returns 400" --allow "src/auth/**"
```

This writes `.scopediff/intent.json`. Then, after changes, check the diff:

```bash
scopediff check
```

Example output (declared `src/auth/**`, but the diff also touched `package.json`
and `src/payment/`):

```text
ScopeDiff Report

Mode:
  scope

Declared scope:
  task: fix login empty password returns 400
  allow: src/auth/**

Summary:
  1 high, 1 medium, 0 info
  3 files, 6 changed lines

High Risk:
  [SD019] High-risk file changed outside declared scope
  file: package.json
  reason: This file was changed but is not covered by the declared scope (src/auth/**). High-risk files require an explicit declaration.
  blocking: true

Potential Scope Drift:
  [SD019] Potential scope drift: file changed outside declared scope
  file: src/payment/PaymentService.ts
  reason: This file was changed but is not covered by the declared scope (src/auth/**). Please review whether it belongs in this task.

Result:
  failed because 1 blocking finding(s) were found.
```

Files inside the declared scope (and test files) stay silent. An undeclared
high-risk file blocks; an undeclared ordinary source file is a non-blocking
review note; an undeclared docs file is informational.

## Without a declaration

If there is no `.scopediff/intent.json`, ScopeDiff degrades gracefully:

- **Deterministic danger tripwires still fire on fact** — env/secret changes,
  test deletion, and large deletions are flagged regardless of scope.
- **Keyword heuristics become a best-effort fallback** — it guesses task domains
  from a prompt or branch name. These findings are review hints and **never
  block**.

You can still pass context explicitly:

```bash
scopediff check --prompt "fix login empty password returns 400"
scopediff check --prompt-file task.md
```

## Diff source

```bash
scopediff check            # git diff HEAD (all tracked changes)
scopediff check --staged   # git diff --staged
scopediff check --base main # git diff main...HEAD
```

## Agent workflows

```bash
scopediff init cursor
scopediff init codex
scopediff init claude
```

Execution differs by tool, and ScopeDiff is honest about it:

| Tool | Enforcement | How |
| --- | --- | --- |
| **Claude Code** | **Hard** | `init claude` installs a `Stop` hook (`scopediff check --hook`) that runs automatically before the agent finishes and sends it back on blocking findings. Merged into `.claude/settings.json`. |
| **Cursor** | Soft (best-effort) | `.cursor/rules/scopediff.mdc` asks the agent to declare scope and check. The agent may skip it. |
| **Codex** | Soft (best-effort) | `AGENTS.md` asks the agent to declare scope and check. The agent may skip it. |

> Deterministic post-turn hooks for Cursor and Codex are not yet supported here;
> on those tools enforcement is best-effort until that is verified.

## Configuration

```bash
scopediff init   # writes scopediff.yml
```

ScopeDiff reads `scopediff.yml` from the current project.

## Exit codes

- `0`: passed
- `1`: blocked by findings at or above the configured `fail_on` (default: HIGH)
- `2`: runtime or config error

## Rules

Findings carry an ID (`SD001`–`SD019`). The full rule list, severities, and the
declared-intent model are documented in [SPEC.md](SPEC.md).

## Privacy

ScopeDiff runs locally. Your code, diffs, and task context are not uploaded. No
API key is required. No LLM is used — semantic judgment, when needed, is left to
the coding agent already in your editor.

## Roadmap

- v0.1: CLI, local rules, config, Risk Mode, Agent Pack
- v0.2: declared-intent scope engine, Claude Code Stop hook, honest agent docs
- v0.2.x: verify Cursor/Codex hooks, file-level scope precision, more rules
- v1.0: PR bot, team policies, dashboard

## Contributing

Issues and PRs are welcome. Local setup:

```bash
git clone https://github.com/kestiny18/scopediff.git
cd scopediff
npm install
npm run check   # build + tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for project layout and how rules are
structured.

## License

MIT
