# Deployment checklist

## Before launch

- Configure provider secrets outside workflow JSON.
- Set salon timezone, services, durations and staff IDs.
- Enable call-recording disclosure required by local law.
- Configure calendar account with least privilege.
- Set human handoff number and opening hours.
- Validate webhook signature and idempotency key.

## Tests

- Happy-path booking.
- Occupied slot returns two alternatives.
- Duplicate webhook creates one booking.
- Calendar timeout transfers to human.
- Medical question receives no advice.
- Cancellation requires explicit confirmation.

## Rollback

- Disable inbound number routing.
- Revoke provider API key.
- Restore prior agent version.
- Export failed call IDs for manual follow-up.
