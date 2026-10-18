import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const web = fileURLToPath(new URL("../apps/web/", import.meta.url));
const artifact = path.join(web, ".next", "standalone", "apps", "web");
await cp(path.join(web, "public"), path.join(artifact, "public"), {
  recursive: true,
});
await cp(
  path.join(web, ".next", "static"),
  path.join(artifact, ".next", "static"),
  { recursive: true },
);
console.log(
  "Standalone artifact includes the public assets and Next.js static files.",
);
