# Disaster Recovery Plan - Team Based Care Mapping (TBCM)

**Status:** Draft - operational approval required
**Service owner:** To be assigned
**Plan owner:** To be assigned
**Last reviewed:** October 15, 2026
**Review cadence:** At least annually and after a recovery exercise or significant architecture change

---

## 1. Purpose and scope

This plan describes how to assess and recover TBCM after a major service disruption, data-loss event, or failed production deployment. It covers the production application, its AWS infrastructure and data, and the external authentication dependency. It complements the operational procedures in [runbooks.md](./runbooks.md); it does not replace AWS account procedures or the BC Government Common Logon incident process.

This document is a draft until the service owner approves the objectives, assigns named contacts, verifies the live AWS configuration, and exercises the procedures.

### Recovery objectives

| Objective | Approved target | Definition |
|-----------|-----------------|------------|
| Recovery Time Objective (RTO) | **Proposed: 8 hours** (not business-owner approved) | Maximum elapsed time from disaster declaration until TBCM is restored and validated for users. |
| Recovery Point Objective (RPO) | **Proposed: 5 minutes** (not business-owner approved) | Maximum acceptable age of recovered production data at the time service is restored. |

These are technical planning estimates for recoverable incidents within `ca-central-1`, inferred from the documented infrastructure limitations and recovery steps—not business-owner-approved objectives or service commitments. The RTO reflects the need to restore a separate Aurora cluster, validate it, reconcile Terraform/application configuration, and cut over; it has not been measured in a recovery exercise. The RPO reflects the documented Aurora backup retention and assumes point-in-time recovery is enabled and the incident falls within its available recovery window. Verify the live configuration and latest restorable time before relying on it. Backup retention is not itself an RPO. Both targets require business-owner approval and exercise validation. They do not cover regional or account-level loss, for which no alternate recovery environment is documented.

## 2. Service overview and recovery dependencies

TBCM is deployed in AWS region `ca-central-1` and consists of:

| Component | Current design | Recovery considerations |
|-----------|----------------|-------------------------|
| Web application | Static Next.js assets in a private S3 bucket, served through CloudFront. S3 versioning is enabled for the application bucket. | Rebuild and redeploy from a known-good source revision, or recover object versions. Confirm the correct CloudFront distribution and cache state. |
| API | NestJS on AWS Lambda behind API Gateway and CloudFront. Lambda uses Aurora and SSM-sourced secrets/configuration. | Redeploy a known-good API build only after checking database/schema compatibility and required configuration. |
| Database | Aurora PostgreSQL 15.15. Production Terraform configures two cluster instances and AZs `ca-central-1a` and `ca-central-1b`; the other environments configure one instance. | Production backup retention is configured as 14 days; non-production as 3 days. A restore creates a separate cluster that needs an instance and a controlled application cutover. |
| Authentication | BC Government Common Logon / Keycloak OAuth2/OIDC. | External dependency. TBCM operators cannot restore the identity provider; contact its support/operations team. |
| Infrastructure and deployment | Terraform and GitHub Actions. Production deploys from the `prod` tag or manual workflow dispatch. | Use an approved AWS identity and repository access. Reconcile recovery infrastructure with Terraform before normal deployments resume. |

The two production database instances across availability zones provide availability against some instance/AZ failures; they are not a substitute for restoring from backup or a regional recovery capability. The documented configuration does not establish cross-region replication or a tested recovery environment in another AWS region. Treat full-region recovery as **not currently demonstrated** until the platform team confirms otherwise.

The application and API S3 buckets are versioned, but versioning alone does not protect against loss of the AWS account or region. Confirm backup scope, version retention, and off-region copies before relying on them for regional recovery. Terraform state, deployment artifacts, secrets, DNS/custom-domain setup, and required IAM/network resources must also be available to the recovery team.

## 3. Roles and authority

Assign named primary and alternate contacts before approving this plan. Use the existing incident channels and escalation procedures; do not put credentials or secret values in this document.

