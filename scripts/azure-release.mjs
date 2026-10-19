import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

const functions = [
  "dispatch",
  "sendEmail",
  "emailDelivery",
  "mediaScan",
  "poison",
  "maintenance",
];
const subscription = "db78cda5-d94e-4802-9b5c-e930f496cd18";
const management = "https://management.azure.com";
let phase = "configuration";
export function currentPhase() {
  return phase;
}
export function reportFailure(error) {
  console.error(
    JSON.stringify({
      event: "release.failed",
      phase,
      errorType: error?.constructor?.name ?? "Error",
      action:
        "Stop promotion; inspect this phase through approved redacted diagnostics. No automatic rollback was attempted.",
    }),
  );
}

export function validateConfiguration(config) {
  if (
    config.subscriptionId !== subscription ||
    config.resourceGroup !== "rg-cloudyo-prd-e65d" ||
    config.environment !== "production"
  )
    throw new Error("Release target is outside the approved production scope.");
  if (
    !/^[a-f0-9]{40}$/.test(config.applicationCommit) ||
    !/^[a-f0-9]{64}$/.test(config.webSha256) ||
    !/^[a-f0-9]{64}$/.test(config.workerSha256) ||
    !/^[a-f0-9]{64}$/.test(config.sourceSha256)
  )
    throw new Error(
      "Exact release commit and independently recorded hashes are required.",
    );
  if (config.migrationsApproved !== true || config.productionApproved !== true)
    throw new Error("Production and migration acknowledgments are required.");
  const site = new URL(config.siteUrl);
  if (
    site.protocol !== "https:" ||
    site.pathname !== "/" ||
    site.username ||
    site.password ||
    site.search ||
    site.hash
  )
    throw new Error("Invalid external HTTPS origin.");
  const prefix = `/subscriptions/${subscription}/resourceGroups/${config.resourceGroup}/providers/Microsoft.Web/sites/`;
  if (
    config.webId !== `${prefix}app-cloudyo-prd-e65d` ||
    config.workerId !== `${prefix}func-cloudyo-prd-e65d`
  )
    throw new Error("Unexpected application resource IDs.");
  if (config.vaultUri !== "https://kv-cloudyo-prd-e65d.vault.azure.net/")
    throw new Error("Unexpected secret destination.");
  return config;
}

export function validateSettings(settings, config, worker = false) {
  const required = [
    "DATABASE_URL",
    "OUTBOX_ENCRYPTION_KEY",
    "ABUSE_HASH_SECRET",
    "INTERNAL_EMAIL",
  ];
  if (!worker)
    required.push(
      "NEXTAUTH_SECRET",
      "ENTRA_CLIENT_ID",
      "ENTRA_CLIENT_SECRET",
      "ENTRA_TENANT_ID",
    );
  for (const name of required)
    if (typeof settings[name] !== "string" || !settings[name].trim())
      throw new Error(`Missing configured setting: ${name}`);
  if (
    settings.APP_ENV !== "production" ||
    settings.SITE_URL !== config.siteUrl ||
    settings.SCM_DO_BUILD_DURING_DEPLOYMENT !== "false" ||
    settings.ENABLE_ORYX_BUILD !== "false"
  )
    throw new Error(
      "Target settings do not match the immutable production release.",
    );
  if (worker) {
    if (
      settings.EMAIL_MODE !== "disabled" ||
      settings.WEBSITE_RUN_FROM_PACKAGE !== "1"
    )
      throw new Error(
        "Worker must remain paused with run-from-package enabled.",
      );
    for (const name of functions)
      if (settings[`AzureWebJobs.${name}.Disabled`] !== "true")
        throw new Error(`Worker function is not paused: ${name}`);
  } else if (
    settings.NEXTAUTH_URL !== config.siteUrl ||
    settings.PUBLIC_CONTENT_MODE !== "database" ||
    settings.HOSTNAME !== "0.0.0.0"
  )
    throw new Error(
      "Web startup/origin configuration does not match the release.",
    );
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    // Child output can include database URLs. Report only command name/exit code.
    const child = spawn(command, args, { cwd, env, stdio: "ignore" });
    child.on("error", () => reject(new Error(`Cannot launch ${command}.`)));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`${command} failed with exit ${code}; release stopped.`),
          ),
    );
  });
}

