# Cloudyo Azure Web Application - Product Specification

Version: 1.0

Date: 2026-10-19

Status: Proposed implementation baseline; no application or Azure resources deployed

Reference website: https://cloudyo.ai

Target repository: `D:\AI Dev\Cloudyo.ai`

## 1. Product objective

Rebuild the existing Cloudyo website as an Azure-hosted web application with complete contact, partnership, newsletter, email, and staff administration workflows.

**The public website must retain the existing Cloudyo design and theme. This is a functional migration, not a redesign.** New backend capabilities must not replace the existing visual identity with a generic template.

The owner accepted the recommended feature scope. This document defines that scope and its release criteria; it does not authorize cloud provisioning, DNS changes, paid services, or production communications.

## 2. Evidence and assumptions

The public HTML, stylesheet, and JavaScript served by https://cloudyo.ai were inspected on 2026-10-19. Public route definitions, form fields, submission endpoints, content labels, and CSS theme variables were identified.

Public inspection does not establish whether the existing backend stores submissions, delivers emails, maintains consent history, or provides private administration. Those behaviors must be verified against the original source and authorized access before migration.

No rendered screenshot baseline or browser-computed typography was captured during this specification exercise. Visual equivalence is a mandatory implementation acceptance gate, not a claim already verified.

Assumptions:

- The owner will provide authorized source code, original assets, and existing data exports where available.
- English is the initial site language. Localization is outside the first release.
- Visitors do not need accounts. Staff use organization-controlled identities.
- Existing approved public content and URLs are retained unless the owner explicitly approves changes.
- Existing business email mailboxes remain with their current provider unless separately requested.
- Azure region, subscription, budget, domain access, and recipient addresses remain deployment inputs.

## 3. Users and permissions

| User | Capabilities |
|---|---|
| Visitor | Browse public content, submit enquiries and partnership applications, subscribe, confirm subscription, and unsubscribe. |
| Sales | Access authorized enquiries and partner applications, assign owners, add internal notes, and update workflow status. |
| Editor | Create and revise public content and media; preview and publish approved content. No access to enquiries or subscriber exports by default. |
| Administrator | Manage application settings, authorized workflow recipients, role assignments through the approved identity process, and restricted data operations. |

All staff endpoints require server-side authentication and authorization. Hiding navigation elements alone is insufficient. Personal-data access and exports must be audited.

## 4. Public website and route inventory

| Route | Required content and behavior |
|---|---|
| `/` | Current hero, imagery, positioning, business metrics, provider logos, core expertise, value propositions, and calls to action. |
| `/expertise` | Overview of all existing service areas and links to their detail pages. |
| `/expertise/software-procurement` | Software procurement advisory, negotiation, license optimization, compliance, and assessment enquiry links. |
| `/expertise/it-cost-management` | FinOps, spend analytics, rightsizing, and assessment enquiry links. |
| `/expertise/cloud-services` | Migration, architecture, managed services, and cloud architect enquiry links. |
| `/expertise/data-ai-solutions` | Data engineering, AI strategy, MLOps, and enquiry links. |
| `/industries` | Financial services, healthcare, manufacturing, retail/e-commerce, education, and public sector content. |
| `/cloud-providers` | Existing provider information, approved logos, certifications, and partner-related content. |
| `/resources` | Blog, case study, and whitepaper listings with existing category filters. |
| `/resources/:slug` | Individual resource content, metadata, imagery, related calls to action, and downloads where existing assets support them. Preserve actual published slugs. |
| `/about` | Existing company story, values, and imagery. |
| `/contact` | Contact form, office details, direct email, and telephone information. |
| `/partner-with-us` | Partnership benefits and application form. |
| `/privacy` | Approved privacy policy reflecting implemented processing. |
| Legal routes | Working Terms of Service and Cookie Policy destinations; proposed routes are `/terms` and `/cookies`, subject to legacy URL inventory. |
| Unknown route | Branded, helpful not-found page and an appropriate HTTP 404 response. |

Shared navigation, mobile navigation, footer, newsletter entry point, and contextual enquiry links must work on every applicable page. Service-specific calls to action should preselect the matching enquiry topic without changing the established design.

