# ASTERA — DESIGN.md

Status: DRAFT v3 — light-mode color revision
Supersedes: DRAFT v2 (dark-mode warm charcoal + champagne-gold system)

---

## 0. Strategic framing (read this before the visual spec)

Before colors and type: a design system alone does not win Building Indonesia. The published rubric weights the categories like this:

| Criterion | Weight |
|---|---|
| Business Impact & Potential to Scale | 30% |
| Upvotes | 20% |
| Problem Solving | 20% |
| Use of Emergent | 15% |
| UI/UX | 15% |

UI/UX is real but it's the smallest slice, tied with "Use of Emergent." The heaviest single criterion is **evidenced business impact** — the judges explicitly say "concrete beats aspirational" and ask for time saved, before/after screenshots, adoption, user feedback. ARCHITECTURE.md's current framing ("all displayed data is synthetic, front-end only") is honest and good engineering practice, but it is the opposite of what scores highest on the heaviest criterion. That tension needs a decision from you, separate from this file:

- **Option A — Pilot framing.** Get ASTERA (or even a stripped-down version of it) actually used by one real estate manager or property owner in Indonesia for even 1–2 weeks before submission. One real incident logged, one real quote comparison, a screenshot of a WhatsApp testimonial. This is the only path to a strong 30%-criterion score. Everything else in this doc still applies.
- **Option B — Honest prototype framing.** Keep it synthetic, but be explicit and confident about *why*: "estate operations software must be piloted with a real principal's real property data, which requires a signed engagement — this submission demonstrates the production-ready interaction model and architecture that pilot will run on." This is a weaker 30%-score but an honest one, and it can still do well on Problem Solving (20%), Use of Emergent (15%), and UI/UX (15%) — that's 55% of the rubric available without fabricating impact data.

Design work below serves either path. But if you have any real contact — a friend who manages a villa, a family office, a property management company in Bali/Jakarta — even one real usage session before Sept 5 is worth more to your score than another week of visual polish. Flagging this now so it doesn't get lost.

---

## 1. Brief change: what's being replaced and why

**Old brief (EMERGENT_BUILD_GUIDE.md):** "midnight-indigo, champagne-gold visual system with restrained anime-inspired 3D concierge artwork as a memorable hook."

**Decision (per your prompt):** anime-inspired 3D concierge is cut entirely, not "restrained" — cut. Reasoning:

1. **Category mismatch.** ASTERA is professional B2B operations software for estate managers and principals — a category adjacent to private banking, family office platforms, and enterprise ops tools. Anime-style 3D mascots read as consumer/entertainment software. In a room of Indonesian judges evaluating "is this credible for a Rp-billions estate," an anime concierge actively works against trust, even if visually striking.
2. **Judging math.** The mascot spends visual budget on "memorable hook" (a marketing goal) while UI/UX is judged on "clarity, usability, and finish from a real user's point of view" (an operational goal). Those aren't the same target. A decorative 3D character competes with data for attention on every screen it appears on.
3. **It doesn't scale as a system.** A mascot is one hero asset. It doesn't tell you what a table row, an approval button, or an audit log entry should look like. The rest of this document exists because *those* are the surfaces judges and real users will actually spend time in.

What replaces it: the memorability now comes from **restraint and material quality** — the kind of confidence a good private bank statement or a Aman-group hospitality interface has. Quiet, precise, expensive-feeling through spacing and typography rather than through an illustrated character.

---

## 2. Visual research grounding

Two reference pools informed this direction:

**Pool A — Indonesian luxury estate/hospitality.** Villa and resort interiors in Bali (Amanjiwo, Amandari-tier, high-end private villa brochures) consistently use: warm neutral stone and timber tones, deep charcoal or espresso as the "dark" anchor rather than saturated indigo, brass/antique-gold as a sparse metal accent (never a fill color), abundant negative space, and photography-led storytelling with very little on-image text. Nothing about these spaces is loud. The luxury signal is silence and material honesty, not ornament.

**Pool B — Premium operational/wealth dashboards.** Private banking and institutional-finance dashboard UI (the kind built for RMs and family offices, not retail apps) favors clean light backgrounds with clear data hierarchy, a single restrained accent color used only for state and action (never decoration), strict data-table typographic hierarchy, and status communicated through color-coded small elements (dots, thin bars, pill labels) rather than illustration. Nothing tries to be delightful; everything tries to be legible under time pressure.

ASTERA's direction sits at the intersection: **hospitality-grade material warmth on a bright, legible operational surface.**

---

## 3. Color system

Cutting "midnight-indigo, champagne-gold" entirely — replacing the dark-mode indigo system with a **bright, neutral light-mode** system. The old palette was too close to generic "AI dashboard" dark themes (indigo+gold appears in every other AI-generated crypto/finance prototype). The new direction is calm, bright, and distinctly premium: true neutral surfaces with a single warm accent (Burnt Sienna) that evokes architectural materiality — terracotta, fired clay, Balinese estate stonework — without falling into the generic beige+brass trap.

