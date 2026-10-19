import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  validateConfiguration,
  validateSettings,
} from "../../scripts/azure-release.mjs";

const prefix =
  "/subscriptions/db78cda5-d94e-4802-9b5c-e930f496cd18/resourceGroups/rg-cloudyo-prd-e65d/providers/Microsoft.Web/sites/";
const config = {
  subscriptionId: "db78cda5-d94e-4802-9b5c-e930f496cd18",
  resourceGroup: "rg-cloudyo-prd-e65d",
  environment: "production",
  applicationCommit: "a".repeat(40),
  webSha256: "b".repeat(64),
  workerSha256: "c".repeat(64),
  sourceSha256: "d".repeat(64),
  webId: `${prefix}app-cloudyo-prd-e65d`,
  workerId: `${prefix}func-cloudyo-prd-e65d`,
  vaultUri: "https://kv-cloudyo-prd-e65d.vault.azure.net/",
  siteUrl: "https://synthetic.example.com",
  migrationsApproved: true,
  productionApproved: true,
};
test("release requires exact scope, provenance and independent migration approval", () => {
  assert.equal(validateConfiguration(config), config);
  for (const patch of [
    { subscriptionId: "wrong" },
    { resourceGroup: "test" },
    { environment: "staging" },
    { applicationCommit: "" },
    { sourceSha256: "" },
    { workerSha256: "" },
    { productionApproved: false },
    { migrationsApproved: false },
    { webId: `${prefix}different` },
    { siteUrl: "http://synthetic.example.com" },
    { siteUrl: "https://synthetic.example.com/path" },
    { vaultUri: "https://untrusted.example.com/" },
  ])
    assert.throws(() => validateConfiguration({ ...config, ...patch }));
});
const settings = {
  APP_ENV: "production",
  SITE_URL: config.siteUrl,
  SCM_DO_BUILD_DURING_DEPLOYMENT: "false",
  ENABLE_ORYX_BUILD: "false",
  DATABASE_URL: "synthetic",
  OUTBOX_ENCRYPTION_KEY: "synthetic",
  ABUSE_HASH_SECRET: "synthetic",
  INTERNAL_EMAIL: "synthetic@example.com",
  EMAIL_MODE: "disabled",
  WEBSITE_RUN_FROM_PACKAGE: "1",
  ...Object.fromEntries(
    [
      "dispatch",
      "sendEmail",
      "emailDelivery",
      "mediaScan",
      "poison",
      "maintenance",
    ].map((name) => [`AzureWebJobs.${name}.Disabled`, "true"]),
  ),
};
test("all six worker functions and outbound email must be paused", () => {
  validateSettings(settings, config, true);
  assert.throws(() =>
    validateSettings({ ...settings, EMAIL_MODE: "azure" }, config, true),
  );
  for (const name of [
    "dispatch",
    "sendEmail",
    "emailDelivery",
    "mediaScan",
    "poison",
    "maintenance",
  ])
    assert.throws(() =>
      validateSettings(
        { ...settings, [`AzureWebJobs.${name}.Disabled`]: "false" },
        config,
        true,
      ),
    );
});
test("web settings must match the external origin and include real authentication configuration", () => {
  const web = {
    ...settings,
    NEXTAUTH_URL: config.siteUrl,
    PUBLIC_CONTENT_MODE: "database",
    HOSTNAME: "0.0.0.0",
    NEXTAUTH_SECRET: "synthetic",
    ENTRA_CLIENT_ID: "synthetic",
    ENTRA_CLIENT_SECRET: "synthetic",
    ENTRA_TENANT_ID: "synthetic",
  };
  validateSettings(web, config);
  for (const patch of [
    { NEXTAUTH_URL: "https://wrong.example.com" },
    { HOSTNAME: "localhost" },
    { ENTRA_CLIENT_SECRET: "" },
    { PUBLIC_CONTENT_MODE: "reference" },
  ])
    assert.throws(() => validateSettings({ ...web, ...patch }, config));
});
test("production templates retain private access, scoped exceptions and independent runtime identities", async () => {
  const storage = await readFile(
    new URL("../../infra/modules/storage.bicep", import.meta.url),
    "utf8",
  );
  const compute = await readFile(
    new URL("../../infra/modules/compute.bicep", import.meta.url),
    "utf8",
  );
  const platform = await readFile(
    new URL("../../infra/modules/platform.bicep", import.meta.url),
    "utf8",
  );
  assert.equal(
    (storage.match(/publicNetworkAccess: 'Disabled'/g) ?? []).length,
    2,
  );
  assert.equal((storage.match(/allowSharedKeyAccess: false/g) ?? []).length, 1);
  assert.equal((storage.match(/allowSharedKeyAccess: true/g) ?? []).length, 1);
  assert.match(compute, /'x-azure-fdid': \[frontDoorId\]/);
  assert.match(compute, /ipAddress: 'AzureFrontDoor.Backend'/);
  assert.match(compute, /scmIpSecurityRestrictionsDefaultAction: 'Deny'/);
  assert.match(platform, /sslaccept=strict/);
  assert.match(platform, /'database-admin-url'.*readers: \[identities\[2\]/);
  for (const name of ["stcloudyoprde65dapp", "stcloudyoprde65dhost"])
    assert.match(name, /^[a-z0-9]{3,24}$/);
});
test("provisioning is validation-only by default and requires an explicit risk acknowledgment to write", async () => {
  const script = await readFile(
    new URL("../../scripts/provision.ps1", import.meta.url),
    "utf8",
  );
  assert.match(script, /\$Mode = 'Validate'/);
  assert.match(script, /\$Mode -eq 'Deploy' -and \(-not \$RiskAcknowledged/);
  assert.match(script, /\$RegisterProviders -and \$Mode -ne 'Deploy'/);
  assert.match(script, /--result-format', 'ResourceIdOnly'/);
});