Resource search, pagination, and related-article recommendations beyond existing behavior are Phase 2. The first release must preserve the complete authorized published resource inventory, not only sample articles.

## 5. Design and theme preservation - mandatory

### 5.1 Visual contract

Preserve the reference site's:

- Logo, wordmark, favicon, approved partner logos, original photographs, illustrations, and image crops.
- Page composition, section order, text hierarchy, content widths, alignment, whitespace, and alternating section backgrounds.
- Dark primary surfaces, orange accent treatment, white/light neutral surfaces, borders, shadows, cards, and corner treatments.
- Header and footer layouts, navigation behavior, button hierarchy, input styling, and call-to-action placement.
- Existing responsive layouts and animation behavior, with reduced-motion support.

Do not substitute stock imagery, change brand colors, introduce a new public dark-mode toggle, replace typography, or materially rearrange pages without owner approval. Accessibility corrections must be narrowly scoped and documented; material visual changes require approval.

### 5.2 Observed theme tokens

These are values observed in the served stylesheet, not approximated colors from screenshots.

| Token | Reference value |
|---|---|
| Background and card | `hsl(0 0% 100%)` |
| Foreground and primary | `hsl(193 83% 10%)` |
| Primary foreground | `hsl(0 0% 100%)` |
| Accent | `hsl(10 100% 53%)` |
| Accent foreground | `hsl(0 0% 100%)` |
| Secondary and muted | `hsl(214 32% 96%)` |
| Muted foreground | `hsl(215 16% 47%)` |
| Border and input | `hsl(214 32% 91%)` |
| Destructive | `hsl(0 84.2% 60.2%)` |
| Base radius | `0.5rem`; preserve component-specific variants |
| Responsive breakpoints | `40rem`, `48rem`, `64rem`, `80rem`, and `96rem` |

The HTML requests Inter weights 400, 500, 600, and 700, while the stylesheet declares `--app-font-sans: "Plus Jakarta Sans", sans-serif`. Implementation must inspect actual rendered font usage and font loading on the reference site before selecting or packaging fonts. Do not assume either declaration alone represents the visible typography.

Reuse authorized original components and styles when practical. Retain the original token mappings and component-specific overrides rather than rebuilding from these tokens alone.

### 5.3 Baseline and visual acceptance

Before UI implementation, capture a dated baseline of every public route, every published resource detail page, header/footer states, open mobile navigation, and form states that can be inspected without sending production submissions.

Capture at minimum these viewport sizes in CSS pixels: `390 x 844`, `768 x 1024`, and `1440 x 900`. Inspect narrow-screen behavior at 320px width and navigation immediately around the existing breakpoints.

Use the same browser version, device scale, fonts, content, and viewport for baseline and candidate screenshots. Wait for fonts and images and stabilize animations. Mask only documented dynamic regions, never layout errors or substantive content.

Release requires:

- Automated visual comparisons with no more than 1% differing pixels per captured page/state, using a recorded per-pixel threshold of 0.2 in the selected screenshot tool.
- No unexplained differences in logos, colors, typography, hero composition, section order, or primary calls to action, even if the numerical threshold passes.
- Manual side-by-side owner approval of the public design.
- No unintended horizontal overflow, clipped content, broken images, or unusable mobile navigation.

Visual baselines must not be updated simply to make failing comparisons pass. Intentional differences need an approved change record. The administration UI is new, but must reuse Cloudyo colors, typography, and shared component styling.

## 6. Forms and workflow requirements

### 6.1 Contact enquiry

Preserve first name, last name, company, work email, topic, and message. Retain the current required/optional indicators after checking the original implementation; first name, last name, email, and message must be required.

Topics include Software Procurement Advisory, IT Cost Management / FinOps, Cloud Migration Services, Data & AI Solutions, and General Inquiry. Add the AI topic consistently to the existing selector and routing configuration.

On submission:

1. Validate the request on the server and apply spam/rate controls.
2. Persist the accepted enquiry and a notification outbox record atomically.
3. Return a durable reference number and the existing branded success experience.
4. Deliver internal notifications to configured topic recipients and an acknowledgement to the visitor.
5. Make the enquiry immediately available to authorized staff.

