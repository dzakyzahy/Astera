# ASTERA Quality Checklist

## Golden workflow

- [x] Select Bali Villa and see the relevant incident.
- [x] Open incident intake, exercise text/photo/voice controls, analyze, and create a draft.
- [x] Open quote review and switch between both proposals.
- [x] Approval cannot proceed without explicit acknowledgement.
- [x] Approval is recorded server-side before the separate dispatch checkpoint becomes available.
- [x] Simulated dispatch opens with the authorized vendor and never implies external contact.
- [x] Reset restores the original server and client demo state.

## Navigation and resilience

- [ ] Every visible button has a working outcome.
- [x] Escape closes overlays; backdrop clicks close only the active overlay.
- [x] Focus enters each overlay and remains within it until closed.
- [x] Body scrolling is locked while an overlay is open.
- [ ] Search returns helpful empty and populated states.
- [x] Refreshing never implies a real external action occurred.

## Responsive and accessibility

- [x] 360 px, 768 px, 1024 px, and 1440 px widths remain usable.
- [ ] Keyboard-only users can complete the golden workflow.
- [x] Focus indicators are visible against the light theme.
- [ ] Interactive controls have accessible names and sufficient target size.
- [ ] Text and essential status indicators meet contrast expectations.
- [x] Reduced-motion preference disables non-essential motion.
- [x] Meaning is never conveyed by color alone.

## Trust and privacy

- [x] Synthetic-data disclosure is visible.
- [x] No personal names, real addresses, phone numbers, or credentials exist in the build.
- [x] No claim of certification, encryption, vendor integration, or AI certainty exceeds implementation.
- [x] Approval and dispatch language preserves human authorization.
- [x] Social image and UI artwork are original and contain no third-party marks.

## Release gates

- [x] Lint passes.
- [x] Production build passes.
- [ ] Repository secret scan is clean.
- [ ] Deployment URL and Open Graph metadata match.
- [ ] Previous deployment remains available for rollback.

## Validation evidence — 2026-09-01

- Chrome 152: 360, 768, 1024, and 1440 px viewport checks; no horizontal document overflow.
- Edge 152: mobile visual capture at 390 × 844; Cloud + Sienna layout, trust disclosure, and primary workflow controls render correctly.
- Keyboard: Enter opens quote review, focus enters the dialog, Tab wraps from the last to first control, Escape closes, body scroll restores, and focus returns to the trigger.
- Reduced motion: the active pulse resolves to a single `0.01ms` iteration under `prefers-reduced-motion: reduce`.
- Golden workflow: browser-driven approval and simulated dispatch reached the server, then `POST /api/demo/reset` restored `INC-2026-089` to `AWAITING_APPROVAL`.