| Role | Responsibility | Assigned contact |
|------|----------------|------------------|
| Incident commander / service owner | Declare a disaster, set incident priority, authorize recovery and cutover, coordinate status updates, and approve closure. | **To be assigned** |
| Platform / DevOps lead | Assess AWS health and access, restore infrastructure, manage Terraform/state and routing/configuration, and coordinate AWS escalation. | **To be assigned** |
| DBA / database operator | Select and restore the recovery point, validate database health and data, and advise on data loss. | **To be assigned** |
| Application lead | Select known-good releases, validate API and user workflows, and coordinate application deployment. | **To be assigned** |
| Identity provider contact | Investigate Common Logon / Keycloak incidents and confirm authentication recovery. | **To be assigned** |
| Communications lead | Send approved incident and recovery notices to affected stakeholders and users. | **To be assigned** |

Only authorized operators may run production restore, infrastructure, or cutover actions. Require incident commander approval before restoring production data or routing production traffic to a recovered database.

## 4. Declare, coordinate, and close a recovery incident

1. **Detect and assess.** Review CloudWatch Lambda/API Gateway logs and metrics, CloudFront errors, Aurora health/events, and external identity-provider status. Use the health endpoint `GET /api/v1` as one signal; it is not a substitute for an authenticated end-to-end check.
2. **Open an incident.** Record the start time, affected environment/components, symptoms, suspected data impact, and actions already taken. Appoint an incident commander and technical leads.
3. **Declare disaster recovery when needed.** The incident commander declares DR when normal mitigation or the standard deployment rollback cannot restore service within the proposed objectives, or when integrity/availability of production data is at risk. Until approved, the proposed objectives are planning guidance, not service commitments.
4. **Communicate.** Notify stakeholders using the approved incident channel. State the user impact, known data-loss window if any, current actions, next update time, and whether authentication or only TBCM is affected. Do not speculate about recovery time.
5. **Stabilize.** Prevent further data damage where practical. For suspected corruption, stop writes or place the application in an approved maintenance state before selecting a restore point. Preserve logs, timestamps, and evidence.
6. **Recover and validate.** Follow the applicable scenario below. Keep the original database and recovered resources available until validation and the incident commander approves cleanup.
7. **Close and learn.** Confirm service restoration and stakeholder notification. Record actual outage duration, last recoverable data point, data loss, approvals, commands/actions, and follow-up work. Schedule a post-incident review and update this plan.

## 5. Recovery procedures

### 5.1 Aurora instance or availability-zone failure

1. Check Aurora cluster and instance status, AWS Health, recent RDS events, connectivity, and API errors. Determine whether Aurora has failed over automatically.
2. Do not initiate a restore solely for an instance/AZ failure if the existing cluster is healthy or recovering. Coordinate with the platform/DBA lead and follow AWS service guidance.
3. Verify the cluster writer/reader status and that the application can connect. Check for elevated errors, connection exhaustion, or prolonged failover.
4. Validate `GET /api/v1`, login, and representative read/write workflows once the database is stable.
5. If the cluster is unavailable beyond the approved recovery objective or integrity is in doubt, the incident commander and DBA should select the database-restore procedure in section 5.2.

### 5.2 Accidental data loss or database corruption

**Approval gate:** The incident commander and DBA must agree on the restore point and acceptable data loss before production recovery. Prefer recovery into a new cluster; do not overwrite or delete the source cluster.

