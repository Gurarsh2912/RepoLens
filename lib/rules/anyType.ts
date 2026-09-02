import ts from "typescript";
import { AnalysisRule } from "./types";
import { DetectedIssue } from "@/types/issues";

export const anyTypeRule: AnalysisRule = {
  id: "any-type",

  run: ({ parsedFile, code }) => {
    const issues: DetectedIssue[] = [];

    const sourceFile = ts.createSourceFile(
      parsedFile.path,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node) {
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
          ).line + 1;

        issues.push({
          rule: "any-type",
          severity: "warning",
          message:
            "Explicit 'any' type reduces type safety.",
          line,
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return issues;
  },
};