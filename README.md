# EHS Suite

EHS Suite is a Node.js + PostgreSQL application with static frontend pages served by the backend.

## Project Structure

- [backend](backend): Express API, auth, employee/department/training/compliance routes, Swagger docs
- [frontend](frontend): static login/dashboard/uploads/operations pages and Playwright tests
- [database](database): SQL initialization scripts

## Local Setup

1. Install dependencies:

```powershell
Set-Location C:\CODEBASE\EHS\backend
npm install

Set-Location C:\CODEBASE\EHS\frontend
npm install
```

1. Start backend (example on port 5002):

```powershell
Set-Location C:\CODEBASE\EHS\backend
$env:PORT='5002'
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_NAME='ehsdb'
$env:DB_USER='ehsuser'
$env:DB_PASSWORD='ehspassword123'
$env:DB_SSL='false'
npm start
```

1. Open app:

- `http://localhost:5002/index.html`
- `http://localhost:5002/api/docs`
- `http://localhost:5002/api/health`

## Operator Quick Commands

Run seed data:

```powershell
Set-Location C:\CODEBASE\EHS\backend
npm run seed
```

Run smoke E2E:

```powershell
Set-Location C:\CODEBASE\EHS\frontend
npm run test:e2e:smoke
```

Run full E2E:

```powershell
Set-Location C:\CODEBASE\EHS\frontend
npm run test:e2e:full
```

Run headed E2E:

```powershell
Set-Location C:\CODEBASE\EHS\frontend
npm run test:e2e:headed
```

## Demo Credentials

- `admin@ehssuite.com` / `demo123456`
- `manager@ehssuite.com` / `demo123456`
- `employee@ehssuite.com` / `demo123456`
- `safety@ehssuite.com` / `demo123456`

If demo logins stop working in local development, run `npm run seed` from [backend](C:/CODEBASE/EHS/backend).
The seed flow now refreshes demo-user password hashes back to the credentials above.

## Production Notes

Backend now validates required production configuration at startup. In production, set:

- `NODE_ENV=production`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `DATABASE_URL` (or DB host tuple variables)

See [PHASE_03_DEPLOYMENT_RUNBOOK.md](PHASE_03_DEPLOYMENT_RUNBOOK.md) for deployment and rollback procedures.

## Known Issues and Mitigations

- Port conflict on `5000`/`5001` can occur if another Node process is active.
  - Mitigation: run on a free port (for example `5002`) or stop conflicting process.
- UI hint on login page may show legacy demo credentials.
  - Mitigation: use seeded credentials listed above.
- File APIs depend on AWS/MinIO variables.
  - Mitigation: configure AWS env vars before testing upload/download endpoints.
