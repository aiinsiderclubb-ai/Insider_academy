# Prelaunch release runbook

## Required production configuration

- `PRELAUNCH_MODE=1` — fail-closed switch for checkout, course grants, progress, homework and protected lesson content.
- `GIVEAWAY_CLAUDE_ENDS_AT=2026-08-31T23:59:59+03:00` — canonical server deadline (31 August 2026, 23:59:59 GMT+3).
- Deploy the same public deadline as `VITE_GIVEAWAY_CLAUDE_ENDS_AT` when building the frontend.

Do not set `PRELAUNCH_MODE=0` until courses, server-side SKU pricing and payment reconciliation are approved for release.

## Production smoke gates

Run against the deployed frontend and API with a new real mailbox and Telegram account:

1. Register a new account and confirm that the email code arrives.
2. Verify the email, sign in and connect the Telegram bot.
3. Subscribe to `@aiinsiderclub` and call `POST /api/giveaways/claude-pro/verify-telegram`.
4. Enter with `POST /api/giveaways/claude-pro/enter`; expect `201`.
5. Repeat entry; expect `200` with `alreadyEntered: true` and no duplicate DB row.
6. Verify checkout, `/api/me/purchases`, progress, homework, team grant and admin grant return `423 PRELAUNCH_MODE`.
7. Verify every lesson returned by `/api/courses` has `videoUrl: null`.

Record the test account, timestamps, HTTP statuses and production deploy id. Do not use a mocked Telegram membership response for this gate.

## Draw, export and result publication

All endpoints require an admin bearer token. The draw is permitted only after the server deadline.

1. Inspect participants: `GET /api/admin/giveaways/claude-pro/entries`.
2. Archive a CSV snapshot: `GET /api/admin/giveaways/claude-pro/export.csv`.
3. Draw once: `POST /api/admin/giveaways/claude-pro/draw`.
4. Re-run draw to verify idempotency; it must return the existing result with `alreadyDrawn: true`.
5. Contact and validate the winner, then publish: `POST /api/admin/giveaways/claude-pro/publish`.
6. Verify the public endpoint exposes the published result without email or internal user id.

The immutable result stores the participant count, selected ordered index, winning entry, actor and draw time. Administrative draw and publication actions are also written to `audit_log`.
