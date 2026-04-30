# Login Scope Drift Demo

Prompt:

```text
fix login empty password returns 500 instead of 400
```

Example changed files:

- `src/auth/LoginController.ts`
- `src/auth/LoginController.test.ts`
- `src/payment/PaymentService.ts`
- `package.json`

Expected findings:

- SD001 HIGH for `package.json`
- SD008 MEDIUM for `src/payment/PaymentService.ts`
- SD017 INFO for the test update
