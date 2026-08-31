# ASTERA

**Private estate operations, orchestrated.**

ASTERA is a responsive command center for principals and professional estate managers. It turns scattered incidents, vendor quotes, approvals, assets, and audit records into one calm workflow with clear human authority.

![ASTERA social preview](public/og.png)

## Why it exists

Premium residences and villas are often operated through chat threads, spreadsheets, calls, and personal memory. That makes urgent work slower, spending decisions harder to verify, and operational history easy to lose. ASTERA presents only the exceptions and decisions that need attention, while preserving the evidence behind them.

## Demonstrated workflow

1. Staff report a water leak at a Bali villa using text, photo, or voice.
2. ASTERA structures the evidence and proposes severity and containment.
3. The estate manager compares normalized vendor quotes.
4. The principal explicitly acknowledges and approves the selected scope.
5. The vendor dispatch and accountable decision appear in the audit trail.

The current competition build uses synthetic in-browser data. It does not contact a real vendor, move money, control a property, or store personal household information.

## Product highlights

- portfolio pulse across Jakarta Residence and Bali Villa;
- incident intake and AI-assisted triage simulation;
- evidence-led quote comparison;
- explicit approval boundary for spend above manager limits;
- dispatch plan, assets, trusted vendors, notifications, search, and audit timeline;
- original anime-inspired 3D concierge used as a restrained visual hook;
- responsive, keyboard-aware overlays with reduced-motion support;
- error, loading, reset, privacy, and synthetic-data states.

## Run locally

Requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality gate

```bash
npm run check
```

This runs the ASTERA anonymity/trust verifier, lint, and the production build. GitHub Actions runs the same gates on pushes to `main` and pull requests.

## Documentation

- [Product brief](docs/PRODUCT_BRIEF.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [90-second walkthrough](docs/WALKTHROUGH.md)
- [Emergent build guide](docs/EMERGENT_BUILD_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Quality checklist](docs/QA_CHECKLIST.md)
- [Roadmap](docs/ROADMAP.md)
- [Submission copy](docs/SUBMISSION_COPY.md)
- [Visual asset notes](docs/ASSET_NOTES.md)

## Trust boundary

AI suggestions are advisory. Accountable people approve spending and dispatch. A production implementation must enforce role and estate scope at the API and database layers, use idempotent external actions, protect evidence, and maintain append-only audit events.

## Repository workflow

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [AGENTS.md](AGENTS.md). The reusable [production app workflow skill](skills/production-app-workflow/SKILL.md) captures the planning, design, prose, quality, and security practices adopted for this and future projects.
