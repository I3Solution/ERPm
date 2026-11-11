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
  const httpClientSymbols = collectAngularHttpClientSymbols(sourceFilesForProgram(program), checker);
  const programFilesByAbsolutePath = new Map(
    program.getSourceFiles().map(sourceFile => [path.resolve(sourceFile.fileName), sourceFile])
  );
  const sourceFiles = program.getSourceFiles()
    .filter(sourceFile => isIndexableSource(sourceFile.fileName, fePath, sourceFile.text))
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
  const symbolKinds = new Map();
  const declarationsBySourceFile = new Map();
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
        symbolKinds.set(symbol, symbolKind);
      }
      if (!declarationsBySourceFile.has(sourceFile)) {
        declarationsBySourceFile.set(sourceFile, []);
      }
      declarationsBySourceFile.get(sourceFile).push({ sourceFile, node, info, symbol, symbolKind, symbolId, name });
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

    for (const declaration of declarationsBySourceFile.get(sourceFile) ?? []) {

      const start = declaration.node.getStart(sourceFile);
      const end = declaration.node.getEnd();
      const qualifiedName = getQualifiedName(declaration.node);
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

    collectImports(sourceFile, info, parsed.options, fileInfo, programFilesByAbsolutePath, records, generatedAtUtc);
    collectReferences(sourceFile, info, checker, symbolIds, symbolKinds, records, generatedAtUtc);
    collectAngularMetadata(sourceFile, info, checker, symbolIds, records, generatedAtUtc);
    collectRouteMetadata(sourceFile, info, checker, symbolIds, records, generatedAtUtc);
    collectApiCalls(sourceFile, info, checker, symbolIds, httpClientSymbols, records, generatedAtUtc);
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
      excludedOrExternalSourceFiles: program.getSourceFiles().length - fileInfo.size,
      recordCountsByKind: countBy(records, record => record.kind),
      angularKinds: countBy(records.filter(record => record.angular), record => record.angular.kind),
      apiMethods: countBy(records.filter(record => record.api), record => record.api.httpMethod),
      apiUrlKinds: countBy(records.filter(record => record.api), record => record.api.urlKind)
    }
  };
}

function collectImports(sourceFile, info, compilerOptions, fileInfo, programFilesByAbsolutePath, records, generatedAtUtc) {
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
      const target = programFilesByAbsolutePath.get(resolvedPath);
      if (target) {
        const targetInfo = fileInfo.get(target);
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


function collectReferences(sourceFile, info, checker, symbolIds, symbolKinds, records, generatedAtUtc) {
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
      symbolKind: symbolKinds.get(symbol) ?? "unknown",
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


function collectAngularMetadata(sourceFile, info, checker, symbolIds, records, generatedAtUtc) {
  visit(sourceFile, node => {
    if (ts.isClassDeclaration(node) && node.name) {
      const componentDecorator = findDecorator(node, "Component");
      const injectableDecorator = findDecorator(node, "Injectable");
      const decorator = componentDecorator ?? injectableDecorator;
      if (!decorator) {
        return;
      }

      const symbol = checker.getSymbolAtLocation(node.name);
      const targetSymbolId = symbol ? symbolIds.get(symbol) ?? null : null;
      if (!targetSymbolId) {
        return;
      }

      const metadata = getDecoratorObject(decorator);
      const kind = componentDecorator ? "component" : "service";
      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      const selector = readStringProperty(metadata, "selector");
      const template = readStringProperty(metadata, "templateUrl")
        ?? readStringProperty(metadata, "template");
      const styles = readStringArrayProperty(metadata, "styleUrls")
        .concat(readStringArrayProperty(metadata, "styles"));

      records.push(createRecord(info, {
        kind: "angular",
        symbolKind: kind,
        symbolId: `angular:${info.owner.repositoryId}:${info.relativePath}:${start}`,
        name: node.name.text,
        qualifiedName: getQualifiedName(node),
        language: extensionLanguage(sourceFile.fileName),
        startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
        endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
        startOffset: start,
        endOffset: end,
        relation: "defines",
        sourceSymbolId: info.symbolId,
        targetSymbolId,
        evidence: "verified",
        generatedAtUtc,
        angular: {
          kind,
          selector,
          template,
          styles,
          providedIn: readStringProperty(metadata, "providedIn"),
          routePath: null,
          guardInvocation: null,
          targetSymbolId,
          lazyImportPath: null
        },
        api: null
      }));
      return;
    }

    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node))
      && node.name && isGuardDeclaration(node)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      const targetSymbolId = symbol ? symbolIds.get(symbol) ?? null : null;
      if (!targetSymbolId) {
        return;
      }

      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      records.push(createRecord(info, {
        kind: "angular",
        symbolKind: "guard",
        symbolId: `angular-guard:${info.owner.repositoryId}:${info.relativePath}:${start}`,
        name: node.name.getText(sourceFile),
        qualifiedName: getQualifiedName(node),
        language: extensionLanguage(sourceFile.fileName),
        startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
        endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
        startOffset: start,
        endOffset: end,
        relation: "defines",
        sourceSymbolId: info.symbolId,
        targetSymbolId,
        evidence: "verified",
        generatedAtUtc,
        angular: {
          kind: "guard",
          selector: null,
          template: null,
          styles: [],
          providedIn: null,
          routePath: null,
          guardInvocation: null,
          targetSymbolId,
          lazyImportPath: null
        },
        api: null
      }));
    }
  });
}