async function token(resource) {
  const endpoint = new URL(
    "http://169.254.169.254/metadata/identity/oauth2/token",
  );
  endpoint.searchParams.set("api-version", "2018-02-01");
  endpoint.searchParams.set("resource", resource);
  endpoint.searchParams.set("client_id", process.env.AZURE_CLIENT_ID ?? "");
  const response = await fetch(endpoint, {
    headers: { Metadata: "true" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Managed identity request failed: HTTP ${response.status}.`,
    );
  const result = await response.json();
  if (!result.access_token)
    throw new Error("Managed identity returned no token.");
  return result.access_token;
}

async function arm(id, method = "GET") {
  const response = await fetch(
    `${management}${id}${id.includes("?") ? "&" : "?"}api-version=2025-03-01`,
    {
      method,
      headers: { Authorization: `Bearer ${await token(`${management}/`)}` },
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Azure control-plane ${method} failed: HTTP ${response.status}.`,
    );
  const body = await response.text();
  return body ? JSON.parse(body) : {};
}

async function getSecret(vaultUri, name) {
  const response = await fetch(`${vaultUri}secrets/${name}?api-version=7.4`, {
    headers: {
      Authorization: `Bearer ${await token("https://vault.azure.net")}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Private secret retrieval failed for ${name}: HTTP ${response.status}.`,
    );
  const result = await response.json();
  if (typeof result.value !== "string" || !result.value)
    throw new Error(`Secret ${name} has no value.`);
  return result.value;
}

async function download(url, destination) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password)
    throw new Error(
      "Release downloads require authenticated HTTPS URLs without embedded credentials.",
    );
  const response = await fetch(parsed, { signal: AbortSignal.timeout(300000) });
  if (!response.ok || !response.body)
    throw new Error(
      `Release download failed: HTTP ${response.status}. Obtain a fresh short-lived URL.`,
    );
  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(destination, { flags: "wx" }),
  );
}

async function hash(file) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest("hex");
}

async function preflight(id, config, worker) {
  const app = await arm(id);
  const current = app.properties;
  if (!current.reserved || !current.httpsOnly)
    throw new Error("Both targets must be Linux HTTPS-only sites.");
  const configuration = (await arm(`${id}/config/web`)).properties;
  if (!/^node\|22(-lts)?$/i.test(configuration.linuxFxVersion))
    throw new Error("Both targets must use the approved Node 22 runtime.");
  if (
    !worker &&
    (configuration.appCommandLine !== "node apps/web/server.js" ||
      configuration.healthCheckPath !== "/health/ready")
  )
    throw new Error("Unexpected web startup or health check.");
  if (worker) {
    const plan = await arm(current.serverFarmId);
    if (plan.sku?.tier !== "ElasticPremium")
      throw new Error(
        "Worker requires the approved Elastic Premium deployment profile.",
      );
  }
  validateSettings(
    (await arm(`${id}/config/appsettings/list`, "POST")).properties,
    config,
    worker,
  );
  const scm = current.enabledHostNames.find((name) => name.includes(".scm."));
  if (!scm || !scm.endsWith(".azurewebsites.net"))
    throw new Error("Azure did not return a recognized SCM hostname.");
  return `https://${scm}`;
}

