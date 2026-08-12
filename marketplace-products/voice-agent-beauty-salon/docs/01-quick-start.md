# Quick start - 60 minutes to staging

## 0-10 min: prepare

- Clone provider template.
- Create staging phone number.
- Store secrets in provider/n8n credential store.
- Set timezone, salon name and human handoff.

## 10-25 min: calendar

- Create restricted Google account or calendar.
- Grant event read/write only.
- Map staff calendar IDs in service catalog.
- Never use personal owner calendar.

## 25-40 min: n8n

- Import both workflow JSON files.
- Configure Google Calendar and Sheets credentials.
- Set `N8N_WEBHOOK_SECRET`.
- Activate staging webhooks.

## 40-50 min: provider

- Paste system prompt.
- Configure four tools from `tools.json`.
- Set signed webhook secret.
- Keep recording disabled until legal review.

## 50-60 min: test

- Run all scenarios from `tests/acceptance-tests.json`.
- Require 12/12 pass.
- Route only internal/staging number.
- Complete launch scorecard before production.
