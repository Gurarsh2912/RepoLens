import ts from "typescript";
import { ParsedClass, ParsedFile } from "@/types/parser";

export function parseSourceFile(
  path: string,
  code: string
): ParsedFile {
  const sourceFile = ts.createSourceFile(
    path,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const imports: string[] = [];
  const functions: string[] = [];
  const classes: ParsedClass[] = [];
  const interfaces: string[] = [];
  const types: string[] = [];
  const exports: string[] = [];

  function isExported(node: ts.Node): boolean {
    return ts.canHaveModifiers(node)
      ? ts.getModifiers(node)?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
        ) ?? false
      : false;
}

  

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleName = node.moduleSpecifier.getText(sourceFile);
      imports.push(moduleName.replace(/['"]/g, ""));
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push(node.name.text);

      if (isExported(node)) {
        exports.push(node.name.text);
      }
    }

    if (ts.isInterfaceDeclaration(node)) {
      interfaces.push(node.name.text);

      if (isExported(node)) {
        exports.push(node.name.text);
      }
    }

    if (ts.isTypeAliasDeclaration(node)) {
      types.push(node.name.text);

      if (isExported(node)) {
        exports.push(node.name.text);
      }
    }

    if (ts.isClassDeclaration(node) && node.name) {
    const methods: string[] = [];

    for (const member of node.members) {
      if (
        ts.isMethodDeclaration(member) &&
        member.name &&
        ts.isIdentifier(member.name)
      ) {
        methods.push(member.name.text);
      }
    }

    classes.push({
      name: node.name.text,
      methods,
    });
    if (isExported(node)) {
      exports.push(node.name.text);
    }
  }

  if (ts.isVariableStatement(node)) {
    const exported = isExported(node);

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        continue;
      }

      const name = declaration.name.text;

      if (
        declaration.initializer &&
        (
          ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer)
        )
      ) {
        if (!functions.includes(name)) {
          functions.push(name);
        }
      }

      if (exported) {
        exports.push(name);
      }
    }
  }

    ts.forEachChild(node, visit);
  }


  visit(sourceFile);

  return {
    path,
    imports,
    functions,
    classes,
    interfaces,
    types,
    exports,
  };
}