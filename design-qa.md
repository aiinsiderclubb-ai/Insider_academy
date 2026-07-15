# AI Insider Academy — Design QA

Date: 2026-07-15  
Viewport baseline: 1440 × 900  
Mobile baseline: 390 × 844

## Approved source boards

| Area | Source |
| --- | --- |
| Commerce / public catalogue | `/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-c16791db-43e0-4490-a863-7ebdc3d66e1d.png` |
| Learning / student workspace | `/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-7f9780bf-8ca6-4d65-9aaa-81315115635e.png` |
| Marketplace / checkout | `/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-b27b2f0a-153a-4e64-9317-b748ab1e95ef.png` |
| Account / onboarding / community | `/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-3562a326-fd5a-4581-96de-3071b9c4c959.png` |

## Side-by-side comparisons

- [Commerce comparison](docs/design-qa/commerce-comparison.png)
- [Learning comparison](docs/design-qa/learning-comparison.png)
- [Marketplace comparison](docs/design-qa/marketplace-comparison.png)
- [Account comparison](docs/design-qa/account-comparison.png)

Every comparison places the approved source board and the current browser implementation in one image at the same target size.

## Routes checked

### Commerce

- `/`
- `/courses`
- `/courses/ai-agent-engineer`
- `/memberships`

### Learning

- `/cabinet`
- `/learning-map`
- `/courses/ai-agent-engineer?lesson=0`
- Homework/practice state inside the lesson workspace
- `/calendar`

### Marketplace

- `/marketplace`
- `/marketplace/lead-generation-workflow`
- `/marketplace/lead-generation-workflow/buy`
- `/events`

### Account

- `/login`
- `/onboarding`
- `/account`
- `/events`

## Visual checks

- [x] Persistent left navigation on platform screens
- [x] One dark graphite shell across public, learning, marketplace, and account flows
- [x] Onest display/body typography and JetBrains Mono utility labels
- [x] Violet primary accent, muted sage learning status, controlled orange action accent
- [x] Real AI Insider mentor and generated course/marketplace raster assets
- [x] Consistent cards, borders, radii, shadows, and surface hierarchy
- [x] Image crops preserve the character's face, mask, and orange/violet lighting
- [x] Learning map contains six real AI Agent Engineer modules and real progress/access states
- [x] Lesson workspace, homework form, checkout, login, onboarding, and profile states are visible and usable
- [x] Desktop first screens preserve the board density and key CTA visibility
- [x] Mobile 390 px screenshots show no horizontal clipping in the checked core routes

## Functional checks

- [x] Login with the local all-access QA account
- [x] Marketplace payment-method selection changes state
- [x] Monthly/yearly membership switch changes prices and selected state
- [x] Learning-map stages and course details remain interactive
- [x] Lesson navigation, progress action, homework input, file control, and submit action remain connected
- [x] Telegram account panel calls the implemented `/api/telegram/*` client methods

## Automated checks

- [x] Production client build (`npm run build`)
- [x] Server API tests: 3 passed, 1 skipped because local PostgreSQL is not configured
- [x] Playwright end-to-end suite: 11 passed against an isolated API instance

## Intentional live-data differences

- Names, dates, course counts, progress percentages, purchases, and event participation come from the running application rather than being hard-coded to the mockup.
- Unpublished lesson video uses the approved AI Insider mentor poster while preserving the real video-player state and controls.
- The visual language and hierarchy match the approved boards; dynamic content stays truthful to the current account and catalogue.
