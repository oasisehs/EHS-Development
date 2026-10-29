# Phase 03 Deployment Runbook

This runbook defines the required deployment and verification flow for the current EHS Suite monolithic backend+frontend runtime.

## 1. Pre-Deployment Requirements

- Backend dependencies installed in [backend/package.json](backend/package.json)
- Frontend dependencies installed in [frontend/package.json](frontend/package.json)
- Database is reachable and seeded
- CI workflow exists in [.github/workflows/playwright-e2e.yml](.github/workflows/playwright-e2e.yml)

## 2. Required Environment Variables

Required for production startup validation in [backend/server.js](backend/server.js):

- `NODE_ENV=production`
- `JWT_SECRET=<strong-random-secret>`
- `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- `DATABASE_URL=<postgres-connection-string>` or DB host tuple:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

Recommended for file features:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 3. Local Validation Before Deploy

1. Start backend (example):

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

1. Verify health:

```powershell
Invoke-RestMethod -Uri http://localhost:5002/api/health | ConvertTo-Json -Depth 5
```

1. Run E2E smoke and full:

```powershell
Set-Location C:\CODEBASE\EHS\frontend
npm run test:e2e:smoke
npm run test:e2e:full
```

## 4. Render Deployment Steps

1. Confirm [render.yaml](render.yaml) service settings:

- `root_dir: backend`
- `buildCommand: npm install`
- `startCommand: npm start`

1. In Render dashboard, set required secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- AWS secrets if file APIs are used

1. Trigger deploy.

1. Verify API docs and health:

- `/api/health`
- `/api/docs`
- `/api/docs.json`

## 5. Rollback Procedure

1. Identify last known good deploy in Render.
2. Roll back to previous deploy artifact.
3. Re-run post-deploy smoke checks.
4. Open an incident ticket with:

- failing endpoint(s)
- deployment id
- error log snippet

## 6. Post-Deploy Smoke Checklist

- [ ] Health endpoint returns `status: ok`
- [ ] Login page loads
- [ ] Admin login works
- [ ] Operations page loads from dashboard link
- [ ] Employees and departments lists refresh successfully
- [ ] API docs page loads
- [ ] No critical errors in server logs for 10 minutes
