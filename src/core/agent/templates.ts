export const cursorRule = `---
description: Use ScopeDiff to keep AI-generated code changes within the declared task scope
alwaysApply: true
---

# ScopeDiff Rule

## 1. Declare scope before editing

At the start of a coding task, before changing files, declare the intended
scope so ScopeDiff can check actual changes against it:

\`\`\`bash
scopediff intent --task "<short task description>" --allow "<glob you intend to change>"
\`\`\`

Pass \`--allow\` once per path/glob you expect to touch (e.g.
\`--allow "src/auth/**" --allow "src/auth/**/*.test.ts"\`). Keep it tight: only
declare what the task genuinely needs.

## 2. Check before finishing

Before finishing the task, run:

\`\`\`bash
scopediff check
\`\`\`

If ScopeDiff reports HIGH findings:

1. Do not finalize the task yet.
2. Inspect the reported files.
3. Revert unrelated changes, or — if a change is genuinely required — add its
   path to the declared scope and briefly explain why.
4. Run ScopeDiff again.

MEDIUM findings are not blockers, but should be reviewed and briefly mentioned.
`;

export const codexSection = `# ScopeDiff

## 1. Declare scope before editing

At the start of a coding task, declare the files you intend to change:

\`\`\`bash
scopediff intent --task "<short task description>" --allow "<glob you intend to change>"
\`\`\`

Repeat \`--allow\` for each path/glob. Declare only what the task needs.

## 2. Check before finishing

Before completing the task:

1. Run tests if applicable.
2. Run ScopeDiff:

\`\`\`bash
scopediff check
\`\`\`

If ScopeDiff reports HIGH findings:

- Do not finish the task yet.
- Review the reported files.
- Revert unrelated changes, or add a genuinely required path to the declared
  scope and explain why.
- Run ScopeDiff again.

Treat MEDIUM findings as review suggestions, not hard blockers.
`;

export const claudeSection = `# ScopeDiff

\`scopediff init claude\` also installs a Stop hook that runs
\`scopediff check --hook\` automatically before you finish, so scope drift is
caught even if these steps are skipped.

## 1. Declare scope before editing

At the start of a coding task, before changing files, declare the intended
scope:

\`\`\`bash
scopediff intent --task "<short task description>" --allow "<glob you intend to change>"
\`\`\`

Pass \`--allow\` once per path/glob you expect to touch. Declare only what the
task genuinely needs.

## 2. Check before final response

After making changes and before your final response, run:

\`\`\`bash
scopediff check
\`\`\`

If ScopeDiff reports HIGH findings:

1. Stop before finalizing.
2. Inspect the findings.
3. Revert unrelated or risky changes unless explicitly required; if required,
   add the path to the declared scope.
4. Re-run ScopeDiff.

Mention any remaining MEDIUM findings in the final response.
`;