1. **Contain the incident.** If writes could worsen the issue, coordinate an approved maintenance/traffic restriction. Record when the incident began and the earliest known bad change.
2. **Choose the recovery point.** Inspect available automated backups, snapshots, and the latest restorable time for the production cluster. Choose a point immediately before the corruption or unwanted change, accounting for the RPO decision and any valid changes that would be lost. If no suitable point is available, stop and escalate to the platform/DBA lead.
3. **Restore a separate cluster.** Use the appropriate AWS RDS restore operation for the approved point. Example command forms follow; replace placeholders only after confirming the AWS account, region, cluster, and approved recovery point:

   ```bash
   # Point-in-time restore; use the approved timestamp in UTC.
   aws rds restore-db-cluster-to-point-in-time \
     --source-db-cluster-identifier <source-cluster-id> \
     --db-cluster-identifier <recovered-cluster-id> \
     --restore-to-time <YYYY-MM-DDTHH:MM:SSZ> \
     --region ca-central-1

   # Alternatively, restore an approved manual cluster snapshot.
   aws rds restore-db-cluster-from-snapshot \
     --db-cluster-identifier <recovered-cluster-id> \
     --snapshot-identifier <approved-snapshot-id> \
     --engine aurora-postgresql \
     --region ca-central-1

   # Wait for the restored cluster, then create at least one instance in it.
   aws rds wait db-cluster-available \
     --db-cluster-identifier <recovered-cluster-id> \
     --region ca-central-1
   aws rds create-db-instance \
     --db-instance-identifier <recovered-instance-id> \
     --db-cluster-identifier <recovered-cluster-id> \
     --db-instance-class <approved-instance-class> \
     --engine aurora-postgresql \
     --region ca-central-1
   ```

   Use the documented AWS profile/role and approved change procedure. These commands create resources and are not a substitute for validating the actual account configuration, subnet/security-group requirements, encryption key access, naming, and cost approval.
4. **Validate before cutover.** Confirm the cluster and instance are available; verify database connectivity, expected schema/migrations, essential reference data, and representative recovered records. Have the DBA/application lead confirm the selected recovery point and expected data loss.
5. **Prepare controlled cutover.** The current Terraform API configuration takes its database endpoint from the managed Aurora cluster resource. Coordinate with the platform team to update/reconcile the Terraform configuration and state through the approved process so subsequent applies do not restore the old endpoint. Do not resume standard deployment applies or make an undocumented one-off endpoint change. Keep the original cluster intact.
6. **Cut over after approval.** Update the application configuration/deployment to use the recovered cluster through the agreed Terraform process. Restore normal traffic only after the API is connected to the intended cluster.
7. **Run post-cutover checks.** Follow section 6. Monitor API errors, DB connections, CloudFront/API Gateway responses, and user reports closely.
8. **Preserve and clean up deliberately.** Retain the source cluster, snapshots, and incident evidence until the incident commander, DBA, and platform lead approve cleanup under retention and evidence requirements. Document any data re-entry needed for transactions after the restore point.

