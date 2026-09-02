# Product

## Register

brand

## Users

Owners and operations leads of small-to-mid businesses in Kazakhstan — logistics, retail,
services, light manufacturing. They are not technical buyers. They arrive with a felt pain
("my people spend half the day copying data between systems"), not a technical spec, and
they have usually been burned or spooked by a previous contractor: money up front, result
later, no visibility in between.

Context of use: a phone or laptop, mid-workday, skimming. They are comparison-shopping
between two or three vendors and are looking for a reason to *disqualify* rather than a
reason to buy. The job to be done is: decide in under two minutes whether Ramzur is
straight-dealing and competent enough to be worth one phone call.

The conversion is deliberately small — name and phone, a first call within 24 hours. Not a
contract. The whole page is built to make that one low-commitment step feel obvious.

## Product Purpose

A single-page site of record for Ramzur, an IT company in Kazakhstan working in three
lanes: AI agents, business-process automation, and custom software.

It exists to convert cold traffic into one phone call by removing the perceived risk of
hiring a development contractor. Every section is a risk-reducer: a named four-step
process, explicit guarantees for when things go wrong, a pilot-stage option instead of a
full contract, and a free checklist that lets the visitor self-diagnose before talking to
anyone.

Success looks like a qualified inbound call whose caller already understands what Ramzur
does and is not asking about price first.

## Brand Personality

**Straight-dealing · engineered · unhurried.**

The voice already on the page is the brand: "we don't sell development hours, we sell a
solution to a specific problem", "we'll say plainly if it can be done cheaper than you
assumed". It de-escalates. It never oversells, never uses urgency, and readily narrows its
own scope ("we don't spread ourselves thin") because a stated limit is more credible than
a claim of universal competence.

The interface should feel like an engineer's honest estimate, not a sales pitch:
confident, quiet, precise, and legible. The emotional target is *relief* — the sense that
this one will be straightforward — not excitement.

## Anti-references

- **Generic AI-startup SaaS.** Purple gradients, glowing orbs, "AI-powered" badges,
  hero-metric templates, endless rows of identical icon cards. The default look of every
  2026 AI landing page. Ramzur sells outcomes to non-technical buyers; looking like an AI
  product company actively misreads the audience.
- **Cheap outsourcing / studio site.** Stock photography of suits shaking hands, "№1 на
  рынке", logo carousels, inflated round numbers. This is precisely what the copy is
  positioned against — a page that looks like it while claiming to speak plainly destroys
  its own argument.

Also out of bounds, as direct consequences of the voice: countdown timers, urgency
banners, exit-intent popups, and any number on the page that cannot be substantiated.

## Design Principles

1. **Practice what you preach.** The site claims Ramzur removes friction and shows
   progress at every stage. So the site itself must be fast, legible, and never make the
   visitor wait or guess. A janky page is a counter-argument to the pitch.
2. **Every claim carries its own proof.** No adjective without a mechanism next to it.
   "Transparent" is worthless; "demo access at each stage plus a regular status report" is
   the design unit. Sections are built around the mechanism, not the adjective.
3. **Lower the stakes, never raise the pressure.** The primary action is a conversation,
   not a purchase. Motion, color, and copy all de-escalate. Nothing on the page should
   feel like it is closing a deal.
4. **The flow motif is the identity.** Scattered manual work resolving into one continuous
   line — the hero graphic, the scroll-progress bar, the active-nav underline, the
   step-marker rhythm. Motion earns its place when it advances that one idea, and is cut
   when it is merely decoration.
5. **Placeholders must be impossible to ship by accident.** Real company data is still
   missing in seven places. Every gap stays visibly marked in the design until it is
   filled, rather than reading as finished copy.

## Accessibility & Inclusion

Target: **WCAG 2.1 AA.**

- All body text ≥4.5:1 against its background; large text ≥3:1. This is a dark theme, so
  the faint end of the gray ramp is the standing risk and must be audited, not assumed.
- Full keyboard operability: visible `:focus-visible` indicators on every interactive
  element, logical tab order, a real focus trap and return-focus in the lead modal, and no
  focusable elements inside the closed modal.
- `prefers-reduced-motion: reduce` is honoured everywhere, including smooth scrolling and
  every looping ambient animation — not only the scroll reveals.
- Content is never gated on a JS-triggered reveal: the readable state is the default and
  animation enhances it, so the page is complete with JS disabled or an observer that
  never fires.
- Russian-language copy runs long; every component must tolerate longer strings than the
  sample content without clipping or overflow.
- Touch targets ≥44×44px. Interactive state is never signalled by color alone.
