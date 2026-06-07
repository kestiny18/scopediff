# Contributing to ScopeDiff

Thanks for your interest! ScopeDiff is a small, local-first CLI. Issues and pull
requests are welcome.

## Local setup

Requires Node.js ≥ 20 and git.

```bash
git clone https://github.com/kestiny18/scopediff.git
cd scopediff
npm install
npm run check   # build (tsc) + tests (vitest)
```

Useful scripts:

- `npm run build` — compile TypeScript to `dist/`
- `npm test` — run the test suite
- `npm run dev -- check` — run the CLI from source via tsx

## Project layout

```
src/
  cli/            # commander entry + commands (check, init, intent)
  core/
    analyze/      # diff parsing, file classification, domain detection
    config/       # scopediff.yml schema + loading
    context/      # prompt/keyword parsing (fallback context)
    intent/       # .scopediff/intent.json read/write (declared scope)
    rules/        # SD001..SD019 rule implementations + runner
    report/       # text and json reporters
    agent/        # init templates + Claude Code Stop-hook installer
tests/            # vitest specs
```

## Design principles

ScopeDiff is an **attention router**, not an intent judge. Two principles guide
every change:

1. **Trust over coverage.** A false HIGH costs more than ten missed MEDIUMs.
2. **Heuristics never block.** Only deterministic facts (declared-vs-actual scope
   drift, env/secret/migration/lockfile/CI changes, test/large deletions) may be
   blocking. Keyword/inference-based findings are review hints only.

See [SPEC.md](SPEC.md) for the full model, especially the v0.2 declared-intent
addendum.

## Adding or changing a rule

- Each rule lives in `src/core/rules/sdNNN*.ts` and exports a `Rule`
  (`(input: RuleInput) => Finding[]`). Register it in `src/core/rules/index.ts`.
- Use the `finding(...)` helper. Keep MEDIUM/INFO wording review-oriented
  ("Potential …", "Please review").
- When a declared intent exists (`input.intent`), scope/heuristic rules should
  defer to SD019 to avoid duplicate findings — follow the existing
  `if (input.intent) return [];` pattern.
- Add a test in `tests/` covering both a positive and a negative case.

## Pull requests

- Run `npm run check` before pushing; CI runs the same.
- Keep changes focused. Update `SPEC.md` / `README.md` when behavior changes.
- Dogfooding is encouraged: declare scope with `scopediff intent` and run
  `scopediff check` on your own branch.

## Releasing (maintainers)

```bash
npm version <patch|minor|major>   # bumps package.json + lockfile
# update src/version.ts to match, commit "Release X.Y.Z"
git tag vX.Y.Z && git push origin main --tags
```

Pushing the tag triggers the `Publish` workflow, which builds, tests, and
publishes to npm with provenance via OIDC trusted publishing.
