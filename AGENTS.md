# Repository instructions for coding agents

## Required verification

Before pushing any commit, run:

```bash
npm run check
```

Do not push when tests or the production build fail. When behavior intentionally changes, update the implementation and its regression tests in the same commit.

## Structural-code safety

- Do not upgrade `REVIEW_REQUIRED` or `UNVERIFIED` evidence to `VERIFIED` without a clause-level source, edition, page, and independently checked calculation case.
- Keep the current mandatory-code set separate from a calculator's historical formula baseline.
- A documentation summary or AI statement is not sufficient evidence that a formula is unaffected by a newer standard.