For a pre-change manual snapshot, follow the snapshot procedure in [runbooks.md](./runbooks.md#database-backup--restore-rds-aurora). Verify that the snapshot completed successfully; starting snapshot creation is not proof that a usable recovery point exists.

### 5.3 Failed or damaging application deployment

1. Determine whether the fault is in the web assets, API Lambda, database migration, configuration, or an external dependency.
2. For an application-only failure, redeploy the previous known-good commit using the standard [deployment and rollback procedures](./runbooks.md#4-rollback-procedures). Validate that its API code is compatible with the current database schema before restoring traffic.
3. For static assets, use a known-good build/redeploy or recover the appropriate S3 object versions, then invalidate CloudFront as required. Verify both the delivered web version and API build ID.
4. If a database migration is implicated, do not assume application rollback reverses the schema. The DBA/application lead must determine whether a safe migration rollback is possible; otherwise use section 5.2 and assess the data-loss impact.
5. Confirm the deployment workflow and Terraform configuration point to the intended resources before running them. Follow production approvals and record the release/commit used for recovery.

### 5.4 Regional, account, or unrecoverable infrastructure outage

The current documented design is in `ca-central-1`; no tested alternate-region or alternate-account recovery procedure is established here. Therefore this plan does **not** promise full regional/account recovery or an RTO/RPO for that scenario.

1. The incident commander contacts the platform lead and AWS support/escalation channel, confirms scope and AWS account status, and communicates that regional recovery capability is unverified.
2. Do not attempt ad hoc deployment into another region. The platform lead must first confirm availability of an approved alternate account/region, Terraform state and source, S3 build artifacts or source builds, secrets/keys, network and IAM dependencies, DNS/certificate setup, database backups/replicas, and Keycloak callback configuration.
3. If no approved alternate environment and recoverable database copy exist, follow the organization’s service-continuity escalation and keep stakeholders informed. Record the required architecture and business decisions as recovery gaps.
4. A regional recovery runbook may be added only after the alternate-region design is provisioned, access-tested, and exercised.

### 5.5 Common Logon / Keycloak outage

1. Check the configured Keycloak/Common Logon service using the approved endpoint and determine whether the incident is external or caused by TBCM configuration/secrets.
2. Contact the identity-provider operations team and communicate the login impact. Do not rotate, expose, or copy credentials as a speculative mitigation.
3. If the provider is unavailable, explain that users may be unable to authenticate; the TBCM team cannot restore the external identity service. Avoid repeatedly changing application infrastructure when the dependency is the outage source.
4. After the provider is reported healthy, verify login, callback, token refresh, logout, and an authenticated API request. Escalate persistent errors to the identity provider and application lead.

## 6. Service restoration checklist

The application lead and incident commander should confirm and record each applicable item before declaring recovery complete:

- [ ] Correct AWS account, environment, region, deployment revision, and database endpoint are confirmed.
- [ ] Aurora cluster and at least one database instance are available; API connectivity succeeds.
- [ ] The approved recovery point, observed latest restorable time, and estimated data-loss interval are recorded.
- [ ] Database schema/migrations and essential data are validated by the DBA/application lead.
- [ ] `GET /api/v1` returns expected version/build information.
- [ ] CloudFront serves the expected web application and API responses; stale content is not being served.
- [ ] Keycloak login/callback and token refresh work, if the provider is available.
- [ ] A representative authenticated read and write workflow succeeds, with no unintended duplicate or missing data.
- [ ] CloudWatch logs and metrics show no sustained critical error or database connection issue.
- [ ] Stakeholders/users have received a recovery update and any known limitations or data re-entry instructions.

## 7. Backup and readiness requirements

Before this plan is approved, the platform/DBA leads must verify and document:

- Effective Aurora automated backup/PITR settings in each environment, including actual latest restorable time and retention; Terraform currently configures 14 days for production and 3 days otherwise.
- Snapshot ownership, encryption/KMS permissions, retention, deletion protection, monitoring, and whether backups are copied to another account or region.
- S3 versioning and retention for web assets, API artifacts, and user-guide documents; identify any required cross-region/account copies.
- Terraform state location, access, recovery procedure, and a way to reconcile restored resources without accidentally replacing the production database.
- Availability of build source, deploy workflow, secrets in SSM, IAM/OIDC access, VPC/subnets/security groups, CloudFront/DNS/custom certificate configuration, and required vendor contacts.
- Authorized operators, out-of-band communications, and required production approvals.

Run a non-production point-in-time or snapshot restore before treating database recovery steps as operational. Periodically exercise the complete restore-and-cutover process in a controlled environment and record measured recovery time, recovered point, errors, and corrective actions.

## 8. Open decisions and plan maintenance

The following are approval blockers or tracked recovery gaps:

1. Service owner and recovery roles/alternates are not assigned in this document.
2. Proposed production RTO of **8 hours** and RPO of **5 minutes** are inferred from documented infrastructure limitations; they are not business-owner confirmed and require approval and validation through a recovery exercise.
3. Cross-region/account recovery and off-region backup availability are not established by the documented infrastructure.
4. The production cutover procedure for a restored Aurora cluster must be verified with the Terraform/state owners.
5. Contact channels, stakeholder/user notification templates, and recovery exercise cadence need confirmation.

The plan owner should review this document at least annually, after material AWS/deployment/database changes, and after every DR exercise or incident. Record approvals, review date, exercise evidence, and outstanding corrective actions in the service’s approved operational record.
