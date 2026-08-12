# Voice Agent Kit: Beauty Salon

Version 1.1.0 - production-oriented booking starter kit.

Build appointment calls for salons with Vapi, Retell or ElevenLabs. Package covers conversation policy, calendar actions, n8n orchestration, QA, privacy, handoff, deployment and client delivery.

## Start here

1. Read `docs/01-quick-start.md`.
2. Copy `.env.example` into private deployment environment.
3. Pick provider config from `providers/`.
4. Import `workflows/beauty-salon-booking.json` into n8n.
5. Map salon services using `data/service-catalog.example.json`.
6. Run `tests/acceptance-tests.json` before routing live calls.
7. Use `docs/05-client-handoff.md` for delivery.

## Package map

- `providers/` - Vapi, Retell and ElevenLabs templates.
- `workflows/` - n8n booking and call-summary workflows.
- `prompts/` - system prompt and reusable dialog modules.
- `data/` - service catalog and test fixtures.
- `tests/` - acceptance, failure and security scenarios.
- `docs/` - setup, privacy, operations, rollback and client handoff.
- `sales/` - discovery form, proposal scope and ROI calculator.

## Boundaries

- Templates, not hosted service.
- Provider/API costs excluded.
- Legal recording/consent rules depend on deployment country.
- No credentials or customer data included.
- Medical advice forbidden; sensitive or disputed calls transfer to human.

## License

See `LICENSE.md`. Personal, Client and Agency tiers are enforced by purchase entitlement.
