type FileContextInput = {
  path: string;
  language: string | null;

  linesOfCode: number;
  complexity: number;

  functionCount: number;
  classCount: number;

  dependencies: number;
  dependents: number;

  importanceScore: number;

  issues: {
    rule: string;
    severity: string;
    message: string;
    line: number | null;
  }[];
};

export function buildFileContext(
  file: FileContextInput
): string {
  const issueText =
    file.issues.length === 0
      ? "No static-analysis issues detected."
      : file.issues
          .map(
            (issue) =>
              `- [${issue.severity}] ${issue.rule}: ${issue.message}${
                issue.line
                  ? ` (line ${issue.line})`
                  : ""
              }`
          )
          .join("\n");

  return `
File: ${file.path}
Language: ${file.language ?? "Unknown"}

Metrics:
- Lines of code: ${file.linesOfCode}
- Cyclomatic complexity: ${file.complexity}
- Functions: ${file.functionCount}
- Classes: ${file.classCount}
- Internal dependencies: ${file.dependencies}
- Internal dependents: ${file.dependents}
- Importance score: ${file.importanceScore}

Static-analysis findings:
${issueText}
`.trim();
}