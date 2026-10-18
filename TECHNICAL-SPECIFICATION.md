# Cloudyo Azure Web Application - Technical Specification

Version: 1.0

Date: 2026-10-19

Status: Accepted technology baseline; implementation and deployment not started

Product requirements: [PRODUCT-SPECIFICATION.md](PRODUCT-SPECIFICATION.md)

Reference website: https://cloudyo.ai

Repository: `D:\AI Dev\Cloudyo.ai`

## 1. Purpose and authority

Define the technology stack and implementation contracts for the accepted product specification. This document selects PostgreSQL and the TypeScript application stack from the alternatives previously left open in the product specification.

Product behavior, launch scope, privacy requirements, and visual acceptance remain governed by the product specification. This document does not authorize resource provisioning, paid services, production emails, identity changes, or DNS cutover.

The application is a modular monolith with a separate background worker deployment. Do not introduce microservices, Kubernetes, Redis, a separate .NET API, customer accounts, or a new marketing campaign engine for the first release.

## 2. Selected technology stack

| Area | Selection | Responsibility |
|---|---|---|
| Application language | TypeScript with strict checking | Shared types and maintainable application/worker code. |
| Runtime | Node.js LTS supported by the selected Next.js and Azure Functions versions | Node-based server execution; do not assume Edge runtime compatibility. |
| Application framework | Next.js App Router and React | Public pages, staff administration, and HTTP endpoints. |
| Styling | Tailwind CSS and authorized original styles/components | Preserve the reference design rather than install a replacement theme. |
| Forms | React Hook Form and Zod | Client interaction and authoritative server-side validation. |
| Database | Azure Database for PostgreSQL Flexible Server | Durable business records, content, consent, audit history, and outbox. |
| Database access | Prisma ORM and Prisma Migrate | Typed queries, transactions, schema history, and controlled migrations. |
| Staff authentication | Auth.js with Microsoft Entra ID | Single-tenant staff login with application roles. |
| Content editing | Tiptap in a focused Next.js administration area | Structured rich text, drafts, previews, revisions, and publishing. |
| Email templates | React Email | Shared branded HTML and plain-text output. |
| Email delivery | Azure Communication Services Email | Verified-domain transactional delivery. |
| Background processing | Azure Functions, TypeScript, Azure Storage Queue | Outbox dispatch, email processing, event handling, and scheduled maintenance. |
| File storage | Azure Blob Storage | Media and authorized downloadable documents. |
| Secrets/access | Azure Key Vault and managed identities | Secret protection and least-privilege Azure service access. |
| Telemetry | Application Insights and Azure Monitor | Redacted logs, metrics, distributed correlation, and alerts. |
| Tests | Vitest, React Testing Library, Playwright, axe-core | Unit, integration, browser, visual, and accessibility verification. |
| Infrastructure/delivery | Bicep and GitHub Actions | Repeatable infrastructure, federated deployment authentication, and release gates. |

At implementation kickoff, select mutually compatible supported stable package versions, record exact versions in manifests, and commit the npm lockfile. Use `npm ci` for reproducible CI installs. Do not select prerelease authentication/runtime dependencies without a documented compatibility decision.

Keep the initial repository as one npm-workspace project with web, worker, and shared packages; no additional orchestration framework is required.

## 3. Runtime boundaries and repository organization

| Logical location | Purpose |
|---|---|
| `apps\web` | Next.js public routes, administration UI, HTTP handlers, and web configuration. |
| `apps\worker` | Azure Functions timer, queue, and email event handlers. |
| `packages\core` | Business rules, workflow transitions, validation schemas, and authorization policy definitions. |
| `packages\data` | Prisma schema, generated client integration, migrations, and transactional repositories. |
| `packages\email` | Email templates and rendering helpers. |
| `tests\e2e` | Browser workflows, visual baselines, and accessibility tests. |
| `infra` | Bicep modules and nonsecret environment parameters, created only after infrastructure approval. |