function collectRouteMetadata(sourceFile, info, checker, symbolIds, records, generatedAtUtc) {
  visit(sourceFile, node => {
    if (!ts.isVariableDeclaration(node) || !node.name || !node.type
      || !node.type.getText(sourceFile).includes("Routes")
      || !node.initializer || !ts.isArrayLiteralExpression(node.initializer)) {
      return;
    }

    visit(node.initializer, routeNode => {
      if (!ts.isObjectLiteralExpression(routeNode) || !ts.isArrayLiteralExpression(routeNode.parent)) {
        return;
      }

      const routePath = readStringProperty(routeNode, "path");
      if (routePath === null) {
        return;
      }

      const loadProperty = findObjectProperty(routeNode, "loadComponent")
        ?? findObjectProperty(routeNode, "loadChildren");
      const lazyImportPath = loadProperty
        ? findDynamicImportPath(loadProperty.initializer)
        : null;
      const targetSymbolId = loadProperty
        ? findLazyTargetSymbolId(loadProperty.initializer, checker, symbolIds)
        : null;
      const guardInvocation = ["canActivate", "canActivateChild", "canDeactivate", "canMatch"]
        .map(name => findObjectProperty(routeNode, name))
        .filter(Boolean)
        .map(property => property.getText(sourceFile))
        .join("; ") || null;

      const start = routeNode.getStart(sourceFile);
      const end = routeNode.getEnd();
      const routeName = routePath.length > 0 ? routePath : "(root)";
      records.push(createRecord(info, {
        kind: "angular",
        symbolKind: "route",
        symbolId: `angular-route:${info.owner.repositoryId}:${info.relativePath}:${start}`,
        name: routeName,
        qualifiedName: `${node.name.getText(sourceFile)}.${routeName}`,
        language: extensionLanguage(sourceFile.fileName),
        startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
        endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
        startOffset: start,
        endOffset: end,
        relation: "declaresRoute",
        sourceSymbolId: info.symbolId,
        targetSymbolId,
        evidence: "verified",
        generatedAtUtc,
        angular: {
          kind: "route",
          selector: null,
          template: null,
          styles: [],
          providedIn: null,
          routePath,
          guardInvocation,
          targetSymbolId,
          lazyImportPath
        },
        api: null
      }));
    });
  });
}

