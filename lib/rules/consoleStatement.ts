import ts from "typescript";
import { AnalysisRule } from "./types";
import { DetectedIssue } from "@/types/issues";

export const consoleStatementRule: AnalysisRule = {
  id: "console-statement",

  run: ({ parsedFile, code }) => {
    const issues: DetectedIssue[] = [];

    const sourceFile = ts.createSourceFile(
      parsedFile.path,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const object = node.expression.expression;
        const property = node.expression.name;

        if (
          ts.isIdentifier(object) &&
          object.text === "console"
        ) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(
              node.getStart()
            ).line + 1;

          issues.push({
            rule: "console-statement",
            severity: "info",
            message: `Console statement detected: console.${property.text}`,
            line,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return issues;
  },
};