Browser bundles must never import database clients, Azure credentials, server configuration, or privileged services. Mark server-only modules accordingly. Use shared application services from route handlers instead of making internal HTTP calls back into the same application.

Azure App Service hosts the Next.js Node server. Azure Functions hosts background work. Both use the same business/database contracts but independently configured managed identities and least-privilege permissions.

## 4. Public rendering and design preservation

Implement all routes inventoried in the product specification, preserving existing published resource slugs and approved redirect mappings.

Use server rendering or prerendering for public content, page metadata, canonical links, sitemap, and social previews. Use client components only where interaction requires them. Administration, draft previews, and personal-data APIs must be dynamic, private, and uncached.

Public content queries must select published revisions explicitly. Publish/unpublish operations must invalidate affected caches across running instances. For the initial release, prefer dynamic rendering of CMS-driven pages if shared cache invalidation cannot be proven correct; do not rely on one instance's local cache.

Reuse the original logo, images, styles, component structure, and animations where authorized. Preserve the primary `hsl(193 83% 10%)`, accent `hsl(10 100% 53%)`, neutral colors, component radii, and existing responsive breakpoints.

The Inter versus Plus Jakarta Sans declaration discrepancy identified in the product specification must be resolved through actual computed font inspection before implementation. Pin verified font assets and weights; do not guess or substitute.

Playwright screenshot requirements:

- Baseline and candidate use identical browser builds, fonts, device scale, viewport, content, and animation stabilization.
- Required viewports: `390 x 844`, `768 x 1024`, and `1440 x 900`; also inspect 320px overflow and breakpoint transitions.
- Configure `maxDiffPixelRatio: 0.01` and `threshold: 0.2`.
- Cover all public routes, published resource pages, shared navigation, and reproducible form states.
- Require owner visual approval; numerical comparison does not excuse changed branding or layout.

Do not submit production forms while collecting the reference baseline. Test submission states using controlled fixtures in the candidate application.

## 5. Data model and persistence

Use generated UUID primary keys, UTC timestamps, foreign keys, explicit unique constraints, and indexes matching list/filter queries. Business reference numbers must not expose sensitive identifiers.

| Entity | Main fields and constraints |
|---|---|
| ContactEnquiry | Reference, names, optional company, email, topic, message, status, assigned staff identifier, created/updated timestamps. |
| PartnerApplication | Reference, organization, contact, email, interest, value proposition, status, owner, timestamps. |
| InternalNote | Parent record reference, author identity, note body, timestamps; never returned by public APIs. |
| Subscriber | Original email, normalized lookup key, Pending/Confirmed/Suppressed state, confirmation/suppression timestamps. Unique normalized lookup key. |
| ConsentEvent | Subscriber, purpose, action, notice version, source, timestamp; append-only consent history. |
| SubscriptionToken | Subscriber, purpose, token hash, expiry, used/revoked timestamp; raw bearer tokens are not stored here. |
| ContentPage/ResourceArticle | Stable identifier, route/slug, content type, draft/published revision pointers, SEO metadata, timestamps. |
| ContentRevision | Parent content, version, structured rich text/approved section data, author, timestamp. Immutable revision records. |
| Redirect | Unique source path, internal destination, redirect status; reject loops and reserved-path collisions. |
| MediaAsset | Blob key, media type, byte size, checksum, alternative text, visibility, uploader. |
| EmailOutbox | Business reference, template/version, recipient purpose, protected payload, state, attempt count, next attempt, lease, provider operation/message identifiers. |
| EmailDeliveryEvent | Unique provider event identifier, message correlation, event type, event timestamp, sanitized details. |
| AuditEvent | Staff actor, action, target identifier, timestamp, safe change summary. Do not copy full enquiry bodies. |
| IdempotencyRecord | Endpoint scope, key hash, request fingerprint, accepted response/reference, expiry; unique scope/key combination. |
| AbuseLimit | Short-lived purpose-bound pseudonymous key, window, count, expiry; atomic shared rate limiting. |
| ApplicationSetting | Typed validated settings, version, updater; no application secrets. |

