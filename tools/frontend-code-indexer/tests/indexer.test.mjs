import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { indexWorkspace } from "../indexer.mjs";

test("indexes compiler-resolved definitions, imports and references with nested repository ownership", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "erpm-indexer-"));
  try {
    const feRoot = path.join(root, "ERPm-FE");
    const moduleRoot = path.join(feRoot, "src", "app", "modules", "CRM");
    await mkdir(path.join(feRoot, "src"), { recursive: true });
    await mkdir(moduleRoot, { recursive: true });

    await writeFile(path.join(feRoot, "tsconfig.app.json"), JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "Bundler", strict: true },
      files: ["src/main.ts"]
    }));
    await writeFile(path.join(feRoot, "src", "main.ts"), 'import { PartnerService } from "./app/modules/CRM/partner.service";\nconst service = new PartnerService();\nservice.load();\n');
    await writeFile(path.join(moduleRoot, "partner.service.ts"), 'export class PartnerService { load(): string { return "ok"; } }\n');

    const manifest = {
      rootPath: root,
      repositories: [
        { repositoryId: "erpm-fe", relativePath: "ERPm-FE", commitSha: "a".repeat(40) },
        { repositoryId: "erpm-fe-src-app-modules-crm", relativePath: "ERPm-FE/src/app/modules/CRM", commitSha: "b".repeat(40) }
      ]
    };

    const result = indexWorkspace(manifest);
    assert.ok(result.records.some(record => record.kind === "definition" && record.name === "PartnerService"));
    assert.ok(result.records.some(record => record.relation === "imports" && record.targetSymbolId?.includes("erpm-fe-src-app-modules-crm")));
    assert.ok(result.records.some(record => record.relation === "calls" && record.name === "load"));
    const crmRecords = result.records.filter(record => record.repositoryId === "erpm-fe-src-app-modules-crm");
    assert.ok(crmRecords.length > 0);
    assert.ok(crmRecords.every(record => record.commitSha === "b".repeat(40)));
    assert.ok(crmRecords.every(record => record.path.startsWith("src/")));
    assert.equal(result.diagnostics.indexedSourceFiles, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("excludes declaration and generated files from source records", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "erpm-indexer-"));
  try {
    const feRoot = path.join(root, "ERPm-FE");
    await mkdir(path.join(feRoot, "src"), { recursive: true });
    await writeFile(path.join(feRoot, "tsconfig.app.json"), JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "Bundler" },
      files: ["src/main.ts", "src/generated.g.ts"]
    }));
    await writeFile(path.join(feRoot, "src", "main.ts"), "export const ready = true;\n");
    await writeFile(path.join(feRoot, "src", "generated.g.ts"), "export const generated = true;\n");
    const manifest = {
      rootPath: root,
      repositories: [{ repositoryId: "erpm-fe", relativePath: "ERPm-FE", commitSha: "c".repeat(40) }]
    };
    const result = indexWorkspace(manifest);
    assert.ok(result.records.some(record => record.path === "src/main.ts"));
    assert.ok(!result.records.some(record => record.path.includes("generated")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
