# Phase 03 Execution Checklist

Status: In Progress
Scope: Deployment readiness, optimization, and production controls for the current monolithic frontend+backend app.

## A. Release and Quality Gates

- [ ] Lock release checklist and acceptance criteria
- [ ] Run full E2E suite in CI on push/PR
- [x] Add smoke E2E command for fast pre-merge checks
- [ ] Publish test artifacts (Playwright HTML report)

## B. Security and Configuration

- [x] Validate all required environment variables and defaults
- [x] Add startup config validation (fail fast on missing critical secrets)
- [x] Set secure HTTP headers (helmet or equivalent)
- [x] Tighten CORS policy for production domains

## C. Observability and Runtime Stability

- [x] Standardize health endpoint checks for app and DB
- [x] Add request logging format suitable for production troubleshooting
- [x] Add graceful shutdown handling for process signals
- [ ] Add structured error payload conventions across modules

## D. Deployment Readiness

- [x] Add CI workflow for backend sanity and frontend E2E
- [x] Add deployment runbook (env, start order, rollback)
- [x] Validate Render deployment config against current scripts
- [x] Define post-deploy smoke checklist

## E. Performance and Hardening

- [ ] Audit static asset caching strategy
- [ ] Add payload limits and upload safeguards
- [ ] Review database query hot paths and indexes for module endpoints
- [ ] Add baseline load test plan (small, repeatable)

## F. Documentation and Handover

- [x] Update README with Phase 03 run commands
- [x] Add operator quick commands (seed, run, test, verify)
- [x] Add known issues and mitigations section

---

## Immediate Start Items (Now)

- [x] Create Phase 03 checklist and execution tracker
- [x] Add frontend `test:e2e:smoke` and `test:e2e:full` scripts
- [x] Add GitHub Actions workflow for Playwright CI