### Core surfaces (the actual UI ground)
| Token | Name | Hex | Use |
|---|---|---|---|
| `--surface-base` | Cloud | `#F5F5F5` | App background — true neutral light gray, no warm/cool lean |
| `--surface-raised` | Paper | `#FFFFFF` | Cards, panels, raised surfaces — pure white for lift |
| `--surface-secondary` | Fog | `#FAFAFA` | Alternating table rows, secondary panels |
| `--surface-overlay` | Paper | `#FFFFFF` | Modals, popovers, dropdowns (white + shadow for depth) |
| `--border-subtle` | Mist | `#EBEBEB` | Hairline dividers, card borders |
| `--border-strong` | Stone | `#D4D4D4` | Input borders, focused dividers |

### Text
| Token | Name | Hex | Use |
|---|---|---|---|
| `--text-primary` | Ink | `#171717` | Headings, primary data values — deep neutral black |
| `--text-secondary` | Graphite | `#404040` | Labels, body copy, metadata |
| `--text-tertiary` | Slate | `#737373` | Disabled, placeholder, timestamps |

### Accent — Burnt Sienna, used sparingly
| Token | Name | Hex | Use |
|---|---|---|---|
| `--accent` | Sienna | `#92400E` | Primary actions, active nav state, key numerals only. Never large fills. |
| `--accent-hover` | Sienna Light | `#B45309` | Hover/pressed state — slightly brighter warm brown |
| `--accent-wash` | Sienna Wash | `#FEF3C7` | Very light amber tint for subtle active-state backgrounds, selected row highlights |

### Functional / status (small, semantic use only — incident severity, approval states)
| Token | Name | Hex | Use |
|---|---|---|---|
| `--status-critical` | Garnet | `#B91C1C` | Deep red — critical incidents, destructive actions |
| `--status-warning` | Marigold | `#B45309` | Warm amber — caution states, SLA warnings |
| `--status-good` | Sage | `#15803D` | Forest green — healthy, approved, resolved |
| `--status-info` | Steel | `#1D4ED8` | Deep blue — neutral informational states, AI suggestions |

### Color rules

1. **Accent coverage cap:** Sienna and status colors combined should never exceed roughly 10% of any single screen's surface area. If a screen looks colorful, it has failed this system. The dominant experience should be neutral gray/white surfaces, dark text, and generous space — color appears only where it's meaningful (an action, a state, a number that matters).
2. **No warm-cool mixing:** the surface palette is true neutral (no undertone). Do not introduce warm cream or cool blue-tinted sections. Keep the entire app on the same neutral axis.
3. **Depth via shadow, not color:** surface hierarchy is communicated through subtle box-shadows and border-subtle, not through background color shifts. The Cloud/Paper/Fog range is intentionally narrow — the visual system relies on shadow and spacing, not on a rainbow of gray tints.
4. **Status colors are small:** dots, pill labels, thin bars, icon tints. Never used as section backgrounds, card fills, or large blocks. A status color at card scale means the system is leaking.

---

## 4. Typography

- **Display/headings:** a clean, high-contrast grotesk display — `Geist` or `Inter Display` for headings. Sans-serif headings match the operational, modern register of ASTERA as a professional tool — serif headings would pull toward editorial/magazine, which conflicts with the "instrument panel" feel estate managers need.
- **UI/body/data:** same family at regular weight — `Geist` or `Inter` — with `font-variant-numeric: tabular-nums` enforced on every numeric column (currency, dates, counts). This is non-negotiable for a data-dense operational product — misaligned numerals in tables read as amateur immediately.
- **Monospace (code/IDs):** `Geist Mono` or `JetBrains Mono` for incident IDs, asset codes, timestamps where monospace aids scanning.
- **Scale:** keep it restrained — 5-6 steps max. Estate managers are scanning under time pressure; a huge type scale with many sizes slows recognition rather than aiding it.

**Rule:** one type family throughout. Everything a user reads quickly (tables, statuses, timestamps, buttons) stays in the same grotesk. No serif mixing, no decorative type.

---

## 5. What "operational clarity" means as a design principle here

This is the replacement north star for "anime-inspired 3D concierge as memorable hook":

1. **The incident/audit timeline is the hero, not a mascot.** The golden workflow (water leak -> triage -> quote -> approval -> dispatch -> audit) should be the most visually developed part of the product. That's where craft budget goes.
2. **Every state is legible at a glance.** Severity, approval status, and audit entries use consistent, small, color-coded indicators (dot + label, never color alone — per the accessibility baseline already in ARCHITECTURE.md).
3. **Empty states and loading states are designed, not default.** A command center that looks unfinished in its empty/loading states breaks trust immediately for this audience.
4. **Motion is functional, not decorative.** Transitions confirm state change (a card moving from QUOTING to AWAITING_APPROVAL) rather than performing personality. No bounce, no character animation, no particle effects.
5. **Synthetic-data disclosure is designed as a trust signal, not hidden as a disclaimer.** A quiet, well-typeset "This is a live demo with synthetic data" badge is more credible to a judge than pretending otherwise — and it's already a stated requirement in the build guide.

