# AGENTS.md — OpenCRVS country configuration

Guidance for AI coding agents working in this Node.js repository.

Docs: https://github.com/opencrvs/documentation & `README.md`.

## Security and policy

- ALWAYS obey to `.claude/settings.json` permissions.
- NEVER workaround the deny rules. NEVER read any PII or production secrets.

## Related repos

Load these lazily when a task needs them:

- **`opencrvs-core`** — OpenCRVS core platform and main mono-repository
- **`opencrvs-farajaland`** — synthetic demo country for testing and E2E
- **`opencrvs-integrationland`** - demo country with integrations to 3rd party systems (e.g. MOSIP, E-Signet)
- **`mosip-api`** — MOSIP identity system integration
