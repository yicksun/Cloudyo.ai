import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const linuxEngine =
  "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node";

export function assertBuildRuntime(
  platform: string,
  arch: string,
  version: string,
) {
  const nodeVersion = /^v22\.(\d+)\.\d+$/.exec(version);
  if (
    platform !== "linux" ||
    arch !== "x64" ||
    !nodeVersion ||
    Number(nodeVersion[1]) < 12
  )
    throw new Error(
      "Release packages must be built on Linux x64 with Node.js 22.12 or newer within major 22.",
    );
}

export async function stageWeb(repository: string, output: string) {
  await cp(
    path.join(repository, "apps/web/.next/standalone"),
    path.join(output, "web"),
    {
      recursive: true,
      dereference: true,
    },
  );
  for (const module of ["@prisma/client", ".prisma"])
    await cp(
      path.join(repository, "node_modules", module),
      path.join(output, "web/node_modules", module),
      { recursive: true },
    );
  for (const required of [
    "apps/web/server.js",
    "apps/web/public/favicon.svg",
    "apps/web/.next/static",
    linuxEngine,
  ])
    await access(path.join(output, "web", required));
}

export async function stageWorker(repository: string, output: string) {
  const worker = path.join(output, "worker");
  await mkdir(path.join(worker, "dist"), { recursive: true });
  await cp(
    path.join(repository, "apps/worker/dist/index.cjs"),
    path.join(worker, "dist/index.cjs"),
  );
  await cp(
    path.join(repository, "apps/worker/host.json"),
    path.join(worker, "host.json"),
  );
  const modules = path.join(repository, "node_modules");
  await cp(modules, path.join(worker, "node_modules"), {
    recursive: true,
    dereference: true,
    filter: (source) =>
      !["@cloudyo", ".bin"].includes(
        path.relative(modules, source).split(path.sep)[0],
      ),
  });
  await cp(
    path.join(output, "web/node_modules/.prisma"),
    path.join(worker, "node_modules/.prisma"),
    { recursive: true },
  );
  await writeFile(
    path.join(worker, "package.json"),
    JSON.stringify(
      {
        name: "cloudyo-worker-runtime",
        version: "1.0.0",
        private: true,
        main: "dist/index.cjs",
        engines: { node: "22.x" },
      },
      null,
      2,
    ),
  );
  await access(path.join(worker, linuxEngine));
}

export async function createManifest(directory: string, commit: string) {
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw new Error("An exact Git commit is required for release provenance.");
  const files: Record<string, string> = {};
  for (const name of ["web.zip", "worker.zip"])
    files[name] = createHash("sha256")
      .update(await readFile(path.join(directory, name)))
      .digest("hex");
  const manifest = {
    schemaVersion: 1,
    sourceCommit: commit,
    builtAt: new Date().toISOString(),
    platform: process.platform,
    architecture: process.arch,
    nodeMajor: Number(process.versions.node.split(".")[0]),
    nodeVersion: process.versions.node,
    files,
  };
  await writeFile(
    path.join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  return manifest;
}

function zip(directory: string, name: string) {
  const result = spawnSync(
    "zip",
    ["-q", "-r", path.join(directory, `${name}.zip`), "."],
    {
      cwd: path.join(directory, name),
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Could not create ${name}.zip.`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertBuildRuntime(process.platform, process.arch, process.version);
  const [step, destination] = process.argv.slice(2);
  if (!["web", "worker"].includes(step) || !destination)
    throw new Error(
      "Usage: stage-deployment.ts <web|worker> <output-directory>",
    );
  const output = path.resolve(destination);
  await mkdir(output, { recursive: true });
  if (step === "web") {
    await stageWeb(process.cwd(), output);
  } else {
    await stageWorker(process.cwd(), output);
    createRequire(path.join(output, "worker/package.json"))("./dist/index.cjs");
    for (const name of ["web", "worker"]) zip(output, name);
    await createManifest(output, process.env.SOURCE_COMMIT ?? "");
  }
}
