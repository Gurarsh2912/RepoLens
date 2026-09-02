import ts from "typescript";
import { AnalysisRule } from "./types";
import { DetectedIssue } from "@/types/issues";

export const emptyCatchRule: AnalysisRule = {
  id: "empty-catch",

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
        ts.isCatchClause(node) &&
        node.block.statements.length === 0
      ) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
          ).line + 1;

        issues.push({
          rule: "empty-catch",
          severity: "warning",
          message:
            "Empty catch block may silently hide errors.",
          line,
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return issues;
  },
};