Preserve the displayed one-business-day response expectation only if the owner confirms it is operationally supported. An acknowledgement is not a guarantee of email delivery or a completed staff response.

### 6.2 Partnership application

Preserve organization name, contact name, work email, partnership interest, and value proposition. Interest options include Technology / ISV, System Integrator, and Referral / Affiliate.

Persist accepted applications and outbox records atomically; return a reference number; notify the partnerships team; send a branded applicant acknowledgement. Track New, In Review, Approved, and Declined states with owner, timestamps, and internal notes.

Preserve the displayed three-business-day response expectation only after operational confirmation.

### 6.3 Newsletter

Keep the existing footer subscription design. Require explicit newsletter consent and double opt-in before enabling marketing delivery.

- Normalize and deduplicate addresses without modifying meaningful address characters.
- Record consent purpose, notice version, source, timestamp, and confirmation status.
- Use expiring, unpredictable confirmation tokens; store token hashes rather than raw tokens.
- Repeated signup must not reveal whether an address already exists or bypass confirmation.
- Provide unsubscribe links in marketing messages, support provider one-click unsubscribe, and maintain a suppression record.
- A normal visit or GET request must not silently unsubscribe a user; use a confirmation page and explicit action, with provider one-click POST support where applicable.
- Do not re-enable suppressed recipients through an import or retry. A fresh subscription requires an explicit new opt-in flow.
- A contact or partnership submission must not automatically subscribe the visitor.

Campaign composition, segmentation, and scheduling are Phase 2 integrations with a dedicated marketing platform, not custom first-release email software.

### 6.4 Shared input, abuse, and error handling

Validate types, required fields, allowed topics, email syntax, and field lengths on both client and server. Initial limits: names 100 characters per field, organization/company 200, email 254, and free-text messages/value propositions 5,000.

Apply configurable server-side rate limits, honeypot/time-based abuse detection, and CAPTCHA escalation when necessary. Do not reject personal email providers merely because the label says "work email."

Disable duplicate clicks and use idempotency identifiers so request retries create only one business submission. Render user content safely; never concatenate visitor input into email headers or HTML.

Distinguish validation, throttling, temporary outage, and unknown failures with accessible messages and correlation identifiers. Never show success before durable acceptance. A database/outbox write failure must return a retryable error rather than a false success.

## 7. Email delivery

Use verified company sending domains with SPF, DKIM, and DMARC configuration appropriate to the existing mail setup. Use a company address as From and a validated visitor address as Reply-To for internal enquiry notifications.

Required templates: contact acknowledgement, internal contact notification, partnership acknowledgement, internal partnership notification, and newsletter confirmation. Provide HTML and plain-text variants using consistent Cloudyo branding.

Process outbox records asynchronously through a queue. Retry transient failures with bounded exponential backoff; move exhausted jobs to a monitored failure state. Expose failure reasons and an audited authorized retry action.

Track queued, provider-accepted, delivered, bounced, and failed states where the provider supports them. Provider acceptance must not be displayed as delivery. Handle duplicate and out-of-order queue/event deliveries idempotently and prevent uncontrolled resend loops.

Keep secrets and personal data out of telemetry. Transactional email and marketing consent are separate. No production email is sent during automated tests.

## 8. Administration and content management

Launch administration includes:

- Entra ID staff sign-in, organizational MFA policy, role-based navigation, and server-side access enforcement.
- Contact enquiry inbox with search, topic/status filters, ownership, internal notes, and New/In Progress/Closed states.
- Partnership inbox with the application workflow defined above.
- Notification status, failure visibility, and controlled retries.
- Subscriber confirmation and suppression visibility, consent history, and permission-restricted exports.
- Content editing for service copy, articles, contact details, media, and SEO metadata.
- Draft, preview, publish, unpublish, and revision history; drafts are not publicly accessible or indexed.
- Authorized recipient/settings changes with validation and audit records.

Sanitize rich content, validate media type and size, restrict uploads to authorized staff, and prevent executable uploads. Media descriptions and alternative text are editable. Renaming a published resource slug must create a redirect from the old URL.

Business dashboards, CRM synchronization, calendar booking, advanced editorial approval chains, and customer portals are not launch dependencies.

## 9. Data and privacy

