import EmbeddedPostgres from "embedded-postgres";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve(".local/postgres");
await mkdir(directory, { recursive: true });
const postgres = new EmbeddedPostgres({
  databaseDir: directory,
  user: "cloudyo",
  password: "local-development-only",
  port: 55432,
  persistent: true,
});
await postgres.initialise();
await postgres.start();
const client = postgres.getPgClient();
await client.connect();
for (const database of ["cloudyo_dev", "cloudyo_test", "cloudyo_e2e_test"]) {
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database],
  );
  if (!result.rowCount)
    await client.query(
      `CREATE DATABASE ${database} ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
    );
}
await client.end();
console.log(
  "Local PostgreSQL ready on 127.0.0.1:55432 (databases: cloudyo_dev, cloudyo_test, cloudyo_e2e_test).",
);
async function stop() {
  await postgres.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await new Promise(() => {});
