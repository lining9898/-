# AI-assisted structural calculation architecture

```text
AI structural engineering agent (development and review only)
  |-- Structural Calculation Skill: formulas, units, boundaries, tests
  `-- Code Evidence Skill: original PDFs, clauses, versions, impact review
                 |
              calc-core (deterministic; no AI/OCR/network at runtime)
                 |
          CalculationResult + Evidence
                 |
         report generator + Web calculator
```

## Boundary

- The two Skills guide development and audit. They are not deployed as Netlify functions and do not compute a user's design result.
- `src/core` owns numerical calculations. `src/types/calculation.ts` is the shared output contract; `src/types/evidence.ts` holds the source and review state for each relevant step or check.
- `src/report` turns numerical outputs into `CalculationResult` where a core function does not already return it, then builds the calculation report. `src/components` handles inputs and presentation only.
- A retrieved or OCR-recognized passage is a candidate, not a trusted formula. Confirm it against the original PDF page and the applicable standard version before changing the core. Missing or conflicting evidence remains `REVIEW_REQUIRED`.
- An individual numerical check may pass while the overall status remains `REVIEW_REQUIRED`. The Web UI must not equate that with full design approval.

## Current Migration

The rectangular and T-beam calculators currently assemble evidence in `src/core/beam`; continuous beam, axial column, and material weight use report adapters. Future modules should keep formula evaluation and evidence packaging separate. Migrate older calculators incrementally, preserving numerical regression tests and source traceability; do not rewrite all cores at once.
