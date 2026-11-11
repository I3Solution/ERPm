import path from "node:path";
import ts from "typescript";

const INDEXER_VERSION = "0.1.0";
const SCHEMA_VERSION = 3;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_SEGMENTS = new Set([
  "node_modules", "dist", "coverage", ".angular", "out-tsc", "bin", "obj"
]);
const GENERATED_SUFFIXES = [".generated.ts", ".g.ts", ".g.i.ts"];

export function indexWorkspace(manifest, options = {}) {
  const rootPath = path.resolve(manifest.rootPath ?? manifest.RootPath);
  const repositories = manifest.repositories ?? manifest.Repositories;
  if (!Array.isArray(repositories)) {
    throw new Error("Workspace manifest does not contain a repositories array.");
  }

  const feRevision = repositories.find(item => item.repositoryId === "erpm-fe");
  if (!feRevision) {
    throw new Error("Workspace manifest does not contain erpm-fe.");
  }

  const fePath = path.resolve(rootPath, feRevision.relativePath);
  const tsconfigPath = options.tsconfigPath ?? path.join(fePath, "tsconfig.app.json");
  const configRead = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configRead.error) {
    throw new Error(formatDiagnostic(configRead.error));
  }

  const parsed = ts.parseJsonConfigFileContent(
    configRead.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath
  );
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(formatDiagnostic).join("\n"));
  }

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options
  });
  const checker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles()
    .filter(sourceFile => isIndexableSource(sourceFile.fileName, fePath))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));

  const owners = repositories
    .map(revision => ({
      revision,
      absolutePath: path.resolve(rootPath, revision.relativePath),
      normalizedPath: normalizePath(revision.relativePath)
    }))
    .sort((left, right) => right.normalizedPath.length - left.normalizedPath.length);

  const fileInfo = new Map();
  for (const sourceFile of sourceFiles) {
    const owner = findOwner(sourceFile.fileName, owners);
    if (!owner) {
      continue;
    }

    const relativePath = normalizePath(path.relative(owner.absolutePath, sourceFile.fileName));
    const symbolId = `file:${owner.revision.repositoryId}:${relativePath}`;
    fileInfo.set(sourceFile, {
      owner: owner.revision,
      relativePath,
      symbolId
    });
  }

  const symbolIds = new Map();
  const declarations = [];
  for (const sourceFile of sourceFiles) {
    const info = fileInfo.get(sourceFile);
    if (!info) {
      continue;
    }

    visit(sourceFile, node => {
      if (!isSupportedDeclaration(node) || !node.name) {
        return;
      }

      const symbol = checker.getSymbolAtLocation(node.name);
      if (!symbol) {
        return;
      }

      const symbolKind = classifyDeclaration(node);
      const startOffset = node.getStart(sourceFile);
      const name = node.name.getText(sourceFile);
      const symbolId = createSymbolId(info.owner.repositoryId, info.relativePath, symbolKind, startOffset, name);
      if (!symbolIds.has(symbol)) {
        symbolIds.set(symbol, symbolId);
      }
      declarations.push({ sourceFile, node, info, symbol, symbolKind, symbolId, name });
    });
  }

  const generatedAtUtc = new Date().toISOString();
  const records = [];

  for (const sourceFile of sourceFiles) {
    const info = fileInfo.get(sourceFile);
    if (!info) {
      continue;
    }

    const endLine = sourceFile.getLineAndCharacterOfPosition(sourceFile.text.length).line + 1;
    records.push(createRecord(info, {
      kind: "file",
      symbolKind: "file",
      symbolId: info.symbolId,
      name: path.posix.basename(info.relativePath),
      qualifiedName: null,
      language: extensionLanguage(sourceFile.fileName),
      startLine: 1,
      endLine,
      startOffset: 0,
      endOffset: sourceFile.text.length,
      relation: null,
      sourceSymbolId: null,
      targetSymbolId: null,
      evidence: "verified",
      generatedAtUtc,
      angular: null,
      api: null
    }));

    for (const declaration of declarations) {
      if (declaration.sourceFile !== sourceFile) {
        continue;
      }

      const start = declaration.node.getStart(sourceFile);
      const end = declaration.node.getEnd();
      const qualifiedName = checker.getFullyQualifiedName(declaration.symbol);
      records.push(createRecord(info, {
        kind: "definition",
        symbolKind: declaration.symbolKind,
        symbolId: declaration.symbolId,
        name: declaration.name,
        qualifiedName,
        language: extensionLanguage(sourceFile.fileName),
        startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
        endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
        startOffset: start,
        endOffset: end,
        relation: null,
        sourceSymbolId: info.symbolId,
        targetSymbolId: null,
        evidence: "verified",
        generatedAtUtc,
        angular: null,
        api: null
      }));
    }

    collectImports(sourceFile, info, program, parsed.options, records, generatedAtUtc);
    collectReferences(sourceFile, info, checker, symbolIds, records, generatedAtUtc);
  }

  records.sort((left, right) =>
    left.repositoryId.localeCompare(right.repositoryId)
    || left.path.localeCompare(right.path)
    || (left.startOffset ?? -1) - (right.startOffset ?? -1)
    || left.kind.localeCompare(right.kind)
    || left.symbolId.localeCompare(right.symbolId));

  return {
    records,
    diagnostics: {
      indexerVersion: INDEXER_VERSION,
      schemaVersion: SCHEMA_VERSION,
      tsVersion: ts.version,
      programSourceFiles: program.getSourceFiles().length,
      indexedSourceFiles: fileInfo.size,
      excludedOrExternalSourceFiles: program.getSourceFiles().length - fileInfo.size
    }
  };
}

