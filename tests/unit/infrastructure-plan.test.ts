import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

interface Resource {
  name: string;
  type: string;
  location: string;
  sku: string;
  properties: Record<string, unknown>;
  reasoning: {
    whyChosen: string;
    alternativesConsidered: string[];
    tradeoffs: string;
  };
  dependencies: string[];
  references: { title: string; url: string }[];
}

interface Plan {
  meta: { status: "draft" | "approved" | "deployed" };
  inputs: { insightsApplied: string[] };
  plan: {
    resources: Resource[];
    costEstimate: {
      hoursPerMonth: number;
      items: {
        component: string;
        quantity?: number;
        monthlyUsd: number;
      }[];
      planningSubtotalMonthlyUsd: number;
      notAHardCap: boolean;
      unpricedOrVariable: string[];
    };
    approval: {
      architectureApproved: boolean;
      deploymentApproved: boolean;
      spendingApproved: boolean;
      productionApproved: boolean;
      liveBackgroundProcessingApproved: boolean;
    };
    release: {
      applicationCommit: string;
      platform: string;
      architecture: string;
      nodeMajor: number;
      sha256: Record<string, string>;
    };
    productionOverride: {
      userInstruction: string;
      resourceGroup: string;
      environment: string;
      deploymentStatus: string;
    };
  };
}

async function loadPlan(): Promise<Plan> {
  return JSON.parse(
    await readFile(
      new URL("../../.azure/infrastructure-plan.json", import.meta.url),
      "utf8",
    ),
  );
}

function cidrBounds(value: unknown) {
  if (typeof value !== "string") throw new Error("Missing subnet CIDR");
  const [address, prefix] = value.split("/");
  const bits = Number(prefix);
  const octets = address.split(".").map(Number);
  if (
    !/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(value) ||
    !Number.isInteger(bits) ||
    bits < 0 ||
    bits > 32 ||
    octets.some((octet) => octet < 0 || octet > 255)
  )
    throw new Error(`Invalid subnet CIDR: ${value}`);
  const start = octets.reduce((sum, octet) => sum * 256 + octet, 0);
  const size = 2 ** (32 - bits);
  if (start % size !== 0) throw new Error(`Unaligned subnet CIDR: ${value}`);
  return { start, end: start + size - 1 };
}

test("delegated and private endpoint subnets fit inside the VNet without overlaps", async () => {
  const { plan } = await loadPlan();
  const network = plan.resources.find(
    (resource) => resource.type === "Microsoft.Network/virtualNetworks",
  );
  const parent = cidrBounds(network?.properties.addressSpace);
  const subnets = network?.properties.subnets;
  if (!Array.isArray(subnets)) throw new Error("Missing VNet subnet plan");
  expect(subnets.length).toBeGreaterThan(0);
  const ranges = subnets.map((subnet) => cidrBounds(subnet.prefix));
  for (const [index, range] of ranges.entries()) {
    expect(range.start).toBeGreaterThanOrEqual(parent.start);
    expect(range.end).toBeLessThanOrEqual(parent.end);
    for (const other of ranges.slice(index + 1))
      expect(range.end < other.start || other.end < range.start).toBe(true);
  }
});

test("infrastructure resources have complete rationale and an acyclic, fully resolved dependency graph", async () => {
  const { plan } = await loadPlan();
  const resources = new Map(
    plan.resources.map((resource) => [resource.name, resource]),
  );
  expect(resources.size).toBe(plan.resources.length);
  expect(resources.size).toBeGreaterThan(0);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(name: string) {
    const resource = resources.get(name);
    if (!resource)
      throw new Error(`Unresolved infrastructure dependency: ${name}`);
    if (visiting.has(name))
      throw new Error(`Infrastructure dependency cycle: ${name}`);
    if (visited.has(name)) return;
    visiting.add(name);
    resource.dependencies.forEach(visit);
    visiting.delete(name);
    visited.add(name);
  }
  for (const resource of plan.resources) {
    expect(resource.type).toMatch(/^Microsoft\.[A-Za-z]+\/.+/);
    for (const value of [
      resource.location,
      resource.sku,
      resource.reasoning.whyChosen,
      resource.reasoning.tradeoffs,
    ])
      expect(value.length).toBeGreaterThan(0);
    expect(resource.reasoning.alternativesConsidered.length).toBeGreaterThan(0);
    expect(resource.references.length).toBeGreaterThan(0);
    for (const reference of resource.references)
      expect(new URL(reference.url).protocol).toBe("https:");
    visit(resource.name);
  }
});

