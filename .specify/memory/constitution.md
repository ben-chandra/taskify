<!--
Sync Impact Report
Version change: (template, unratified) → 1.0.0
Modified principles: none (initial ratification)
  - I. Code Quality (new)
  - II. Test-First (NON-NEGOTIABLE) (new)
  - III. UX Consistency (new)
  - IV. Performance (new)
  - V. Simplicity (new)
Added sections: Core Principles (5), Additional Constraints, Development Workflow, Governance
Removed sections: none
Deferred TODOs: none — all placeholders filled.
-->
# Taskify Constitution

## Core Principles

### I. Code Quality
Code MUST pass linting and type-checks before merge. All changes MUST undergo
code review by at least one other contributor before merge. No commit MUST
introduce new linter warnings or suppressed errors without a documented
justification in the pull request.

**Rationale:** Consistent quality gates prevent defect accumulation and keep
the codebase maintainable as contributors and features multiply.

### II. Test-First (NON-NEGOTIABLE)
Tests MUST be written before implementation. Tests MUST be shown to fail
before the corresponding code is written (Red-Green-Refactor). Every bug fix
MUST include a regression test that reproduces the bug. Code MUST NOT be
merged without passing tests covering its behavior.

**Rationale:** Writing tests first forces requirements to be explicit before
implementation starts and catches regressions as soon as they are introduced.

### III. UX Consistency
All user-facing features MUST follow a single, documented set of interaction
and visual patterns. New UI work MUST reuse existing components and patterns
before introducing new ones. Any deviation from established patterns MUST be
justified in the pull request description.

**Rationale:** A consistent experience reduces user confusion and support
burden, and keeps the product coherent as it is built by multiple
contributors over time.

### IV. Performance
Every feature MUST define acceptance performance budgets (e.g., response
time, memory, payload size) before implementation begins. Performance-
sensitive code paths MUST be profiled, and changes MUST NOT regress
established budgets without explicit, documented sign-off. Confirmed
performance regressions MUST block release until resolved or explicitly
accepted.

**Rationale:** Explicit budgets make performance a first-class requirement
instead of an afterthought, preventing silent degradation as the product
grows.

### V. Simplicity
Implementations MUST use the simplest design that satisfies the stated
requirements (YAGNI). Speculative abstractions, unused configuration options,
and premature generalization MUST NOT be added. Any added complexity MUST be
justified in writing against a simpler alternative that was considered and
rejected.

**Rationale:** Simplicity keeps the system easy to reason about, test, and
change as requirements evolve, and lowers the cost of future work.

## Additional Constraints

Technology and implementation choices MUST comply with the Core Principles
above. Any deviation from a Core Principle (e.g., skipping tests for a
throwaway prototype, introducing a new UI pattern outside the existing
library) MUST be explicitly called out and approved in the pull request
before merge.

## Development Workflow

All pull requests MUST be checked against the Core Principles above before
merge. Reviewers MUST reject changes that violate the Test-First or Code
Quality principles unless a documented exception is attached. Compliance
with this constitution MUST be re-checked at each `/speckit-plan` and
`/speckit-implement` run, and any unresolved violation MUST be tracked rather
than silently dropped.

## Governance

This constitution supersedes all other project practices and guidelines.
Amendments require: (1) a documented rationale for the change, (2) an update
to the version number following semantic versioning — MAJOR for backward
incompatible principle removals or redefinitions, MINOR for new or materially
expanded principles/sections, PATCH for clarifications and wording fixes —
and (3) a propagation check across dependent templates (plan, spec, tasks)
for consistency. All pull requests and reviews MUST verify compliance with
this constitution; any added complexity MUST be justified against Principle
V (Simplicity).

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