Core records: ContactEnquiry, PartnerApplication, Subscriber, ConsentEvent, ContentPage, ResourceArticle, MediaAsset, EmailOutbox, EmailDeliveryEvent, and AuditEvent. Staff identity references use Entra identifiers; do not store application passwords.

Store timestamps in UTC. Record durable identifiers and relevant lifecycle timestamps. Audit events capture actor, action, record identifier, and timestamp without unnecessarily copying message bodies.

Protect personal data in transit and at rest. Restrict exports, prevent spreadsheet formula injection in CSV exports, and support authorized access/correction/deletion requests. Do not collect IP addresses or tracking identifiers beyond an approved operational purpose.

The owner must approve a retention schedule for enquiries, applications, subscriptions, audit logs, and backups before production. Deletion and suppression rules must be reconciled with legal obligations and backup retention. Do not invent legal compliance guarantees.

Use essential cookies only by default. Activate nonessential analytics or marketing tracking only after applicable consent. Publish privacy and cookie text matching actual providers, regions, processing purposes, and retention.

## 10. SEO, accessibility, and quality

- Preserve existing published URLs and implement permanent redirects for approved changes.
- Provide unique titles, descriptions, canonical URLs, and social previews for indexable pages.
- Replace the observed placeholder Replit-related descriptions with approved Cloudyo metadata.
- Serve a real XML sitemap containing public published canonical URLs. The inspected `/sitemap.xml` currently returns the application HTML shell.
- Exclude administration, previews, confirmation tokens, and unsubscribe tokens from indexing.
- Make meaningful public content available to crawlers through server rendering or prerendering rather than relying solely on an empty client shell.
- Target WCAG 2.2 AA: keyboard access, visible focus, labelled inputs, associated errors, appropriate contrast, semantic structure, and reduced-motion support.
- Support current and previous major Chrome, Edge, Firefox, and Safari releases, including mobile Safari and Chrome.
- Optimize original images and reserve layout space without changing their visible crop or quality materially.

Performance targets after launch: p75 LCP <= 2.5 seconds, INP <= 200ms, and CLS <= 0.1, measured separately for mobile and desktop when sufficient field data exists. Before sufficient field data, use repeatable representative lab measurements and record their limitations.

## 11. Proposed Azure architecture

| Responsibility | Proposed service and constraints |
|---|---|
| Public site, administration, API | Azure App Service, initially one modular application; support server-rendered or prerendered public content. |
| Application records | One managed relational database: Azure SQL Database or Azure Database for PostgreSQL. Select one during technical design, not both by default. |
| Media and documents | Azure Blob Storage; private storage for any nonpublic material. |
| Transactional email | Azure Communication Services Email with verified sender domain and checked regional availability/quotas. |
| Asynchronous processing | Azure Storage Queue and Azure Functions, backed by a database outbox so database writes and enqueue operations cannot lose accepted submissions. |
| Staff identity | Microsoft Entra ID; application roles and organization-controlled MFA policy. |
| Secrets and access | Azure Key Vault and managed identities; narrowly scoped permissions. |
| Observability | Application Insights and Azure Monitor with personal-data redaction and alerting. |
| Delivery | GitHub Actions using federated Azure authentication, staging checks, and controlled production promotion. |
| Optional edge protection | Azure Front Door/WAF when justified by traffic, security, and availability requirements. |

Application framework, database engine, resource SKUs, and region are technical-design decisions after obtaining the original source, workload estimates, data residency requirements, and budget. Prefer reuse of working original components over an unnecessary rewrite. Kubernetes is not required for the specified launch scope.

Keep development/staging and production configuration, data, credentials, queues, and email behavior isolated. Staging messages must be captured or restricted to approved test recipients.

## 12. Operations, recovery, and deployment

- HTTPS-only operation, health endpoints, secure session handling, and no public debug endpoints.
- Alert on sustained application errors, failed form acceptance, growing queue backlog, exhausted email retries, and failed background processing.
- Use bounded retries, dependency timeouts, and structured correlation identifiers across API, outbox, worker, and provider events.
- Configure backups and demonstrate restoration. Initial planning targets are database RPO <= 24 hours and service RTO <= 8 hours; these are requirements to validate against the selected tier, not promised Azure guarantees.
- Document resource ownership, runbooks, retention, email troubleshooting, and restore/rollback procedures.
- Require separate approval of the Azure plan and estimated cost before provisioning.
- Use backward-compatible migrations and define recovery steps before applying destructive schema changes.

