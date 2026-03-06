# SIT Test Cases & Execution Report - Team Based Care Mapping (TBCM)

**Version:** 1.1
**Date:** March 5, 2026

---

## Test Execution Summary

| Field | Value |
|-------|-------|
| **Environment** | Test (https://tbcm-test.hlth.gov.bc.ca) |
| **Build / Commit** | `8b24512` (fix/uat-bug-fixes) |
| **Date Executed** | March 6, 2026 |
| **Executed By** | Amir Shayegh |
| **Total Test Cases** | 55 |
| **Passed** | 55 |
| **Failed** | 0 |
| **Blocked** | 0 |
| **Pass Rate** | 100% |

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [Authentication Test Cases](#2-authentication-test-cases)
3. [User Management Test Cases](#3-user-management-test-cases)
4. [Occupations Test Cases](#4-occupations-test-cases)
5. [Care Activities Test Cases](#5-care-activities-test-cases)
6. [Care Settings Templates Test Cases](#6-care-settings-templates-test-cases)
7. [Planning Sessions Test Cases](#7-planning-sessions-test-cases)
8. [KPI Dashboard Test Cases](#8-kpi-dashboard-test-cases)
9. [Feedback Test Cases](#9-feedback-test-cases)
10. [Cross-Cutting Test Cases](#10-cross-cutting-test-cases)
11. [Security Test Cases](#11-security-test-cases)
12. [Accessibility Test Cases](#12-accessibility-test-cases)
13. [How to Run Tests](#13-how-to-run-tests)

---

## 1. Test Infrastructure

### Test Frameworks

| Type | Framework | Config |
|------|-----------|--------|
| Unit (API) | Jest + @nestjs/testing | NestJS default config |
| Unit (Web) | Jest + jsdom | `apps/web/jest.config.js` |
| E2E | Cypress | `apps/web/cypress.json` + `apps/web/tests/` |
| Accessibility | Pa11y | `packages/accessibility/` |

### Existing Automated Test Coverage

| Module | File | Coverage |
|--------|------|----------|
| App Controller | `app.controller.spec.ts` | Version endpoint |
| Auth | `auth.controller.spec.ts`, `auth.service.spec.ts` | JWT, authentication |
| Care Settings | `care-setting-template.controller.spec.ts`, `care-setting-template.service.spec.ts` | Template CRUD, permissions |
| Care Activities | `care-activity-bulk.service.spec.ts` | Bulk upload operations |
| Occupations | `occupation.controller.spec.ts`, `occupation.service.spec.ts` | Occupation CRUD |
| Planning | `planning-session.service.spec.ts` | Session business logic |
| KPI | `kpi.controller.spec.ts`, `kpi.service.spec.ts` | Dashboard metrics |

---

## 2. Authentication Test Cases

### AUTH-001: Successful Login

| Field | Value |
|-------|-------|
| **ID** | AUTH-001 |
| **Description** | User can log in via Keycloak and receive valid tokens |
| **Preconditions** | Valid Keycloak user account exists |
| **Steps** | 1. Navigate to application URL<br>2. Click "Login" or get redirected to Keycloak<br>3. Enter valid credentials<br>4. Submit login form |
| **Expected Result** | User is redirected to the application with valid JWT stored in localStorage. Sidebar shows role-appropriate menu items. |
| **Status** | Pass |

### AUTH-002: Login with Invalid Credentials

| Field | Value |
|-------|-------|
| **ID** | AUTH-002 |
| **Description** | Login fails with incorrect credentials |
| **Preconditions** | None |
| **Steps** | 1. Navigate to application URL<br>2. Enter invalid email/password<br>3. Submit login form |
| **Expected Result** | Keycloak displays error message. User remains on login page. |
| **Status** | Pass |

### AUTH-003: Token Refresh

| Field | Value |
|-------|-------|
| **ID** | AUTH-003 |
| **Description** | Expired access token is refreshed automatically |
| **Preconditions** | User is logged in with a valid refresh token |
| **Steps** | 1. Wait for access token to expire<br>2. Perform an API action |
| **Expected Result** | Token is refreshed transparently. Action completes without requiring re-login. |
| **Status** | Pass |

### AUTH-004: Logout

| Field | Value |
|-------|-------|
| **ID** | AUTH-004 |
| **Description** | User can log out and session is invalidated |
| **Preconditions** | User is logged in |
| **Steps** | 1. Click logout button<br>2. Attempt to navigate to a protected page |
| **Expected Result** | Tokens cleared from localStorage. User redirected to login page. |
| **Status** | Pass |

### AUTH-005: Revoked User Blocked

| Field | Value |
|-------|-------|
| **ID** | AUTH-005 |
| **Description** | Revoked user cannot access the application |
| **Preconditions** | User account has been revoked by admin |
| **Steps** | 1. Log in with revoked user credentials<br>2. Attempt to access any page |
| **Expected Result** | User sees access revocation notification. API calls return forbidden. |
| **Status** | Pass |

---

## 3. User Management Test Cases

### UM-001: Invite New User

| Field | Value |
|-------|-------|
| **ID** | UM-001 |
| **Description** | Admin can invite a new user with role and organization |
| **Preconditions** | Logged in as ADMIN |
| **Steps** | 1. Navigate to User Management<br>2. Click "Add User"<br>3. Enter email address<br>4. Select role (Admin/User/Content Editor)<br>5. Select Health Authority<br>6. Submit invitation |
| **Expected Result** | User appears in list with "Pending" status. Success toast notification. |
| **Status** | Pass |

### UM-002: Edit User Role

| Field | Value |
|-------|-------|
| **ID** | UM-002 |
| **Description** | Admin can change a user's role |
| **Preconditions** | Logged in as ADMIN, target user exists |
| **Steps** | 1. Navigate to User Management<br>2. Find target user<br>3. Click Edit<br>4. Change role<br>5. Confirm |
| **Expected Result** | User role updated. User sees new menu items on next login. |
| **Status** | Pass |

### UM-003: Revoke User Access

| Field | Value |
|-------|-------|
| **ID** | UM-003 |
| **Description** | Admin can revoke a user's access |
| **Preconditions** | Logged in as ADMIN, target user is Active |
| **Steps** | 1. Navigate to User Management<br>2. Find target user<br>3. Click Revoke<br>4. Confirm |
| **Expected Result** | User status changes to "Revoked". User can no longer access the application. |
| **Status** | Pass |

### UM-004: Re-Provision Revoked User

| Field | Value |
|-------|-------|
| **ID** | UM-004 |
| **Description** | Admin can restore access for a revoked user |
| **Preconditions** | Logged in as ADMIN, target user status is Revoked |
| **Steps** | 1. Navigate to User Management<br>2. Find revoked user<br>3. Click Re-Provision<br>4. Confirm |
| **Expected Result** | User status changes to "Active". User can log in again. |
| **Status** | Pass |

### UM-005: Cannot Revoke Self

| Field | Value |
|-------|-------|
| **ID** | UM-005 |
| **Description** | Admin cannot revoke their own account |
| **Preconditions** | Logged in as ADMIN |
| **Steps** | 1. Navigate to User Management<br>2. Locate own account |
| **Expected Result** | Revoke button is not available for own account. |
| **Status** | Pass |

### UM-006: Search Users

| Field | Value |
|-------|-------|
| **ID** | UM-006 |
| **Description** | Admin can search users by email |
| **Preconditions** | Logged in as ADMIN, multiple users exist |
| **Steps** | 1. Navigate to User Management<br>2. Type partial email in search box |
| **Expected Result** | List filters to show matching users. Pagination updates. |
| **Status** | Pass |

### UM-007: Non-Admin Cannot Access User Management

| Field | Value |
|-------|-------|
| **ID** | UM-007 |
| **Description** | USER and CONTENT_ADMIN roles cannot access User Management |
| **Preconditions** | Logged in as USER or CONTENT_ADMIN |
| **Steps** | 1. Check sidebar navigation |
| **Expected Result** | "User Management" does not appear in sidebar. Direct URL access is blocked. |
| **Status** | Pass |

---

## 4. Occupations Test Cases

### OCC-001: List Occupations (Occupational Scope)

| Field | Value |
|-------|-------|
| **ID** | OCC-001 |
| **Description** | User can view paginated list of occupations |
| **Preconditions** | Logged in as USER or CONTENT_ADMIN |
| **Steps** | 1. Navigate to Occupational Scope<br>2. View occupation list |
| **Expected Result** | Paginated list displays occupation names and regulation status. |
| **Status** | Pass |

### OCC-002: Sort Occupations Alphabetically (Default)

| Field | Value |
|-------|-------|
| **ID** | OCC-002 |
| **Description** | Occupations are sorted alphabetically by default |
| **Preconditions** | Logged in, occupations exist |
| **Steps** | 1. Navigate to Occupational Scope or CMS Occupations tab<br>2. Observe default sort order |
| **Expected Result** | Occupations displayed in alphabetical order (A-Z) by display name. |
| **Status** | Pass |

### OCC-003: Search Occupations

| Field | Value |
|-------|-------|
| **ID** | OCC-003 |
| **Description** | User can search occupations by name |
| **Preconditions** | Logged in, occupations exist |
| **Steps** | 1. Navigate to Occupational Scope<br>2. Type search text<br>3. Wait for debounce (500ms) |
| **Expected Result** | List filters to matching occupations. Page resets to 1. |
| **Status** | Pass |

### OCC-004: View Occupation Detail

| Field | Value |
|-------|-------|
| **ID** | OCC-004 |
| **Description** | User can view detailed occupation information |
| **Preconditions** | Logged in, occupation exists |
| **Steps** | 1. Navigate to Occupational Scope<br>2. Click on an occupation |
| **Expected Result** | Detail page shows: description, scope of practice, related resources (all in collapsible sections). |
| **Status** | Pass |

### OCC-005: CMS - Create Occupation

| Field | Value |
|-------|-------|
| **ID** | OCC-005 |
| **Description** | Content Admin can create a new occupation |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Navigate to Content Management > Occupations tab<br>2. Click Create<br>3. Fill in name, description, regulation status<br>4. Save |
| **Expected Result** | New occupation appears in list. Success notification. |
| **Status** | Pass |

### OCC-006: CMS - Edit Occupation

| Field | Value |
|-------|-------|
| **ID** | OCC-006 |
| **Description** | Content Admin can edit an existing occupation |
| **Preconditions** | Logged in as CONTENT_ADMIN, occupation exists |
| **Steps** | 1. Navigate to Content Management > Occupations tab<br>2. Click Edit on an occupation<br>3. Modify fields<br>4. Save |
| **Expected Result** | Occupation details updated. Success notification. |
| **Status** | Pass |

### OCC-007: CMS - Soft Delete Occupation

| Field | Value |
|-------|-------|
| **ID** | OCC-007 |
| **Description** | Content Admin can delete an occupation (soft delete) |
| **Preconditions** | Logged in as CONTENT_ADMIN, occupation exists |
| **Steps** | 1. Navigate to Content Management > Occupations tab<br>2. Click Delete on an occupation<br>3. Confirm deletion |
| **Expected Result** | Occupation removed from list (soft deleted with `deletedAt` timestamp). |
| **Status** | Pass |

---

## 5. Care Activities Test Cases

### CA-001: List Care Activities

| Field | Value |
|-------|-------|
| **ID** | CA-001 |
| **Description** | User can view paginated list of care activities |
| **Preconditions** | Logged in, care activities exist |
| **Steps** | 1. Navigate to Care Terminologies or Content Management > Care Activities |
| **Expected Result** | Paginated list with activity name, type, and bundle. |
| **Status** | Pass |

### CA-002: Search Care Activities

| Field | Value |
|-------|-------|
| **ID** | CA-002 |
| **Description** | User can search care activities by name |
| **Preconditions** | Logged in, activities exist |
| **Steps** | 1. Navigate to care activities list<br>2. Type search text |
| **Expected Result** | List filters to matching activities. |
| **Status** | Pass |

### CA-003: View Care Activity Detail

| Field | Value |
|-------|-------|
| **ID** | CA-003 |
| **Description** | User can view detailed care activity information |
| **Preconditions** | Logged in as USER, care activity exists |
| **Steps** | 1. Navigate to a care activity via Planning or Occupational Scope<br>2. Click on a care activity link |
| **Expected Result** | Detail page shows activity name, description, type, clinical type, and bundle. |
| **Status** | Pass |

### CA-004: CMS - Edit Care Activity

| Field | Value |
|-------|-------|
| **ID** | CA-004 |
| **Description** | Content Admin can edit a care activity |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Navigate to Content Management > Care Activities<br>2. Click on an activity<br>3. Modify fields<br>4. Save |
| **Expected Result** | Activity updated successfully. |
| **Status** | Pass |

### CA-005: CMS - Delete Care Activity

| Field | Value |
|-------|-------|
| **ID** | CA-005 |
| **Description** | Content Admin can delete a care activity |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Navigate to Content Management > Care Activities<br>2. Click Delete on an activity<br>3. Confirm |
| **Expected Result** | Activity removed. Cascade deletes associated AllowedActivity records. |
| **Status** | Pass |

### CA-006: Bulk Upload - Valid File

| Field | Value |
|-------|-------|
| **ID** | CA-006 |
| **Description** | Content Admin can bulk upload care activities via Excel |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Navigate to Content Management > Care Activities<br>2. Click Bulk Upload<br>3. Download template<br>4. Fill in data<br>5. Upload file<br>6. Review validation results<br>7. Confirm upload |
| **Expected Result** | Activities created/updated. Success summary displayed. |
| **Status** | Pass |

### CA-007: Bulk Upload - Validation Errors

| Field | Value |
|-------|-------|
| **ID** | CA-007 |
| **Description** | Bulk upload shows validation errors for invalid data |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Upload Excel with missing required fields<br>2. Review validation results |
| **Expected Result** | Errors displayed with expandable details: missing IDs, duplicates, conflicts. Upload blocked until resolved. |
| **Status** | Pass |

### CA-008: Bulk Upload - Empty File

| Field | Value |
|-------|-------|
| **ID** | CA-008 |
| **Description** | Bulk upload handles empty file gracefully |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Click Bulk Upload<br>2. Upload an empty Excel file (headers only, no data rows) |
| **Expected Result** | Validation returns an appropriate error message. Upload is not executed. |
| **Status** | Pass |

### CA-009: Bulk Upload - Special Characters

| Field | Value |
|-------|-------|
| **ID** | CA-009 |
| **Description** | Bulk upload handles special characters in activity names |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Upload Excel with activities containing accented characters, ampersands, and quotes<br>2. Review and confirm |
| **Expected Result** | Activities created with correct special characters preserved. No encoding issues. |
| **Status** | Pass |

### CA-010: Filter by Care Setting

| Field | Value |
|-------|-------|
| **ID** | CA-010 |
| **Description** | CMS care activities can be filtered by care setting |
| **Preconditions** | Logged in as CONTENT_ADMIN, activities linked to care settings |
| **Steps** | 1. Navigate to Content Management > Care Activities<br>2. Select a care setting filter |
| **Expected Result** | List shows only activities associated with selected care setting. |
| **Status** | Pass |

### CA-011: Bulk Upload - Large File Handling

| Field | Value |
|-------|-------|
| **ID** | CA-011 |
| **Description** | Bulk upload handles large files gracefully |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Click Bulk Upload<br>2. Upload an Excel file with 1000+ rows |
| **Expected Result** | File is processed without timeout. Validation results displayed. If file exceeds size limits, an appropriate error message is shown. |
| **Status** | Pass |

---

## 6. Care Settings Templates Test Cases

### CS-001: List Templates

| Field | Value |
|-------|-------|
| **ID** | CS-001 |
| **Description** | Admin/Content Admin can view care setting templates |
| **Preconditions** | Logged in as ADMIN or CONTENT_ADMIN |
| **Steps** | 1. Navigate to Care Settings |
| **Expected Result** | Paginated list showing template name, parent, and last modified date. |
| **Status** | Pass |

### CS-002: Master Templates Are Read-Only

| Field | Value |
|-------|-------|
| **ID** | CS-002 |
| **Description** | Master (GLOBAL) templates cannot be edited or deleted |
| **Preconditions** | Logged in as ADMIN, master template exists |
| **Steps** | 1. Navigate to Care Settings<br>2. Locate a master template |
| **Expected Result** | Edit and Delete buttons are not available for master templates. Copy button is available. |
| **Status** | Pass |

### CS-003: Copy Template

| Field | Value |
|-------|-------|
| **ID** | CS-003 |
| **Description** | User can create a copy of a template |
| **Preconditions** | Logged in as ADMIN or CONTENT_ADMIN, template exists |
| **Steps** | 1. Navigate to Care Settings<br>2. Click Copy on a template<br>3. Step 1: Confirm source template selection<br>4. Step 2: Select bundles and activities<br>5. Step 3: Set occupation permissions (Y/LC)<br>6. Click Save<br>7. Enter unique template name<br>8. Confirm |
| **Expected Result** | New template created with copied permissions. Appears in list with parent reference. |
| **Status** | Pass |

### CS-004: Edit Template Permissions

| Field | Value |
|-------|-------|
| **ID** | CS-004 |
| **Description** | Admin/Content Admin can edit occupation permissions on a template |
| **Preconditions** | Logged in, non-master template exists |
| **Steps** | 1. Navigate to Care Settings<br>2. Click Edit on a template<br>3. Step 1: Select bundles and activities<br>4. Step 2: Set permissions (Y/LC) for each occupation-activity pair<br>5. Save changes<br>6. Confirm |
| **Expected Result** | Template permissions updated. Success notification. |
| **Status** | Pass |

### CS-005: Delete Template

| Field | Value |
|-------|-------|
| **ID** | CS-005 |
| **Description** | Admin/Content Admin can delete a non-master template |
| **Preconditions** | Logged in, non-master template exists |
| **Steps** | 1. Navigate to Care Settings<br>2. Click Delete on a template<br>3. Confirm deletion |
| **Expected Result** | Template removed from list. Cascade deletes associated permissions. |
| **Status** | Pass |

### CS-006: Content Admin Scoped to Own HA

| Field | Value |
|-------|-------|
| **ID** | CS-006 |
| **Description** | Content Admin can only edit templates for their Health Authority |
| **Preconditions** | Logged in as CONTENT_ADMIN assigned to a specific HA |
| **Steps** | 1. Navigate to Care Settings<br>2. View available templates |
| **Expected Result** | Only templates for own HA and GLOBAL templates visible. Edit only available for own HA templates. |
| **Status** | Pass |

### CS-007: Duplicate Template Name Prevention

| Field | Value |
|-------|-------|
| **ID** | CS-007 |
| **Description** | Cannot create template with duplicate name |
| **Preconditions** | Template with name "Test Template" already exists |
| **Steps** | 1. Copy a template<br>2. Enter name "Test Template"<br>3. Confirm |
| **Expected Result** | Error message indicating name already exists. |
| **Status** | Pass |

### CS-008: Unsaved Changes Warning

| Field | Value |
|-------|-------|
| **ID** | CS-008 |
| **Description** | User warned when navigating away with unsaved changes |
| **Preconditions** | Editing a template with unsaved modifications |
| **Steps** | 1. Edit a template<br>2. Modify permissions<br>3. Navigate away without saving |
| **Expected Result** | Confirmation dialog appears asking to discard or stay. |
| **Status** | Pass |

### CS-009: Concurrent Template Editing (Last Write Wins)

| Field | Value |
|-------|-------|
| **ID** | CS-009 |
| **Description** | Two users editing the same template — last save overwrites |
| **Preconditions** | Two users logged in, both editing the same non-master template |
| **Steps** | 1. User A opens template for editing<br>2. User B opens the same template for editing<br>3. User A saves changes<br>4. User B saves different changes |
| **Expected Result** | User B's changes overwrite User A's. No error or data corruption. The application does not support real-time collaborative editing. |
| **Status** | Pass |

---

## 7. Planning Sessions Test Cases

### PS-001: Create New Planning Session

| Field | Value |
|-------|-------|
| **ID** | PS-001 |
| **Description** | User can create a new planning session |
| **Preconditions** | Logged in as USER, care setting templates exist |
| **Steps** | 1. Navigate to Planning<br>2. Select "Start from scratch"<br>3. Select Care Setting and Location |
| **Expected Result** | New session created. Proceeds to Step 2 (Care Competencies). |
| **Status** | Pass |

### PS-002: Resume Draft Session

| Field | Value |
|-------|-------|
| **ID** | PS-002 |
| **Description** | User can resume a previously saved draft |
| **Preconditions** | Logged in as USER, draft session exists |
| **Steps** | 1. Navigate to Planning<br>2. "Resume draft" modal appears<br>3. Click to resume |
| **Expected Result** | Previous session data loaded. User continues from last step. |
| **Status** | Pass |

### PS-003: Select Care Bundles and Activities

| Field | Value |
|-------|-------|
| **ID** | PS-003 |
| **Description** | User can select care bundles and individual activities |
| **Preconditions** | Planning session created (Step 1 complete) |
| **Steps** | 1. On Step 2, view available bundles<br>2. Select one or more bundles<br>3. Within each bundle, select specific activities<br>4. Click Next |
| **Expected Result** | Selected activities saved. Proceeds to Step 3. |
| **Status** | Pass |

### PS-004: Select Occupations

| Field | Value |
|-------|-------|
| **ID** | PS-004 |
| **Description** | User can select occupations for the care plan |
| **Preconditions** | Step 2 complete |
| **Steps** | 1. On Step 3, view available occupations<br>2. Select relevant occupations<br>3. Click Next |
| **Expected Result** | Selected occupations saved. Proceeds to Step 4 (Gap Analysis). |
| **Status** | Pass |

### PS-005: View Activity Gap Analysis

| Field | Value |
|-------|-------|
| **ID** | PS-005 |
| **Description** | User can view the gap matrix between occupations and activities |
| **Preconditions** | Steps 1-3 complete |
| **Steps** | 1. On Step 4, view the gap analysis matrix |
| **Expected Result** | Matrix displays: green checkmark (in scope), yellow caution (limits/conditions), red X (out of scope), blue question (some restrictions). |
| **Status** | Pass |

### PS-006: Export Gap Analysis

| Field | Value |
|-------|-------|
| **ID** | PS-006 |
| **Description** | User can export gap analysis as Excel |
| **Preconditions** | Step 4 visible |
| **Steps** | 1. Click Export button on Step 4 |
| **Expected Result** | Excel file downloaded with: care setting info, creator name, timestamp, gap matrix with conditional formatting, legend sheet. |
| **Status** | Pass |

### PS-007: Publish Planning Session

| Field | Value |
|-------|-------|
| **ID** | PS-007 |
| **Description** | User can publish a completed planning session |
| **Preconditions** | All 4 steps complete |
| **Steps** | 1. Click Publish on Step 4 |
| **Expected Result** | Session status changes from DRAFT to PUBLISHED. |
| **Status** | Pass |

### PS-008: Get Occupation Suggestions

| Field | Value |
|-------|-------|
| **ID** | PS-008 |
| **Description** | System suggests occupations based on selected activities |
| **Preconditions** | Step 4 visible |
| **Steps** | 1. Click Suggestions on Step 4<br>2. Review suggested occupations |
| **Expected Result** | Modal shows ranked occupations by activity coverage overlap. |
| **Status** | Pass |

### PS-009: Draft "Don't Show Again"

| Field | Value |
|-------|-------|
| **ID** | PS-009 |
| **Description** | User can dismiss draft resume popup for the session |
| **Preconditions** | Logged in as USER, draft exists |
| **Steps** | 1. Navigate to Planning<br>2. Draft resume modal appears<br>3. Check "Don't show again"<br>4. Dismiss modal |
| **Expected Result** | Modal does not reappear for the current browser session (session cookie). |
| **Status** | Pass |

### PS-010: Start New Session Replaces Existing Draft

| Field | Value |
|-------|-------|
| **ID** | PS-010 |
| **Description** | Starting a new session replaces any existing draft |
| **Preconditions** | Logged in as USER, draft session exists |
| **Steps** | 1. Navigate to Planning<br>2. Dismiss the resume draft modal<br>3. Select "Start from scratch"<br>4. Complete Step 1 with different selections |
| **Expected Result** | New session created. Previous draft is replaced. Only one active draft maintained per user. |
| **Status** | Pass |

### PS-011: Planning Session with No Matching Occupations

| Field | Value |
|-------|-------|
| **ID** | PS-011 |
| **Description** | Gap analysis handles case where no occupations match selected activities |
| **Preconditions** | Steps 1-2 complete, selected occupations have no permissions for selected activities |
| **Steps** | 1. Select occupations that have no Y or LC permissions for the chosen activities<br>2. Proceed to Step 4 |
| **Expected Result** | Gap matrix displays all red X indicators. Suggestions modal shows occupations ranked by closest match. No errors. |
| **Status** | Pass |

---

## 8. KPI Dashboard Test Cases

### KPI-001: View Overview KPIs

| Field | Value |
|-------|-------|
| **ID** | KPI-001 |
| **Description** | Admin/Content Admin can view KPI overview |
| **Preconditions** | Logged in as ADMIN or CONTENT_ADMIN |
| **Steps** | 1. Navigate to Dashboard |
| **Expected Result** | KPI cards display: Active Users, Pending Users, Total Care Plans. |
| **Status** | Pass |

### KPI-002: Filter by Health Authority (Admin)

| Field | Value |
|-------|-------|
| **ID** | KPI-002 |
| **Description** | Admin can filter KPIs by Health Authority |
| **Preconditions** | Logged in as ADMIN |
| **Steps** | 1. Navigate to Dashboard<br>2. Select a Health Authority from filter |
| **Expected Result** | KPI metrics update to reflect selected HA only. |
| **Status** | Pass |

### KPI-003: Content Admin Sees Own HA Only

| Field | Value |
|-------|-------|
| **ID** | KPI-003 |
| **Description** | Content Admin sees KPIs scoped to their Health Authority |
| **Preconditions** | Logged in as CONTENT_ADMIN |
| **Steps** | 1. Navigate to Dashboard |
| **Expected Result** | KPIs filtered to user's Health Authority. No HA filter dropdown shown. |
| **Status** | Pass |

### KPI-004: Export KPIs

| Field | Value |
|-------|-------|
| **ID** | KPI-004 |
| **Description** | User can export KPI data as Excel |
| **Preconditions** | Logged in as ADMIN or CONTENT_ADMIN |
| **Steps** | 1. Navigate to Dashboard<br>2. Click Export |
| **Expected Result** | Excel file downloaded with current KPI metrics. |
| **Status** | Pass |

### KPI-005: Active Users Excludes Pending/Revoked

| Field | Value |
|-------|-------|
| **ID** | KPI-005 |
| **Description** | Active Users KPI only counts users who are not pending or revoked |
| **Preconditions** | Mix of active, pending, and revoked users exist |
| **Steps** | 1. Navigate to Dashboard<br>2. Note Active Users count |
| **Expected Result** | Count excludes users with Pending or Revoked status. |
| **Status** | Pass |

---

## 9. Feedback Test Cases

### FB-001: Submit Feedback

| Field | Value |
|-------|-------|
| **ID** | FB-001 |
| **Description** | Authenticated user can submit feedback |
| **Preconditions** | Logged in as any role |
| **Steps** | 1. Click the feedback option<br>2. Enter a feedback message<br>3. Submit |
| **Expected Result** | Feedback submitted successfully. Success notification displayed. Page URL and user agent captured automatically. |
| **Status** | Pass |

### FB-002: Feedback Requires Message

| Field | Value |
|-------|-------|
| **ID** | FB-002 |
| **Description** | Feedback form requires a message |
| **Preconditions** | Logged in as any role |
| **Steps** | 1. Open feedback form<br>2. Leave message field empty<br>3. Attempt to submit |
| **Expected Result** | Validation error shown. Submit is blocked until message is provided. |
| **Status** | Pass |

---

## 10. Cross-Cutting Test Cases

### XC-001: Pagination

| Field | Value |
|-------|-------|
| **ID** | XC-001 |
| **Description** | All list views support pagination |
| **Preconditions** | More items than page size |
| **Steps** | 1. Navigate to any list view<br>2. Click Next page<br>3. Change page size |
| **Expected Result** | Correct page of results displayed. Total count accurate. |
| **Status** | Pass |

### XC-002: Sort Toggle

| Field | Value |
|-------|-------|
| **ID** | XC-002 |
| **Description** | Column headers toggle sort order |
| **Preconditions** | List view with sortable columns |
| **Steps** | 1. Click a column header (ASC)<br>2. Click again (DESC)<br>3. Click again (default) |
| **Expected Result** | Sort indicator changes. Data reorders accordingly. |
| **Status** | Pass |

### XC-003: Role-Based Navigation

| Field | Value |
|-------|-------|
| **ID** | XC-003 |
| **Description** | Sidebar shows only role-appropriate menu items |
| **Preconditions** | Users of different roles |
| **Steps** | 1. Log in as USER -> see Planning, Occupational Scope<br>2. Log in as ADMIN -> see Dashboard, Care Settings, User Management, Occupational Scope<br>3. Log in as CONTENT_ADMIN -> see Dashboard, Care Settings, Content Management, Occupational Scope |
| **Expected Result** | Each role sees only permitted menu items. |
| **Status** | Pass |

### XC-004: Responsive Loading States

| Field | Value |
|-------|-------|
| **ID** | XC-004 |
| **Description** | Loading spinners/skeletons shown during data fetch |
| **Preconditions** | Any page with data loading |
| **Steps** | 1. Navigate to any data page<br>2. Observe loading state |
| **Expected Result** | Loading indicator visible until data loads. No layout shift. |
| **Status** | Pass |

### XC-005: Error Toast Notifications

| Field | Value |
|-------|-------|
| **ID** | XC-005 |
| **Description** | API errors displayed as toast notifications |
| **Preconditions** | None |
| **Steps** | 1. Trigger an API error (e.g., create duplicate) |
| **Expected Result** | Error toast appears with descriptive message. |
| **Status** | Pass |

### XC-006: Session Expiry Redirect

| Field | Value |
|-------|-------|
| **ID** | XC-006 |
| **Description** | Expired session redirects to login |
| **Preconditions** | Logged in, both tokens expired |
| **Steps** | 1. Wait for session to fully expire<br>2. Perform any action |
| **Expected Result** | User redirected to login page. |
| **Status** | Pass |

---

## 11. Security Test Cases

### SEC-001: API Access with Expired Token

| Field | Value |
|-------|-------|
| **ID** | SEC-001 |
| **Description** | API rejects requests with expired JWT |
| **Preconditions** | Valid user account exists |
| **Steps** | 1. Obtain a valid JWT<br>2. Wait for token to expire (or manually craft an expired token)<br>3. Make an API request with the expired token |
| **Expected Result** | API returns 401 Unauthorized. No data is returned. |
| **Status** | Pass |

### SEC-002: API Access with Forged Token

| Field | Value |
|-------|-------|
| **ID** | SEC-002 |
| **Description** | API rejects requests with an invalid/forged JWT |
| **Preconditions** | None |
| **Steps** | 1. Craft a JWT with a fake signature<br>2. Make an API request with the forged token |
| **Expected Result** | API returns 401 Unauthorized. No data is returned. |
| **Status** | Pass |

### SEC-003: API Access with No Token

| Field | Value |
|-------|-------|
| **ID** | SEC-003 |
| **Description** | API rejects unauthenticated requests to protected endpoints |
| **Preconditions** | None |
| **Steps** | 1. Make API requests to protected endpoints without an Authorization header |
| **Expected Result** | API returns 401 Unauthorized for all protected endpoints. Public endpoints (health check) still respond. |
| **Status** | Pass |

### SEC-004: Role Escalation Prevention

| Field | Value |
|-------|-------|
| **ID** | SEC-004 |
| **Description** | USER role cannot access Admin-only API endpoints directly |
| **Preconditions** | Logged in as USER |
| **Steps** | 1. Obtain a valid JWT for a USER<br>2. Make direct API requests to admin-only endpoints (e.g., POST /user/invite, DELETE /care-settings/cms/:id) |
| **Expected Result** | API returns 403 Forbidden for all admin-only endpoints. |
| **Status** | Pass |

### SEC-005: SQL Injection Prevention

| Field | Value |
|-------|-------|
| **ID** | SEC-005 |
| **Description** | API rejects SQL injection attempts in search/filter parameters |
| **Preconditions** | Logged in as any role |
| **Steps** | 1. Enter SQL injection payloads in search fields (e.g., `'; DROP TABLE users; --`)<br>2. Submit the request |
| **Expected Result** | Input is safely parameterized. No SQL execution. Normal search results or empty set returned. |
| **Status** | Pass |

---

## 12. Accessibility Test Cases

### A11Y-001: Pa11y Automated Scan

| Field | Value |
|-------|-------|
| **ID** | A11Y-001 |
| **Description** | Application pages pass Pa11y WCAG 2.1 AA automated checks |
| **Preconditions** | Application running, Pa11y configured |
| **Steps** | 1. Run `make test-pa11y` |
| **Expected Result** | No WCAG 2.1 Level AA errors reported. |
| **Status** | Pass |

### A11Y-002: Keyboard Navigation

| Field | Value |
|-------|-------|
| **ID** | A11Y-002 |
| **Description** | All interactive elements are accessible via keyboard |
| **Preconditions** | Logged in as any role |
| **Steps** | 1. Navigate the application using only Tab, Shift+Tab, Enter, and Escape<br>2. Test sidebar navigation, form inputs, buttons, modals, and table sorting |
| **Expected Result** | All interactive elements are reachable and operable via keyboard. Focus indicators are visible. |
| **Status** | Pass |

### A11Y-003: Screen Reader Compatibility

| Field | Value |
|-------|-------|
| **ID** | A11Y-003 |
| **Description** | Key pages are navigable with a screen reader |
| **Preconditions** | Screen reader enabled (VoiceOver/NVDA) |
| **Steps** | 1. Navigate to Planning, Dashboard, and Care Settings pages<br>2. Verify headings, landmarks, and form labels are announced correctly |
| **Expected Result** | Pages have proper heading hierarchy, ARIA landmarks, and labelled form controls. |
| **Status** | Pass |

---

## 13. How to Run Tests

### Unit Tests

```bash
# All tests
make test-jest

# API tests only
yarn workspace @tbcm/api test

# Web tests only
yarn workspace @tbcm/web test

# Watch mode
yarn test:watch

# Coverage report (API)
yarn test:cov
```

**Note:** Run `yarn build-common` first if `@tbcm/common` resolution error occurs.

### E2E Tests (Cypress)

```bash
# Start test database and seed
make start-test-db

# Run E2E tests
yarn test:e2e

# Open Cypress UI (interactive)
yarn open:cypress
```

### Accessibility Tests (Pa11y)

```bash
# Run accessibility scan
make test-pa11y

# Debug accessibility interactively
make debug-pa11y

# Generate GitHub-compatible results
make generate-accessibility-results
```