function collectApiCalls(sourceFile, info, checker, symbolIds, httpClientSymbols, records, generatedAtUtc) {
  visit(sourceFile, node => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
      return;
    }

    const methodName = node.expression.name.text;
    const supportedMethods = new Set(["get", "post", "put", "patch", "delete", "head", "options", "request"]);
    if (!supportedMethods.has(methodName) || !isAngularHttpClient(node.expression.expression, checker, httpClientSymbols)) {
      return;
    }

    let httpMethod = methodName.toUpperCase();
    let urlArgument = node.arguments[0];
    if (methodName === "request") {
      const requestedMethod = node.arguments[0];
      urlArgument = node.arguments[1];
      httpMethod = requestedMethod && (ts.isStringLiteral(requestedMethod) || ts.isNoSubstitutionTemplateLiteral(requestedMethod))
        ? requestedMethod.text.toUpperCase()
        : "UNKNOWN";
    }
    if (!urlArgument) {
      return;
    }
    if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "UNKNOWN"].includes(httpMethod)) {
      httpMethod = "UNKNOWN";
    }

    const isLiteralUrl = ts.isStringLiteral(urlArgument) || ts.isNoSubstitutionTemplateLiteral(urlArgument);
    const urlKind = isLiteralUrl
      ? (urlArgument.text.length > 0 ? "literal" : "dynamic")
      : ts.isTemplateExpression(urlArgument) ? "interpolated" : "dynamic";
    const literalPath = urlKind === "literal" ? urlArgument.text : null;
    const containing = findContainingSymbolInfo(node, sourceFile, checker, symbolIds);
    const start = node.getStart(sourceFile);
    const end = node.getEnd();
    const expression = urlArgument.getText(sourceFile);

    records.push(createRecord(info, {
      kind: "api",
      symbolKind: "apiClient",
      symbolId: `api:${info.owner.repositoryId}:${info.relativePath}:${start}`,
      name: containing?.name ?? httpMethod,
      qualifiedName: containing?.qualifiedName ?? null,
      language: extensionLanguage(sourceFile.fileName),
      startLine: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
      endLine: sourceFile.getLineAndCharacterOfPosition(end).line + 1,
      startOffset: start,
      endOffset: end,
      relation: "callsApi",
      sourceSymbolId: containing?.symbolId ?? info.symbolId,
      targetSymbolId: null,
      evidence: "verified",
      generatedAtUtc,
      angular: null,
      api: {
        httpMethod,
        urlKind,
        expression,
        literalPath,
        containingSymbolId: containing?.symbolId ?? null
      }
    }));
  });
}

function findDecorator(node, name) {
  const decorators = [
    ...(ts.getDecorators(node) ?? []),
    ...(node.modifiers ?? []).filter(modifier => ts.isDecorator(modifier))
  ];
  return decorators.find(decorator => {
    const expression = decorator.expression;
    return ts.isCallExpression(expression)
      && ts.isIdentifier(expression.expression)
      && expression.expression.text === name;
  }) ?? null;
}

function getDecoratorObject(decorator) {
  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return null;
  }
  const argument = decorator.expression.arguments[0];
  return argument && ts.isObjectLiteralExpression(argument) ? argument : null;
}

function findObjectProperty(object, name) {
  if (!object) {
    return null;
  }
  return object.properties.find(property =>
    ts.isPropertyAssignment(property) && getPropertyName(property.name) === name) ?? null;
}

function getPropertyName(name) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
}

function readStringProperty(object, name) {
  const property = findObjectProperty(object, name);
  if (!property || !ts.isPropertyAssignment(property)) {
    return null;
  }
  const initializer = property.initializer;
  return ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)
    ? initializer.text : null;
}

function readStringArrayProperty(object, name) {
  const property = findObjectProperty(object, name);
  if (!property || !ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer)) {
    return [];
  }
  return property.initializer.elements
    .filter(element => ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element))
    .map(element => element.text);
}