## 13. Migration and cutover

1. Obtain authorized source, original media, published route/resource inventory, email configuration, and available data exports.
2. Freeze a dated content and visual baseline; reconcile source with the reference website.
3. Inventory backend integrations and prove which existing workflows must be retained.
4. Implement and verify the Azure-hosted candidate in isolated staging.
5. Migrate authorized data with count reconciliation, consent preservation, duplicate checks, and a defined final-delta procedure.
6. Obtain content, legal, visual, workflow, and operational acceptance.
7. Approve DNS changes, record previous values, and preserve existing MX and unrelated TXT records.
8. Promote the release, switch web traffic, and monitor forms, queues, delivery, and errors.
9. Retain a rollback window and reconcile submissions accepted by either system during cutover or rollback.

Do not scrape private data, fabricate missing consent, copy unlicensed assets, or replace live DNS/email settings without authorization.

## 14. Verification and release acceptance

Each implementation change requires corresponding Git commits and relevant tests under `AGENTS.md`. All required automated checks and release verifications must pass before delivery.

| Area | Required acceptance evidence |
|---|---|
| Content/routes | Every inventoried public URL and resource has correct content; links, filters, downloads, redirects, and 404 responses work. |
| Design parity | Dated screenshot baseline, comparisons at the specified viewports, threshold results, and owner visual approval. |
| Contact/partnership | Valid input creates exactly one record and outbox entry; routing and acknowledgement templates are correct; invalid, duplicate, throttled, and outage cases behave as specified. |
| Email resilience | Provider failure does not lose accepted submissions; retry exhaustion is visible; repeated worker/event deliveries do not create uncontrolled duplicate messages. |
| Newsletter | Double opt-in, token expiry, repeated signup, consent history, unsubscribe, suppression, and explicit resubscription are covered. |
| Authorization | Anonymous and unauthorized role access is rejected by APIs; permitted workflows work; exports and privileged changes are audited. |
| CMS | Drafts stay private; preview/publish/revision flows work; unsafe content/uploads are rejected; changed slugs redirect. |
| Privacy | Consent gating, authorized export/deletion, retention configuration, and telemetry redaction are demonstrated. |
| Accessibility | Automated checks plus manual keyboard, focus, error announcement, zoom, and screen-reader smoke checks. |
| SEO/performance | Correct rendered metadata, sitemap, canonical URLs, public content crawlability, image/layout behavior, and recorded performance measurements. |
| Operations | Health/alerts, queue failure handling, backup restore, deployment rollback, and cutover reconciliation are exercised. |

Testing layers: unit tests for validation and workflow rules; integration tests for persistence, outbox, authorization, and email adapters; browser end-to-end tests for public/admin workflows; visual regression tests for design parity.

Use synthetic data and mocked email in routine automation. Verify controlled real delivery only with authorized test recipients before production acceptance. Load tests must run against an approved nonproduction environment, not the reference production website.

## 15. Release boundaries and outstanding inputs

First release includes public-site parity, all three form workflows, reliable transactional email, newsletter consent management, staff authentication, enquiry/partner administration, basic CMS, SEO/accessibility work, monitoring, backups, and automated delivery.

Phase 2 candidates: CRM integration, meeting scheduling, marketing campaign platform integration, advanced business reporting, enhanced resource discovery, and additional languages.

Excluded unless separately approved: customer accounts/portal, billing, payments, e-commerce, AI chat, custom marketing campaign software, and infrastructure unrelated to this website.

Required inputs before production: original source/assets; existing route/data inventory; approved brand/content and legal text; actual rendered font baseline; email recipient/sender settings; Entra tenant and initial staff roles; Azure subscription/region/budget; retention decisions; domain/DNS ownership; original workflow integration details; and cutover/rollback approval.

These inputs do not block this product specification, but must be resolved at the applicable design, implementation, or release gate. No migration is considered complete solely because the pages look similar or an email API returns success.
