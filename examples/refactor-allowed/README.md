# Refactor Allowed Demo

Prompt:

```text
refactor auth service naming
```

Example changed files:

- `src/auth/AuthService.ts`
- `src/auth/AuthManager.ts`
- `src/auth/AuthService.test.ts`

Expected findings:

- no SD013 because the task explicitly mentions refactor/naming
- SD017 INFO for the test update