---

## 6. Photography — zoned, not everywhere

Decision: yes to photography, but **zoned by surface**, not applied uniformly. This resolves a real tension: photography is what makes a showcase screenshot stop the scroll (serves the 20%-weighted Upvotes criterion and general "wow"), but dense photographic surfaces slow down an operator scanning incidents under time pressure (works against the 15%-weighted UI/UX criterion, which is explicitly judged "from a real user's point of view").

**Where photography lives — "hero" and "context" surfaces:**
- Public landing / showcase page (what a judge or voter sees first, before ever opening the app)
- Portfolio grid — each property card carries one photograph as its primary identifier
- Property detail header — a single wide editorial shot anchors the page
- Empty states — a quiet property image is warmer than an icon when a list is empty

**Where photography does NOT live — "instrument" surfaces:**
- Incident table, triage queue, quote comparison, approval modal, audit timeline
- Any view where numbers, statuses, or timestamps are the primary read
- These stay strictly typographic + color-coded status, per S5. This is where "operational clarity" is non-negotiable — an operator comparing two vendor quotes at 11pm during a real leak should never be scanning past a decorative image to find the number that matters.

**Photographic direction (based on reference research):**
Dusk/golden-hour architectural photography, strong horizontal lines, minimal human presence, generous negative sky/water space that can hold UI overlays (card labels, KPI chips) without competing for attention. Think the register of Alila, COMO, Amanjiwo editorial photography — not bright tropical-brochure daylight shots, not staged lifestyle photography with people. The property is the subject; the mood is quiet confidence, matching the "silence as luxury signal" principle from S2.

**Source:** since these are synthetic demo properties (per ARCHITECTURE.md), photography will need to be either (a) licensed stock in the above register, or (b) AI-generated architectural imagery in the same register, clearly consistent with the "all data is synthetic" disclosure already required by the build guide. Recommend a small fixed set (6-10 hero images) rather than one-per-property-forever, reused deliberately across the portfolio so the visual system feels curated, not stock-flooded.

---

## 7. Wordmark

"ASTERA" as a pure wordmark, no symbol/icon mark alongside it — deliberately, to avoid reintroducing a mascot-style problem in miniature (a small icon mark tends to invite illustration, which pulls back toward the thing we just cut in S1).

- **Typeface:** the same display grotesk from S4 (Geist/Inter register), set in caps, wide letter-tracking (roughly +8-12% tracking). Wide-tracked grotesk caps is a clean, modern device used by premium operational brands and quiet luxury services — it does the "memorable hook" job the old mascot brief wanted, at a fraction of the visual cost, and it scales cleanly from a favicon down to a business card.
- **Color:** `--text-primary` (#171717 Ink) in most contexts (it's identity, not an action), never rendered filled in `--accent` as a large block — Sienna is reserved for action/state per S3's 10% rule. A thin Sienna rule or single accent dot beside the wordmark is the *most* ornament this should carry.
- **Lockup:** wordmark alone for the app header (small, top-left, not oversized — this is a tool, not a landing page hero). A slightly larger, more spaced-out version is fine for the public showcase/landing page where making a first impression matters more.
- **What to avoid:** no gradient-filled text, no drop shadow, no icon combination mark, nothing that reads as "generated logo." If a symbol mark is wanted later for favicon purposes only, it should be a single geometric motif abstracted from the estate/compass idea (e.g., a minimal cardinal-point mark) rendered as a thin single-weight line — never a mascot, never 3D, never anime-adjacent.

---

## 8. Export documents (PDF/CSV reports) — same light system, minimal adaptation

Per Pembagian.md module 7 ("cetak laporan family-office"), ASTERA needs printable incident/expense summaries. Since the app is already light-mode, the export template is a natural extension rather than an inversion:

- **Background:** pure white (`#FFFFFF`), not the app's Cloud gray — standard convention for printed documents.
- **Typography:** same grotesk family from S4, dark text on white ground. Brand continuity is automatic.
- **Accent:** `--accent` Sienna still works as a rule/header accent on white; it does not need to change between contexts.
- **Content discipline:** these documents should look like something a family office would actually accept — clean tables, a header with estate/date/prepared-by, no chrome, no UI affordances (buttons, hover states) since they're static output.

---

## 9. Remaining open question

One item still needs your call before `COMPONENT_SPEC.md`:

- **Photo sourcing method** — should I generate the 6-10 hero architectural images now (AI-generated, in the register described in S6) so you can see them against the color/type system, or do you already have real property photography (even placeholder/reference) you want to supply instead?

---

*Next file after this is approved: `COMPONENT_SPEC.md` — translating this into actual token values, spacing scale, and specs for the core screens (portfolio view, incident intake, quote comparison, approval modal, audit timeline).*