test("each private endpoint has a matching service DNS zone and an undelegated subnet", async () => {
  const { plan } = await loadPlan();
  const resources = new Map(
    plan.resources.map((resource) => [resource.name, resource]),
  );
  const expectedZones: Record<string, string> = {
    blob: "privatelink.blob.core.windows.net",
    queue: "privatelink.queue.core.windows.net",
    table: "privatelink.table.core.windows.net",
    file: "privatelink.file.core.windows.net",
    vault: "privatelink.vaultcore.azure.net",
    "sites-staging": "privatelink.azurewebsites.net",
  };
  const endpoints = plan.resources.filter(
    (resource) => resource.type === "Microsoft.Network/privateEndpoints",
  );
  expect(endpoints.length).toBeGreaterThan(0);
  for (const endpoint of endpoints) {
    const { target, dnsZone, groupId, subnet } = endpoint.properties;
    expect(typeof target).toBe("string");
    expect(typeof groupId).toBe("string");
    expect(typeof dnsZone).toBe("string");
    if (
      typeof target !== "string" ||
      typeof groupId !== "string" ||
      typeof dnsZone !== "string"
    )
      throw new Error("Invalid private endpoint contract");
    expect(resources.has(target)).toBe(true);
    expect(dnsZone).toBe(expectedZones[groupId]);
    expect(resources.get(dnsZone)?.type).toBe(
      "Microsoft.Network/privateDnsZones",
    );
    expect(endpoint.dependencies).toContain(dnsZone);
    expect(subnet).toBe("snet-private-endpoints");
    expect(endpoint.properties.privateDnsZoneGroup).toBe(true);
  }
  const network = plan.resources.find(
    (resource) => resource.type === "Microsoft.Network/virtualNetworks",
  );
  const subnets = network?.properties.subnets;
  if (!Array.isArray(subnets)) throw new Error("Missing VNet subnet plan");
  expect(
    subnets.find((subnet) => subnet.name === "snet-private-endpoints")
      ?.delegation,
  ).toBeNull();
  expect(
    subnets.filter(
      (subnet) => subnet.delegation === "Microsoft.Web/serverFarms",
    ),
  ).toHaveLength(2);
});

test("estimated network quantities match planned resources and the subtotal discloses exclusions", async () => {
  const { plan } = await loadPlan();
  const cost = plan.costEstimate;
  for (const [component, type] of [
    ["Private endpoints", "Microsoft.Network/privateEndpoints"],
    ["Private DNS zones", "Microsoft.Network/privateDnsZones"],
  ]) {
    expect(
      cost.items.find((item) => item.component === component)?.quantity,
    ).toBe(plan.resources.filter((resource) => resource.type === type).length);
  }
  const total = cost.items.reduce((sum, item) => sum + item.monthlyUsd, 0);
  expect(Number(total.toFixed(2))).toBe(cost.planningSubtotalMonthlyUsd);
  expect(cost.notAHardCap).toBe(true);
  expect(cost.unpricedOrVariable.length).toBeGreaterThan(0);
});

test("approved production plan retains exact Linux provenance without implying deployment or background activation", async () => {
  const { meta, plan } = await loadPlan();
  expect(plan.release.applicationCommit).toMatch(/^[a-f0-9]{40}$/);
  expect(plan.release.platform).toBe("linux");
  expect(plan.release.architecture).toBe("x64");
  expect(plan.release.nodeMajor).toBe(22);
  expect(Object.keys(plan.release.sha256).sort()).toEqual([
    "web.zip",
    "worker.zip",
  ]);
  for (const hash of Object.values(plan.release.sha256))
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  expect(["draft", "approved", "deployed"]).toContain(meta.status);
  expect(plan.approval.architectureApproved).toBe(meta.status !== "draft");
  if (meta.status === "deployed") {
    expect(plan.approval.deploymentApproved).toBe(true);
    expect(plan.approval.spendingApproved).toBe(true);
  }
  expect(plan.approval.productionApproved).toBe(true);
  expect(plan.productionOverride.environment).toBe("production");
  expect(plan.productionOverride.resourceGroup).toBe("rg-cloudyo-prd-e65d");
  expect(plan.productionOverride.userInstruction).toBe(
    "approved to go for production deployment on Azure subscription provided previously",
  );
  if (meta.status !== "deployed")
    expect(plan.productionOverride.deploymentStatus).not.toBe("deployed");
  expect(plan.approval.liveBackgroundProcessingApproved).toBe(false);
});
