import ts from "typescript";
import { AnalysisRule } from "./types";
import { DetectedIssue } from "@/types/issues";

export const deepNestingRule: AnalysisRule = {
  id: "deep-nesting",

  run: ({ parsedFile, code }) => {
    const issues: DetectedIssue[] = [];

    const sourceFile = ts.createSourceFile(
      parsedFile.path,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node, depth: number) {
      let nextDepth = depth;

      if (
        ts.isIfStatement(node) ||
        ts.isForStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isDoStatement(node) ||
        ts.isSwitchStatement(node) ||
        ts.isTryStatement(node)
      ) {
        nextDepth++;
      }

      if (nextDepth > 4) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
          ).line + 1;

        issues.push({
          rule: "deep-nesting",
          severity: "warning",
          message: `Code nesting depth reached ${nextDepth}, which may reduce readability.`,
          line,
        });

        return;
      }

      ts.forEachChild(node, (child) =>
        visit(child, nextDepth)
      );
    }

    visit(sourceFile, 0);

    return issues;
  },
};