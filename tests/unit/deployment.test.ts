import { afterEach, beforeEach, expect, test } from "vitest";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertBuildRuntime,
  createManifest,
  linuxEngine,
  stageWeb,
  stageWorker,
} from "../../scripts/stage-deployment";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "cloudyo-deployment-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
async function fixture(relative: string, value = "synthetic fixture") {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, value);
}

test("runtime workspaces declare their direct Zod dependency in both manifest and lockfile", async () => {
  const lock = JSON.parse(
    await readFile(new URL("../../package-lock.json", import.meta.url), "utf8"),
  );
  for (const workspace of ["apps/worker", "packages/data"]) {
    const manifest = JSON.parse(
      await readFile(
        new URL(`../../${workspace}/package.json`, import.meta.url),
        "utf8",
      ),
    );
    expect(manifest.dependencies.zod).toBe("4.3.5");
    expect(lock.packages[workspace].dependencies.zod).toBe(
      manifest.dependencies.zod,
    );
  }
});

test("clean CI generates the workspace Prisma client before seeding", async () => {
  const workflow = await readFile(
    new URL("../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  const generate = workflow.indexOf("- run: npm run db:generate");
  const seed = workflow.indexOf("npm run db:seed");
  expect(generate).toBeGreaterThan(-1);
  expect(seed).toBeGreaterThan(generate);
});

test("Git checkouts keep formatter-compatible line endings across platforms", async () => {
  const attributes = await readFile(
    new URL("../../.gitattributes", import.meta.url),
    "utf8",
  );
  expect(attributes).toMatch(/^\* text=auto eol=lf$/m);
});

test("only Linux x64 Node 22 builds can claim deployable runtime compatibility", () => {
  expect(() => assertBuildRuntime("linux", "x64", "v22.23.3")).not.toThrow();
  expect(() => assertBuildRuntime("linux", "x64", "v22.12.0")).not.toThrow();
  const invalid: [string, string, string][] = [
    ["win32", "x64", "v22.23.3"],
    ["linux", "arm64", "v22.23.3"],
    ["linux", "x64", "v24.0.0"],
    ["linux", "x64", "v22.11.0"],
  ];
  for (const args of invalid) {
    expect(() => assertBuildRuntime(...args)).toThrow(/Linux x64/);
  }
});
test("web packaging retains the complete standalone tree, hidden static files and Linux Prisma engine", async () => {
  for (const name of [
    "apps/web/server.js",
    "apps/web/public/favicon.svg",
    "apps/web/.next/static/chunk.js",
  ])
    await fixture(`repository/apps/web/.next/standalone/${name}`);
  await fixture(`repository/${linuxEngine}`);
  await fixture("repository/node_modules/@prisma/client/package.json");
  const output = path.join(root, "release");
  await stageWeb(path.join(root, "repository"), output);
  for (const name of [
    "apps/web/server.js",
    "apps/web/public/favicon.svg",
    "apps/web/.next/static/chunk.js",
    linuxEngine,
  ])
    await expect(
      readFile(path.join(output, "web", name), "utf8"),
    ).resolves.toBe("synthetic fixture");
});
test("incomplete standalone builds fail instead of producing success-shaped packages", async () => {
  await fixture("repository/apps/web/.next/standalone/apps/web/server.js");
  await expect(
    stageWeb(path.join(root, "repository"), path.join(root, "release")),
  ).rejects.toThrow();
});
test("worker puts host.json and the bundled entry point at the Functions package root without TypeScript workspace links", async () => {
  await fixture("repository/apps/worker/host.json", '{"version":"2.0"}');
  await fixture("repository/apps/worker/dist/index.cjs");
  await fixture(
    "repository/node_modules/@azure/functions/package.json",
    '{"name":"@azure/functions"}',
  );
  await fixture("repository/node_modules/@cloudyo/data/src/index.ts");
  await fixture("repository/node_modules/.bin/unused");
  await fixture(`release/web/${linuxEngine}`);
  await stageWorker(path.join(root, "repository"), path.join(root, "release"));
  const output = path.join(root, "release/worker");
  expect(
    JSON.parse(await readFile(path.join(output, "package.json"), "utf8")).main,
  ).toBe("dist/index.cjs");
  await expect(access(path.join(output, "host.json"))).resolves.toBeUndefined();
  await expect(access(path.join(output, linuxEngine))).resolves.toBeUndefined();
  await expect(
    access(path.join(output, "node_modules/@azure/functions/package.json")),
  ).resolves.toBeUndefined();
  await expect(
    access(path.join(output, "node_modules/@cloudyo")),
  ).rejects.toThrow();
  await expect(
    access(path.join(output, "node_modules/.bin")),
  ).rejects.toThrow();
});
test("manifest identifies the exact source commit and hashes the actual release bytes", async () => {
  await fixture("web.zip", "synthetic web package");
  await fixture("worker.zip", "synthetic worker package");
  const manifest = await createManifest(root, "a".repeat(40));
  expect(manifest.sourceCommit).toBe("a".repeat(40));
  expect(manifest.files["web.zip"]).toBe(
    createHash("sha256").update("synthetic web package").digest("hex"),
  );
  expect(Object.keys(manifest.files)).toEqual(["web.zip", "worker.zip"]);
  expect(
    JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")),
  ).toEqual(manifest);
});
test("release provenance cannot silently default to an unknown commit", async () => {
  await expect(createManifest(root, "")).rejects.toThrow(/exact Git commit/);
});
