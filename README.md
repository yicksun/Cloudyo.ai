# Cloudyo web application

Azure-ready Next.js application based on the existing [cloudyo.ai](https://cloudyo.ai) public website. The product and technical specifications remain the requirements of record. This repository contains the application, not a deployed Azure environment.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Linux release packaging, guarded scripts targeting existing Azure apps, required configuration, migrations, staging, production promotion and rollback.

## Requirements and local setup

Use Node.js 22 LTS (22.12 or newer within major 22), npm, and PostgreSQL. The lockfile pins the supported dependency combination. Windows filesystem commands below use PowerShell.

```powershell
npm ci
Copy-Item .env.example .env
Copy-Item .env.example apps\web\.env.local
npm run local:database
```

Keep the last command running in a separate terminal. This optional development helper starts an isolated PostgreSQL instance on port 55432 with UTF-8 databases `cloudyo_dev`, `cloudyo_test` and `cloudyo_e2e_test`. Its `cloudyo` / `local-development-only` credentials are **development fixtures, never production credentials**. Data is under the ignored `.local\postgres` directory. Alternatively, supply a disposable PostgreSQL service yourself.

Configure both environment files, or export the environment variables to the shell:

```dotenv
DATABASE_URL=postgresql://cloudyo:local-development-only@localhost:55432/cloudyo_dev
SITE_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
PUBLIC_CONTENT_MODE=database
APP_ENV=development
INTERNAL_EMAIL=internal@cloudyo.example
EMAIL_MODE=disabled
```

Generate independent secrets with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` for `OUTBOX_ENCRYPTION_KEY`, `ABUSE_HASH_SECRET`, and `NEXTAUTH_SECRET`. Never commit environment files. The first key encrypts retained notification payloads and pending newsletter identities; rotation requires a plan for outstanding encrypted records.

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:3000`. Seeding creates the original pages and six complete resource articles without overwriting staff edits. Forms require the database and valid encryption/abuse secrets. Accepted enquiries are persisted together with notification jobs; email is deliberately not sent by local tests or the web process.

For a read-only design preview only, set `PUBLIC_CONTENT_MODE=static`. This is an explicit mode, not an outage fallback; it does not make form persistence work without a database.

## Implemented surfaces

The original public routes, imagery, responsive layouts, Plus Jakarta Sans font, colors and article content are preserved. Contact and partnership forms add validation, acceptance references, duplicate protection, privacy notices and persistent records. Newsletter registration adds explicit consent, double opt-in, hashed expiring tokens and suppression.

`/admin` contains enquiry/partnership inboxes, workflow ownership and notes, consent history, authorized privacy correction/erasure, CSV exports, revision-based content editing and publishing, private previews, email failure review/retry, settings and media quarantine. Existing fixed-template pages expose their recovered text fields; resource/new-page bodies use structured rich text. Navigation labels, template structure and text in shared source arrays are still code-managed, rather than an unrestricted page builder.

Resource listings and sitemap use published content. Unpublished pages and private drafts are not publicly rendered. Legal `/terms` and `/cookies` pages are explicitly unapproved drafts and excluded from the sitemap; the existing privacy policy also requires owner/legal approval before launch.

Files remain in a private Azure container. A trusted Defender for Storage malware result with the matching SHA-256 moves a file to clean/rejected; an editor must explicitly publish clean media. Published media is served through `/api/media/{id}` with integrity checking, safe content types and PDF attachment disposition. No scanner result or development upload bypass is provided.

## Staff identity

Configure a **single-tenant** Microsoft Entra application with callback URI `<SITE_URL>/api/auth/callback/azure-ad`, and supply `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.

Define and assign Entra application roles exactly as `Administrator`, `Editor` and `Sales`. Administrators can manage privacy, exports, configuration and reviewed email retries; editors manage content/media; sales staff manage business inboxes. Every API checks permissions independently. Sessions last 15 minutes; privileged operations require authentication within five minutes. Apply approved Conditional Access/MFA policies in the tenant. Missing identity configuration shows an explicit unavailable notice; there is no local login bypass.

Real Entra sign-in, role assignments, MFA and callbacks must be verified in controlled staging before release.

Browser tests use ephemeral JWT secrets and isolated synthetic role claims to exercise the real staff UI and API. The test provider identifiers are intentionally nonexistent; no live Microsoft sign-in is attempted, and no authentication bypass is added to application code.

## Email worker and storage integration

`apps\worker` is an Azure Functions Node v4 application with dispatch, queue-send, delivery-report, poison and retention handlers. Queue messages contain outbox identifiers only. Sending is leased, bounded, and audited; ambiguous provider outcomes become `Unknown` and require reviewed duplicate-risk acknowledgment before retry. Provider acceptance and delivery are distinct states.

Configure the Functions host storage independently of business queues. The business connection prefix is `EmailQueue`, with `EmailQueue__queueServiceUri` for identity-based connection; the queue is `cloudyo-email`. Set `EMAIL_QUEUE_URL`, `ACS_EMAIL_ENDPOINT`, verified `EMAIL_FROM`, and `ACS_EVENT_SOURCE` (the exact ACS resource topic). Live sending requires `EMAIL_MODE=azure`; outside production an explicit `EMAIL_TEST_ALLOWLIST` is additionally mandatory.

Set `MEDIA_STORAGE_URL` to the blob account endpoint and `MEDIA_EVENT_SOURCE` to the exact storage resource topic. The private container is `media`. Enable Defender malware scanning and subscribe its result events to the `mediaScan` function. Route ACS reports to `emailDelivery`. Use authenticated Functions Event Grid endpoints with the platform system key and appropriate source/network restrictions; do not expose anonymous custom relay endpoints. Validate actual service schemas, subscription filters, identities and RBAC in staging.

The web identity needs only approved media access; the worker needs queue, email and relevant operational access. Configure least-privilege runtime database roles, Key Vault references and separate deployment credentials in the approved infrastructure plan. Never embed connection secrets in CI or Bicep.

Retained icon/UI helper notices are under `apps\web\public\licenses`, and the local font license is `apps\web\public\fonts\OFL.txt`. Cloud/provider trademarks and the original site's image ownership remain subject to the owner's usage rights.

Confirmation is an explicit POST; GET links do not alter consent. `/api/newsletter/unsubscribe?token=…` also accepts RFC 8058 `application/x-www-form-urlencoded` POST with `List-Unsubscribe=One-Click`, requiring the recipient's purpose-bound bearer token. Campaign sending/provider integration is Phase 2, not implemented; that integration must issue unsubscribe tokens and corresponding signed email headers.

Retention runs only with an administrator-saved, approved schedule. Unsent notification payloads expire after 24 hours and become explicitly failed. Production alerts must cover oldest pending jobs, queue failures, poison messages, unknown sends and delivery failures.

## Verification

Never use production databases, recipients or identities for tests. Integration and browser configuration reject database names not ending in `_test`. Use separate databases for integration and browser suites: integration teardown clears its disposable database.

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
$env:TEST_DATABASE_URL='postgresql://cloudyo:local-development-only@localhost:55432/cloudyo_test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm run db:migrate
npm run test:integration
$env:E2E_DATABASE_URL='postgresql://cloudyo:local-development-only@localhost:55432/cloudyo_e2e_test'
$env:DATABASE_URL=$env:E2E_DATABASE_URL
npm run db:migrate
npm run db:seed
npm run build
npm run test:e2e
```

Install the test browser with `npx playwright install chromium` if it is missing. Playwright starts and stops its own production server. Do not concurrently run a different app on port 3000.

Visual expectations in `tests\e2e\reference` are screenshots captured from the live reference, not candidate-generated approvals. They cover all 19 original routes at 390, 768 and 1440px. `npm run reference:capture` writes fresh evidence to ignored `.local\reference`; replacing tracked expectations requires reviewed approval, never a blind snapshot update. The required comparator is 1% pixel difference with a 0.2 threshold. Changes needed for consent, validation and accessibility must be reviewed explicitly rather than hidden by broad masks or relaxed thresholds.

CI runs formatting, lint, types, unit/integration checks, builds and browser gates with synthetic data. Actual tenant/email/storage behavior, manual keyboard/screen-reader checks, field performance, owner visual acceptance, backup restore and cloud rollback remain staging/release gates.

The Windows CI runner initializes the bundled PostgreSQL tools directly with UTF-8/C locale, inherited runner environment and visible initialization errors, then stops the disposable server even when verification fails. The optional local database helper remains for interactive development.
Git attributes keep source checkouts LF-normalized on Windows and Linux; generated Next.js type references are excluded from formatting.

**Known accessibility release blocker:** the original site's orange controls, muted footer text and resource metadata fail contrast requirements. Original colors are retained because theme changes have not been approved. `tests\e2e\reference\accessibility.json` records the live site's findings. The automated regression gate permits only measured existing color/font combinations without increasing their count, and fails new serious issues; it is **not** a claim of WCAG 2.2 AA compliance. Contrast corrections or an explicitly accepted exception still require the owner's decision.

## Build artifacts and Azure release boundary

`npm run build` creates a complete web standalone tree under `apps\web\.next\standalone`, including public assets/static files, and bundled worker entry point `apps\worker\dist\index.cjs`. `npm run start --workspace @cloudyo/web` runs the standalone application locally. Bind `HOSTNAME=0.0.0.0` explicitly on approved hosting and use its configured `PORT`.

Build on the same OS/architecture as the selected Azure runtime so Prisma's native engine matches; **do not deploy Windows-built artifacts to Linux App Service**. Deploy the entire standalone tree and start `node apps/web/server.js` from that tree on the host. For Functions, deploy `host.json`, the bundled entry point, the workspace dependency install/lockfile and generated Prisma runtime in a packaging layout validated with Functions Core Tools/staging. Bundling includes workspace source; Azure SDKs, Prisma, React Email, React and Zod remain runtime dependencies. A successful local module import is not evidence of a running Azure Functions host.

No Azure resources, production email, Entra assignments or DNS records have been created or changed. Before provisioning, obtain region/subscription/budget and infrastructure approval. Before launch, approve sender and recipient routing, legal content, retention, trusted ingress/client-IP handling, network restrictions, telemetry query-string/body redaction, monitoring/alerts, backup restoration (RPO/RTO), deployed artifact rollback and domain cutover. Application-side failures log correlation IDs and error classifications, not submitted bodies or raw tokens; hosting/access telemetry must separately redact token query strings.

Production ingress must supply a trustworthy, overwritten `x-azure-clientip` header (for example through an approved restricted Front Door origin). Do not trust arbitrary forwarded headers or expose a bypass origin. Until that architecture is validated, the application must not be exposed as production.

Follow `AGENTS.md`: changes require corresponding commits and passing relevant verification.