Validate statuses and topic/interest enums at service and persistence boundaries. Use optimistic concurrency for staff edits so one user's change cannot silently overwrite another's.

Normalize email conservatively: trim surrounding whitespace and normalize the domain, without stripping dots, plus suffixes, or case-folding meaningful local-part characters. Keep the submitted display address. Document the normalization policy and test it consistently.

Use database transactions for business changes requiring atomicity, including accepted forms plus idempotency/outbox records, subscriber/consent transitions, and publishing plus audit records.

Set explicit connection-pool bounds for each web instance and worker. Worker concurrency and autoscaling must remain within the database connection budget. Do not assume platform scaling makes database connections unlimited.

## 6. HTTP and validation contracts

Preserve current public submission paths. Internal administrative endpoint names below are implementation contracts, not changes to public page URLs.

| Endpoint | Contract |
|---|---|
| `POST /api/email/contact` | Validate and persist contact enquiry plus internal/acknowledgement outbox records. Return accepted reference. |
| `POST /api/email/partner` | Validate and persist partner application plus outbox records. Return accepted reference. |
| `POST /api/email/subscribe` | Validate consent and initiate confirmation when allowed. Always use a generic accepted response that does not expose membership. |
| `GET /newsletter/confirm` | Render token confirmation UI without changing subscription state. No token logging, analytics, or third-party resources. |
| `POST /api/newsletter/confirm` | Atomically validate and consume confirmation token, record consent, and confirm subscription. |
| `GET /newsletter/unsubscribe` | Render confirmation UI; GET must not change subscription state. |
| `POST /api/newsletter/unsubscribe` | Explicit token-authorized unsubscribe; also support the provider one-click POST contract when marketing is integrated. |
| `/api/admin/*` | Authenticated, role-checked enquiry, partner, subscriber, content, media, settings, and audited retry operations. |
| `/api/auth/*` | Auth.js-managed authentication endpoints. No public account registration. |
| `GET /health/live` | Minimal liveness response without dependency details. |
| `GET /health/ready` | Bounded readiness probe; return 503 when essential acceptance dependencies are unavailable. Do not expose topology or secrets. |

Successful durable contact/partner acceptance returns HTTP 202 with `reference`, `status: "accepted"`, and `correlationId`. It does not claim email delivery. Newsletter acceptance omits any subscriber identifier or membership information.

Errors use a consistent envelope containing `error.code`, safe `error.message`, optional `error.fieldErrors`, and `correlationId`. Use 400 for invalid input, 401/403 for staff access failures, 409 for idempotency conflicts or stale updates, 413 for oversized payloads, 429 with Retry-After for throttling, and 503 for retryable acceptance outages. Unexpected errors return a safe 500 response and are logged explicitly.

Require JSON for ordinary submission APIs. Enforce a 64 KiB request limit before parsing. Names are limited to 100 characters, company/organization to 200, email to 254, and message/value proposition to 5,000. Media uses a separate authenticated upload contract.

Clients generate an idempotency key for each deliberate contact/partner submission and reuse it on retry. Atomically enforce uniqueness; replay the accepted response for a matching request, reject changed payloads under the same key, and reject replay outside the configured 24-hour window. Store hashes rather than raw keys, and do not return sensitive submission content.

Use server-side shared rate limiting rather than process-local counters. Initial configurable limits: five contact/partner attempts per ten minutes per purpose-bound client key and three confirmation emails per address per hour. Test tuning before launch. Hash abuse identifiers with a protected server secret, expire them promptly, and never log raw IP addresses by default. Add honeypot/time checks and CAPTCHA escalation without silently dropping valid-looking submissions.

## 7. Staff identity and authorization

