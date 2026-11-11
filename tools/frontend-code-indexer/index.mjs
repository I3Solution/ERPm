import { indexWorkspace } from "./indexer.mjs";

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const manifest = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const result = indexWorkspace(manifest);

  for (const record of result.records) {
    process.stdout.write(`${JSON.stringify(record)}\n`);
  }

  process.stderr.write(`Frontend index diagnostics: ${JSON.stringify(result.diagnostics)}\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