function collectImports(sourceFile, info, program, compilerOptions, records, generatedAtUtc) {
  const host = ts.sys;
  visit(sourceFile, node => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }

    const moduleName = node.moduleSpecifier.text;
    const resolved = ts.resolveModuleName(moduleName, sourceFile.fileName, compilerOptions, host).resolvedModule;
    let targetSymbolId = null;
    if (resolved) {
      const resolvedPath = path.resolve(resolved.resolvedFileName);
      const target = program.getSourceFiles().find(item => path.resolve(item.fileName) === resolvedPath);
      if (target) {
        const targetInfo = infoForSource(target, program);
        if (targetInfo) {
          targetSymbolId = targetInfo.symbolId;
        }
      }
    }

    const start = node.moduleSpecifier.getStart(sourceFile);
    const end = node.moduleSpecifier.getEnd();
    records.push(createRecord(info, {
      kind: "relationship",
      symbolKind: "module",
      symbolId: `import:${info.owner.repositoryId}:${info.relativePath}:${start}`,
      name: moduleName,
      qualifiedName: null,
      language: extensionLanguage(sourceFile.fileName),
      startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
      endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
      startOffset: start,
      endOffset: end,
      relation: "imports",
      sourceSymbolId: info.symbolId,
      targetSymbolId,
      evidence: targetSymbolId ? "verified" : "partial",
      generatedAtUtc,
      angular: null,
      api: null
    }));
  });
}

function infoForSource(sourceFile, program) {
  const sourcePath = path.resolve(sourceFile.fileName);
  const feRoot = path.resolve(program.getCurrentDirectory(), "ERPm-FE");
  const relative = normalizePath(path.relative(feRoot, sourcePath));
  if (relative.startsWith("../") || path.isAbsolute(relative)) {
    return null;
  }
  return { relative };
}

function collectReferences(sourceFile, info, checker, symbolIds, records, generatedAtUtc) {
  visit(sourceFile, node => {
    if (!ts.isIdentifier(node) || isDeclarationName(node) || isImportOrExportName(node)) {
      return;
    }

    let symbol = checker.getSymbolAtLocation(node);
    if (!symbol) {
      return;
    }
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      try {
        symbol = checker.getAliasedSymbol(symbol);
      } catch {
        return;
      }
    }

    const targetSymbolId = symbolIds.get(symbol);
    if (!targetSymbolId) {
      return;
    }

    const start = node.getStart(sourceFile);
    const end = node.getEnd();
    const containingSymbolId = findContainingSymbol(node, sourceFile, checker, symbolIds) ?? info.symbolId;
    const relation = isCallTarget(node) ? "calls" : "references";
    records.push(createRecord(info, {
      kind: "reference",
      symbolKind: "unknown",
      symbolId: `ref:${info.owner.repositoryId}:${info.relativePath}:${start}`,
      name: node.text,
      qualifiedName: null,
      language: extensionLanguage(sourceFile.fileName),
      startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
      endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
      startOffset: start,
      endOffset: end,
      relation,
      sourceSymbolId: containingSymbolId,
      targetSymbolId,
      evidence: "verified",
      generatedAtUtc,
      angular: null,
      api: null
    }));
  });
}

