# Contributing to ASTERA

## Development flow

1. Start from an up-to-date `main` branch.
2. Create a short-lived branch using the `codex/` prefix for assisted work or a descriptive team prefix.
3. Keep changes focused and include documentation when behavior or architecture changes.
4. Run lint and the production build before requesting review.
5. Describe user impact, test evidence, privacy implications, and rollback steps in the pull request.

## Product guardrails

- Preserve the complete incident-to-resolution golden workflow.
- Keep demo data synthetic and anonymous.
- Never present AI output as an accountable approval.
- Do not add fake certifications, integrations, testimonials, or security claims.
- Keep the Cloud + Sienna identity original, mature, and subordinate to operational clarity; do not introduce mascot or anime-style artwork.
- Treat accessibility, privacy, auditability, and failure states as product requirements.

## Commit style

Use concise imperative messages, for example:

- `Add approval acknowledgement guard`
- `Document production authorization model`
- `Improve mobile incident workflow`

## Definition of done

A change is done when its intended workflow is usable, error and empty states are considered, keyboard access remains intact, no sensitive data is introduced, documentation is current, and lint/build checks pass.
