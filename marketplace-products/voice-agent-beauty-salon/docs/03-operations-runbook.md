# Operations runbook

## Daily

- Review failed workflow executions.
- Reconcile agent bookings against calendar.
- Contact callers whose handoff/callback failed.

## Weekly

- Sample ten calls with consent.
- Track booking success, handoff rate, tool error rate and duplicate rate.
- Update service catalog changes.

## Alerts

- Tool error rate above 5% for 15 minutes: disable automated writes.
- Duplicate booking detected: disable create tool and investigate idempotency.
- Calendar auth failure: route all calls to human.
- Data exposure suspicion: disable number, revoke secrets, preserve audit logs.

## Targets

- Tool success >= 98%.
- Duplicate booking = 0.
- Unsupported claims = 0.
- Human handoff connects >= 95% during opening hours.
