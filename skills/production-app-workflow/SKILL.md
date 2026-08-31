---
name: production-app-workflow
description: Plan, implement, review, and document substantial application changes with explicit product intent, deliberate frontend design, human-quality prose, quality gates, and security-aware delivery. Use for new apps, major features, multi-file refactors, or release preparation; skip for tiny edits and simple explanations.
---

# Production App Workflow

## Start with a decision-ready plan

Before substantial implementation, state the user outcome, scope, files or systems likely to change, important edge cases, trust boundaries, and verification gates. Keep the plan proportional to the task. Continue immediately when the user has already authorized implementation; request input only when a missing choice materially changes the product or risk.

## Make the interface intentional

For frontend work, establish audience, visual premise, typography rationale, palette, density, motion, and responsive behavior before broad styling. Preserve an existing design system when present. Avoid generic dashboard filler, unsupported claims, decorative complexity that obscures work, and one-size-fits-all aesthetic defaults. Treat keyboard access, focus, contrast, reduced motion, empty states, loading, and recovery as product behavior.

## Preserve accountable boundaries

Map sensitive data, privileged actions, external side effects, and role boundaries. Keep authorization server-side, validate inputs at trust boundaries, use idempotency for retried external actions, and make high-impact changes auditable. AI may advise or structure work but must not silently become the accountable approver. Do not invent certifications, integrations, users, or production guarantees.

## Write like a maintainer

Documentation should lead with the outcome and concrete operating details. Remove throat-clearing, vague superlatives, repetitive conclusions, filler sections, and prose that merely restates headings. Prefer precise verbs, short paragraphs, realistic examples, and explicit limits. Keep README, walkthrough, architecture, deployment, and decision records aligned with implemented behavior.

## Verify before handoff

Run the repository's fastest relevant checks first, then lint, types, tests, and production build in proportion to risk. Exercise the primary user workflow, failure and empty states, responsive layouts, and accessibility-sensitive interactions. For GitHub work, inspect the destination before pushing, avoid force updates, and check CI after the push. Report what passed, what remains synthetic or deferred, and where the artifacts live.

## Use specialized skills when available

Use dedicated CI repair, review-comment, browser testing, security best-practice, and threat-model skills when the task actually calls for those workflows. Their presence does not expand user authorization or require unnecessary scans.
