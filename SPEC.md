# ScopeDiff v0.1 Public Spec

## Product Definition

ScopeDiff is a local-first CLI that checks whether AI-generated code
changes stay within task scope.

Code review tools ask: "Is this code good?"

ScopeDiff asks: "Was this code supposed to change?"

## Non-Goals

ScopeDiff v0.1 is not:

- an AI code review tool
- a bug detector
- a security scanner
- an auto-fixer
- a PR bot
- a web SaaS
- an enterprise governance platform

It only checks whether AI-generated diffs contain obvious scope drift or
high-risk changes.

## v0.1 Scope

Required:

- npm CLI package
- `scopediff check`
- `--prompt`
- `--prompt-file`
- `--staged`
- `--base`
- `--format text/json`
- `scopediff.yml`
- local rule engine
- Scope Mode
- Risk Mode
- HIGH / MEDIUM / INFO findings
- exit codes
- Cursor / Codex / Claude Code Agent Pack
- README and demo cases

Out of scope:

- LLM integration
- OpenAI, Anthropic, OpenRouter, Ollama, or local LLM calls
- MCP server
- GitHub Action
- GitHub App
- PR bot
- Web UI
- SaaS dashboard
- Jira or Linear integration
- full AST semantic analysis

## Product Modes

### Scope Mode

Enabled when task context is available:

```bash
scopediff check --prompt "fix login empty password returns 400"
scopediff check --prompt-file task.md
```

Scope Mode asks whether the diff appears to stay within task scope.

### Risk Mode

Enabled when no task context is available:

```bash
scopediff check
```

Risk Mode only checks high-risk diff patterns. It does not perform task-scope
judgment.

## CLI

The npm package is published as `@scopediff-dev/cli` because the bare
`scopediff` package name is already occupied. The installed binary remains:

```bash
scopediff
```

Supported commands:

```bash
scopediff check
scopediff init
scopediff init cursor
scopediff init codex
scopediff init claude
scopediff --version
scopediff --help
```

### `scopediff check`

Options:

| Option | Type | Description |
| --- | --- | --- |
| `--prompt <text>` | string | Task description |
| `--prompt-file <path>` | path | Read task description from file |
| `--staged` | boolean | Check staged diff |
| `--base <ref>` | string | Compare against a branch or commit |
| `--format <text/json>` | enum | Output format |
| `--config <path>` | path | Config file path |
| `--fail-on <level>` | enum | Override blocking level |
| `--no-color` | boolean | Disable color |
| `--verbose` | boolean | Print extra detail |

Diff source priority:

1. `--staged` reads `git diff --staged`
2. `--base main` reads `git diff main...HEAD`
3. otherwise reads `git diff HEAD`

Exit codes:

- `0`: passed
- `1`: blocked by findings at or above `fail_on`
- `2`: runtime or config error

Default blocking level: HIGH only.

## Configuration

Config file:

```text
scopediff.yml
```

Supported v0.1 fields:

- `version`
- `risk.fail_on`
- `diff.max_changed_files`
- `diff.max_diff_lines`
- `diff.max_deleted_lines`
- `context.min_prompt_words`
- `context.enable_branch_name`
- `context.enable_commit_message`
- `sensitive_files`
- `sensitive_paths`
- `ignore`
- `tests.patterns`
- `tests.allow_test_changes`

## Rules

| Rule ID | Name | Context Required | Default Severity | Default Blocking |
| --- | --- | --- | --- | --- |
| SD001 | Dependency/build file changed | yes | HIGH | yes |
| SD002 | Lockfile changed | yes | HIGH | yes |
| SD003 | Database schema/migration changed | yes | HIGH | yes |
| SD004 | CI/CD config changed | yes | HIGH | yes |
| SD005 | Env/secret file changed | no | HIGH | yes |
| SD006 | Test deletion | no | HIGH | yes |
| SD007 | Large production-code deletion | no | HIGH | yes |
| SD008 | Out-of-scope module changed | yes | MEDIUM | no |
| SD009 | Cross-domain changes | no | MEDIUM | no |
| SD010 | Large diff | no | MEDIUM | no |
| SD011 | Too many files changed | no | MEDIUM | no |
| SD012 | Formatting noise | no | MEDIUM | no |
| SD013 | Possible rename/refactor | yes | MEDIUM | no |
| SD014 | Sensitive path changed | no | MEDIUM | no |
| SD015 | Low context confidence | yes | INFO | no |
| SD016 | Risk-only mode | no | INFO | no |
| SD017 | Test added/updated | no | INFO | no |
| SD018 | Docs-only change | no | INFO | no |

HIGH findings should be reserved for high-confidence risk. MEDIUM findings
should use review-oriented wording such as "Potential scope drift" and
"Please review."

## Context Resolution

Priority:

1. `--prompt-file`
2. `--prompt`
3. commit message fallback
4. branch name fallback
5. none, which enters Risk Mode

Context confidence:

- `high`: enough words and at least one known domain
- `medium`: enough words
- `low`: too short or broad
- `none`: no context

v0.1 supports a small English and Chinese keyword map for auth, payment,
database, dependency, CI, and docs tasks.

## Output

Text output is human-readable and groups findings by HIGH, MEDIUM, and INFO.

JSON output has this shape:

```json
{
  "version": "0.1.0",
  "mode": "scope",
  "context": {
    "source": "prompt_file",
    "path": "task.md",
    "confidence": "high",
    "summary": "fix login empty password returns 400",
    "keywords": ["login", "password", "auth"],
    "domains": ["auth"]
  },
  "summary": {
    "high": 1,
    "medium": 2,
    "info": 3,
    "changedFiles": 5,
    "changedLines": 742
  },
  "findings": [
    {
      "ruleId": "SD001",
      "severity": "high",
      "title": "Dependency/build file changed without task mention",
      "file": "package.json",
      "reason": "Build/dependency file changed, but task context does not mention dependency, package, build, or upgrade.",
      "blocking": true
    }
  ],
  "result": {
    "passed": false,
    "exitCode": 1
  }
}
```

## Agent Pack

v0.1 supports:

- Cursor via `.cursor/rules/scopediff.mdc`
- Codex via `AGENTS.md`
- Claude Code via `CLAUDE.md`

Agent instructions ask coding agents to run ScopeDiff before finishing a task
and to address HIGH findings before finalizing.

## Demo Cases

### Login bug changed payment and package

Prompt:

```text
fix login empty password returns 500 instead of 400
```

Changed files:

- `src/auth/LoginController.ts`
- `src/auth/LoginController.test.ts`
- `src/payment/PaymentService.ts`
- `package.json`

Expected:

- `package.json`: SD001 HIGH
- `src/payment/PaymentService.ts`: SD008 MEDIUM
- test update: SD017 INFO

### Docs task changed source

Prompt:

```text
update README installation section
```

Changed files:

- `README.md`
- `src/auth/AuthService.ts`

Expected:

- `README.md`: docs info
- `src/auth/AuthService.ts`: SD008 MEDIUM

### Refactor task allows rename

Prompt:

```text
refactor auth service naming
```

Changed files:

- `src/auth/AuthService.ts`
- `src/auth/AuthManager.ts`
- `src/auth/AuthService.test.ts`

Expected:

- no HIGH
- no SD013 because refactor/naming is explicit
- test update is INFO

## Privacy

ScopeDiff runs locally by default.

Your code, diffs, and task context are not uploaded. No API key is required. No
LLM is used in v0.1.

## Roadmap

- v0.1: CLI, local rules, `scopediff.yml`, Scope Mode, Risk Mode, Agent Pack
- v0.2: declared-intent scope engine, Claude Code Stop hook, honest agent docs
- v0.2.x: verify Cursor/Codex hooks, file-level scope precision, more rules
- v1.0: PR bot, team policies, dashboard

---

# v0.2 Addendum: Declared Intent

v0.2 shifts the primary model from *inferring* task scope (keyword guessing) to
*declaring* it. This addendum supersedes the keyword-centric parts of the v0.1
spec above where they conflict.

## Principle

ScopeDiff is an attention router, not an intent judge. **Trust over coverage:**
only deterministic facts block; inferred/heuristic findings never block.

## Declaration: `.scopediff/intent.json`

Written (typically by the coding agent during planning) via:

```bash
scopediff intent --task "<task>" --allow "<glob>" [--allow ...] [--deny ...] [--rationale "..."]
```

Shape:

```json
{
  "version": 1,
  "task": "fix login empty password returns 400",
  "allow": ["src/auth/**"],
  "deny": [],
  "rationale": "optional",
  "createdAt": "ISO-8601"
}
```

Loading: a missing file falls back to keyword/risk mode; a present-but-malformed
file is a config error (exit 2) — it is not silently ignored. Granularity in
v0.2 is directory/glob level; file-level precision is deferred to v0.2.x.

## Resolution order

1. `.scopediff/intent.json` present → **declared scope** is authoritative.
2. Otherwise prompt/prompt-file/commit/branch context → keyword **fallback**
   (heuristic, never blocks).
3. Otherwise → **risk mode** (deterministic danger tripwires only).

## SD019 — declared-vs-actual

Active only when a declaration exists. For each changed file not covered by
`allow` (and not excluded by `deny`), and not a test file:

| Undeclared file | Severity | Blocks |
| --- | --- | --- |
| High-risk category (dependency/lockfile/migration/CI/secret) | HIGH | yes |
| Ordinary source file | MEDIUM | no |
| Docs file | INFO | no |

Declared files and test files produce no scope finding.

## Rule deferral under declared scope

When a declaration exists, the keyword/heuristic scope rules defer to SD019 to
avoid duplicate or noisy findings: **SD001–SD005, SD008, SD009, SD014** return
nothing. Intent-independent fact rules (SD006 test deletion, SD007 large
deletion, SD010–SD012, SD016–SD018) are unchanged. Without a declaration,
v0.1 behavior is preserved (with the v0.1.2 trust fixes below).

## v0.1.2 trust fixes

- Context-required HIGH rules (SD001–SD004) require ≥ medium confidence, so a
  generic branch-name fallback (e.g. `main`) no longer yields false HIGH.
- Path domain detection uses camelCase-aware whole-token matching, fixing
  substring false positives (`authors/` → auth, `reorder` → order).

## Execution tiers

- **Claude Code**: hard execution. `scopediff init claude` installs a `Stop`
  hook running `scopediff check --hook`, which (only on blocking findings)
  emits `{"decision":"block", ...}` so the agent is sent back before finishing.
- **Cursor / Codex**: soft / best-effort via `.cursor/rules` and `AGENTS.md`.
  Deterministic hooks for these tools are not yet verified.