function findContainingSymbol(node, sourceFile, checker, symbolIds) {
  let current = node.parent;
  while (current && current !== sourceFile) {
    if (isSupportedDeclaration(current) && current.name) {
      const symbol = checker.getSymbolAtLocation(current.name);
      if (symbol) {
        const id = symbolIds.get(symbol);
        if (id) {
          return id;
        }
      }
    }
    current = current.parent;
  }
  return null;
}

function isCallTarget(node) {
  let current = node;
  while (current.parent && (ts.isPropertyAccessExpression(current.parent) || ts.isElementAccessExpression(current.parent))) {
    current = current.parent;
  }
  return Boolean(current.parent && ts.isCallExpression(current.parent) && current.parent.expression === current);
}

function isDeclarationName(node) {
  const parent = node.parent;
  return Boolean(parent && parent.name === node && isSupportedDeclaration(parent));
}

function isImportOrExportName(node) {
  let current = node.parent;
  while (current && !ts.isStatement(current)) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current) || ts.isImportClause(current)
      || ts.isImportSpecifier(current) || ts.isExportSpecifier(current) || ts.isNamespaceImport(current)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isSupportedDeclaration(node) {
  return ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)
    || ts.isEnumDeclaration(node) || ts.isFunctionDeclaration(node)
    || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)
    || ts.isPropertyDeclaration(node) || ts.isGetAccessorDeclaration(node)
    || ts.isSetAccessorDeclaration(node) || ts.isVariableDeclaration(node)
    || ts.isParameter(node) || ts.isTypeParameterDeclaration(node)
    || ts.isModuleDeclaration(node);
}

function classifyDeclaration(node) {
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isMethodDeclaration(node)) return "method";
  if (ts.isConstructorDeclaration(node)) return "constructor";
  if (ts.isPropertyDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) return "property";
  if (ts.isVariableDeclaration(node)) return "variable";
  if (ts.isParameter(node)) return "parameter";
  if (ts.isTypeParameterDeclaration(node)) return "typeParameter";
  if (ts.isModuleDeclaration(node)) return "namespace";
  return "unknown";
}

function createSymbolId(repositoryId, relativePath, kind, start, name) {
  return `ts:${repositoryId}:${kind}:${relativePath}:${start}:${encodeURIComponent(name)}`;
}

function createRecord(owner, data) {
  return {
    schemaVersion: SCHEMA_VERSION,
    indexerVersion: INDEXER_VERSION,
    repositoryId: owner.owner.repositoryId,
    commitSha: owner.owner.commitSha,
    path: owner.relativePath,
    ...data
  };
}

function findOwner(fileName, owners) {
  const normalizedFile = normalizePath(path.resolve(fileName));
  return owners.find(owner => normalizedFile === normalizePath(owner.absolutePath)
    || normalizedFile.startsWith(`${normalizePath(owner.absolutePath)}/`));
}

function isIndexableSource(fileName, fePath) {
  const absolute = path.resolve(fileName);
  const relative = normalizePath(path.relative(fePath, absolute));
  if (relative.startsWith("../") || path.isAbsolute(relative) || !relative.startsWith("src/")) {
    return false;
  }
  const extension = path.extname(relative).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(extension) || relative.endsWith(".d.ts")) {
    return false;
  }
  const segments = relative.split("/");
  if (segments.some(segment => EXCLUDED_SEGMENTS.has(segment.toLowerCase()))) {
    return false;
  }
  return !GENERATED_SUFFIXES.some(suffix => relative.toLowerCase().endsWith(suffix));
}

function extensionLanguage(fileName) {
  return path.extname(fileName).toLowerCase() === ".js" || path.extname(fileName).toLowerCase() === ".jsx"
    ? "javascript" : "typescript";
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}

function formatDiagnostic(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

export { INDEXER_VERSION };
