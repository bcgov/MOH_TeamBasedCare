# Technical Design Document - Team Based Care Mapping (TBCM)

**Version:** 1.1
**Date:** March 5, 2026
**Status:** Current

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Database Design](#5-database-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Endpoints](#7-api-endpoints)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Suggestion Engine](#9-suggestion-engine)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Security Considerations](#12-security-considerations)

---

## 1. System Overview

### Purpose

The Team Based Care Mapping (TBCM) application is a web-based tool designed for the BC Ministry of Health to support healthcare teams in developing team-based models of care. It helps align patient care needs with available health professional resources for both short-term and long-term resource planning.

### Key Capabilities

- **Planning Tool** - Multi-step workflow for creating care plans that map occupations to care activities
- **Care Settings Management** - Template-based system for defining occupation permissions per care setting
- **Content Management** - Administrative interface for managing occupations, care activities, and bundles
- **User Management** - Role-based user administration with Health Authority scoping
- **KPI Dashboard** - Analytics and metrics for monitoring system usage and care settings
- **Occupational Scope** - Reference data for health profession scopes of practice
- **Suggestion Engine** - Algorithm that recommends occupations based on activity coverage overlap

---

## 2. Architecture

### High-Level Architecture

```
                    +-----------------+
                    |   CloudFront    |
                    |   (CDN/SSL)     |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+      +-----------v-----------+
    |    Next.js Web    |      |     NestJS API        |
    |    (S3 Static)    +----->+    (AWS Lambda)       |
    |    Port 3000      |      |    Port 4000          |
    +-------------------+      +-----------+-----------+
                                           |
                          +----------------+----------------+
                          |                                 |
               +----------v----------+          +----------v----------+
               |   PostgreSQL 15     |          |     Keycloak        |
               |   (RDS Aurora)      |          |  (BC Gov Common     |
               +---------------------+          |   Logon / OAuth2)   |
                                                +---------------------+
```

### Design Principles

- **Monorepo** - Single repository with shared code via Yarn workspaces
- **Shared Validation** - DTOs and ROs shared between frontend and backend via `@tbcm/common`
- **Role-Based Access** - All endpoints protected by role-based guards
- **Audit Trail** - All entity changes tracked with created/updated timestamps and user references
- **Soft Deletes** - Critical entities use soft delete patterns (revokedAt, deletedAt)

---

## 3. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22+ |
| **Language** | TypeScript | 5.4.3 |
| **Package Manager** | Yarn | 1.22.22 (Classic, with workspaces via `package.json` `workspaces` field) |
| **Backend Framework** | NestJS | 11.1.6 |
| **ORM** | TypeORM | 0.3.20 |
| **Database** | PostgreSQL | 15 (RDS Aurora) |
| **Frontend Framework** | Next.js | 15.5.9 |
| **UI Library** | React | 19.1.2 |
| **Styling** | Tailwind CSS | 3.4.17 |
| **Forms** | Formik | 2.4.5 |
| **Data Fetching** | SWR | 1.3.0 |
| **HTTP Client** | Axios | 1.12.0 |
| **Authentication** | Keycloak | OAuth2/OIDC |
| **Containerization** | Docker | Alpine-based |
| **IaC** | Terraform | (AWS provider ~> 6.10.0) |
| **Cloud** | AWS | Lambda, S3, CloudFront, RDS |
| **CI/CD** | GitHub Actions | - |

---

## 4. Monorepo Structure

```
MOH_TeamBasedCare/
├── apps/
│   ├── api/                          # NestJS Backend API
│   │   └── src/
│   │       ├── main.ts               # Application bootstrap
│   │       ├── app.module.ts          # Root module
│   │       ├── app.config.ts          # Global pipes, filters, interceptors
│   │       ├── ormconfig.ts           # TypeORM configuration
│   │       ├── auth/                  # Authentication module
│   │       ├── user/                  # User management module
│   │       ├── unit/                  # Care locations & templates module
│   │       ├── care-activity/         # Care activities module
│   │       ├── occupation/            # Occupations module
│   │       ├── planning-session/      # Planning sessions module
│   │       ├── allowed-activity/      # Legacy permissions module
│   │       ├── kpi/                   # KPI dashboard module
│   │       ├── feedback/              # User feedback module (entity, subscriber, audit)
│   │       ├── common/                # Guards, filters, pipes, utils
│   │       ├── database/              # DB config, seeding, DatabaseLogger (custom TypeORM logger)
│   │       └── migration/             # TypeORM migrations (30+)
│   │
│   └── web/                          # Next.js Frontend
│       └── src/
│           ├── pages/                 # Next.js file-based routing
│           ├── components/            # React components (90+)
│           ├── services/              # API hooks & services (48+)
│           ├── common/                # Constants, interfaces, helpers
│           └── utils/                 # Utilities (excel, storage, validation)
│
├── packages/
│   ├── common/                       # Shared library (@tbcm/common)
│   │   └── src/
│   │       ├── dto/                   # Input validation (class-validator)
│   │       ├── ro/                    # Response objects (class-transformer)
│   │       ├── constants/             # Enums, sort keys, dropdown options
│   │       ├── models/                # Keycloak token models
│   │       ├── interfaces/            # TypeScript interfaces
│   │       └── helper/                # Shared utilities
│   │
│   └── accessibility/                # Pa11y accessibility testing
│
├── terraform/                        # AWS infrastructure as code
├── scripts/                          # Seed data CSV files
├── .github/workflows/                # CI/CD pipelines
├── docker-compose.yml                # Local development stack
├── Makefile                          # Build & development commands
└── package.json                      # Root workspace configuration
```

---

## 5. Database Design

### Entity Relationship Overview

```
User ─────────────────────────────────────────────────────────┐
  │                                                            │
  ├─ roles: [ADMIN, USER, CONTENT_ADMIN]                      │
  ├─ organization (Health Authority)                           │
  └─ revokedAt (soft delete)                                   │
                                                               │
PlanningSession ──────────────────────────────────────────┐    │
  │                                                        │    │
  ├─ M:1 careLocation (Unit)                              │    │
  ├─ M:1 careSettingTemplate (CareSettingTemplate)        │    │
  ├─ M:M careActivity                                      │    │
  ├─ M:M occupation                                        │    │
  └─ status: DRAFT | PUBLISHED                             │    │
                                                           │    │
CareSettingTemplate ──────────────────────────────────┐    │    │
  │                                                    │    │    │
  ├─ M:1 unit (Unit)                                  │    │    │
  ├─ M:1 parent (self-reference for copies)           │    │    │
  ├─ healthAuthority: GLOBAL | specific HA            │    │    │
  ├─ isMaster: boolean                                │    │    │
  ├─ M:M selectedBundles (Bundle)                     │    │    │
  ├─ M:M selectedActivities (CareActivity)            │    │    │
  └─ 1:M permissions (CareSettingTemplatePermission)  │    │    │
                                                       │    │    │
CareSettingTemplatePermission ─────────────────────┐   │    │    │
  │                                                 │   │    │    │
  ├─ M:1 template (CareSettingTemplate, cascade)   │   │    │    │
  ├─ M:1 careActivity (CareActivity)               │   │    │    │
  ├─ M:1 occupation (Occupation)                   │   │    │    │
  ├─ permission: Y | LC                            │   │    │    │
  └─ UNIQUE(template, careActivity, occupation)    │   │    │    │
                                                    │   │    │    │
AllowedActivity (Legacy) ──────────────────────┐    │   │    │    │
  │                                             │    │   │    │    │
  ├─ M:1 occupation                            │    │   │    │    │
  ├─ M:1 careActivity (cascade delete)         │    │   │    │    │
  ├─ M:1 unit (nullable)                       │    │   │    │    │
  ├─ permission: Y | LC | N                    │    │   │    │    │
  └─ UNIQUE(occupation, careActivity)          │    │   │    │    │
                                                │    │   │    │    │
Occupation ────────────────────────────────┐    │    │   │    │    │
  │                                         │    │    │   │    │    │
  ├─ displayName, displayOrder             │    │    │   │    │    │
  ├─ isRegulated: boolean                  │    │    │   │    │    │
  ├─ relatedResources: JSONB[]             │    │    │   │    │    │
  ├─ deletedAt (soft delete)               │    │    │   │    │    │
  └─ 1:M allowedActivities                │    │    │   │    │    │
                                            │    │    │   │    │    │
CareActivity ─────────────────────────┐     │    │    │   │    │    │
  │                                    │     │    │    │   │    │    │
  ├─ displayName, description         │     │    │    │   │    │    │
  ├─ activityType: ASPECT_OF_PRACTICE │     │    │    │   │    │    │
  │                | TASK              │     │    │    │   │    │    │
  │                | RESTRICTED_ACTIVITY│    │    │    │   │    │    │
  ├─ clinicalType (optional)          │     │    │    │   │    │    │
  ├─ M:1 bundle                       │     │    │    │   │    │    │
  ├─ M:M careLocations (Unit)         │     │    │    │   │    │    │
  └─ 1:M allowedActivities            │     │    │    │   │    │    │
                                       │     │    │    │   │    │    │
Bundle ────────────────────────────┐   │     │    │    │   │    │    │
  │                                 │   │     │    │    │   │    │    │
  ├─ name, displayName             │   │     │    │    │   │    │    │
  └─ 1:M careActivities           │   │     │    │    │   │    │    │
                                    │   │     │    │    │   │    │    │
Unit (Care Location) ──────────┐   │   │     │    │    │   │    │    │
  │                             │   │   │     │    │    │   │    │    │
  ├─ name, displayName         │   │   │     │    │    │   │    │    │
  ├─ M:M careActivities       │   │   │     │    │    │   │    │    │
  └─ 1:M templates             │   │   │     │    │    │   │    │    │
                                │   │   │     │    │    │   │    │    │
Feedback ──────────────────┐   │   │   │     │    │    │   │    │    │
  │                         │   │   │   │     │    │    │   │    │    │
  ├─ email, message        │   │   │   │     │    │    │   │    │    │
  ├─ pageUrl, userAgent    │   │   │   │     │    │    │   │    │    │
  └─ timestamps            │   │   │   │     │    │    │   │    │    │
```

### Base Entity

Most entities extend `CustomBaseEntity` (which extends `BaseEntity`):

| Field | Type | Source |
|-------|------|--------|
| id | UUID | BaseEntity |
| createdAt | timestamp | BaseEntity |
| updatedAt | timestamp | BaseEntity |
| createdBy | string | CustomBaseEntity |
| updatedBy | string | CustomBaseEntity |

**Note:** The `User` entity extends `BaseEntity` directly (not `CustomBaseEntity`) to avoid circular dependency, so it does not have `createdBy`/`updatedBy` fields.

### Database Naming Convention

The application uses a custom `DatabaseNamingStrategy` that maps camelCase TypeScript properties to snake_case database columns (e.g., `careActivity` becomes `care_activity_id`).

### Two Permission Systems

The application maintains two coexisting permission systems:

**1. AllowedActivity (Legacy)**
- Global occupation-to-activity permission mappings
- Stores Y (perform), LC (limits/conditions), and N (cannot perform)
- Not scoped to templates
- Still active for backward compatibility

**2. CareSettingTemplatePermission (Current)**
- Template-scoped occupation-to-activity permissions
- Only stores Y and LC (absence means cannot perform)
- Tied to specific CareSettingTemplate
- Supports Health Authority scoping
- Used by the planning workflow

---

## 6. Authentication & Authorization

### Authentication Flow (Keycloak OAuth2/OIDC)

```
1. User visits application
       │
2. Frontend redirects to GET /auth/login
       │
3. Backend redirects to Keycloak login page
   (BC Government Common Logon)
       │
4. User authenticates with credentials
       │
5. Keycloak redirects to POST /auth/callback with authorization code
       │
6. Backend exchanges code for JWT + refresh token via Keycloak token endpoint
       │
7. Backend returns tokens to frontend
       │
8. Frontend stores tokens in localStorage
       │
9. Subsequent API requests include: Authorization: Bearer <JWT>
       │
10. AuthGuard validates JWT on each request
       │
11. User record created/synced in database (resolveUser)
```

### Token Lifecycle

- **Access Token** - Short-lived JWT for API authentication
- **Refresh Token** - Used to obtain new access tokens via `POST /auth/refresh`
- **Logout** - `POST /auth/logout` invalidates tokens in Keycloak and clears frontend storage

### Authorization (RBAC)

**Roles:**

| Role | Description |
|------|-------------|
| ADMIN | Full system access (except Planning), all Health Authorities |
| USER | Planning tool access, Occupational Scope, scoped to own HA |
| CONTENT_ADMIN | Content editing, care settings for own HA, dashboard |

**Implementation:**
- `@AllowRoles({ roles: [Role.ADMIN] })` decorator on controllers/handlers
- `AuthGuard` extracts and validates JWT, resolves user from database
- Handler-level decorators override class-level decorators
- No decorator = all authenticated users allowed
- Revoked users blocked from all endpoints except auth/user

---

## 7. API Endpoints

Base URL: `/api/v1`

### Auth (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Redirect to Keycloak login |
| POST | `/callback` | OAuth2 callback, returns tokens |
| GET | `/user` | Get current authenticated user |
| POST | `/refresh` | Refresh JWT token |
| POST | `/logout` | Logout from Keycloak |

### User Management (`/user`) - Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invite` | Invite new user |
| GET | `/find` | Search users (paginated) |
| POST | `/:id/edit` | Update user roles/organization |
| POST | `/:id/revoke` | Revoke user access |
| POST | `/:id/re-provision` | Restore revoked user |

### Care Activities (`/care-activity`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/bundles` | User | List all bundles |
| GET | `/by-bundles` | User | Bundles with activities |
| GET | `/find` | User | Search activities (paginated) |
| GET | `/common-search-terms` | User | Popular search terms |
| GET | `/:id` | User | Activity detail |
| PATCH | `/:id` | Admin | Update activity |
| DELETE | `/:id/:unitName` | Content Admin | Delete activity by unit |
| GET | `/cms/find` | Content Admin | CMS search |
| GET | `/cms/:id` | Content Admin | CMS detail |
| PATCH | `/cms/:id` | Content Admin | CMS update |
| DELETE | `/cms/:id` | Admin/Content Admin | CMS delete |
| GET | `/cms/download` | Content Admin | Export activities |
| POST | `/cms/bulk/validate` | Content Admin | Validate bulk upload |
| POST | `/cms/bulk/upload` | Content Admin | Execute bulk upload |

### Occupations (`/occupations`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | User | List all occupations |
| GET | `/find` | User | Search (paginated) |
| GET | `/cms/find` | Content Admin | CMS search |
| GET | `/cms/:id` | Content Admin | CMS detail |
| POST | `/cms` | Content Admin | Create occupation |
| PATCH | `/cms/:id` | Content Admin | Update occupation |
| DELETE | `/cms/:id` | Content Admin | Soft delete occupation |

### Care Setting Templates (`/care-settings`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/cms/find` | Admin/Content Admin | Search templates (paginated) |
| GET | `/cms/templates-for-filter` | Admin/Content Admin | Templates for dropdown |
| GET | `/:id` | Authenticated | Template detail |
| GET | `/:id/bundles` | Authenticated | Template bundles |
| GET | `/:id/occupations` | Authenticated | Template occupations |
| GET | `/:id/copy-data` | Admin/Content Admin | Get template data for copy |
| POST | `/:id/copy` | Admin/Content Admin | Copy template |
| POST | `/:id/copy-full` | Admin/Content Admin | Full copy with permissions |
| PATCH | `/:id` | Admin/Content Admin | Update template |
| DELETE | `/:id` | Admin/Content Admin | Delete template |

### Planning Sessions (`/sessions`) - User Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/care-setting-templates` | Available templates |
| GET | `/last_draft` | Get last draft session |
| POST | `/` | Create new session |
| PATCH | `/:id/profile` | Save profile selection |
| GET | `/:id/profile` | Get profile |
| GET | `/:id/care-activity/bundle` | Get bundles for profile |
| PATCH | `/:id/care-activity` | Save activities |
| GET | `/:id/care-activity` | Get activities |
| PATCH | `/:id/occupation` | Save occupations |
| GET | `/:id/occupation` | Get occupations |
| GET | `/:id/activities-gap` | Gap analysis |
| PATCH | `/:id/publish` | Publish session |
| POST | `/:id/suggestions` | Get occupation suggestions |

### KPI (`/kpi`) - Admin/Content Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | KPI statistics (HA filtered) |
| GET | `/care-settings` | KPI per care setting |

### Other

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | App version/health |
| POST | `/feedback` | Authenticated | Submit feedback |
| GET | `/carelocations` | Authenticated | List care locations |

---

## 8. Frontend Architecture

### Page Routing (Next.js File-Based)

| Route | Role | Description |
|-------|------|-------------|
| `/` | All | Landing page |
| `/planning` | User | Planning workflow |
| `/occupational-scope` | User, Content Admin | Occupation list |
| `/occupational-scope/[id]` | User, Content Admin | Occupation detail |
| `/care-terminologies/[id]` | User | Care activity detail |
| `/care-settings` | Admin, Content Admin | Template list |
| `/care-settings/[id]/edit` | Admin, Content Admin | Edit template wizard |
| `/care-settings/copy` | Admin, Content Admin | Copy template wizard |
| `/user-management` | Admin | User management |
| `/dashboard` | Admin, Content Admin | KPI dashboard |
| `/content-management` | Content Admin | CMS (occupations + activities) |
| `/content-management/occupation/[id]` | Content Admin | Edit occupation |
| `/content-management/care-activity/[id]` | Content Admin | Edit care activity |

### Data Fetching Pattern

The frontend uses a **hybrid data fetching approach**:

1. **`useHttp` + `useEffect` pattern** - Most service hooks use the custom `useHttp` hook combined with `useEffect` for fetching data when dependencies change. This is the dominant pattern in the codebase.

2. **SWR hooks** - Some hooks use SWR for automatic caching and revalidation (e.g., `useMe` for current user data).

Example of the primary pattern:

```typescript
// Example: useOccupationsFind hook
export const useOccupationsFind = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState([]);
  const [sortKey, setSortKey] = useState<SortKey>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchData({ endpoint: API_ENDPOINT.findOccupations({...}) }, setOccupations);
  }, [sortKey, sortOrder, searchText, pageIndex, pageSize]);

  return { occupations, onSortChange, onSearchTextChange, ... };
};
```

### Component Architecture

- **Layout** - `AppLayout` wraps all pages with navigation, header, footer
- **Forms** - Formik-based with shared DTO validation from `@tbcm/common`
- **State** - React hooks + Context API (e.g., `CareSettingsContext`, `PlanningContext`)
- **HTTP** - `useHttp` hook handles auth headers, auto-logout on 401
- **Export** - Excel generation utilities in `utils/excel-utils.ts`

---

## 9. Suggestion Engine

The Planning tool includes a suggestion engine that recommends occupations based on selected care activities.

### How It Works

1. User completes Steps 1-3 of the planning workflow (profile, activities, occupations)
2. On Step 4, the user can request suggestions via `POST /sessions/:id/suggestions`
3. The engine identifies "non-covered activities" — activities where no selected occupation has Y or LC permission
4. For each candidate occupation not already in the plan, a score is calculated based on non-covered activities only
5. Results are ranked by score and returned as `SuggestionResponseRO` containing `OccupationSuggestionRO` items with per-activity competency breakdowns

### Scoring Algorithm (V1 — Current)

The scoring formula weights by activity type and permission level:

| Activity Type | Y (Full Scope) | LC (Limits/Conditions) |
|---------------|:-:|:-:|
| Restricted Activity | +4 | +3 |
| Aspect of Practice | +3 | +2 |
| Task | +2 | +1 |

**Key design decision:** Only non-covered activities contribute to scores. Once an activity has any coverage (Y or LC from a selected occupation), it does not affect suggestion rankings.

### Input/Output

- **Input:** Planning session ID (which defines the selected care setting template, activities, and currently selected occupations)
- **Output:** Ranked list of candidate occupations with:
  - Total score
  - Per-activity permission breakdown (Y/LC/not covered)
  - Competency breakdown by bundle

### Permission Data Sources

The engine queries permissions from the session's `CareSettingTemplate` via `CareSettingTemplatePermission` records. If no template permissions exist, it falls back to the legacy `AllowedActivity` table.

---

## 10. Infrastructure & Deployment

### AWS Architecture

| Service | Purpose |
|---------|---------|
| **AWS Lambda** | Hosts NestJS API (serverless) |
| **S3** | Static hosting for Next.js build |
| **CloudFront** | CDN + SSL termination |
| **RDS Aurora** | PostgreSQL 15 database |
| **IAM / OIDC** | GitHub Actions deployment auth |

### Deployment Pipeline

```
Developer pushes code
       │
       ├── PR → GitHub Actions PR checks (lint, build)
       │
       ├── git tag dev  → deploy-dev.yml  → Dev environment
       ├── git tag test → deploy-test.yml → Test environment
       └── git tag prod → deploy-prod.yml → Production
                              │
                    ┌─────────┴─────────┐
                    │  1. Terraform apply │
                    │  2. Build web (S3)  │
                    │  3. Build API (Lambda) │
                    │  4. Deploy all      │
                    │  5. CloudFront invalidation │
                    └─────────────────────┘
```

### Docker (Local Development)

Four services via `docker-compose.yml`:

1. **db** - PostgreSQL 13 on port 5432 (local development; production uses RDS Aurora PostgreSQL 15)
2. **common** - Watches `@tbcm/common` package
3. **api** - NestJS API on port 4000
4. **web** - Next.js on port 3000

---

## 11. Non-Functional Requirements

### Performance

- API response time: < 2 seconds for standard queries
- Page load time: < 3 seconds (static assets served via CloudFront CDN)
- Lambda cold start: mitigated by keeping package size minimal

### Scalability

- Serverless API (Lambda) scales automatically with request volume
- RDS Aurora supports read replicas if needed
- S3 + CloudFront handles static asset scaling natively

### Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Accessibility

- Pa11y automated accessibility testing in CI pipeline
- WCAG 2.1 Level AA compliance target

### Availability

- AWS Lambda: 99.95% SLA
- RDS Aurora: automated backups, multi-AZ capable
- CloudFront: global edge distribution

### Data Retention

- Audit trail retained indefinitely (entity history tables)
- Soft-deleted records preserved in database
- Database backups per RDS Aurora automated backup policy

---

## 12. Security Considerations

- **Authentication** - Keycloak OAuth2/OIDC via BC Government Common Logon
- **Authorization** - Role-based guards on all API endpoints
- **Input Validation** - class-validator DTOs on all inputs; ValidationPipe globally applied
- **SQL Injection** - TypeORM parameterized queries
- **XSS** - React's built-in output encoding; no dangerouslySetInnerHTML usage
- **CORS** - Configured in NestJS app bootstrap
- **Secrets** - Environment variables, never committed; GitHub Secrets for CI/CD
- **Audit Trail** - All entity mutations tracked with user reference and timestamp
- **Security Scanning** - Monthly npm audit + OWASP ZAP scans via GitHub Actions
- **Soft Deletes** - User revocation and occupation deletion are reversible
- **Sensitive Data Logging** - Password and payload fields stripped from error logs
