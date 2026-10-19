# Cloudyo Azure deployment runbook

This guide deploys the existing application to **already provisioned** Azure resources. It does not approve spending, create infrastructure, assign permissions, register identities, send email, swap slots or change DNS. Bicep remains a separate deliverable after subscription, region, network, service tier and cost approval, as required by the technical specification.

## Subscription-specific production approval

On 2026-10-19 the owner approved production deployment to the previously supplied subscription. The [plan's production override](.azure/infrastructure-plan.json) records this instruction and supersedes the original staging target: use `rg-cloudyo-prd-e65d`, primary app sites with `APP_ENV=production` and one active S1/EP1 pair. Plans retain slot capability; additional slots are not created until their isolated data/configuration is approved. Approval is not evidence of provisioning or production acceptance. Keep `cloudyo.ai` DNS unchanged and all six worker functions/email disabled until the relevant checks and activation decisions are complete.

### Production infrastructure implementation

`infra/main.bicep` creates only the new production resource group and its resource-group-scoped modules. It does not touch `test`. `scripts/provision.ps1` defaults to Azure validation, constrains the subscription/group/region, rejects missing credentials and placeholder recipient addresses, and requires `-RiskAcknowledged` for provisioning. `-RegisterProviders` is permitted only in deployment mode. Review `WhatIf` output before execution.

Supply an ARM parameters JSON file through an access-controlled secret-management process, outside tracked source. Required values are `internalEmail`, `entraClientId`, and secure object `secrets` containing independent `databaseAdminPassword`, `webDatabasePassword`, `workerDatabasePassword`, `migrationDatabasePassword`, `outboxEncryptionKey` (64 hexadecimal characters), `abuseHashSecret`, `nextauthSecret`, and `entraClientSecret`. Preserve `secretExpirationEpoch` across redeployments and schedule rotation before its 180-day initial deadline; do not rotate encryption keys without an outbox/backlog compatibility plan. The environment-driven `infra/main.bicepparam` is an alternative input mechanism; any compiled parameters contain secrets and belong only in protected, ignored temporary storage.

```powershell
.\scripts\provision.ps1 -ParameterFile .local\production.parameters.json
.\scripts\provision.ps1 -ParameterFile .local\production.parameters.json -Mode WhatIf
# Only after reviewed changes, operational inputs, and risk approval:
.\scripts\provision.ps1 -ParameterFile .local\production.parameters.json -Mode Deploy -RiskAcknowledged -RegisterProviders
```

`infra/release.bicep` defines a bounded, non-root private ACI release process. `scripts/azure-release.mjs` verifies exact source/archive and artifact hashes, authenticates with its separate managed identity, checks both targets before mutation, creates restricted runtime database roles, runs authorized migrations/optional seed, uploads worker then web over private SCM, and requires exact web readiness plus all six real Functions registrations. It never enables background processing. The release requires a verified digest-pinned Linux Node 22 image containing `python3` and `tar`, actual resource outputs, and fresh short-lived authenticated source/artifact URLs. A reusable GitHub token is not an acceptable substitute. Expired URLs stop the release rather than producing a partial success.

The runner image is pinned to `node@sha256:0e5f906573693feaa1e21057ebdcfdb5bd5021f050b2dc7c9deceb629c7da2a8` (Node 22.23.3 Bookworm). The Linux verification workflow confirmed `python3`, `tar` and the release checks under user/group 1000 with all Linux capabilities dropped. That image check does not establish Azure managed-identity, PostgreSQL or SCM behavior.

The operator must enable temporary release egress only for its bounded execution window, then remove the exact new ACI container, detach/delete its NAT/IP and remove the release identity's temporary permissions. Incremental ARM deployment does **not** delete old conditional resources automatically. Never delete the resource group, database, storage, Key Vault or existing resources as cleanup. These runner/control-plane paths still require actual Azure verification.

Local verification commands:

```powershell
az bicep build --file infra\main.bicep --outfile .local\infra\main.json
az bicep build --file infra\release.bicep --outfile .local\infra\release.json
checkov -d infra --framework bicep --skip-download
node --test tests\infrastructure\release.test.mjs
```

Checkov exceptions are resource-local, not global exclusions: the accepted single-instance/non-zone-redundant/LRS baseline; no client certificates for public marketing traffic or the private non-HTTP worker; no fake worker HTTP health route; Standard Front Door's deliberately filtered public origin; private storage requiring no trusted-services bypass; and parameterized storage-name false positives covered by exact-name tests. The separate host Azure Files shared-key exception is also documented explicitly. These are tradeoffs, not assertions of production high availability or a fully keyless environment.

### Original architecture baseline and tradeoffs

The original [infrastructure plan](.azure/infrastructure-plan.json) targeted subscription `db78cda5-d94e-4802-9b5c-e930f496cd18`, new resource group `rg-cloudyo-stg-e65d`, and `southeastasia`. Its resource catalog is retained as the architecture baseline; the production override above governs actual environment, names and deployment targets. The existing `test` resource group remains untouched.

The proposal preserves Linux S1 web/EP1 worker slots, private PostgreSQL 18 B1ms with 32 GiB, independent application/host storage, private Key Vault and SCM access, and Standard Front Door with a filtered public origin. Nine private endpoints and seven private DNS zones are enumerated. A temporary VNet-connected ACI release runner, with temporary NAT/IP egress, is required for privileged migrations and private SCM uploads; this runner is **not implemented yet**. Public GitHub runners and the local workstation cannot deploy directly to private SCM or migrate the private database.

The current retail planning subtotal is **USD 378.67/month** at 730 hours, including 5 GB of paid logs. It is **not a quote or spending cap**: traffic/DNS queries, additional Files/storage operations, temporary ACI/NAT/IP use, extra instances/logs, future email/scanning/event activation and taxes are additional. Subscription-specific S1/EP1 capacity and global name availability remain unverified.

Approval must explicitly cover the plan's security tradeoffs: Key Vault-protected Prisma/Entra credentials; shared-key capability only for the isolated Premium Functions Azure Files content share; public authenticated Azure Monitor; and a public-addressed, strictly Front Door-filtered web origin. `WEBSITE_RUN_FROM_PACKAGE=1` does not remove the Azure Files requirement. A fully keyless/no-Files worker or fully private Monitor/origin requires a revised implementation and estimate. The business storage account remains shared-key-disabled. Private-only Functions cannot receive public Event Grid push deliveries; authenticated reachable event ingress must be designed before later activation.

Application release `56ee2b6e3c54483ec5f8d89d86c381ef473c1bfb` passed [full application verification](https://github.com/yicksun/Cloudyo.ai/actions/runs/39211758193) and [Linux packaging](https://github.com/yicksun/Cloudyo.ai/actions/runs/39213649050). Its downloaded ZIP hashes are recorded in the plan. Infrastructure/documentation commits are distinct from that immutable application release. Before deployment, reauthenticate the workflow/ref and artifacts; never use an expired/missing artifact or a different commit silently.

Architecture and production deployment approval are now recorded. Bicep/runner implementation, validation and an incremental change/risk review must precede provisioning. Database initialization, real Entra configuration, background activation and production acceptance are not established by application CI or the infrastructure plan.

## 1. Supported target and prerequisites

| Component    | Required existing configuration                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web          | Linux Azure App Service, built-in Node 22 stack, staging slot on a tier supporting slots.                                                                                                 |
| Worker       | Linux Azure Functions v4, Node 22, **Elastic Premium**, staging slot, ZIP deployment support. Flex Consumption, Linux Consumption and custom containers are not supported by this script. |
| Database     | Separate staging/production PostgreSQL databases with TLS, restricted connectivity, bounded pools, runtime roles and a separately authorized migration role.                              |
| Dependencies | Approved Key Vault, private Blob container `media`, business queue `cloudyo-email`, independent Functions host storage, ACS sender and Event Grid subscriptions.                          |
| Identity     | Separate runtime managed identities and deployment identity. Existing single-tenant Entra app, callback URIs and assigned `Administrator`, `Editor`, `Sales` roles.                       |
| Operator     | PowerShell 7.2+, Azure CLI and access to the exact existing apps/slots and their configuration. Packaging additionally needs Git, tar and Docker with Linux containers/BuildKit.          |

Use a trusted deployment runner that can reach the restricted SCM endpoints, database and health endpoint. Do not open public firewall exceptions to make deployment work. Keep Azure CLI current. The scripts pass the subscription explicitly on every Azure call and never change the CLI's default subscription.

Use federated GitHub-to-Azure authentication and protected GitHub environments for an authorized release job. Do not create a service-principal password or save publishing profiles in the repository. The supplied packaging workflow has no Azure credentials and does not deploy.

## 2. Build immutable Linux release packages

Commit the intended release and require the existing **Application verification** workflow to pass for that exact commit. Packaging is separate from approval: a package build alone does not prove browser, database or release acceptance.

From the repository root in PowerShell:

```powershell
# Preview only; does not require Docker or contact Azure.
.\scripts\build-deployment.ps1 -ReleaseName release-001 -WhatIf

# Requires a clean committed tree and a running Linux Docker engine.
.\scripts\build-deployment.ps1 -ReleaseName release-001
```

Output is `.local\deployments\release-001\`:

| File            | Contents                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web.zip`       | Complete Next.js standalone tree, including public assets, hidden `.next\static` files and Linux Prisma engine. ZIP root contains `apps\web\server.js`.                         |
| `worker.zip`    | `host.json`, runtime `package.json`, `dist\index.cjs`, selected production dependencies and generated Linux Prisma client. No unresolved `@cloudyo` TypeScript workspace links. |
| `manifest.json` | Exact source commit, build timestamp, runtime platform and SHA-256 for both ZIP files.                                                                                          |

The builder exports the exact Git commit to a temporary build context using Git/tar, rather than sending the working directory or ignored local files to Docker. The Docker build uses Node 22 on Debian/OpenSSL 3, builds both applications, reinstalls worker-only production dependencies from the existing lockfile, and checks that the bundled worker can load its dependencies. Node/package imports outside a Functions host do **not** establish that host startup or trigger registration works.

The Docker context excludes environment files, local database/build output and private key files. Only application/workspace sources, package manifests and the two necessary packaging scripts are copied into the build. Do not put credentials in tracked source or build arguments.

Never package the Windows `.next` or `node_modules` tree for Linux. The builder refuses an existing output directory rather than merging old artifacts. On failure, keep the diagnostic output and use a new release name; never deploy a partial output directory.

Alternatively, run **Package Linux deployment** manually in GitHub Actions on the chosen committed ref and download its `cloudyo-linux-<commit>` artifact. It produces the same three files without Azure access. Extract the download before passing its directory to the deployment script.

Keep the original ZIPs and manifest together in trusted release storage. Hashes detect corruption, not malicious replacement of the entire release; authenticate the source workflow/ref and record the approved commit and hashes independently. Promote the same files; do not rebuild for production.

## 3. Configure existing resources before deployment

An authorized infrastructure/configuration owner must create the resources and slots first. The script only reads settings and uploads code; it intentionally does not populate secrets, change access, configure domains or choose service tiers.

Configure the web slot:

- Linux stack `NODE|22-lts`, startup command `node apps/web/server.js`, health check `/health/ready`, HTTPS only.
- `HOSTNAME=0.0.0.0`, `NODE_ENV=production`, `PUBLIC_CONTENT_MODE=database`.
- `APP_ENV=staging` in nonproduction slots; `APP_ENV=production` in production.
- `SITE_URL` and `NEXTAUTH_URL`: the exact external HTTPS origin for that environment, without a path. Use the same origin passed to `-SiteUrl`.
- `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `ENABLE_ORYX_BUILD=false`. These are prebuilt ZIPs, not Oryx source deployments.
- `DATABASE_URL`, `OUTBOX_ENCRYPTION_KEY`, `ABUSE_HASH_SECRET`, `INTERNAL_EMAIL`, `NEXTAUTH_SECRET`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`.
- `MEDIA_STORAGE_URL` when media is enabled, and the relevant runtime identity/RBAC/network configuration.

Use Key Vault references for database/authentication/encryption secrets. `OUTBOX_ENCRYPTION_KEY` must resolve to 64 hexadecimal characters; abuse and authentication secrets must be independently generated high-entropy values. The web and worker share the encryption/abuse keys for their environment. Never share staging keys, databases or queues with production.

Configure the worker slot:

- Linux stack `NODE|22`, `FUNCTIONS_WORKER_RUNTIME=node`, `FUNCTIONS_EXTENSION_VERSION=~4`, `WEBSITE_RUN_FROM_PACKAGE=1`.
- `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `ENABLE_ORYX_BUILD=false`.
- The same environment-specific `DATABASE_URL`, `OUTBOX_ENCRYPTION_KEY`, `ABUSE_HASH_SECRET`, `INTERNAL_EMAIL`, `SITE_URL`, `APP_ENV`.
- Functions host storage, using approved identity-based `AzureWebJobsStorage__*` settings, or an approved Key Vault-referenced `AzureWebJobsStorage` connection. Identity-based host storage needs the full endpoint/role configuration appropriate to the selected cloud, not merely an arbitrary account name.
- Business queue settings `EMAIL_QUEUE_URL` and `EmailQueue__queueServiceUri`. Host storage is not a substitute for these.
- Initially `EMAIL_MODE=disabled` and **all six** settings below equal to `true`.

```text
AzureWebJobs.dispatch.Disabled
AzureWebJobs.sendEmail.Disabled
AzureWebJobs.emailDelivery.Disabled
AzureWebJobs.mediaScan.Disabled
AzureWebJobs.poison.Disabled
AzureWebJobs.maintenance.Disabled
```

Keep environment-specific settings and function-disable flags slot-sticky, including secret references, database/queue/storage bindings, sender/recipient routing, URLs, identity configuration and host IDs where needed. Verify platform behavior before any manual slot swap. Staging must not consume production queues, run production retention, or process production events.

For approved email/media integration later, configure `ACS_EMAIL_ENDPOINT`, verified `EMAIL_FROM`, exact `ACS_EVENT_SOURCE`, `MEDIA_STORAGE_URL` and exact `MEDIA_EVENT_SOURCE`. Outside production, `EMAIL_MODE=azure` additionally requires a synthetic-recipient `EMAIL_TEST_ALLOWLIST`. Set up authenticated Event Grid destinations for `emailDelivery` and `mediaScan`, with reviewed source restrictions. Never enable delivery merely to make a deployment health check pass.

The preflight validates required presence and selected runtime settings, not the resolution of every Key Vault reference, identity permission, network rule or service configuration. Validate those in staging.

## 4. Apply migrations as a separate release operation

Use a trusted network-connected migration runner with Node 22 and the repository checked out at the package's `sourceCommit`. Supply the migration-role `DATABASE_URL` through the runner's secret environment, never a command-line argument, committed file or log.

```powershell
npm ci
npm run db:generate
npm run db:migrate
if ($LASTEXITCODE -ne 0) { throw 'Migration failed. Do not deploy.' }
```

Run migrations once per database/release, not from application startup or every instance. Confirm backups and restore capability first. Require expand/migrate/contract changes compatible with both old and new web/worker versions; the script deploys worker before web, and the uploads are not atomic.

For the **initial** approved content import only, run `npm run db:seed` with the intended environment's configuration and verify the seeded routes. Existing staff edits are not overwritten, but importing content is still an explicit data operation. Never run automated integration/browser tests against production or use production recipients for smoke tests.

`-MigrationsApplied` is an operator acknowledgment, not an automatic migration or database-state check.

## 5. Preview and deploy to staging

Log in separately with your approved deployment identity; the script never starts interactive login or creates credentials. For local authorized operation, `az login --tenant <tenant-id>` is an operator step. In CI, use the existing approved OIDC identity and environment gate.

```powershell
$deployment = @{
    ArtifactDirectory = '.local\deployments\release-001'
    SubscriptionId = '<approved-subscription-guid>'
    ResourceGroup = '<existing-resource-group>'
    WebAppName = '<existing-web-app>'
    FunctionAppName = '<existing-premium-function-app>'
    SiteUrl = 'https://<approved-staging-hostname>'
    WebSlot = 'staging'
    FunctionSlot = 'staging'
}

# Offline: verifies manifest/hashes and prints targets; no Azure calls.
.\scripts\deploy.ps1 @deployment

# Actual replacement of code in the two explicitly named existing slots.
.\scripts\deploy.ps1 @deployment -Execute -MigrationsApplied
```

Execution first validates the subscription, both existing Linux/HTTPS targets, worker plan, Node stack, startup/health configuration and app settings. All preflight checks finish before the first upload. Setting values are held in memory and not printed.

The worker upload uses `az functionapp deployment source config-zip --build-remote false`. The web upload uses `az webapp deploy --type zip --clean true`, then waits for the external origin's `/health/ready` to return HTTP 200 **and** `{"status":"ready"}`. The web upload replaces the deployment directory, so keep all durable state in PostgreSQL/Blob Storage, never `wwwroot`.

The script refuses active worker functions or live email configuration unless `-BackgroundProcessingApproved` is explicitly supplied. That flag acknowledges that new worker code can immediately consume queues, send email, process events or perform approved retention; it does not enable functions itself. Do not use it to bypass a missing release decision.

A successful script exit establishes code upload and web readiness only. If the worker upload succeeds but web upload/readiness fails, the script exits with an error and **both apps may already have changed**. It does not silently roll back or reverse migrations.

## 6. Staging acceptance and controlled activation

Record results against the release commit and hashes:

1. Confirm the Functions host actually loads all six named functions, without entry-point or Prisma/native engine errors. Use the portal or the slot's ARM functions endpoint (`<slot-resource-id>/functions`, supported Microsoft.Web API version); the CLI's general function-list command does not consistently support slots.
2. Verify web liveness/readiness, original routes/assets, 404s, metadata and draft privacy. Confirm database pools, trusted client-IP ingress, restricted origin/SCM access and telemetry token/body redaction.
3. Exercise real Entra sign-in/callback, all assigned roles, stale-session handling and privileged reauthentication. Synthetic test JWTs do not prove real tenant configuration.
4. Use only approved synthetic submissions. Verify durable records/outbox, double opt-in, unsubscribe, CMS preview/publish/unpublish, media quarantine/scan/publication, and controlled email acceptance/delivery correlation.
5. Activate only approved staging triggers and test queue retries, poison/unknown outcomes, duplicate events, expiry and alerts. Verify production resources remain untouched.
6. Complete owner visual/legal/retention approval, manual accessibility checks, backup restore and a paired web/worker rollback rehearsal. The inherited original-theme contrast blocker in `README.md` remains unresolved.

Do not infer email delivery from web readiness or provider acceptance. Do not infer restore/RPO/RTO or zero downtime from a successful ZIP deployment.

## 7. Production promotion

Production resources/configuration, approved ingress, sender, identities, budgets and release gates must already be in place. Keep staging and production data/event bindings isolated.

Use the **same ZIPs and manifest**, update the target hashtable to the approved production apps/origin, and explicitly set both slot values to `production`:

```powershell
$productionDeployment = @{
    ArtifactDirectory = '.local\deployments\release-001'
    SubscriptionId = '<approved-production-subscription-guid>'
    ResourceGroup = '<existing-production-resource-group>'
    WebAppName = '<existing-production-web-app>'
    FunctionAppName = '<existing-production-premium-function-app>'
    SiteUrl = 'https://<approved-production-hostname>'
    WebSlot = 'production'
    FunctionSlot = 'production'
}
.\scripts\deploy.ps1 @productionDeployment
.\scripts\deploy.ps1 @productionDeployment -Execute -MigrationsApplied -ProductionApproved
```

The `production` sentinel omits the CLI's `--slot` argument; it is not a slot named `production`. A mixed production/staging target pair is rejected. If background processing is already active and explicitly approved for this release, add `-BackgroundProcessingApproved`. Otherwise keep all functions paused and email disabled, then activate through a separately approved configuration change after smoke verification.

This is direct artifact promotion with app restarts, **not** an automated blue/green swap or a zero-downtime guarantee. Use an approved maintenance/rollout window. Slot swaps and DNS/MX/TXT changes remain manual, separately approved operations; preserve incoming submissions and consent history during cutover.

## 8. Failure handling and rollback

Stop promotion on any nonzero exit. Inspect deployment/host logs using approved redaction; do not paste app-setting lists, connection strings, tokens or enquiry bodies into tickets.

Before each release, retain the previous paired web/worker ZIPs, manifest, configuration snapshot references and database compatibility decision. On code failure, pause affected background processing through an authorized configuration operation, preview the previous release directory, then redeploy it with the same script and required approvals.

Do **not** run `prisma migrate reset`, integration teardown, reverse SQL or an automatic database restore as a code rollback. A previous binary must be compatible with the current schema and queued payloads. Otherwise keep processing paused and execute a separately approved forward fix or tested restore/reconciliation plan. Reconcile requests accepted during the incident, leased/unknown email outcomes and consent changes before resuming.

## 9. Tooling checks and limits

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:deployment
```

The deployment safety suite uses synthetic CLI/HTTP functions: it cannot contact Azure. It verifies offline planning, artifact tamper rejection, explicit targets, approval gates, preflight-before-upload, worker-before-web order, failure propagation and the exact readiness response. Unit tests cover package layout, Linux compatibility guards and release hashes.

Run the Linux packaging workflow/Docker build and a controlled Azure staging deployment before the first release. These tooling tests are not evidence of a real Azure deployment, Functions-host verification, live identity/email/media operation, or production readiness.

References: [App Service ZIP deployment CLI](https://learn.microsoft.com/cli/azure/webapp#az-webapp-deploy), [Functions ZIP deployment CLI](https://learn.microsoft.com/cli/azure/functionapp/deployment/source#az-functionapp-deployment-source-config-zip), [technical specification](TECHNICAL-SPECIFICATION.md).