Configure Auth.js against one approved Entra tenant and validate issuer, audience, authentication state, and trusted callback origins. Do not grant access merely because an email matches a company domain.

Define Entra application roles `Administrator`, `Editor`, and `Sales`. Deny staff access when no authorized role is present. Enforce the product permission matrix in server-side policy helpers on every read, mutation, and export, including direct endpoint access.

Use secure, HttpOnly session cookies, appropriate SameSite settings, session expiry, and CSRF/origin checks for cookie-authenticated mutations. MFA is enforced by the organization's Entra policy, not by a UI checkbox.

Choose a documented session strategy at implementation. Authorization must not depend indefinitely on stale login claims: use bounded sessions and require fresh authorization for privileged operations. Test role removal, disabled users, logout, and expired sessions.

Sales may access business enquiries but not publish content or change settings. Editors may manage public content but not read enquiries or export subscriber data. Administrators may perform audited privileged operations. Apply least privilege to exports and provide formula-safe CSV output.

## 8. Content administration and media

Store Tiptap content as schema-validated structured JSON with an allowlist of supported nodes and marks. Render through controlled components; sanitize imported rich text and reject arbitrary scripts, inline handlers, unsafe URLs, and unsupported embeds.

Represent existing marketing layouts as fixed components with editable, validated content fields. Do not expose a free-form page builder that can accidentally alter the accepted public design.

Save creates a draft revision. Preview requires staff authorization and private/no-store responses. Publish atomically updates the published revision and audit record, then refreshes affected public content. Unpublish removes content from public rendering and sitemap.

Validate slug changes and create permanent redirects without chains or loops. Reject conflicts with reserved routes. Publishing must retain previous revisions for authorized restoration.

Staff media uploads are limited initially to 10 MiB per file, approved raster images, and PDF documents. Verify content signatures, not only extensions. Quarantine and scan files before publishing; use unique blob keys and never execute uploaded content. Original trusted SVG brand assets may be imported through the controlled repository workflow, not arbitrary staff SVG upload.

Private blobs require authenticated access or short-lived narrowly scoped URLs. Public files must not contain secrets, personal records, or unapproved content.

## 9. Reliable email and newsletter processing

1. A server transaction stores an accepted business record, idempotency record, and separate outbox entries for each intended recipient/template.
2. A timer-triggered dispatcher claims due outbox entries using database leases, enqueues identifiers only, and records enqueue state. A crash after enqueue but before recording can enqueue twice; workers must tolerate this.
3. The queue worker checks the database state and claims the entry before sending. It renders the versioned template and records provider operation identifiers as soon as available.
4. Authenticated provider events update correlated delivery history idempotently. Duplicate or out-of-order events must not regress final delivery state.
5. A sweeper recovers expired leases and overdue work. Exhausted failures and poison messages are visible, alerted, and eligible only for controlled audited retry.

Queue delivery is at least once. Do not promise exactly-once email delivery: a timeout or crash after provider acceptance can leave an ambiguous send outcome. Reconcile using stored provider operation identifiers when possible; otherwise mark the outcome Unknown and require controlled resolution instead of an unbounded automatic resend.

Use bounded exponential backoff with jitter, initially five application send attempts, capped at 30 minutes between attempts. Distinguish safe transient retries from ambiguous send outcomes and permanent rejections. Coordinate queue retry/visibility settings with the application attempt budget so platform retries do not multiply sends.

Outbox states distinguish Pending, Enqueued, Sending, ProviderAccepted, Delivered, Bounced, Failed, and Unknown. ProviderAccepted is not Delivered. Store event history for messages with multiple outcomes and avoid treating a later unrelated event as proof of delivery.

Use React Email templates for the five required message types, with HTML and plain-text alternatives. Sender and internal routing come from validated configuration. Visitor addresses may be Reply-To, never arbitrary From values.

Configure sender-domain verification, SPF, DKIM, and DMARC without replacing existing mailbox/MX records. Validate the exact ACS Email SDK authentication method and assigned service permissions during implementation.

