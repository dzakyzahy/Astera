# ASTERA Project Instructions

## Product boundary

ASTERA is a private estate operations command center. Preserve the incident-to-triage-to-quote-to-human-approval-to-dispatch-to-audit golden workflow. The current build is a synthetic contest prototype and must never imply that a real payment, property control, or vendor dispatch occurred.

## UX direction

- Use the anime-inspired 3D concierge as a memorable, original brand hook.
- Keep operational surfaces calm, mature, legible, and credible for high-trust decisions.
- Preserve the midnight-indigo and champagne-gold visual language.
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