function isGuardDeclaration(node) {
  return /\bCan(?:Activate|ActivateChild|Deactivate|Match)Fn\b/.test(node.getText());
}

function findDynamicImportPath(node) {
  if (!node) {
    return null;
  }
  let result = null;
  visit(node, current => {
    if (ts.isCallExpression(current) && current.expression.kind === ts.SyntaxKind.ImportKeyword
      && current.arguments[0] && (ts.isStringLiteral(current.arguments[0])
        || ts.isNoSubstitutionTemplateLiteral(current.arguments[0]))) {
      result = current.arguments[0].text;
    }
  });
  return result;
}

function findLazyTargetSymbolId(node, checker, symbolIds) {
  if (!node) {
    return null;
  }
  let result = null;
  visit(node, current => {
    if (!ts.isPropertyAccessExpression(current)) {
      return;
    }
    let symbol = checker.getSymbolAtLocation(current.name);
    if (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      try {
        symbol = checker.getAliasedSymbol(symbol);
      } catch {
        return;
      }
    }
    const symbolId = symbol ? symbolIds.get(symbol) : null;
    if (symbolId) {
      result = symbolId;
    }
  });
  return result;
}


function sourceFilesForProgram(program) {
  return program.getSourceFiles();
}

function collectAngularHttpClientSymbols(sourceFiles, checker) {
  const symbols = new Set();
  for (const sourceFile of sourceFiles) {
    visit(sourceFile, node => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)
        || node.moduleSpecifier.text !== "@angular/common/http") {
        return;
      }

      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) {
        return;
      }

      for (const specifier of bindings.elements) {
        const importedName = specifier.propertyName?.text ?? specifier.name.text;
        if (importedName !== "HttpClient") {
          continue;
        }
        const importedSymbol = checker.getSymbolAtLocation(specifier.name);
        if (!importedSymbol) {
          continue;
        }
        symbols.add(importedSymbol);
        if ((importedSymbol.flags & ts.SymbolFlags.Alias) !== 0) {
          try {
            symbols.add(checker.getAliasedSymbol(importedSymbol));
          } catch {
            // Keep unresolved aliases out of the trusted HttpClient symbol set.
          }
        }
      }
    });
  }
  return symbols;
}

function isAngularHttpClient(receiver, checker, httpClientSymbols) {
  const type = checker.getTypeAtLocation(receiver);
  const symbols = [type.aliasSymbol, type.getSymbol()].filter(Boolean);
  return symbols.some(symbol => httpClientSymbols.has(symbol));
}

function findContainingSymbol(node, sourceFile, checker, symbolIds) {
  return findContainingSymbolInfo(node, sourceFile, checker, symbolIds)?.symbolId ?? null;
}

function findContainingSymbolInfo(node, sourceFile, checker, symbolIds) {
  let current = node.parent;
  while (current && current !== sourceFile) {
    if (isSupportedDeclaration(current) && current.name) {
      const symbol = checker.getSymbolAtLocation(current.name);
      if (symbol) {
        const symbolId = symbolIds.get(symbol);
        if (symbolId) {
          return {
            symbolId,
            symbolKind: classifyDeclaration(current),
            name: current.name.getText(sourceFile),
            qualifiedName: getQualifiedName(current)
          };
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
  while (current && !ts.isSourceFile(current)) {
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


function getQualifiedName(node) {
  const parts = [];
  let current = node;
  while (current && !ts.isSourceFile(current)) {
    if (current.name && ts.isIdentifier(current.name)) {
      parts.unshift(current.name.text);
    }
    current = current.parent;
  }
  return parts.join(".");
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

function isIndexableSource(fileName, fePath, sourceText) {
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
  if (GENERATED_SUFFIXES.some(suffix => relative.toLowerCase().endsWith(suffix))) {
    return false;
  }
  return !sourceText.slice(0, 2048).includes("<auto-generated");
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

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function formatDiagnostic(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

export { INDEXER_VERSION };