Generate confirmation tokens using cryptographic randomness, expire them initially after 24 hours, store hashes, and consume them atomically once. Because confirmation email delivery requires the raw token, protect any temporary outbox payload containing it at rest and restrict/decommission it after send/expiry; never log tokens or queue them as plaintext.

Confirmation and unsubscribe pages use no-referrer headers and exclude third-party analytics. Keep suppression and consent history separate from ordinary enquiries. Re-opt-in requires fresh explicit confirmation and cannot be triggered by imports. Newsletter campaign integration remains Phase 2.

Receive delivery reports through Azure Event Grid to a Function using an approved authenticated delivery mechanism. Validate subscription/source and schema, and handle subscription validation through the platform-supported flow. Do not expose an unauthenticated arbitrary event ingestion endpoint.

## 10. Security, configuration, and privacy

Keep secrets out of Git and browser-visible environment variables. Use managed identity for supported Azure SDK access; use Key Vault for remaining secrets, including authentication credentials and database credentials where required.

PostgreSQL uses TLS, a restricted runtime database role, and separate migration privileges. Entra database authentication is optional only after Prisma token-refresh/pooling compatibility is proven; do not assume Azure SDK identity automatically authenticates Prisma.

Define restrictive network access for database and storage according to the approved environment. Avoid broad public firewall exceptions. Select private networking and its cost explicitly during infrastructure planning.

Apply appropriate CSP, frame restrictions, content-type protection, referrer policy, and HTTPS controls without breaking approved fonts or assets. Validate same-origin mutations and do not enable wildcard credentialed CORS.

Telemetry must not capture form bodies, recipient addresses, session cookies, raw tokens, or URL query strings containing bearer tokens. Configure SDK redaction and test it. Track safe record identifiers and correlation identifiers instead.

Enforce approved retention through scheduled, observable jobs. Reconcile deletion with suppression, legal holds, audit retention, and backup expiration. Production must not launch with an unapproved retention schedule.

Development and staging use synthetic data and a mock/capture email adapter by default. Controlled real delivery requires an explicit recipient allowlist and authorized configuration. Never point automated tests at production dependencies.

## 11. Azure hosting and operational controls

| Service | Operational requirement |
|---|---|
| App Service | Linux Node hosting, health checks, controlled scaling, no durable application state on local disk. Use staging/promotion capabilities supported by the approved tier. |
| PostgreSQL Flexible Server | Compatible supported engine version, bounded connections, backups, restore exercise, and monitored capacity. |
| Functions | Hosting plan/runtime compatible with chosen Node version, queue/timer triggers, networking, and identity-based dependencies. |
| Storage | Separate application media and queue permissions; configure required Functions host storage independently from business media access. |
| ACS Email/Event Grid | Verified sender, checked sending quotas and regional availability, correlated delivery events, and actionable failures. |
| Key Vault | Narrow app/worker permissions, audit logging, and documented secret rotation. |
| Application Insights/Monitor | Redacted traces and alerts for acceptance failures, oldest pending outbox age, queue backlog, poisoned jobs, and email failures. |

Provision separate production and nonproduction resources/configuration. Exact region, subscription, resource names, SKUs, availability settings, and cost require a separate approved deployment plan.

Application health must distinguish inability to accept durable submissions from delayed email processing. An email provider outage should raise an alert without losing accepted enquiries or falsely marking their notifications delivered.

Target database RPO <= 24 hours and service RTO <= 8 hours as specified in the product document. Demonstrate these against the selected service tier and restore procedure; do not treat them as unverified platform guarantees.

## 12. Delivery, migrations, and rollback

GitHub Actions must run formatting/linting, TypeScript checks, unit/integration tests, application/worker builds, browser tests, and required visual/accessibility gates before production promotion.

