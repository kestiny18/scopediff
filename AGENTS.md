# ScopeDiff

This repository implements ScopeDiff, a local-first CLI that checks whether AI-generated code changes stay within task scope.

Before completing any coding task:

1. Run tests if applicable.
2. Run ScopeDiff:

```bash
scopediff check
```

If a task or spec file exists, use it as context:

```bash
scopediff check --prompt-file task.md
```

If ScopeDiff reports HIGH findings:

- Do not finish the task yet.
- Review the reported files.
- Revert unrelated changes, narrow the diff, or explain why the risky change is necessary.
- Run ScopeDiff again.

Treat MEDIUM findings as review suggestions, not hard blockers.

Project guidance:

- Keep v0.1 local-first and rule-based.
- Do not add LLM, SaaS, PR bot, or network upload behavior.
- Prefer clear rules and predictable output over clever heuristics.
- Keep public docs focused on product behavior, config, rules, privacy, and contribution context.
