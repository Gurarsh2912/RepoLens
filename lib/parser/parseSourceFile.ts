import ts from "typescript";
import { ParsedFile } from "./types";

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
  const classes: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
        const moduleName = node.moduleSpecifier.getText(sourceFile);

        imports.push(moduleName.replace(/['"]/g, ""));
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
        functions.push(node.name.text);
    }

    if (ts.isClassDeclaration(node) && node.name) {
        classes.push(node.name.text);
    }

    if (ts.isVariableDeclaration(node)) {
    if (
        node.initializer &&
        ts.isArrowFunction(node.initializer) &&
        ts.isIdentifier(node.name)
    ) {
        functions.push(node.name.text);
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
  };
}