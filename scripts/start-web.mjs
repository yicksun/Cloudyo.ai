process.env.HOSTNAME ??= "127.0.0.1";
await import(
  new URL("../apps/web/.next/standalone/apps/web/server.js", import.meta.url)
);
