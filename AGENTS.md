# ASTERA Project Instructions

## Mandatory reading (read these first, before any task)

Before writing any code, editing any file, or proposing any change, read these three documents in order:

1. **`docs/PRD.md`** — Product requirements: what ASTERA is, who it serves, the golden workflow, every feature and its priority/status, success metrics, and what is explicitly out of scope.
2. **`docs/DESIGN.md`** — Visual direction: color system (Cloud + Sienna light-mode palette), typography, photography rules, wordmark, and design principles. This supersedes any dark-mode or midnight-indigo/gold references anywhere else in the codebase.
3. **`docs/COMPONENT_SPEC.md`** — Design system: all CSS tokens, spacing scale, typography scale, and component-by-component specifications. Use these tokens; never hardcode hex values or ad-hoc sizes that contradict this spec.

If a task touches UI, styling, or visual output → DESIGN.md + COMPONENT_SPEC.md are binding.
If a task touches features, scope, or product behavior → PRD.md is binding.
If you find a conflict between these docs and other files in the repo, the three docs above take precedence. Flag the conflict before proceeding.

---

## Product boundary

ASTERA is a private estate operations command center. Preserve the incident-to-triage-to-quote-to-human-approval-to-dispatch-to-audit golden workflow. The current build is a synthetic contest prototype and must never imply that a real payment, property control, or vendor dispatch occurred.

## UX direction

- Keep operational surfaces calm, mature, legible, and credible for high-trust decisions.
- Apply the Cloud + Sienna light-mode palette from `docs/DESIGN.md` — not dark mode, not midnight-indigo, not champagne-gold.
- Avoid generic dashboard filler, fake testimonials, fake integrations, and unsupported security claims.
- Treat keyboard access, focus behavior, responsive layouts, reduced motion, empty states, and error recovery as required behavior.

## Engineering standards

- Keep accountable decisions human-authorized and server-enforced when a backend is introduced.
- Separate domain rules from presentation as production services are added.
- Use typed contracts, validation at trust boundaries, idempotency for external actions, and append-only audit events.
- Keep demo data anonymous and synthetic. Never commit secrets or real household data.
- Prefer small, focused changes and document architecture decisions that affect security, data, or workflows.
- Run `npm run check` before merging.

## Completion checklist

Confirm the golden workflow, anonymity guard, trust copy, keyboard behavior, responsive layout, lint, and production build. Update relevant files in `docs/` when product behavior or architecture changes.
