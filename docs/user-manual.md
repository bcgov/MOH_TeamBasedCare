# User Manual - Team Based Care Mapping (TBCM)

**Version:** 1.1
**Date:** March 5, 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Planning](#2-planning)
3. [Dashboard & KPIs](#3-dashboard--kpis)
4. [Occupational Scope](#4-occupational-scope)
5. [Care Settings Management](#5-care-settings-management)
6. [User Management](#6-user-management)
7. [Content Management](#7-content-management)
8. [Common Features](#8-common-features)
9. [Getting Help](#9-getting-help)
10. [FAQ](#10-faq)

---

## 1. Getting Started

### About TBCM

The Team Based Care Mapping application is a web-based tool that supports healthcare teams in developing team-based models of care. It helps align patient care needs with available health professional resources.

**Important:** This tool provides valuable insights but does not replace the expertise and judgment of healthcare professionals.

### Supported Browsers

- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Apple Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

### Logging In

1. Navigate to the application URL
2. You will be redirected to the BC Government Common Logon page
3. Enter your credentials and sign in
4. Upon successful authentication, you will be redirected to the application

### User Roles

Your role determines which features you can access:

| Feature | User | Admin | Content Admin |
|---------|:----:|:-----:|:-------------:|
| Planning | Yes | - | - |
| Occupational Scope | Yes | - | Yes |
| Dashboard / KPIs | - | Yes | Yes |
| Care Settings | - | Yes | Yes (own HA) |
| User Management | - | Yes | - |
| Content Management | - | - | Yes |

**Note:** Admins do not have access to the Planning tool. Planning is exclusively available to users with the User role.

### Navigation

The application has a collapsible sidebar on the left showing your available features. Click the menu icon to expand or collapse the sidebar.

### Logging Out

Click the logout option to securely end your session. Your tokens will be invalidated.

---

## 2. Planning

**Available to:** User role

The Planning tool guides you through a 4-step process to create team-based care plans.

### Step 1: Profile

1. Navigate to **Planning** from the sidebar
2. If you have a previous draft, a popup will ask if you want to resume it
   - Click "Resume" to continue your draft
   - Check "Don't show again" to dismiss for this browser session
3. To start fresh, select a **Care Setting** and **Care Location**
4. Click **Next**

**Important:** Starting a new session will replace any existing draft. Only one active draft is maintained at a time.

### Step 2: Care Competencies

1. View the available **Care Bundles** (groups of related care activities)
2. Select the bundles relevant to your care plan
3. Within each bundle, select specific **Care Activities** to include
4. Use the search function to find specific activities
5. Click **Next**

### Step 3: Occupations / Roles

1. View the list of available occupations
2. Select the occupations you want to evaluate for your care plan
3. Click **Next**

### Step 4: Gaps, Optimizations & Suggestions

This step displays the **Activity Gap Matrix** - a table showing which occupations can perform which activities.

**Permission Indicators:**

| Icon | Meaning |
|------|---------|
| Green checkmark | Within scope of practice - can perform |
| Yellow caution | Can perform with limits or conditions (additional education or organizational support required) |
| Red X | Outside scope of practice - cannot perform |
| Blue question mark | Some activities have restrictions |

**Actions on this step:**

- **Export** - Downloads the gap analysis as an Excel spreadsheet with:
  - Care setting information
  - Creator name and timestamp
  - Color-coded gap matrix
  - Legend explaining indicators
- **Suggestions** - Opens a modal showing recommended occupations ranked by how well they cover your selected activities
- **Publish** - Finalizes the care plan (changes status from Draft to Published)

### Tips

- Your progress is automatically saved as a draft
- You can navigate between steps using the Previous and Next buttons
- Only one active draft is maintained at a time

---

## 3. Dashboard & KPIs

**Available to:** Admin, Content Admin

The Dashboard provides key performance indicators and metrics about system usage.

### Viewing KPIs

1. Navigate to **Dashboard** from the sidebar
2. View the KPI cards:
   - **Active Users** - Count of users with active status (excludes pending and revoked)
   - **Pending Users** - Users who have been invited but haven't logged in yet
   - **Total Care Plans** - Total number of care plans created

### Filtering (Admin Only)

- Admins can filter all KPIs by **Health Authority** using the dropdown filter
- Content Admins see only their own Health Authority's data

### Exporting

Click the **Export** button to download KPI data as an Excel spreadsheet.

---

## 4. Occupational Scope

**Available to:** User, Content Admin

Browse and reference information about health professions and their scope of practice.

### Browsing Occupations

1. Navigate to **Occupational Scope** from the sidebar
2. View the paginated list of occupations
3. Each entry shows the occupation name and regulation status

### Searching

Type in the search box to filter occupations by name. The list updates after a brief delay (500ms).

### Sorting

Click column headers to sort:
- **Name** - Alphabetical (A-Z / Z-A)
- **Regulation Status** - Regulated first / Unregulated first

### Viewing Details

Click on any occupation to see detailed information:

- **Professional Description** - Overview of the profession (collapsible)
- **Scope of Practice** - What activities the occupation can perform (collapsible)
- **Related Resources** - External links and references (collapsible)

Click the **Back** button to return to the list.

---

## 5. Care Settings Management

**Available to:** Admin (all templates), Content Admin (own Health Authority)

Manage care setting templates that define which occupations can perform which activities.

### Understanding Templates

- **Master Templates** (GLOBAL) - Read-only default templates created per care location. Cannot be edited or deleted.
- **Organization Templates** - Customizable copies created for specific Health Authorities. Can be edited and deleted.

### Viewing Templates

1. Navigate to **Care Settings** from the sidebar
2. View the list showing template name, parent template, and last modified date
3. Use search to find specific templates
4. Sort by clicking column headers

### Copying a Template

1. Click the **Copy** button on any template
2. **Step 1 - Select Template:**
   - Confirm the source template selection
3. **Step 2 - Select Care Competencies:**
   - Choose bundles and activities to include
4. **Step 3 - Finalize:**
   - Set occupation permissions for each activity
   - Y = Can perform
   - LC = Can perform with limits/conditions
5. Click **Save**
6. Enter a unique name for the new template
7. Click **Confirm**

### Editing a Template

1. Click the **Edit** button on a non-master template
2. Follow the same 3-step process as copying
3. Click **Save Changes** and confirm

**Note:** A warning dialog appears if you try to navigate away with unsaved changes.

### Deleting a Template

1. Click the **Delete** button on a non-master template
2. Confirm the deletion

**Warning:** This permanently removes the template and all its permissions.

---

## 6. User Management

**Available to:** Admin only

Manage user accounts, roles, and access permissions.

### Viewing Users

1. Navigate to **User Management** from the sidebar
2. View the user list with email, Health Authority, role, and status
3. Search by email using the search box
4. Sort by clicking column headers

### User Statuses

| Status | Meaning |
|--------|---------|
| **Active** | User can log in and use the application |
| **Pending** | User has been invited but hasn't logged in yet |
| **Revoked** | User's access has been removed |

### Inviting a User

1. Click **Add User**
2. Enter the user's email address
3. Select a role:
   - **Admin** - Full system access
   - **User** - Planning tool access
   - **Content Editor** - Content management access
4. Select the user's Health Authority
5. Click **Submit**

The user will appear in the list with "Pending" status until they log in for the first time.

### Editing a User

1. Find the user in the list
2. Click **Edit**
3. Change the role or Health Authority as needed
4. Confirm the changes

**Note:** You cannot edit your own account.

### Revoking Access

1. Find the user in the list
2. Click **Revoke**
3. Confirm the revocation

The user's status changes to "Revoked" and they can no longer access the application.

**Note:** You cannot revoke your own account.

### Re-Provisioning a User

1. Find the revoked user in the list
2. Click **Re-Provision**
3. Confirm

The user's status changes back to "Active" and they can log in again.

---

## 7. Content Management

**Available to:** Content Admin only

Manage the master data for occupations and care activities.

### Accessing Content Management

1. Navigate to **Content Management** from the sidebar
2. Use the tabs to switch between **Care Activities** and **Occupational Scope**

### Managing Care Activities

#### Viewing and Searching

- Browse the paginated list of care activities
- Use the search box to find activities by name
- Filter by care setting using the dropdown
- Sort by clicking column headers

#### Editing a Care Activity

1. Click on a care activity in the list
2. Modify the fields (name, description, type, classification)
3. Click **Save**

#### Deleting a Care Activity

1. Click **Delete** on the activity
2. Confirm the deletion

#### Bulk Upload

For adding multiple care activities at once:

1. Click **Bulk Upload**
2. Click **Download Template** to get the Excel template
3. Fill in the template with your data:
   - Care Setting
   - Care Bundle
   - Care Activity name
   - Activity classification
4. Click **Upload** and select your completed file
5. Review the validation results:
   - **Errors** will block the upload (must be fixed)
   - **Warnings** can be reviewed and accepted
6. Click **Confirm** to complete the upload

### Managing Occupations

#### Viewing and Searching

- Click the **Occupational Scope** tab
- Browse the paginated list
- Use the search box to find occupations
- Sort by clicking column headers

#### Creating an Occupation

1. Click **Create**
2. Fill in the occupation details:
   - Name
   - Professional description
   - Regulation status (Regulated / Unregulated)
   - Related resources (optional)
3. Click **Save**

#### Editing an Occupation

1. Click on an occupation in the list
2. Modify the fields
3. Click **Save**

#### Deleting an Occupation

1. Click **Delete** on the occupation
2. Confirm the deletion

**Note:** Occupations are soft-deleted and can potentially be restored.

---

## 8. Common Features

### Search

All list views include a search box. Type your search term and the list will filter automatically after a brief delay. The page resets to page 1 when searching.

### Sorting

Click any column header to sort:
- First click: Ascending (A-Z, oldest first)
- Second click: Descending (Z-A, newest first)
- Third click: Returns to default sort

A visual indicator shows the current sort direction.

### Pagination

All list views include pagination at the bottom:
- Navigate between pages using Previous/Next
- Change the number of items per page
- See the total count of items

### Export

Several views offer Excel export:
- **Planning** (Step 4) - Gap analysis matrix
- **Dashboard** - KPI metrics
- **Content Management** - Care activities download

Click the **Export** button to download the data.

### Health Authority Scoping

Your assigned Health Authority affects what data you see:

- **Content Admins** see KPIs and care setting templates for their own Health Authority only
- **Admins** can view and filter across all Health Authorities
- **Users** see planning data scoped to their Health Authority

### Browser Requirements

- **Cookies** must be enabled — the application uses session cookies for features like the "Don't show again" option on the draft resume popup
- **localStorage** must be enabled — used for storing authentication tokens
- **JavaScript** must be enabled

### Feedback

Submit feedback about the application through the feedback option. Include:
- Your message
- The page URL is captured automatically

---

## 9. Getting Help

### Support

If you encounter issues with the application:

1. **Check this manual** - Review the relevant section and FAQ below
2. **Contact your administrator** - For access, role, or permission issues
3. **Contact your organization's IT support** - For login or browser issues
4. **Submit feedback** - Use the in-app feedback feature to report bugs or suggest improvements

### Reporting Issues

When reporting an issue, include the following information:
- What you were trying to do
- What happened instead
- The page URL where the issue occurred
- Your browser name and version
- Any error messages displayed

---

## 10. FAQ

### Q: I forgot my password. How do I reset it?

Contact your organization's IT support or use the BC Government Common Logon password reset option on the login page.

### Q: I can't see certain menu items.

Your menu items are determined by your role. Contact your administrator if you believe you need access to additional features.

### Q: My access was revoked. What do I do?

Contact your organization's TBCM administrator to request re-provisioning.

### Q: I started a planning session but can't find my draft.

When you navigate to Planning, a popup should offer to resume your last draft. If you checked "Don't show again," try clearing your browser session cookies or opening a new browser session.

### Q: The application seems slow or unresponsive.

1. Try refreshing the page
2. Clear your browser cache
3. Check your internet connection
4. If the issue persists, contact your system administrator

### Q: Can I undo a published care plan?

Published sessions cannot be reverted to draft. You can create a new planning session instead.

### Q: Why can't I edit a care setting template?

Master (GLOBAL) templates are read-only. To customize one, use the **Copy** button to create an editable copy. If the template belongs to a different Health Authority, you may not have edit access.

### Q: How do I export my care plan?

On Step 4 of the Planning workflow, click the **Export** button. An Excel file will be downloaded with the full gap analysis matrix.

### Q: What browsers are supported?

Chrome, Firefox, Safari, and Edge (latest 2 versions of each). For the best experience, keep your browser up to date.

### Q: Can multiple people edit the same template at the same time?

The application does not currently support real-time collaborative editing. If two users edit the same template simultaneously, the last save will overwrite previous changes. Coordinate with your team to avoid conflicts.
