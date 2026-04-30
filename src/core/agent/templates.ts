export const cursorRule = `---
description: Use ScopeDiff to check AI-generated code changes before finishing a task
alwaysApply: true
---

# ScopeDiff Rule

Before finishing any coding task, run:

\`\`\`bash
scopediff check
\`\`\`

If there is a task/spec file, prefer:

\`\`\`bash
scopediff check --prompt-file task.md
\`\`\`

If ScopeDiff reports HIGH findings:

1. Do not finalize the task yet.
2. Inspect the reported files.
3. Revert unrelated changes, narrow the diff, or explain why the change is required.
4. Run ScopeDiff again.

MEDIUM findings are not blockers, but should be reviewed and briefly mentioned.
`;

export const codexSection = `# ScopeDiff

Before completing any coding task:

1. Run tests if applicable.
2. Run ScopeDiff:

\`\`\`bash
scopediff check
\`\`\`

If a task or spec file exists, use it as context:

\`\`\`bash
scopediff check --prompt-file task.md
\`\`\`

If ScopeDiff reports HIGH findings:

- Do not finish the task yet.
- Review the reported files.
- Revert unrelated changes, narrow the diff, or explain why the risky change is necessary.
- Run ScopeDiff again.

Treat MEDIUM findings as review suggestions, not hard blockers.
`;

export const claudeSection = `# ScopeDiff

After making code changes and before final response, run:

\`\`\`bash
scopediff check
\`\`\`

When working from a task/spec file, run:

\`\`\`bash
scopediff check --prompt-file task.md
\`\`\`

If ScopeDiff reports HIGH findings:

1. Stop before finalizing.
2. Inspect the findings.
3. Remove unrelated or risky changes unless explicitly required.
4. Re-run ScopeDiff.

Mention any remaining MEDIUM findings in the final response.
`;
