import ts from "typescript";

export function calculateComplexity(
  path: string,
  code: string
): number {
  const sourceFile = ts.createSourceFile(
    path,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let complexity = 1;

  function visit(node: ts.Node) {
    if (
      ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isCaseClause(node) ||
      ts.isCatchClause(node) ||
      ts.isConditionalExpression(node)
    ) {
      complexity++;
    }

    if (
      ts.isBinaryExpression(node) &&
      (
        node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        node.operatorToken.kind === ts.SyntaxKind.BarBarToken
      )
    ) {
      complexity++;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return complexity;
}