async function zipDeploy(scm, file) {
  const bytes = await readFile(file);
  const response = await fetch(`${scm}/api/zipdeploy?isAsync=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await token(`${management}/`)}`,
      "Content-Type": "application/zip",
    },
    body: bytes,
    redirect: "manual",
    signal: AbortSignal.timeout(600000),
  });
  if (response.status !== 202 && response.status !== 200)
    throw new Error(`Private SCM upload failed: HTTP ${response.status}.`);
  const location = response.headers.get("location");
  if (!location)
    throw new Error(
      "SCM returned no deployment status URL; upload outcome requires inspection.",
    );
  const statusUrl = new URL(location, scm);
  if (statusUrl.origin !== scm)
    throw new Error(
      "SCM attempted to redirect deployment credentials to another origin.",
    );
  for (let attempt = 0; attempt < 120; attempt++) {
    const status = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${await token(`${management}/`)}` },
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!status.ok)
      throw new Error(`SCM status check failed: HTTP ${status.status}.`);
    const result = await status.json();
    if (result.status === 4) return;
    if (result.status === 3)
      throw new Error(
        "SCM reports failed deployment; no automatic rollback was attempted.",
      );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
    "SCM deployment status timed out; upload outcome is unknown.",
  );
}

async function initializeDatabase(source, config) {
  const require = createRequire(path.join(source, "package.json"));
  const { PrismaClient } = require("@prisma/client");
  const adminUrl = await getSecret(config.vaultUri, "database-admin-url");
  const migrationUrl = await getSecret(
    config.vaultUri,
    "database-migration-url",
  );
  const runtimeUrls = await Promise.all(
    ["database-web-url", "database-worker-url"].map((name) =>
      getSecret(config.vaultUri, name),
    ),
  );
  const admin = new PrismaClient({ datasourceUrl: adminUrl, log: [] });
  try {
    for (const url of [migrationUrl, ...runtimeUrls]) {
      const parsed = new URL(url);
      const role = decodeURIComponent(parsed.username);
      if (!["cloudyo_migrator", "cloudyo_web", "cloudyo_worker"].includes(role))
        throw new Error("Database credential contains an unexpected role.");
      const password = decodeURIComponent(parsed.password).replaceAll(
        "'",
        "''",
      );
      const existing =
        await admin.$queryRaw`SELECT rolname FROM pg_roles WHERE rolname = ${role}`;
      if (existing.length === 0)
        await admin.$executeRawUnsafe(`CREATE ROLE "${role}" LOGIN`);
      await admin.$executeRawUnsafe(
        `ALTER ROLE "${role}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '${password}'`,
      );
      await admin.$executeRawUnsafe(
        `GRANT CONNECT ON DATABASE cloudyo_production TO "${role}"`,
      );
    }
    await admin.$executeRawUnsafe("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
    await admin.$executeRawUnsafe(
      "GRANT USAGE, CREATE ON SCHEMA public TO cloudyo_migrator",
    );
    await admin.$executeRawUnsafe(
      "GRANT USAGE ON SCHEMA public TO cloudyo_web, cloudyo_worker",
    );
  } finally {
    await admin.$disconnect();
  }
  await run("npm", ["run", "db:migrate"], source, {
    ...process.env,
    DATABASE_URL: migrationUrl,
  });
  const migrator = new PrismaClient({ datasourceUrl: migrationUrl, log: [] });
  try {
    for (const role of ["cloudyo_web", "cloudyo_worker"]) {
      await migrator.$executeRawUnsafe(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${role}"`,
      );
      await migrator.$executeRawUnsafe(
        `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${role}"`,
      );
      await migrator.$executeRawUnsafe(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${role}"`,
      );
      await migrator.$executeRawUnsafe(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "${role}"`,
      );
      await migrator.$executeRawUnsafe(
        `REVOKE ALL ON TABLE "_prisma_migrations" FROM "${role}"`,
      );
    }
  } finally {
    await migrator.$disconnect();
  }
  if (config.initialSeedApproved === true)
    await run("npm", ["run", "db:seed"], source, {
      ...process.env,
      DATABASE_URL: migrationUrl,
    });
}

export async function main() {
  const config = validateConfiguration(
    JSON.parse(process.env.RELEASE_CONFIGURATION ?? "{}"),
  );
  if (
    process.platform !== "linux" ||
    process.arch !== "x64" ||
    Number(process.versions.node.split(".")[0]) !== 22
  )
    throw new Error("Release runner requires Linux x64 Node 22.");
  const root = await mkdtemp(path.join(tmpdir(), "cloudyo-release-"));
  const source = path.join(root, "source");
  const artifacts = path.join(root, "artifacts");
  await Promise.all([mkdir(source), mkdir(artifacts)]);
  phase = "download-and-integrity";
  console.log(
    "Downloading the approved source and release; signed URLs are redacted.",
  );
  await Promise.all([
    download(process.env.SOURCE_URL, path.join(root, "source.tar.gz")),
    download(process.env.ARTIFACT_URL, path.join(root, "artifacts.zip")),
  ]);
  if ((await hash(path.join(root, "source.tar.gz"))) !== config.sourceSha256)
    throw new Error(
      "Source archive SHA-256 does not match the approved migration source.",
    );
  await run(
    "tar",
    [
      "-xzf",
      path.join(root, "source.tar.gz"),
      "--strip-components=1",
      "-C",
      source,
    ],
    root,
  );
  await run(
    "python3",
    [
      "-c",
      "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); names=z.namelist(); assert len(names)==3 and set(names)=={'web.zip','worker.zip','manifest.json'}; z.extractall(sys.argv[2])",
      path.join(root, "artifacts.zip"),
      artifacts,
    ],
    root,
  );
  const manifest = JSON.parse(
    await readFile(path.join(artifacts, "manifest.json"), "utf8"),
  );
  if (
    manifest.sourceCommit !== config.applicationCommit ||
    manifest.platform !== "linux" ||
    manifest.architecture !== "x64" ||
    manifest.nodeMajor !== 22
  )
    throw new Error(
      "Artifact manifest does not match the approved application release.",
    );
  for (const [name, expected] of [
    ["web.zip", config.webSha256],
    ["worker.zip", config.workerSha256],
  ]) {
    if (
      manifest.files[name] !== expected ||
      (await hash(path.join(artifacts, name))) !== expected
    )
      throw new Error(`Artifact SHA-256 mismatch: ${name}`);
  }
  // Download authorization is no longer needed by dependency installation or child processes.
  delete process.env.SOURCE_URL;
  delete process.env.ARTIFACT_URL;
  phase = "azure-preflight";
  const [workerScm, webScm] = await Promise.all([
    preflight(config.workerId, config, true),
    preflight(config.webId, config, false),
  ]);
  phase = "locked-dependency-installation";
  await run("npm", ["ci", "--no-audit", "--no-fund"], source);
  await run("npm", ["run", "db:generate"], source);
  console.log(
    "Preflight and artifact checks passed; applying the authorized database release.",
  );
  phase = "database-initialization";
  await initializeDatabase(source, config);
  phase = "worker-upload";
  await zipDeploy(workerScm, path.join(artifacts, "worker.zip"));
  await arm(`${config.workerId}/syncfunctiontriggers`, "POST");
  phase = "web-upload";
  await zipDeploy(webScm, path.join(artifacts, "web.zip"));
  phase = "web-readiness";
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await fetch(`${config.siteUrl}/health/ready`, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    if (
      response.status === 200 &&
      /^\s*\{\s*"status"\s*:\s*"ready"\s*\}\s*$/.test(await response.text())
    ) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (!ready)
    throw new Error(
      "Code was uploaded but readiness failed; no automatic rollback was attempted.",
    );
  phase = "functions-registration";
  const registered = await arm(`${config.workerId}/functions`);
  const names = (registered.value ?? []).map((item) =>
    item.name.split("/").at(-1),
  );
  if (registered.nextLink || functions.some((name) => !names.includes(name)))
    throw new Error(
      "Actual Functions registration could not establish all six expected triggers.",
    );
  console.log(
    JSON.stringify({
      status: "uploaded-and-ready",
      commit: config.applicationCommit,
      site: config.siteUrl,
      backgroundProcessing: "disabled",
      productionAcceptance: "pending",
    }),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await main();
  } catch (error) {
    reportFailure(error);
    process.exitCode = 1;
  }
}
