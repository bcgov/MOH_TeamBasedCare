# Runbooks - Team Based Care Mapping (TBCM)

**Version:** 1.1
**Date:** March 5, 2026

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Database Operations](#2-database-operations)
3. [Deployment Procedures](#3-deployment-procedures)
4. [Rollback Procedures](#4-rollback-procedures)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Environment Variables](#7-environment-variables)
8. [Incident Response](#8-incident-response)
9. [Common Troubleshooting](#9-common-troubleshooting)

---

## 1. Local Development Setup

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Yarn 1.22.22 (Classic; specified in `package.json` `packageManager` field)
- Git

### Quick Start (Full Docker Stack)

```bash
# 1. Clone the repository
git clone https://github.com/bcgov/MOH_TeamBasedCare.git
cd MOH_TeamBasedCare

# 2. Copy environment file
cp .config/.env-example .env

# 3. Install dependencies
yarn install

# 4. Start all services (db, common, api, web)
GIT_LOCAL_BRANCH="dev" docker compose up -d

# 5. Verify services are running
docker ps
# Expected: tbcm_db (5432), tbcm_api (4000), tbcm_web (3000), tbcm_common
```

### Quick Start (Database Only + Local Node)

```bash
# 1. Start only the database
make run-local-db

# 2. Watch all packages (common + api + web)
yarn watch

# Or start individually:
yarn watch:common    # Watch shared package
yarn watch:api       # Start API on port 4000
yarn watch:web       # Start web on port 3000
```

### Accessing the Application

| Service | URL |
|---------|-----|
| Web Application | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Web -> API (in Docker) | `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` |
| Database | localhost:5432 (user: localdev, pass: password, db: tbcm) |

### Restarting Services

```bash
docker restart tbcm_api     # Restart API only
docker restart tbcm_web     # Restart web only
docker restart tbcm_db      # Restart database

# Full rebuild (after dependency changes)
GIT_LOCAL_BRANCH="dev" docker compose down -v
GIT_LOCAL_BRANCH="dev" docker compose build --no-cache
GIT_LOCAL_BRANCH="dev" docker compose up -d
```

### Viewing Logs

```bash
docker logs -f tbcm_api     # Follow API logs
docker logs -f tbcm_web     # Follow web logs
docker logs -f tbcm_db      # Follow database logs

# Or via Makefile
make local-server-logs      # API logs
make local-client-logs      # Web logs
```

### Shell Access to Containers

```bash
make local-server-workspace   # Shell into API container
make local-client-workspace   # Shell into web container
```

---

## 2. Database Operations

### Migrations

Migrations are located in `apps/api/src/migration/` and follow timestamp-based naming.

#### Run Pending Migrations

```bash
# Local development
make migration-local-run
```

**Note:** Migrations run automatically on API startup (`migrationsRun: true` in ORM config), so manual execution is rarely needed. If you need to run migrations manually inside Docker, restart the API container: `docker restart tbcm_api`.

#### Create a New Migration

```bash
make migration-local-create name=AddNewFeatureTable
# Creates: apps/api/src/migration/{timestamp}-AddNewFeatureTable.ts
```

Migration template:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewFeatureTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ...`);
  }
}
```

#### Revert Last Migration

```bash
make migration-local-revert
```

#### View Migration History

```bash
make migration-local-show
```

### Seeding Data

```bash
# Seed care activities from CSV
make seed-local-db
# Uses: scripts/care-activities.csv

# Custom seed file
npm run db:seed-care-activities --path="./path/to/custom.csv"
```

### Remote Database Access

```bash
# Open SSH tunnel to remote database (requires AWS credentials)
make open-db-tunnel ENV_NAME=dev    # Dev DB on localhost:5454
make open-db-tunnel ENV_NAME=test   # Test DB
make open-db-tunnel ENV_NAME=prod   # Prod DB
```

### Database Backup & Restore (RDS Aurora)

RDS Aurora handles automated backups:

- **Automated backups:** Daily snapshots with configurable retention period
- **Point-in-time recovery:** Restore to any second within the backup retention window
- **Manual snapshots:** Can be created via AWS Console or CLI before risky operations

```bash
# Create manual snapshot before a risky migration (via AWS CLI)
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier tbcm-<ENV> \
  --db-cluster-snapshot-identifier tbcm-<ENV>-pre-migration-$(date +%Y%m%d)

# List available snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier tbcm-<ENV>

# Restore from snapshot (creates new cluster — then update Terraform/DNS)
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier tbcm-<ENV>-restored \
  --snapshot-identifier <snapshot-id> \
  --engine aurora-postgresql
```

---

## 3. Deployment Procedures

### Deployment Model

TBCM uses **tag-based deployment** via GitHub Actions. Pushing a specific git tag triggers the corresponding environment deployment.

### Deploy to Development

```bash
make tag-dev
# Equivalent to: git tag -d dev && git tag dev && git push origin dev -f
```

### Deploy to Test

```bash
make tag-test
# Equivalent to: git tag -d test && git tag test && git push origin test -f
```

### Deploy to Production

```bash
make tag-prod version=v1.0.0
# Tags with version number and triggers production deployment
```

Production can also be triggered manually via GitHub Actions `workflow_dispatch`.

### Deployment Workflow Steps

Each deployment workflow performs:

1. **Terraform Apply** - Infrastructure provisioning/updates
2. **Build Web** - Next.js static build, uploaded to S3
3. **Build API** - NestJS Lambda package, uploaded to S3
4. **Deploy All** - Sync web assets + deploy API Lambda + CloudFront cache invalidation

### Manual Deployment Commands

```bash
# Build artifacts locally
make build-api          # Package API for Lambda
make build-web          # Build Next.js for S3

# Deploy (requires AWS credentials)
make deploy-all         # Full deployment
```

### Post-Deployment Verification

1. Check CloudFront distribution is serving updated content
2. Verify API health: `GET /api/v1` returns version info with new BUILD_ID
3. Confirm database migrations ran (check API startup logs in CloudWatch)
4. Test authentication flow (login/logout)
5. Spot-check core workflows (planning, care settings)

---

## 4. Rollback Procedures

### API Rollback (Lambda)

If a bad API deployment reaches an environment:

```bash
# Option 1: Redeploy the previous known-good commit
git checkout <known-good-commit>
make tag-<env>   # e.g., make tag-dev, make tag-test

# Option 2: Revert via AWS Console
# 1. Go to AWS Lambda > tbcm-<env>-api
# 2. Under "Versions", find the previous version
# 3. Update the alias to point to the previous version
```

### Web Rollback (S3 + CloudFront)

```bash
# Option 1: Redeploy from a known-good commit
git checkout <known-good-commit>
make build-web
# Upload to S3 and invalidate CloudFront cache

# Option 2: S3 versioning (if enabled)
# Restore previous object versions in the S3 bucket via AWS Console
```

### Database Rollback

If a migration causes issues:

```bash
# 1. Revert the last migration
make migration-local-revert   # Local
# For remote: connect via tunnel and run revert

# 2. If migration is irreversible, restore from RDS snapshot
# See "Database Backup & Restore" section above
```

### Full Environment Rollback

For a complete rollback of all components:

1. Identify the last known-good git commit
2. Checkout that commit
3. Redeploy: `make tag-<env>`
4. If database schema changed, revert migrations or restore from snapshot
5. Verify via post-deployment checks

---

## 5. CI/CD Pipeline

### Pull Request Checks

Triggered on all PRs to `main`:

| Workflow | File | Checks |
|----------|------|--------|
| API Check | `pr-check-api.yml` | Lint, format, build-common, build |
| Web Check | `pr-check-web.yml` | Lint, format, build-common, build |
| Common Check | `pr-check-common.yml` | Package validation |
| Terraform Check | `pr-check-tf.yml` | Terraform validation |

All use Node 22 with Yarn cache, 10-minute timeout.

### Deployment Workflows

| Workflow | Trigger | Environment |
|----------|---------|-------------|
| `deploy-dev.yml` | `git tag dev` | Development |
| `deploy-test.yml` | `git tag test` | Test |
| `deploy-prod.yml` | `git tag prod` or manual | Production |

All have 20-minute timeout with concurrency control.

### Security Scanning

| Workflow | Schedule | Description |
|----------|----------|-------------|
| `ci-npm-audit.yml` | Monthly (1st, 02:00 UTC) | npm vulnerability scan, auto-creates GitHub issues |
| `ci-zap-dev.yml` | Manual | OWASP ZAP full scan against dev environment |
| `ci-zap-prod.yml` | Manual | OWASP ZAP full scan against production |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_SA_ROLE_ARN` | Service account role for OIDC auth |
| `AWS_ACCOUNT_ID` | AWS account identifier |
| `CLOUDFRONT_ID` | CloudFront distribution ID for cache invalidation |

---

## 6. Monitoring & Logging

### Application Logging

**Logger:** Winston (via `nest-winston`)

**Configuration:**
- Local: Colorized + NestLike pretty-print format
- Production: JSON structured format
- Timestamps on all log entries
- `exitOnError: false` (graceful degradation)

**Log Sources:**

| Source | Context | Details |
|--------|---------|---------|
| HTTP Middleware | `HTTP` | `METHOD URL STATUS - USER-AGENT IP` |
| Exception Filter | `ExceptionFilter` | Full error + stack trace |
| Database Logger | `TypeORM` | SQL queries (when `DEBUG` env var is set) |
| Seed Service | `SeedService` | Seeding progress and errors |

**Sensitive Data Protection:**
- `password` and `payload` fields are stripped from request body before logging

### Production Monitoring (AWS CloudWatch)

Since the API runs on AWS Lambda, logs are automatically sent to CloudWatch:

- **Log Group:** `/aws/lambda/tbcm-<env>-api`
- **Metrics to monitor:**
  - Lambda invocation count and error rate
  - Lambda duration (watch for cold starts > 5s)
  - Lambda concurrent executions
  - RDS Aurora CPU utilization and connection count
  - CloudFront error rate (4xx, 5xx)

**Recommended CloudWatch Alarms:**

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Lambda Error Rate | > 5% over 5 minutes | Notify team |
| Lambda Duration | p95 > 10 seconds | Investigate cold starts |
| RDS CPU | > 80% sustained | Scale up or investigate queries |
| RDS Connections | > 80% of max | Check for connection leaks |
| CloudFront 5xx | > 1% over 5 minutes | Check Lambda health |

### Error Handling

All exceptions are caught by the global `ErrorExceptionFilter` and transformed to:

```json
{
  "errorType": "string",
  "errorMessage": "string",
  "errorDetails": {}
}
```

**Axios errors** are specially handled to extract URL, method, and response data.

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1` | Returns app version, build ID, and build info |

**Implicit health:**
- TypeORM `migrationsRun: true` - app fails to start if migrations fail
- PostgreSQL connection required at initialization

### Database Monitoring

- Set `DEBUG=true` environment variable to enable TypeORM SQL query logging
- Custom `DatabaseLogger` implements TypeORM Logger interface

---

## 7. Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT` | Project identifier | `tbcm` |
| `RUNTIME_ENV` | Environment name | `local`, `test`, `prod` |
| `POSTGRES_USERNAME` | Database username | `localdev` |
| `POSTGRES_PASSWORD` | Database password | (secret) |
| `POSTGRES_DATABASE` | Database name | `tbcm` |
| `KEYCLOAK_AUTH_SERVER_URI` | Keycloak base URL | `https://common-logon.hlth.gov.bc.ca/auth` |
| `KEYCLOAK_CLIENT_ID` | OAuth2 client ID | `TBCM` |
| `KEYCLOAK_CLIENT_SECRET` | OAuth2 client secret | (secret) |
| `KEYCLOAK_REALM` | Keycloak realm | `moh_applications` |
| `KEYCLOAK_REDIRECT_URI` | OAuth2 callback URL | Local: `http://localhost:3000/`, Dev/Test/Prod: `https://tbcm-<env>.hlth.gov.bc.ca/` |
| `KEYCLOAK_RESPONSE_TYPE` | OAuth2 response type | `code` |
| `KEYCLOAK_CONFIDENTIAL_PORT` | Keycloak confidential port | `0` |
| `KEYCLOAK_SSL_REQUIRED` | Require SSL for Keycloak | `true` |
| `KEYCLOAK_RESOURCE` | Keycloak resource name | `TBCM` |

### Derived Variables

| Variable | Derived From |
|----------|-------------|
| `KEYCLOAK_TOKEN_URI` | `{AUTH_SERVER}/realms/{REALM}/protocol/openid-connect/token` |
| `KEYCLOAK_USER_INFO_URI` | `{AUTH_SERVER}/realms/{REALM}/protocol/openid-connect/userinfo` |
| `KEYCLOAK_LOGOUT_URI` | `{AUTH_SERVER}/realms/{REALM}/protocol/openid-connect/logout` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Public API URL (browser) | `/api/v1` |
| `API_URL` | Server-side API URL | `http://api:4000/api/v1` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `DEBUG` | Enable TypeORM SQL query logging |
| `DOCS_BUCKET` | S3 bucket for user guide docs (disables endpoint if not set) |
| `BUILD_ID` | Git commit SHA (set by CI) |
| `BUILD_INFO` | Last commit message (set by CI) |

### Environment-Specific Database Users

| Environment | Username |
|-------------|----------|
| Local | `localdev` |
| Development | `localdev` |
| Test | `testuser` |
| Production | `tbcm_admin` |

---

## 8. Incident Response

### Escalation Contacts

| Role | Responsibility |
|------|---------------|
| **Development Team** | Application bugs, deployment issues, migration failures |
| **Platform Team / DevOps** | AWS infrastructure, networking, Terraform |
| **Keycloak Admin** | Authentication issues, realm configuration |
| **DBA** | Database performance, RDS Aurora issues |

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Application fully down | Immediate | Lambda errors 100%, DB unreachable |
| **P2 - High** | Major feature broken | Within 1 hour | Auth flow broken, planning fails |
| **P3 - Medium** | Minor feature issue | Within 1 business day | Sort order wrong, UI glitch |
| **P4 - Low** | Cosmetic / minor | Next sprint | Typo, minor styling issue |

### Incident Playbook

1. **Identify** - Check CloudWatch logs and alarms, reproduce the issue
2. **Communicate** - Notify stakeholders of the issue and estimated impact
3. **Mitigate** - If possible, apply a quick fix or rollback (see Section 4)
4. **Resolve** - Deploy a proper fix through the normal pipeline
5. **Post-mortem** - Document root cause, impact, and preventive measures

### Common Incident Scenarios

#### API Lambda Timing Out
1. Check CloudWatch Logs for the Lambda function
2. Look for long-running DB queries (enable `DEBUG=true` if needed)
3. Check RDS connection count — pool exhaustion causes timeouts
4. If caused by a bad migration, revert (see Section 4)

#### Authentication Outage
1. Verify Keycloak server is accessible: `curl <KEYCLOAK_AUTH_SERVER_URI>`
2. Check if BC Government Common Logon is experiencing an outage
3. Verify `KEYCLOAK_CLIENT_SECRET` hasn't been rotated without updating env vars
4. Check CloudWatch for 401/403 error spikes

#### Database Connection Failures
1. Check RDS Aurora status in AWS Console
2. Verify security group rules allow Lambda access
3. Check if max connections reached: `SELECT count(*) FROM pg_stat_activity;`
4. If needed, reboot the RDS instance (causes brief downtime)

---

## 9. Common Troubleshooting

### Docker Container Won't Start

**Symptom:** `packageManager: yarn@3.2.3` mismatch or container crashes on startup.

**Cause:** Local Docker file modifications were lost.

**Fix:**
```bash
# Rebuild from scratch
GIT_LOCAL_BRANCH="dev" docker compose down -v
GIT_LOCAL_BRANCH="dev" docker compose build --no-cache
GIT_LOCAL_BRANCH="dev" docker compose up -d
```

### API Fails to Start - Migration Error

**Symptom:** API container crashes with TypeORM migration error.

**Fix:**
1. Check migration file for syntax errors
2. Verify database is running: `docker logs tbcm_db`
3. Revert last migration if needed: `make migration-local-revert`
4. Fix migration and restart: `docker restart tbcm_api`

### Authentication Not Working

**Symptom:** Login redirects fail or tokens are rejected.

**Checks:**
1. Verify Keycloak env vars are set correctly in `.env`
2. Ensure `KEYCLOAK_REDIRECT_URI` matches your local URL
3. Check if Keycloak server is accessible
4. Clear browser localStorage and retry

### 401 Unauthorized on API Calls

**Symptom:** Frontend shows logged-in but API returns 401.

**Fix:**
1. Token may be expired - refresh the page (triggers token refresh)
2. Check if user has been revoked in the database
3. Verify `Authorization: Bearer <token>` header is being sent

### Database Connection Refused

**Symptom:** API logs show `ECONNREFUSED` to PostgreSQL.

**Fix:**
```bash
# Check database is running
docker ps | grep tbcm_db

# If not running, start it
make run-local-db

# Check database logs
docker logs tbcm_db
```

### yarn install Fails

**Symptom:** Dependency resolution errors or node_modules corruption.

**Fix:**
```bash
make clean-yarn    # Removes node_modules and reinstalls
# Or manually:
rm -rf node_modules apps/*/node_modules packages/*/node_modules
yarn install
```

### Build Fails - @tbcm/common Not Found

**Symptom:** TypeScript compilation error referencing `@tbcm/common`.

**Fix:**
```bash
yarn build-common
# Then retry the failing build
```

### Frontend Shows Blank Page

**Checks:**
1. Browser console for JavaScript errors
2. Network tab for failing API calls
3. Verify `NEXT_PUBLIC_API_URL` is set correctly
4. Check web container logs: `docker logs tbcm_web`

### Slow Migration on Large Data

**Symptom:** Migration takes too long or times out.

**Fix:**
- Check if migration includes data transformation on large tables
- Consider batching data operations
- Monitor PostgreSQL connections: avoid connection pool exhaustion

---

## 10. Keycloak Client Secret Rotation

### When to Rotate

- Scheduled secret rotation policy
- Suspected credential compromise
- After a team member with access departs

### Procedure

1. **Coordinate downtime** - Auth will break between steps 2 and 4
2. **Generate new secret in Keycloak:**
   - Log in to the Keycloak admin console
   - Navigate to Clients > TBCM > Credentials
   - Click "Regenerate Secret"
   - Copy the new secret
3. **Update environment variables:**
   - Update `KEYCLOAK_CLIENT_SECRET` in GitHub Secrets for all environments
   - For immediate fix, update the Lambda environment variable directly via AWS Console
4. **Redeploy** (if updated via GitHub Secrets):
   ```bash
   make tag-dev    # Dev first
   # Verify auth works, then:
   make tag-test
   make tag-prod version=<current-version>
   ```
5. **Verify** - Test login flow in each environment after deployment

### Rollback

If the new secret doesn't work, regenerate again in Keycloak and repeat.

---

## 11. Lambda Concurrency Management

### Monitoring Concurrency

```bash
# Check current concurrency metrics via CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=tbcm-<env>-api \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 --statistics Maximum
```

### Setting Reserved Concurrency

If the Lambda is hitting account concurrency limits or needs guaranteed capacity:

```bash
aws lambda put-function-concurrency \
  --function-name tbcm-<env>-api \
  --reserved-concurrent-executions 50
```

**Warning:** Setting reserved concurrency too low will throttle requests. Setting it too high reserves capacity from other Lambda functions in the account.

### Cold Start Mitigation

- Keep deployment package size minimal (current Lambda build strips dev dependencies)
- Monitor p95 duration in CloudWatch for cold start spikes (> 5s)
- Consider provisioned concurrency for production if cold starts impact users