Use federated GitHub-to-Azure authentication and environment-scoped approvals. Keep deployment identity distinct from application runtime identities. Infrastructure is defined in Bicep only after the required infrastructure approval.

Commit Prisma migrations. Test them against disposable PostgreSQL and a staging database. Run controlled production migrations as a single release job, not during application startup or on every instance.

Use expand/migrate/contract schema changes compatible with both old and new application versions during rollout. Back up before risky migrations; verify recovery before destructive changes.

Deploy a versioned artifact to staging, validate health and smoke workflows, then promote the same artifact. Rollback must cover both web and worker compatibility; a code rollback must not assume the database can be automatically reversed.

Maintain a cutover checklist preserving existing web routes, MX/TXT records, data counts, consent history, and submissions arriving during final migration or rollback.

## 13. Test strategy and acceptance mapping

| Suite | Required coverage |
|---|---|
| Vitest unit | Zod rules, normalization, status transitions, authorization policies, template escaping, token lifecycle, and retry classification. |
| PostgreSQL integration | Transaction rollback, unique/idempotency constraints, concurrency, outbox leasing, publish/revision logic, consent, retention, and migration compatibility. |
| Worker integration | Duplicate queue messages, lost enqueue acknowledgements, expired leases, poison handling, ambiguous provider outcomes, and duplicate/out-of-order events. |
| React Testing Library | Form validation and accessible errors, pending/accepted/failure states, staff controls, and content editing interactions. |
| Playwright workflows | Contact, partner, newsletter confirmation/unsubscribe, private previews, staff roles, exports, CMS publishing, routes, redirects, and downloads. |
| Playwright visual | Product-specified viewports, reference states, `maxDiffPixelRatio: 0.01`, `threshold: 0.2`, and reviewed baseline updates. |
| Accessibility | axe-core plus manual keyboard, focus, zoom, and screen-reader smoke verification targeting WCAG 2.2 AA. |
| SEO/performance | Rendered metadata/content, sitemap, canonical URLs, noindex/private behavior, responsive media, and repeatable performance measurement. |
| Operations | Authenticated controlled email delivery, alert triggering, backup restore, release rollback, and cutover reconciliation. |

Use a real disposable PostgreSQL instance for integration tests rather than SQLite, which cannot establish PostgreSQL transaction and locking behavior. Use Azurite for compatible local storage tests and controlled Azure staging for features it does not emulate.

Application authentication policy tests may use isolated test identities; at least one controlled staging test must verify actual Entra sign-in, roles, session expiry, and callback configuration. Test-only authentication bypasses must be impossible in production configuration.

Retain product targets: p75 LCP <= 2.5 seconds, INP <= 200ms, and CLS <= 0.1, with sufficient field data; record lab limitations before field data is available. Test loading only in approved nonproduction environments.

## 14. Implementation sequence and completion gates

1. Obtain original source/assets and integrations, resolve fonts, and capture approved content/visual baselines.
2. Establish the supported package/runtime matrix, workspace, CI checks, validation contracts, schema, and migration tests.
3. Reproduce public pages and SEO behavior without changing the reference theme.
4. Implement durable forms, idempotency, outbox dispatch, email templates, confirmation, suppression, and failure visibility.
5. Implement Entra staff access, permission enforcement, business inboxes, content revisions/publishing, and safe media handling.
6. Prepare the Azure cost/infrastructure plan for approval; deploy only after explicit deployment approval.
7. Complete staged functional, visual, privacy, accessibility, delivery, recovery, and owner acceptance gates.
8. Perform approved data/DNS cutover, observe production workflows, and retain a tested rollback path.

Every implementation change requires the corresponding Git commit and relevant passing checks under `AGENTS.md`. Documentation completion does not imply implementation completion.

Outstanding deployment inputs remain: original source/assets and exports, rendered font baseline, Entra tenant/app registration and roles, recipient/sender settings, region/subscription/budget, domain control, retention policy, and cutover approval. This document selects the stack but does not fabricate these operational details.
