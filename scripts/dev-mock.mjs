// Launcher for the dev:mock environment (SPEC 14).
//
// Why this indirection exists: Node loads .env.mock while starting THIS
// process (`node --env-file-if-exists=.env.mock scripts/dev-mock.mjs`), which
// puts DAYCARE_DEV_MODE=mock into process.env without Next ever seeing it.
// Passing the env-file flag directly to `next dev` breaks on Next.js 16.4.2:
// its dev workers rebuild NODE_OPTIONS from process.execArgv (dist/server/lib/
// utils.js -> getParsedNodeOptions/formatNodeOptions), and Node rejects
// env-file flags inside NODE_OPTIONS ("--env-file-if-exists= is not allowed in
// NODE_OPTIONS"). Re-spawning the CLI here keeps the workers' NODE_OPTIONS
// clean while the server still receives the flag value.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextBin = path.join("node_modules", "next", "dist", "bin", "next");

// Extra CLI args pass through (`npm run dev:mock -- -p 3001`).
const nextArgs = [nextBin, "dev", "--turbopack", ...process.argv.slice(2)];

const child = spawn(process.execPath, nextArgs, {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

const forwardSignal = (signal) => {
  child.kill(signal);
};
process.on("SIGINT", forwardSignal);
process.on("SIGTERM", forwardSignal);

child.on("close", (code) => {
  process.off("SIGINT", forwardSignal);
  process.off("SIGTERM", forwardSignal);
  process.exitCode = code ?? 0;
});
