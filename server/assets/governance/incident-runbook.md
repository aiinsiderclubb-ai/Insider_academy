# AI Agent Incident Runbook

Version: 1.0

1. Contain: pause the deployment and revoke exposed credentials.
2. Classify: assign severity, owner, affected users and data classes.
3. Preserve: retain redacted logs and event IDs; never copy secrets into the incident.
4. Notify: follow legal and customer notification requirements.
5. Recover: deploy a reviewed version and run the required evaluation suite.
6. Review: document root cause, corrective actions and due dates.

Severity guide:
- Critical: active data exposure or harmful autonomous action.
- High: cross-tenant access, credential exposure or prolonged outage.
- Medium: degraded behavior with a safe workaround.
- Low: contained issue without customer impact.
