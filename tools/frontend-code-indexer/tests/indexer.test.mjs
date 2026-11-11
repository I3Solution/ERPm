import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
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
    assert.ok(result.records.some(record => record.kind === "definition" && record.name === "PartnerService" && record.symbolKind === "class"));
    assert.ok(result.records.some(record => record.kind === "reference" && record.name === "PartnerService" && record.symbolKind === "class"));
    assert.ok(result.records.some(record => record.relation === "imports" && record.targetSymbolId?.includes("erpm-fe-src-app-modules-crm")));
    assert.ok(result.records.some(record => record.relation === "calls" && record.name === "load"));
    const crmRecords = result.records.filter(record => record.repositoryId === "erpm-fe-src-app-modules-crm");
    assert.ok(crmRecords.length > 0);
    assert.ok(crmRecords.every(record => record.commitSha === "b".repeat(40)));
    assert.ok(crmRecords.every(record => record.path === "partner.service.ts"));
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


test("extracts Angular decorators, static routes, guards and HttpClient URL evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "erpm-angular-indexer-"));
  try {
    const feRoot = path.join(root, "ERPm-FE");
    const src = path.join(feRoot, "src");
    const angularCore = path.join(feRoot, "node_modules", "@angular", "core");
    const angularHttp = path.join(feRoot, "node_modules", "@angular", "common", "http");
    await mkdir(src, { recursive: true });
    await mkdir(angularCore, { recursive: true });
    await mkdir(angularHttp, { recursive: true });

    await writeFile(path.join(feRoot, "tsconfig.app.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        moduleResolution: "Bundler",
        experimentalDecorators: true,
        strict: true
      },
      files: ["src/main.ts"]
    }));
    await writeFile(path.join(angularCore, "index.d.ts"), [
      "export declare function Component(metadata: any): ClassDecorator;",
      "export declare function Injectable(metadata?: any): ClassDecorator;"
    ].join("\n"));
    await writeFile(path.join(angularHttp, "index.d.ts"), [
      "export declare class HttpClient {",
      "  get<T = unknown>(url: string): unknown;",
      "  post<T = unknown>(url: string, body: unknown): unknown;",
      "}"
    ].join("\n"));
    await writeFile(path.join(src, "router-types.ts"), [
      "export type Routes = any[];",
      "export type CanActivateFn = () => boolean;"
    ].join("\n"));
    await writeFile(path.join(src, "demo.component.ts"), [
      "import { Component } from '@angular/core';",
      "@Component({ selector: 'app-demo', templateUrl: './demo.component.html', styleUrls: ['./demo.component.scss'] })",
      "export class DemoComponent {}"
    ].join("\n"));
    await writeFile(path.join(src, "demo.service.ts"), [
      "import { Injectable } from '@angular/core';",
      "import { HttpClient } from '@angular/common/http';",
      "@Injectable({ providedIn: 'root' })",
      "export class DemoService {",
      "  private readonly apiUrl = '/api/v1/items';",
      "  constructor(private http: HttpClient) {}",
      "  load() { return this.http.get('/api/v1/items'); }",
      "  loadById(id: number) { return this.http.get(`${this.apiUrl}/${id}`); }",
      "  save(payload: unknown) { return this.http.post(this.apiUrl, payload); }",
      "  empty() { return this.http.get(''); }",
      "}"
    ].join("\n"));
    await writeFile(path.join(src, "app.routes.ts"), [
      "import { Routes, CanActivateFn } from './router-types';",
      "const guard: CanActivateFn = () => true;",
      "export const routes: Routes = [",
      "  { path: 'demo', loadComponent: () => import('./demo.component').then(m => m.DemoComponent), canActivate: [guard] }",
      "];"
    ].join("\n"));
    await writeFile(path.join(src, "main.ts"), [
      "import './app.routes';",
      "import './demo.component';",
      "import './demo.service';"
    ].join("\n"));

    const manifest = {
      rootPath: root,
      repositories: [{ repositoryId: "erpm-fe", relativePath: "ERPm-FE", commitSha: "d".repeat(40) }]
    };
    const result = indexWorkspace(manifest);
    const angularRecords = result.records.filter(record => record.kind === "angular");
    const component = angularRecords.find(record => record.angular?.kind === "component");
    const service = angularRecords.find(record => record.angular?.kind === "service");
    const guard = angularRecords.find(record => record.angular?.kind === "guard");
    const route = angularRecords.find(record => record.angular?.kind === "route");

    assert.ok(result.records.some(record => record.kind === "definition" && record.name === "DemoComponent"),
      JSON.stringify({ diagnostics: result.diagnostics, angularRecords }));
    assert.ok(component, JSON.stringify({ diagnostics: result.diagnostics, angularRecords }));
    assert.equal(component.angular.selector, "app-demo");
    assert.equal(component?.angular?.template, "./demo.component.html");
    assert.deepEqual(component?.angular?.styles, ["./demo.component.scss"]);
    assert.equal(service?.angular?.providedIn, "root");
    assert.ok(guard);
    assert.equal(route?.angular?.routePath, "demo");
    assert.equal(route?.angular?.lazyImportPath, "./demo.component");
    assert.ok(route?.angular?.guardInvocation?.includes("canActivate"));

    const apiRecords = result.records.filter(record => record.kind === "api");
    assert.ok(apiRecords.some(record => record.api?.httpMethod === "GET"
      && record.api.urlKind === "literal" && record.api.literalPath === "/api/v1/items"));
    assert.ok(apiRecords.some(record => record.api?.httpMethod === "GET"
      && record.api.urlKind === "interpolated" && record.api.literalPath === null));
    assert.ok(apiRecords.some(record => record.api?.httpMethod === "POST"
      && record.api.urlKind === "dynamic" && record.api.literalPath === null));
    assert.ok(apiRecords.some(record => record.api?.httpMethod === "GET"
      && record.api.urlKind === "dynamic" && record.api.literalPath === null
      && record.api.expression === "''"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
