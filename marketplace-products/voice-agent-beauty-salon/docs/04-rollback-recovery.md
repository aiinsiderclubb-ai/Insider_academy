# Rollback and recovery

1. Disable inbound number routing.
2. Deactivate n8n write workflow.
3. Revoke compromised provider/calendar secret.
4. Restore previous provider config version.
5. Export failed call IDs and compare against calendar.
6. Manually contact affected callers.
7. Record incident timeline, impact and resolution.
8. Re-run 12 acceptance tests before reactivation.

Restore proof means previous config loads, read-only slot check works, write stays disabled until explicit approval, and no duplicate booking appears after replay.
