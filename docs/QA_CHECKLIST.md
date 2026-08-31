# ASTERA Quality Checklist

## Golden workflow

- [ ] Select Bali Villa and see the relevant incident.
- [ ] Open incident intake, switch input mode, analyze, and create a draft.
- [ ] Open quote review and switch between both proposals.
- [ ] Approval cannot proceed without explicit acknowledgement.
- [ ] Approving changes the incident to dispatched and updates the audit timeline.
- [ ] Dispatch plan opens with the authorized vendor and schedule.
- [ ] Reset restores the original demo state.

## Navigation and resilience

- [ ] Every visible button has a working outcome.
- [ ] Escape closes overlays; backdrop clicks close only the active overlay.
- [ ] Focus enters each overlay and remains within it until closed.
- [ ] Body scrolling is locked while an overlay is open.
- [ ] Search returns helpful empty and populated states.
- [ ] Refreshing never implies a real external action occurred.

## Responsive and accessibility

- [ ] 360 px, 768 px, 1024 px, and 1440 px widths remain usable.
- [ ] Keyboard-only users can complete the golden workflow.
- [ ] Focus indicators are visible against the dark theme.
- [ ] Interactive controls have accessible names and sufficient target size.
- [ ] Text and essential status indicators meet contrast expectations.
- [ ] Reduced-motion preference disables non-essential motion.
- [ ] Meaning is never conveyed by color alone.

## Trust and privacy

- [ ] Synthetic-data disclosure is visible.
- [ ] No personal names, real addresses, phone numbers, or credentials exist in the build.
- [ ] No claim of certification, encryption, vendor integration, or AI certainty exceeds implementation.
- [ ] Approval and dispatch language preserves human authorization.
- [ ] Social image and UI artwork are original and contain no third-party marks.

## Release gates

- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Repository secret scan is clean.
- [ ] Deployment URL and Open Graph metadata match.
- [ ] Previous deployment remains available for rollback.
